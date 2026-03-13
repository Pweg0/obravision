"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@obravision/db"
import { createTenantClient } from "@obravision/db/rls-client"
import { obraSchema, obraUpdateSchema } from "@/lib/validations/obra"

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

// ---- Geocoding helper ----

interface GeocodingResult {
  lat: number
  lon: number
}

/**
 * Geocodes an address using Nominatim (OpenStreetMap).
 * Returns { lat, lon } on success or null on any failure.
 *
 * Rate limit: 1 req/sec is fine since obras are created infrequently.
 * Non-fatal: callers must handle null gracefully.
 *
 * @see https://nominatim.openstreetmap.org/
 */
export async function geocodeAddress(
  logradouro: string,
  numero: string,
  cidade: string,
  estado: string,
  cep: string
): Promise<GeocodingResult | null> {
  try {
    const addressQuery = `${logradouro}, ${numero}, ${cidade}, ${estado}, ${cep}, Brasil`
    const encodedQuery = encodeURIComponent(addressQuery)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`

    const res = await fetch(url, {
      headers: {
        "User-Agent": "ObraVision/1.0",
      },
    })

    if (!res.ok) {
      console.warn(`[geocodeAddress] Nominatim returned ${res.status}: ${res.statusText}`)
      return null
    }

    const results = (await res.json()) as Array<{ lat: string; lon: string }>

    if (!results || results.length === 0) {
      return null
    }

    return {
      lat: parseFloat(results[0].lat),
      lon: parseFloat(results[0].lon),
    }
  } catch (err) {
    // Non-fatal — geocoding failure should never block obra creation
    console.warn("[geocodeAddress] Failed to geocode address:", err)
    return null
  }
}

export async function createObra(formData: FormData) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const rawData = {
    nome: formData.get("nome") as string,
    logradouro: formData.get("logradouro") as string,
    numero: formData.get("numero") as string,
    cidade: formData.get("cidade") as string,
    estado: formData.get("estado") as string,
    cep: formData.get("cep") as string,
    tipo: formData.get("tipo") as string,
    area: formData.get("area") as string,
  }

  const result = obraSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  // Get default status for this empresa
  const defaultStatus = await prisma.obraStatus.findFirst({
    where: { empresaId: empresa.id },
    orderBy: { id: "asc" },
  })

  const obra = await tenantClient.obra.create({
    data: {
      tenantId: empresa.tenantId,
      nome: data.nome,
      logradouro: data.logradouro,
      numero: data.numero,
      cidade: data.cidade,
      estado: data.estado,
      cep: data.cep,
      tipo: data.tipo,
      area: data.area,
      empresaId: empresa.id,
      statusId: defaultStatus?.id ?? null,
      members: {
        create: {
          tenantId: empresa.tenantId,
          userId: session.user.id,
          role: session.user.role as "ADMIN" | "ENGENHEIRO" | "CLIENTE",
        },
      },
    },
  })

  // Geocode address and populate lat/lon — non-fatal if it fails
  const coords = await geocodeAddress(data.logradouro, data.numero, data.cidade, data.estado, data.cep)
  if (coords) {
    await tenantClient.obra.update({
      where: { id: obra.id },
      data: { lat: coords.lat, lon: coords.lon },
    })
  }

  revalidatePath("/dashboard/obras")
  return { success: true, obra }
}

export async function updateObra(id: string, formData: FormData) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const rawData = {
    nome: formData.get("nome") as string,
    logradouro: formData.get("logradouro") as string,
    numero: formData.get("numero") as string,
    cidade: formData.get("cidade") as string,
    estado: formData.get("estado") as string,
    cep: formData.get("cep") as string,
    tipo: formData.get("tipo") as string,
    area: formData.get("area") as string,
    statusId: (formData.get("statusId") as string) || undefined,
  }

  const result = obraUpdateSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  const obra = await tenantClient.obra.update({
    where: { id },
    data: {
      nome: data.nome,
      logradouro: data.logradouro,
      numero: data.numero,
      cidade: data.cidade,
      estado: data.estado,
      cep: data.cep,
      tipo: data.tipo,
      area: data.area,
      statusId: data.statusId,
    },
  })

  // Re-geocode if address fields were provided — non-fatal if it fails
  if (data.logradouro && data.cidade && data.estado) {
    const coords = await geocodeAddress(
      data.logradouro,
      data.numero ?? "",
      data.cidade,
      data.estado,
      data.cep ?? ""
    )
    if (coords) {
      await tenantClient.obra.update({
        where: { id },
        data: { lat: coords.lat, lon: coords.lon },
      })
    }
  }

  revalidatePath("/dashboard/obras")
  revalidatePath(`/dashboard/obras/${id}`)
  return { success: true, obra }
}

export async function archiveObra(id: string) {
  const { session, tenantClient } = await getTenantContext()

  if (session.user.role !== "ADMIN") {
    return { error: "Apenas administradores podem arquivar obras" }
  }

  await tenantClient.obra.update({
    where: { id },
    data: { archived: true },
  })

  revalidatePath("/dashboard/obras")
  return { success: true }
}

export async function unarchiveObra(id: string) {
  const { session, tenantClient } = await getTenantContext()

  if (session.user.role !== "ADMIN") {
    return { error: "Apenas administradores podem desarquivar obras" }
  }

  await tenantClient.obra.update({
    where: { id },
    data: { archived: false },
  })

  revalidatePath("/dashboard/obras/archived")
  return { success: true }
}

export async function listObras(options?: { archived?: boolean; statusId?: string; search?: string }) {
  const session = await auth()
  if (!session?.user?.id || !session.user.empresaId) {
    return []
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) return []

  const tenantClient = createTenantClient(empresa.tenantId)

  const obras = await tenantClient.obra.findMany({
    where: {
      archived: options?.archived ?? false,
      ...(options?.statusId ? { statusId: options.statusId } : {}),
      ...(options?.search
        ? { nome: { contains: options.search, mode: "insensitive" } }
        : {}),
    },
    include: {
      status: true,
      members: true,
    },
    orderBy: { updatedAt: "desc" },
  })

  return obras
}
