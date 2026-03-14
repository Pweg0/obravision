import { z } from "zod"

export const createEtapaSchema = z.object({
  orcamentoId: z.string().min(1, "orcamentoId e obrigatorio"),
  nome: z.string().min(1, "Nome da etapa e obrigatorio"),
  ordem: z.number().int().min(0, "Ordem deve ser um numero inteiro nao-negativo"),
})

export const createItemSchema = z.object({
  etapaId: z.string().min(1, "etapaId e obrigatorio"),
  descricao: z.string().min(1, "Descricao e obrigatoria"),
  unidade: z.string().min(1, "Unidade e obrigatoria"),
  quantidade: z.number().positive("Quantidade deve ser positiva"),
  custoUnitario: z.number().min(0, "Custo unitario deve ser nao-negativo"),
  sinapiCodigo: z.string().optional(),
})

export const updateItemSchema = createItemSchema.partial().omit({ etapaId: true })

export const updateBdiSchema = z.object({
  orcamentoId: z.string().min(1, "orcamentoId e obrigatorio"),
  bdi: z.number().min(0, "BDI deve ser nao-negativo").max(100, "BDI nao pode exceder 100%"),
})

export const itemImportRowSchema = z.object({
  descricao: z.string().min(1),
  unidade: z.string().min(1),
  quantidade: z.coerce.number().positive(),
  custoUnitario: z.coerce.number().min(0),
})
