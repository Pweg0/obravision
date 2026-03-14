"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { differenceInDays, eachDayOfInterval, format } from "date-fns"
import { auth } from "@/lib/auth"
import { prisma } from "@projetapro/db"
import { createTenantClient } from "@projetapro/db/rls-client"

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

async function getTenantContextSafe() {
  const session = await auth()
  if (!session?.user?.id || !session.user.empresaId) {
    return null
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) return null

  return {
    session,
    empresa,
    tenantClient: createTenantClient(empresa.tenantId),
  }
}

function requireAdminOrEngenheiro(role: string) {
  if (role !== "ADMIN" && role !== "ENGENHEIRO") {
    return { error: "Permissao negada: apenas ADMIN e ENGENHEIRO podem registrar entradas de diario" }
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

// ---- Zod Schemas ----

const createRdoEntradaSchema = z.object({
  obraId: z.string().min(1, "obraId e obrigatorio"),
  data: z.coerce.date({ required_error: "Data e obrigatoria" }),
  texto: z.string().optional(),
  tarefaId: z.string().optional(),
  maoDeObra: z.record(z.unknown()).optional(),
  materiais: z.record(z.unknown()).optional(),
  ocorrencias: z.string().optional(),
  climaCondicao: z.string().optional(),
  climaTemp: z.number().optional(),
  climaUmidade: z.number().optional(),
  climaFonteDado: z.enum(["open-meteo", "manual"]).optional(),
})

// ---- calcProgressoReal (pure calculation, also exported) ----

/**
 * Calculates real progress for a tarefa based on distinct RDO entry dates.
 * Formula: COUNT(DISTINCT DATE(rdo.data)) within task period / plannedDays * 100
 * Capped at 100.
 */
export async function calcProgressoReal(tarefaId: string): Promise<number> {
  const ctx = await getTenantContextSafe()
  if (!ctx) return 0

  const tarefa = await ctx.tenantClient.tarefa.findUnique({
    where: { id: tarefaId },
  })

  if (!tarefa) return 0

  const plannedDays = differenceInDays(tarefa.endDate, tarefa.startDate) + 1
  if (plannedDays <= 0) return 0

  // Fetch all RDO entries for this tarefa within the task period
  const entries = await ctx.tenantClient.rdoEntrada.findMany({
    where: {
      tarefaId,
      data: {
        gte: tarefa.startDate,
        lte: tarefa.endDate,
      },
    },
    select: { data: true },
  })

  // Count distinct dates
  const distinctDates = new Set(entries.map((e: { data: Date }) => format(e.data, "yyyy-MM-dd")))
  const rdoDays = distinctDates.size

  const progress = Math.round((rdoDays / plannedDays) * 100)
  return Math.min(progress, 100)
}

// ---- createRdoEntrada ----

/**
 * Creates a new diary entry (RdoEntrada) for an obra.
 * Enforces ADMIN/ENGENHEIRO role. Enforces @@unique([obraId, data]).
 * If tarefaId is provided, recalculates tarefa.progressoReal after creation.
 */
export async function createRdoEntrada(input: {
  obraId: string
  data: Date
  texto?: string
  tarefaId?: string
  maoDeObra?: Record<string, unknown>
  materiais?: Record<string, unknown>
  ocorrencias?: string
  climaCondicao?: string
  climaTemp?: number
  climaUmidade?: number
  climaFonteDado?: "open-meteo" | "manual"
}) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = createRdoEntradaSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  const entrada = await tenantClient.rdoEntrada.create({
    data: {
      tenantId: empresa.tenantId,
      obraId: data.obraId,
      tarefaId: data.tarefaId ?? null,
      autorId: session.user.id,
      data: data.data,
      texto: data.texto ?? null,
      maoDeObra: data.maoDeObra ?? undefined,
      materiais: data.materiais ?? undefined,
      ocorrencias: data.ocorrencias ?? undefined,
      climaCondicao: data.climaCondicao ?? null,
      climaTemp: data.climaTemp ?? null,
      climaUmidade: data.climaUmidade ?? null,
      climaFonteDado: data.climaFonteDado ?? null,
    },
  })

  // If linked to a tarefa, recalculate progressoReal
  if (data.tarefaId) {
    const progressoReal = await _calcProgressoRealWithClient(tenantClient, data.tarefaId)
    await tenantClient.tarefa.update({
      where: { id: data.tarefaId },
      data: { progressoReal },
    })
  }

  revalidatePath(`/dashboard/obras/${data.obraId}/rdo`)
  revalidatePath(`/dashboard/obras/${data.obraId}/cronograma`)

  return { success: true, entrada }
}

/**
 * Internal helper: calculates progressoReal using an existing tenant client.
 * Used inside createRdoEntrada to avoid re-fetching empresa.
 */
async function _calcProgressoRealWithClient(
  tenantClient: ReturnType<typeof createTenantClient>,
  tarefaId: string
): Promise<number> {
  const tarefa = await tenantClient.tarefa.findUnique({
    where: { id: tarefaId },
  })

  if (!tarefa) return 0

  const plannedDays = differenceInDays(tarefa.endDate, tarefa.startDate) + 1
  if (plannedDays <= 0) return 0

  const entries = await tenantClient.rdoEntrada.findMany({
    where: {
      tarefaId,
      data: {
        gte: tarefa.startDate,
        lte: tarefa.endDate,
      },
    },
    select: { data: true },
  })

  const distinctDates = new Set(entries.map((e: { data: Date }) => format(e.data, "yyyy-MM-dd")))
  const rdoDays = distinctDates.size

  const progress = Math.round((rdoDays / plannedDays) * 100)
  return Math.min(progress, 100)
}

// ---- getActiveTask ----

/**
 * Returns the EM_ANDAMENTO tarefa covering the given date for an obra.
 * Returns null if none found. Picks earliest startDate when multiple match.
 */
export async function getActiveTask(obraId: string, date: Date) {
  const ctx = await getTenantContextSafe()
  if (!ctx) return null

  const tarefa = await ctx.tenantClient.tarefa.findFirst({
    where: {
      obraId,
      status: "EM_ANDAMENTO",
      startDate: { lte: date },
      endDate: { gte: date },
    },
    orderBy: { startDate: "asc" },
    include: { etapa: true },
  })

  return tarefa
}

// ---- getRdoPhotoUploadUrl ----

/**
 * Generates a presigned PUT URL for direct browser-to-R2 upload.
 * Key format: rdo/{tenantId}/{rdoEntradaId}/{nanoid}-{filename}
 */
export async function getRdoPhotoUploadUrl(
  rdoEntradaId: string,
  filename: string,
  contentType: string
) {
  const { empresa } = await getTenantContext()

  const r2 = getR2Client()
  // Use timestamp as nanoid substitute (consistent, no extra dep)
  const nanoid = Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
  const key = `rdo/${empresa.tenantId}/${rdoEntradaId}/${nanoid}-${filename}`

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 }
  )

  return { url, key }
}

