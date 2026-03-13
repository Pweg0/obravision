"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { auth } from "@/lib/auth"
import { prisma } from "@obravision/db"
import { createTenantClient } from "@obravision/db/rls-client"
import { createPlantaSchema, createRevisaoSchema } from "@/lib/validations/planta"
import { emitNotification, getObraMemberIds } from "./notification"

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

  return { session, empresa, tenantClient: createTenantClient(empresa.tenantId) }
}

function requireAdminOrEngenheiro(role: string) {
  if (role !== "ADMIN" && role !== "ENGENHEIRO") {
    return { error: "Permissao negada" }
  }
  return null
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
 * Generates a presigned PUT URL for direct browser-to-R2 upload.
 * Key format: plantas/{tenantId}/{obraId}/{timestamp}-{filename}
 * Does NOT require obraId or tenantId in signature — those are embedded in the key.
 */
export async function getPresignedUploadUrl(filename: string, contentType: string) {
  const { empresa } = await getTenantContext()

  const r2 = getR2Client()
  const key = `plantas/${empresa.tenantId}/${Date.now()}-${filename}`

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 3600 }
  )

  return { url, key }
}

/**
 * Creates a new Planta record. Validates with Zod.
 * Permission: Admin + Engenheiro only.
 */
export async function createPlanta(obraId: string, formData: FormData) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const rawData = {
    nome: formData.get("nome") as string,
    disciplina: formData.get("disciplina") as string,
    disciplinaCustom: (formData.get("disciplinaCustom") as string) || undefined,
  }

  const result = createPlantaSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  const planta = await tenantClient.planta.create({
    data: {
      tenantId: empresa.tenantId,
      obraId,
      nome: data.nome,
      disciplina: data.disciplina,
      disciplinaCustom: data.disciplinaCustom ?? null,
    },
  })

  revalidatePath(`/dashboard/obras/${obraId}`)
  return { success: true, planta }
}

/**
 * Creates a new PlantaRevisao with auto-computed revision number.
 * Requires changelog. If fileSize > 5MB, enqueues BullMQ conversion job.
 * If migrarPins = true, copies pins from the latest previous revision.
 * Permission: Admin + Engenheiro only.
 */
