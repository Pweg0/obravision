import { z } from "zod"

export const ESTADOS_BRASILEIROS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const

export const OBRA_TIPOS = ["RESIDENCIAL", "COMERCIAL", "REFORMA"] as const

export const obraSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome muito longo"),
  logradouro: z.string().min(1, "Logradouro e obrigatorio"),
  numero: z.string().min(1, "Numero e obrigatorio"),
  cidade: z.string().min(1, "Cidade e obrigatoria"),
  estado: z.enum(ESTADOS_BRASILEIROS, { errorMap: () => ({ message: "Estado invalido" }) }),
  cep: z
    .string()
    .regex(/^\d{8}$/, "CEP deve ter 8 digitos (apenas numeros)"),
  tipo: z.enum(OBRA_TIPOS, { errorMap: () => ({ message: "Tipo invalido" }) }),
  area: z
    .string()
    .transform((v) => parseFloat(v))
    .pipe(z.number().positive("Area deve ser um numero positivo")),
})

export type ObraInput = z.infer<typeof obraSchema>

export const obraUpdateSchema = obraSchema.extend({
  statusId: z.string().optional(),
})

export const statusSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio").max(50, "Nome muito longo"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser um hex valido (ex: #1A6B5A)"),
})

export type StatusInput = z.infer<typeof statusSchema>
