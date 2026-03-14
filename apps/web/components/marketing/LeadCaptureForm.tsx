"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { captureLead } from "@/lib/actions/lead"
import { leadSchema, type LeadFormValues } from "@/lib/validations/lead"
import { CheckCircle, Loader2, ArrowRight } from "lucide-react"

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
    <section id="lead-capture" className="py-24 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.03] to-background dark:via-primary/[0.05]" />

      <div className="relative max-w-2xl mx-auto px-6 text-center">
        {/* Section header */}
        <p className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">Acesso antecipado</p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
          Participe do beta
        </h2>
        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
          Seja um dos primeiros engenheiros a testar o ProjetaPro. Acesso antecipado,
          gratuito, com suporte direto do time.
        </p>

        {/* Form or success state */}
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-primary" />
            </div>
            <p className="text-xl font-semibold text-foreground">Obrigado!</p>
            <p className="text-muted-foreground">
              Entraremos em contato assim que o beta estiver disponivel.
            </p>
          </div>
        ) : (
          <div className="max-w-lg mx-auto">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col sm:flex-row gap-3"
              noValidate
            >
              <div className="flex-1 flex flex-col">
                <input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  aria-label="Seu email"
                  className={`w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${
                    errors.email
                      ? "border-destructive focus:ring-destructive/50"
                      : "border-border"
                  }`}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-destructive text-left" role="alert">
                    {errors.email.message}
                  </p>
                )}
                {serverError && (
                  <p className="mt-1.5 text-sm text-destructive text-left" role="alert">
                    {serverError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold text-base transition-all duration-200 whitespace-nowrap shadow-premium hover:shadow-premium-lg cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Quero testar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-xs text-muted-foreground">
              Sem spam. Seus dados nao serao compartilhados.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