export async function createRevisao(plantaId: string, formData: FormData) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const rawData = {
    changelog: formData.get("changelog") as string,
    r2Key: formData.get("r2Key") as string,
    fileSize: formData.get("fileSize") as string,
    migrarPins: formData.get("migrarPins") as string,
  }

  const result = createRevisaoSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  // Verify planta exists and belongs to this tenant
  const planta = await tenantClient.planta.findUnique({
    where: { id: plantaId },
  })

  if (!planta) {
    return { error: "Planta nao encontrada" }
  }

  // Count existing revisions to compute the next revision label
  const existingCount = await tenantClient.plantaRevisao.count({
    where: { plantaId, deletedAt: null },
  })

  const revisaoLabel = `R${existingCount}`

  // Get the latest revision for pin migration (if requested)
  let pinsToMigrate: Array<{
    tenantId: string
    plantaRevisaoId: string
    authorId: string
    x: number
    y: number
    pageNumber: number
  }> = []

  if (data.migrarPins && existingCount > 0) {
    const latestRevisao = await tenantClient.plantaRevisao.findFirst({
      where: { plantaId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        pins: {
          where: { deletedAt: null },
        },
      },
    })

    if (latestRevisao?.pins) {
      pinsToMigrate = latestRevisao.pins.map((pin) => ({
        tenantId: empresa.tenantId,
        plantaRevisaoId: "", // will be replaced after revisao creation
        authorId: pin.authorId,
        x: pin.x,
        y: pin.y,
        pageNumber: pin.pageNumber,
      }))
    }
  }

  // Create the revision record
  const revisao = await tenantClient.plantaRevisao.create({
    data: {
      tenantId: empresa.tenantId,
      plantaId,
      revisao: revisaoLabel,
      changelog: data.changelog,
      r2Key: data.r2Key,
      uploadedBy: session.user.id,
    },
  })

  // Migrate pins if requested
  if (data.migrarPins && pinsToMigrate.length > 0) {
    await Promise.all(
      pinsToMigrate.map((pin) =>
        tenantClient.pin.create({
          data: {
            ...pin,
            plantaRevisaoId: revisao.id,
          },
        })
      )
    )
  }

  // Enqueue PDF conversion if file is large (> 5MB)
  const FILE_SIZE_THRESHOLD = 5 * 1024 * 1024 // 5MB
  if (data.fileSize > FILE_SIZE_THRESHOLD) {
    try {
      const apiUrl = process.env.API_URL ?? "http://localhost:4000"
      await fetch(`${apiUrl}/api/plantas/enqueue-conversion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantaRevisaoId: revisao.id,
          r2Key: data.r2Key,
          obraId: planta.obraId,
        }),
      })
    } catch (err) {
      // Non-fatal: log but don't fail — tiles will just not be ready immediately
      console.error("[createRevisao] Failed to enqueue PDF conversion:", err)
    }
  }

  // Notify all obra members about the new revision (except the uploader)
  try {
    const recipientIds = await getObraMemberIds(planta.obraId, session.user.id)
    if (recipientIds.length > 0) {
      await emitNotification(
        planta.obraId,
        "new-revision",
        {
          revisaoId: revisao.id,
          plantaId,
          obraId: planta.obraId,
          revisaoLabel,
          authorName: session.user.name ?? session.user.email ?? "Alguem",
        },
        recipientIds,
        "new_revision",
        {
          revisaoId: revisao.id,
          plantaId,
          obraId: planta.obraId,
          plantaName: planta.nome,
          revisaoLabel,
          authorId: session.user.id,
          authorName: session.user.name ?? session.user.email ?? "Alguem",
        }
      )
    }
  } catch (err) {
    // Non-fatal: notification failure should not break revision creation
    console.error("[createRevisao] Failed to emit notification:", err)
  }

  // TODO: Wire emitNotification for createPin and addMessage after Plan 02 creates those actions
  // createPin → emit "new-pin" to obra room, notify all obra members except author
  // addMessage → emit "new-reply" to obra room, notify thread participants + @mentioned users

  revalidatePath(`/dashboard/obras/${planta.obraId}`)
  return { success: true, revisao }
}

/**
 * Soft-deletes a Planta record (Admin only).
 */
export async function deletePlanta(plantaId: string) {
  const { session, tenantClient } = await getTenantContext()

  if (session.user.role !== "ADMIN") {
    return { error: "Apenas administradores podem excluir plantas" }
  }

  const planta = await tenantClient.planta.update({
    where: { id: plantaId },
    data: { deletedAt: new Date() },
  })

  revalidatePath(`/dashboard/obras/${planta.obraId}`)
  return { success: true }
}

/**
 * Soft-deletes a PlantaRevisao record (Admin only).
 */
export async function deleteRevisao(revisaoId: string) {
  const { session, tenantClient } = await getTenantContext()

  if (session.user.role !== "ADMIN") {
    return { error: "Apenas administradores podem excluir revisoes" }
  }

  await tenantClient.plantaRevisao.update({
    where: { id: revisaoId },
    data: { deletedAt: new Date() },
  })

  return { success: true }
}

/**
 * Returns plantas grouped by disciplina for an obra.
 * Each plant includes its revisions ordered by createdAt desc.
 * Excludes soft-deleted records.
 */
export type PlantaWithRevisoes = {
  id: string
  tenantId: string
  obraId: string
  nome: string
  disciplina: string
  disciplinaCustom: string | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  revisoes: {
    id: string
    tenantId: string
    plantaId: string
    revisao: string
    changelog: string
    r2Key: string
    tilesReady: boolean
    tilesPrefix: string | null
    pageCount: number | null
    deletedAt: Date | null
    createdAt: Date
    uploadedBy: string
  }[]
}

export async function listPlantasByObra(obraId: string): Promise<Record<string, PlantaWithRevisoes[]>> {
  const session = await auth()
  if (!session?.user?.id || !session.user.empresaId) {
    return {}
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) return {} as Record<string, PlantaWithRevisoes[]>

  const tenantClient = createTenantClient(empresa.tenantId)

  const plantas = await tenantClient.planta.findMany({
    where: {
      obraId,
      deletedAt: null,
    },
    include: {
      revisoes: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  // Group by disciplina
  const grouped = plantas.reduce(
    (acc, planta) => {
      const key = planta.disciplina
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(planta)
      return acc
    },
    {} as Record<string, typeof plantas>
  )

  return grouped
}
