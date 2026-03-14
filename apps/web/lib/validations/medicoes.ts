import { z } from "zod"

// ---- Medicao Fisica ----

export const createMedicaoFisicaSchema = z.object({
  obraId: z.string().min(1, "obraId obrigatorio"),
  orcamentoId: z.string().min(1, "orcamentoId obrigatorio"),
  periodo: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "periodo deve estar no formato AAAA-MM (ex: 2024-11)"),
})

export type CreateMedicaoFisicaInput = z.infer<typeof createMedicaoFisicaSchema>

export const updateMedicaoFisicaItemSchema = z.object({
  medicaoFisicaItemId: z.string().min(1, "medicaoFisicaItemId obrigatorio"),
  percentualExecutado: z
    .number()
    .min(0, "Percentual minimo e 0")
    .max(100, "Percentual maximo e 100"),
})

export type UpdateMedicaoFisicaItemInput = z.infer<typeof updateMedicaoFisicaItemSchema>

// ---- Medicao Contrato ----

export const createMedicaoContratoSchema = z.object({
  obraId: z.string().min(1, "obraId obrigatorio"),
  empreiteiroNome: z.string().min(1, "Nome do empreiteiro obrigatorio"),
  empreiteiroCnpj: z.string().optional(),
  periodo: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "periodo deve estar no formato AAAA-MM"),
})

export type CreateMedicaoContratoInput = z.infer<typeof createMedicaoContratoSchema>

export const addContratoItemSchema = z.object({
  medicaoId: z.string().min(1, "medicaoId obrigatorio"),
  descricao: z.string().min(1, "Descricao obrigatoria"),
  unidade: z.string().min(1, "Unidade obrigatoria"),
  quantidade: z.number().positive("Quantidade deve ser positiva"),
  valorUnitario: z.number().positive("Valor unitario deve ser positivo"),
})

export type AddContratoItemInput = z.infer<typeof addContratoItemSchema>