// ---- saveRdoFoto ----

/**
 * Creates a RdoFoto record after browser-to-R2 upload completes.
 */
export async function saveRdoFoto(
  rdoEntradaId: string,
  r2Key: string,
  legenda?: string,
  ordem?: number
) {
  const { empresa, tenantClient } = await getTenantContext()

  const foto = await tenantClient.rdoFoto.create({
    data: {
      tenantId: empresa.tenantId,
      rdoEntradaId,
      r2Key,
      legenda: legenda ?? null,
      ordem: ordem ?? 0,
    },
  })

  return { success: true, foto }
}

// ---- listRdoEntradas ----

/**
 * Lists all diary entries for an obra with photos, ordered by data desc.
 */
export async function listRdoEntradas(obraId: string) {
  const ctx = await getTenantContextSafe()
  if (!ctx) return []

  const entradas = await ctx.tenantClient.rdoEntrada.findMany({
    where: { obraId },
    include: {
      fotos: {
        orderBy: { ordem: "asc" },
      },
    },
    orderBy: { data: "desc" },
  })

  return entradas
}

// ---- getProgressData ----

/**
 * Returns S-curve data for an obra: array of { date, planned, actual }
 * - planned: cumulative % of all tarefas planned to be complete by that date
 * - actual: cumulative % of all tarefas with RDO entries by that date
 */
