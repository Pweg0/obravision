"use client"

import { Suspense, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth"
import { resetPassword } from "@/lib/auth-actions"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  })

  // If no token in URL, show error
  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Link invalido</CardTitle>
          <CardDescription>
            Este link de redefinicao de senha e invalido ou expirou.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Solicitar novo link
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Senha redefinida!</CardTitle>
          <CardDescription>
            Sua senha foi redefinida com sucesso. Voce ja pode entrar com sua
            nova senha.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={() => router.push("/login")}
            className="w-full"
            style={{ backgroundColor: "#1A6B5A" }}
          >
            Ir para o login
          </Button>
        </CardContent>
      </Card>
    )
  }

  async function onSubmit(data: ResetPasswordFormValues) {
    setServerError(null)
    const formData = new FormData()
    formData.append("token", data.token)
    formData.append("password", data.password)
    formData.append("confirmPassword", data.confirmPassword)

    const result = await resetPassword(formData)

    if (result.success) {
      setSubmitted(true)
    } else {
      setServerError(result.error ?? "Erro ao redefinir senha")
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Redefinir senha</CardTitle>
        <CardDescription>Crie uma nova senha para sua conta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Hidden token field */}
          <input type="hidden" {...register("token")} value={token} />

          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimo 8 caracteres"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {serverError && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: "#1A6B5A" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Solicitar novo link
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

// Page export wraps the form in Suspense (required for useSearchParams in Next.js 15)
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Carregando...</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
