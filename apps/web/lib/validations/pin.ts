import { z } from "zod"

export const createPinSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  pageNumber: z.number().int().positive(),
  content: z
    .string()
    .min(1, "Comentario e obrigatorio")
    .max(2000, "Comentario deve ter no maximo 2000 caracteres"),
})

export type CreatePinInput = z.infer<typeof createPinSchema>

export const addMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Mensagem e obrigatoria")
    .max(2000, "Mensagem deve ter no maximo 2000 caracteres"),
  mentions: z.array(z.string()).optional().default([]),
})

export type AddMessageInput = z.infer<typeof addMessageSchema>
