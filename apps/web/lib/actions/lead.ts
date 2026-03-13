"use server"

import { prisma } from "@obravision/db"
import { leadSchema } from "@/lib/validations/lead"

export async function captureLead(formData: FormData) {
  const rawEmail = formData.get("email")

  const result = leadSchema.safeParse({ email: rawEmail })

  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Email invalido",
    }
  }

  const { email } = result.data

  try {
    await prisma.lead.upsert({
      where: { email },
      // Re-submission silently succeeds — no duplicate error, record already exists
      update: {},
      create: { email },
    })

    return {
      success: true,
      message: "Obrigado! Entraremos em contato em breve.",
    }
  } catch (error) {
    console.error("[captureLead] Failed to save lead:", error)
    return {
      success: false,
      error: "Ocorreu um erro. Por favor tente novamente.",
    }
  }
}
