"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@projetapro/db"
import { createTenantClient } from "@projetapro/db/rls-client"
import { emailInviteSchema, shareableLinkSchema } from "@/lib/validations/invite"
import { nanoid } from "nanoid"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

async function getTenantContext() {
  const session = await auth()
  if (!session?.user?.id || !session.user.empresaId) {
    return null
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) return null

  return { session, empresa, tenantClient: createTenantClient(empresa.tenantId) }
}

export async function inviteByEmail(formData: FormData) {
  const ctx = await getTenantContext()
  if (!ctx) return { error: "Nao autenticado" }

  // Only Admin and Engenheiro can invite (CONTEXT.md locked decision)
  if (ctx.session.user.role === "CLIENTE") {
    return { error: "Clientes nao podem enviar convites" }
  }

  const rawData = {
    email: formData.get("email") as string,
    role: formData.get("role") as string,
    obraId: (formData.get("obraId") as string) || undefined,
  }

  const result = emailInviteSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const { email, role, obraId } = result.data

  const token = nanoid(21)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await ctx.tenantClient.invitation.create({
    data: {
      tenantId: ctx.empresa.tenantId,
      token,
      email,
      role: role as "ADMIN" | "ENGENHEIRO" | "CLIENTE",
      obraId: obraId ?? null,
      empresaId: ctx.empresa.id,
      invitedBy: ctx.session.user.id,
      expiresAt,
    },
  })

  const inviteUrl = `${APP_URL}/invite/${token}`

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    ENGENHEIRO: "Engenheiro",
    CLIENTE: "Cliente",
  }

  try {
    await resend.emails.send({
      from: "ProjetaPro <noreply@projetapro.com.br>",
      to: email,
      subject: `Voce foi convidado para ${ctx.empresa.nome} no ProjetaPro`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="margin-bottom: 24px;">
            <h1 style="color: #1A6B5A; font-size: 28px; margin: 0;">ProjetaPro</h1>
          </div>
          <h2 style="font-size: 22px; color: #111827;">Voce foi convidado!</h2>
          <p style="color: #4B5563; font-size: 16px;">
            Voce foi convidado por <strong>${ctx.session.user.name ?? ctx.session.user.email}</strong>
            para participar de <strong>${ctx.empresa.nome}</strong> como
            <strong>${roleLabels[role] ?? role}</strong>.
          </p>
          <div style="margin: 32px 0;">
            <a href="${inviteUrl}"
               style="background-color: #1A6B5A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Aceitar Convite
            </a>
          </div>
          <p style="color: #9CA3AF; font-size: 14px;">
            Este convite expira em 7 dias. Se voce nao esperava receber este email, pode ignora-lo.
          </p>
          <p style="color: #9CA3AF; font-size: 14px;">
            Ou acesse diretamente: <a href="${inviteUrl}" style="color: #1A6B5A;">${inviteUrl}</a>
          </p>
        </div>
      `,
    })
  } catch {
    // Email send failure should not block invite creation
    console.error("Failed to send invite email")
  }

  revalidatePath("/dashboard/obras")
  return { success: true, token }
}

export async function createShareableLink(formData: FormData) {
  const ctx = await getTenantContext()
  if (!ctx) return { error: "Nao autenticado" }

  if (ctx.session.user.role === "CLIENTE") {
    return { error: "Clientes nao podem criar links de convite" }
  }

  const rawData = {
    role: formData.get("role") as string,
    obraId: (formData.get("obraId") as string) || undefined,
  }

  const result = shareableLinkSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const { role, obraId } = result.data

  const token = nanoid(21)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  const invitation = await ctx.tenantClient.invitation.create({
    data: {
      tenantId: ctx.empresa.tenantId,
      token,
      email: null, // null = shareable link
      role: role as "ADMIN" | "ENGENHEIRO" | "CLIENTE",
      obraId: obraId ?? null,
      empresaId: ctx.empresa.id,
      invitedBy: ctx.session.user.id,
      expiresAt,
    },
  })

  const inviteUrl = `${APP_URL}/invite/${token}`

  revalidatePath("/dashboard/obras")
  return { success: true, url: inviteUrl, invitation }
}

export async function regenerateShareableLink(inviteId: string) {
  const ctx = await getTenantContext()
  if (!ctx) return { error: "Nao autenticado" }

  if (ctx.session.user.role === "CLIENTE") {
    return { error: "Permissao negada" }
  }

  const newToken = nanoid(21)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const invitation = await ctx.tenantClient.invitation.update({
    where: { id: inviteId },
    data: {
      token: newToken,
      expiresAt,
      usedAt: null,
    },
  })

  const inviteUrl = `${APP_URL}/invite/${newToken}`
  return { success: true, url: inviteUrl, invitation }
}

export async function acceptInvite(token: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/register?invite=${token}`)
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { empresa: true, obra: true },
  })

  if (!invitation) {
    return { error: "Convite nao encontrado ou invalido" }
  }

  if (invitation.usedAt) {
    return { error: "Este convite ja foi utilizado" }
  }

  if (invitation.expiresAt < new Date()) {
    return { error: "Este convite expirou" }
  }

  // If email-specific invite, verify it matches the logged-in user
  if (invitation.email && invitation.email !== session.user.email) {
    return { error: "Este convite e destinado a outro email" }
  }

  const empresa = invitation.empresa
  const tenantClient = createTenantClient(empresa.tenantId)

  if (invitation.obraId) {
    // Obra-level invite: create ObraMember
    await tenantClient.obraMember.upsert({
      where: {
        userId_obraId: {
          userId: session.user.id,
          obraId: invitation.obraId,
        },
      },
      update: { role: invitation.role },
      create: {
        tenantId: empresa.tenantId,
        userId: session.user.id,
        obraId: invitation.obraId,
        role: invitation.role,
      },
    })
  } else {
    // Empresa-level invite: update User.empresaId
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        empresaId: empresa.id,
        role: invitation.role,
        onboardingStep: 3, // Skip onboarding for invited users
      },
    })

    // CRITICAL: Session refresh after empresa-level invite
    // Delete session cookie to invalidate the JWT. Auth.js will re-issue with updated empresaId.
    // The JWT callback reads empresaId from DB on next sign-in.
    // Using unstable_update() is not available in beta.25, so we delete the cookie.
    try {
      const cookieStore = await cookies()
      const cookieNames = ["authjs.session-token", "__Secure-authjs.session-token"]
      for (const name of cookieNames) {
        cookieStore.delete(name)
      }
    } catch {
      // Cookie deletion may fail in some environments; proceed anyway
    }
  }

  // Mark invitation as used
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { usedAt: new Date() },
  })

  if (!invitation.obraId) {
    // Redirect to login so Auth.js re-issues JWT with new empresaId
    redirect("/login?message=convite-aceito")
  }

  revalidatePath("/dashboard/obras")
  redirect("/dashboard")
}

export async function listInvitations(obraId?: string) {
  const ctx = await getTenantContext()
  if (!ctx) return []

  const invitations = await ctx.tenantClient.invitation.findMany({
    where: {
      empresaId: ctx.empresa.id,
      ...(obraId ? { obraId } : {}),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  })

  return invitations
}

export async function revokeInvitation(id: string) {
  const ctx = await getTenantContext()
  if (!ctx) return { error: "Nao autenticado" }

  if (ctx.session.user.role === "CLIENTE") {
    return { error: "Permissao negada" }
  }

  await ctx.tenantClient.invitation.delete({ where: { id } })

  revalidatePath("/dashboard/obras")
  return { success: true }
}
