/**
 * pdf-queue-client.ts
 *
 * Client for enqueuing PDF generation jobs to the Fastify API (which runs BullMQ).
 * Used by server actions in apps/web to request PDF generation without importing BullMQ directly.
 */

export interface PdfJobData {
  type: "proposta" | "pedido-compra" | "boletim-medicao"
  entityId: string
  obraId: string
  tenantId: string
}

/**
 * Enqueues a PDF generation job by POSTing to the Fastify API endpoint.
 * The API worker handles BullMQ queue operations.
 *
 * @throws Never — errors are caught and logged; caller gets { ok: false } on failure.
 */
export async function addPdfJob(data: PdfJobData): Promise<{ ok: boolean; jobId?: string }> {
  const apiUrl = process.env.API_URL ?? "http://localhost:4000"

  try {
    const res = await fetch(`${apiUrl}/pdf/enqueue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": data.tenantId,
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      console.error(`[addPdfJob] API returned ${res.status}: ${res.statusText}`)
      return { ok: false }
    }

    const json = (await res.json().catch(() => ({}))) as { jobId?: string }
    return { ok: true, jobId: json.jobId }
  } catch (err) {
    console.error("[addPdfJob] Failed to enqueue PDF job:", err)
    return { ok: false }
  }
}
