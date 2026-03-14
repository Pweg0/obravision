import { z } from "zod"

export const createDepositoSchema = z.object({
  obraId: z.string().min(1, "ID da obra e obrigatorio"),
  nome: z.string().min(1, "Nome do deposito e obrigatorio"),
  tipo: z.string().optional().default("almoxarifado"),
})

export const addMovimentacaoSchema = z.object({
  depositoId: z.string().min(1, "ID do deposito e obrigatorio"),
  tipo: z.enum(["ENTRADA", "SAIDA", "TRANSFERENCIA"]),
  descricao: z.string().min(1, "Descricao e obrigatoria"),
  unidade: z.string().min(1, "Unidade e obrigatoria"),
  quantidade: z.number().positive("Quantidade deve ser positiva"),
  quantidadeMinima: z.number().optional(),
  depositoDestinoId: z.string().optional(),
  pedidoId: z.string().optional(),
  tarefaId: z.string().optional(),
  etapaId: z.string().optional(),
  observacoes: z.string().optional(),
})
  .refine(
    (data) =>
      data.tipo !== "TRANSFERENCIA" || (data.depositoDestinoId !== undefined && data.depositoDestinoId !== ""),
    {
      message: "depositoDestinoId e obrigatorio para transferencias",
      path: ["depositoDestinoId"],
    }
  )

export type CreateDepositoInput = z.infer<typeof createDepositoSchema>
export type AddMovimentacaoInput = z.infer<typeof addMovimentacaoSchema>
