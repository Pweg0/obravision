"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { captureLead } from "@/lib/actions/lead"
import { leadSchema, type LeadFormValues } from "@/lib/validations/lead"
import { CheckCircle, Loader2 } from "lucide-react"

export function LeadCaptureForm() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
  })

  async function onSubmit(data: LeadFormValues) {
    setServerError(null)
    const formData = new FormData()
    formData.append("email", data.email)

    const result = await captureLead(formData)

    if (result.success) {
      setSubmitted(true)
    } else {
      setServerError(result.error ?? "Ocorreu um erro. Por favor tente novamente.")
    }
  }

  return (
    <section id="lead-capture" className="py-20 bg-slate-50">
      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Section header */}
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Participe do beta
        </h2>
        <p className="text-lg text-slate-500 mb-10">
          Seja um dos primeiros engenheiros a testar o ObraVision. Acesso antecipado,
          gratuito, com suporte direto do time.
        </p>

        {/* Form or success state */}
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
            <p className="text-xl font-semibold text-slate-900">Obrigado!</p>
            <p className="text-slate-500">
              Entraremos em contato assim que o beta estiver disponivel.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            noValidate
          >
            <div className="flex-1 flex flex-col">
              <input
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                aria-label="Seu email"
                className={`w-full px-4 py-3 rounded-lg border text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow ${
                  errors.email
                    ? "border-red-400 focus:ring-red-400"
                    : "border-slate-300"
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600 text-left" role="alert">
                  {errors.email.message}
                </p>
              )}
              {serverError && (
                <p className="mt-1.5 text-sm text-red-600 text-left" role="alert">
                  {serverError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-800 disabled:opacity-60 text-white font-semibold text-base transition-colors duration-200 whitespace-nowrap"
              style={{ backgroundColor: "#1A6B5A" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Quero testar"
              )}
            </button>
          </form>
        )}

        <p className="mt-6 text-xs text-slate-400">
          Sem spam. Seus dados nao serao compartilhados.
        </p>
      </div>
    </section>
  )
}
