import { z } from "zod"

export const createRequisicaoSchema = z.object({
  obraId: z.string().min(1, "obraId e obrigatorio"),
  orcamentoItemId: z.string().optional(),
  descricao: z.string().min(1, "Descricao e obrigatoria"),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  unidade: z.string().min(1, "Unidade e obrigatoria"),
  urgente: z.boolean().optional().default(false),
  observacoes: z.string().optional(),
})

export const addCotacaoSchema = z.object({
  requisicaoId: z.string().min(1, "requisicaoId e obrigatorio"),
  fornecedorId: z.string().min(1, "fornecedorId e obrigatorio"),
  precoUnitario: z.number().positive("Preco unitario deve ser maior que zero"),
  prazoEntrega: z.number().int().min(1).optional(),
  observacoes: z.string().optional(),
})

export const createPedidoSchema = z.object({
  obraId: z.string().min(1, "obraId e obrigatorio"),
  fornecedorId: z.string().min(1, "fornecedorId e obrigatorio"),
  itens: z
    .array(
      z.object({
        requisicaoId: z.string().optional(),
        descricao: z.string().min(1),
        unidade: z.string().min(1),
        quantidade: z.number().positive(),
        precoUnitario: z.number().positive(),
      })
    )
    .min(1, "Pedido deve ter ao menos um item"),
  observacoes: z.string().optional(),
})

export const createFornecedorSchema = z.object({
  nome: z.string().min(1, "Nome e obrigatorio"),
  cnpj: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true
        // Allow formatted CNPJ (XX.XXX.XXX/XXXX-XX) or raw digits (14)
        const digits = val.replace(/\D/g, "")
        return digits.length === 14
      },
      { message: "CNPJ deve ter 14 digitos" }
    ),
  contato: z.string().optional(),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  categorias: z.array(z.string()).default([]),
})

export const updateFornecedorSchema = createFornecedorSchema.partial()

export type CreateRequisicaoInput = z.infer<typeof createRequisicaoSchema>
export type AddCotacaoInput = z.infer<typeof addCotacaoSchema>
export type CreatePedidoInput = z.infer<typeof createPedidoSchema>
export type CreateFornecedorInput = z.infer<typeof createFornecedorSchema>
export type UpdateFornecedorInput = z.infer<typeof updateFornecedorSchema>