export async function getProgressData(obraId: string) {
  const ctx = await getTenantContextSafe()
  if (!ctx) return []

  const tarefas = await ctx.tenantClient.tarefa.findMany({
    where: { obraId },
    orderBy: { startDate: "asc" },
  })

  if (tarefas.length === 0) return []

  // Determine date range: earliest startDate to today
  const today = new Date()
  const minDate = tarefas.reduce(
    (min: Date, t: { startDate: Date }) => (t.startDate < min ? t.startDate : min),
    tarefas[0].startDate
  )
  const maxDate = today

  if (minDate > maxDate) return []

  // Get all RDO entries for this obra
  const allEntradas = await ctx.tenantClient.rdoEntrada.findMany({
    where: { obraId },
    select: { data: true, tarefaId: true },
    orderBy: { data: "asc" },
  })

  // Build daily data
  const days = eachDayOfInterval({ start: minDate, end: maxDate })
  const totalTarefas = tarefas.length

  const data = days.map((day) => {
    // Planned: fraction of tarefas whose endDate <= this day
    const plannedDone = tarefas.filter((t: { endDate: Date }) => t.endDate <= day).length
    const planned = Math.round((plannedDone / totalTarefas) * 100)

    // Actual: fraction of tarefas that have at least one RDO entry on or before this day
    const rdoEntryDates = allEntradas.filter((e: { data: Date }) => e.data <= day)
    const rdoTarefaIds = new Set(
      rdoEntryDates
        .filter((e: { tarefaId: string | null }) => e.tarefaId !== null)
        .map((e: { tarefaId: string | null }) => e.tarefaId)
    )
    const actualDone = rdoTarefaIds.size
    const actual = Math.round((actualDone / totalTarefas) * 100)

    return {
      date: format(day, "yyyy-MM-dd"),
      planned,
      actual,
    }
  })

  return data
}

// ---- getCurrentWeather ----

/**
 * Fetches current weather from Open-Meteo API for the given coordinates.
 * Returns { condicao, temperatura, umidade } or null if fetch fails.
 * Maps weather_code to human-readable condition in Portuguese.
 */
export async function getCurrentWeather(
  lat: number,
  lon: number
): Promise<{ condicao: string; temperatura: number; umidade: number } | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast")
    url.searchParams.set("latitude", String(lat))
    url.searchParams.set("longitude", String(lon))
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,weather_code")
    url.searchParams.set("forecast_days", "1")
    url.searchParams.set("timezone", "America/Sao_Paulo")

    const response = await fetch(url.toString(), { next: { revalidate: 3600 } })
    if (!response.ok) return null

    const json = await response.json()
    const current = json?.current
    if (!current) return null

    const weatherCode: number = current.weather_code ?? 0
    const temperatura: number = current.temperature_2m ?? 0
    const umidade: number = current.relative_humidity_2m ?? 0

    const condicao = mapWeatherCode(weatherCode)

    return { condicao, temperatura, umidade }
  } catch {
    return null
  }
}

/**
 * Maps WMO Weather interpretation codes to Portuguese conditions.
 * See: https://open-meteo.com/en/docs#weathervariables
 */
function mapWeatherCode(code: number): string {
  if (code === 0) return "Ensolarado"
  if (code <= 3) return "Parcialmente Nublado"
  if (code <= 48) return "Nublado"
  if (code <= 67) return "Chuva"
  if (code <= 77) return "Neve"
  if (code <= 82) return "Chuva"
  if (code <= 86) return "Neve"
  if (code <= 99) return "Tempestade"
  return "Desconhecido"
}
