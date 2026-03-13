import { z } from "zod"

export const INVITE_ROLES = ["ADMIN", "ENGENHEIRO", "CLIENTE"] as const

export const emailInviteSchema = z.object({
  email: z.string().email("Email invalido"),
  role: z.enum(INVITE_ROLES, { errorMap: () => ({ message: "Papel invalido" }) }),
  obraId: z.string().optional(),
})

export type EmailInviteInput = z.infer<typeof emailInviteSchema>

export const shareableLinkSchema = z.object({
  role: z.enum(INVITE_ROLES, { errorMap: () => ({ message: "Papel invalido" }) }),
  obraId: z.string().optional(),
})

export type ShareableLinkInput = z.infer<typeof shareableLinkSchema>
