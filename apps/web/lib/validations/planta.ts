import { z } from "zod"

export const DisciplinaTipoEnum = z.enum([
  "ARQUITETURA",
  "ESTRUTURAL",
  "ELETRICA",
  "HIDRAULICA",
  "INCENDIO",
  "TOPOGRAFIA",
  "CUSTOMIZADO",
])

export type DisciplinaTipo = z.infer<typeof DisciplinaTipoEnum>

export const createPlantaSchema = z
  .object({
    nome: z
      .string()
      .min(3, "Nome deve ter pelo menos 3 caracteres")
      .max(100, "Nome deve ter no maximo 100 caracteres"),
    disciplina: DisciplinaTipoEnum,
    disciplinaCustom: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.disciplina === "CUSTOMIZADO") {
        return !!data.disciplinaCustom && data.disciplinaCustom.trim().length > 0
      }
      return true
    },
    {
      message: "Descricao do tipo customizado e obrigatoria",
      path: ["disciplinaCustom"],
    }
  )

export type CreatePlantaInput = z.infer<typeof createPlantaSchema>

export const createRevisaoSchema = z.object({
  changelog: z
    .string()
    .min(1, "Changelog e obrigatorio")
    .max(500, "Changelog deve ter no maximo 500 caracteres"),
  r2Key: z.string().min(1, "Chave R2 e obrigatoria"),
  fileSize: z.coerce.number().positive("Tamanho do arquivo deve ser positivo"),
  migrarPins: z.coerce.boolean().optional().default(false),
  revisao: z.string().regex(/^R\d+$/, "Revisao deve ser no formato R0, R1, R2...").optional(),
})

export type CreateRevisaoInput = z.infer<typeof createRevisaoSchema>
