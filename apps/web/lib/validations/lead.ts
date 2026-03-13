import { z } from "zod"

export const leadSchema = z.object({
  email: z
    .string()
    .min(1, "Email e obrigatorio")
    .email("Por favor insira um email valido"),
})

export type LeadFormValues = z.infer<typeof leadSchema>
