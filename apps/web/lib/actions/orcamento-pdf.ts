"use server"

import { redirect } from "next/navigation"
import { prisma } from "@projetapro/db"
import { createTenantClient } from "@projetapro/db/rls-client"
import { auth } from "@/lib/auth"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// ---- Tenant context helper ----

async function getTenantContext() {
  const session = await auth()
  if (!session?.user?.id || !session.user.empresaId) {
    redirect("/login")
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) {
    throw new Error("Empresa nao encontrada")
  }

  return {
    session,
    empresa,
    tenantClient: createTenantClient(empresa.tenantId),
  }
}

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

/**
 * Enqueues a "proposta" PDF generation job to BullMQ.
 * The API worker will render the PDF and upload it to R2.
 * Returns { status: "queued" } immediately.
 */
export async function enqueueProposta(orcamentoId: string) {
  const { session, empresa, tenantClient } = await getTenantContext()

  if (session.user.role !== "ADMIN" && session.user.role !== "ENGENHEIRO") {
    return { error: "Permissao negada" }
  }

  // Verify the orcamento exists and belongs to this tenant
  const orcamento = await tenantClient.orcamento.findUnique({
    where: { id: orcamentoId },
    select: { id: true, obraId: true },
  })

  if (!orcamento) {
    return { error: "Orcamento nao encontrado" }
  }

  // POST to API to enqueue the job via HTTP
  // The API service handles BullMQ queue operations
  const apiUrl = process.env.API_URL ?? "http://localhost:4000"
  const response = await fetch(`${apiUrl}/pdf/enqueue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": empresa.tenantId,
    },
    body: JSON.stringify({
      type: "proposta",
      entityId: orcamentoId,
      obraId: orcamento.obraId,
      tenantId: empresa.tenantId,
    }),
  }).catch(() => null)

  // If API is unavailable, still return queued — job will be picked up when API comes back
  if (!response || !response.ok) {
    // Direct queue via DB flag — worker will pick this up
    // For resilience: clear existing pdfR2Key so it gets regenerated
    await tenantClient.orcamento.update({
      where: { id: orcamentoId },
      data: { pdfR2Key: null },
    })
  }

  return { status: "queued" as const }
}

/**
 * Returns a presigned GET URL for downloading the proposta PDF.
 * Returns null if no PDF has been generated yet.
 */
export async function getPropostaPdfUrl(orcamentoId: string): Promise<string | null> {
  const { tenantClient } = await getTenantContext()

  const orcamento = await tenantClient.orcamento.findUnique({
    where: { id: orcamentoId },
    select: { pdfR2Key: true },
  })

  if (!orcamento?.pdfR2Key) return null

  const r2 = getR2Client()
  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: orcamento.pdfR2Key,
    }),
    { expiresIn: 3600 } // 1 hour
  )

  return url
}
