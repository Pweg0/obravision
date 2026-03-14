"use server"

import { prisma } from "@obravision/db"
import bcrypt from "bcryptjs"
import { nanoid } from "nanoid"
import { signIn } from "./auth"
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./validations/auth"
import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

type ActionResult = {
  success: boolean
  error?: string
  message?: string
}

/**
 * Register a new user with email and password.
 * Validates input, checks email uniqueness, hashes password, creates user, signs in.
 */
export async function register(formData: FormData): Promise<ActionResult> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  }

  const result = registerSchema.safeParse(rawData)
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Dados invalidos",
    }
  }

  const { name, email, password } = result.data

  // Check email uniqueness
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { success: false, error: "Email ja esta em uso" }
  }

  // Hash password with bcrypt salt rounds 12
  const passwordHash = await bcrypt.hash(password, 12)

  // Create user manually (not via adapter — adapter doesn't store passwords)
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ENGENHEIRO",
      onboardingStep: 0,
    },
  })

  // Sign in with credentials
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
  } catch {
    // signIn may throw on redirect — session still created
  }

  return { success: true, message: "Conta criada com sucesso!" }
}

/**
 * Login with email and password credentials.
 */
export async function login(formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const result = loginSchema.safeParse(rawData)
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Dados invalidos",
    }
  }

  const { email, password } = result.data

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    return { success: true }
  } catch {
    return { success: false, error: "Email ou senha incorretos" }
  }
}

/**
 * Request a password reset email.
 * Always returns success to prevent email enumeration.
 */
export async function forgotPassword(
  formData: FormData
): Promise<ActionResult> {
  const rawData = { email: formData.get("email") }

  const result = forgotPasswordSchema.safeParse(rawData)
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Email invalido",
    }
  }

  const { email } = result.data

  // Find user — but don't reveal if they exist
  const user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    // Generate secure reset token
    const token = nanoid(32)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    // Send reset email via Resend
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

    await resend?.emails.send({
      from: "ObraVision <noreply@obravision.com.br>",
      to: email,
      subject: "Redefinir sua senha — ObraVision",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A6B5A;">Redefinir Senha</h2>
          <p>Recebemos uma solicitacao para redefinir a senha da sua conta ObraVision.</p>
          <p>Clique no link abaixo para criar uma nova senha. Este link e valido por 1 hora.</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #1A6B5A; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            Redefinir Senha
          </a>
          <p>Se voce nao solicitou a redefinicao de senha, ignore este email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #6b7280; font-size: 14px;">ObraVision — Gestao de Obras Visual</p>
        </div>
      `,
    })
  }

  // Always return success (prevent email enumeration)
  return {
    success: true,
    message:
      "Se o email estiver cadastrado, voce recebera as instrucoes em breve.",
  }
}

/**
 * Reset password using a valid token.
 * Validates token (not expired, not used), updates password, marks token used.
 */
export async function resetPassword(
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  }

  const result = resetPasswordSchema.safeParse(rawData)
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Dados invalidos",
    }
  }

  const { token, password } = result.data

  // Find the reset token
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  if (!resetToken) {
    return { success: false, error: "Token invalido ou expirado" }
  }

  if (resetToken.usedAt) {
    return { success: false, error: "Este link ja foi utilizado" }
  }

  if (resetToken.expiresAt < new Date()) {
    return { success: false, error: "Este link expirou. Solicite um novo." }
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(password, 12)

  // Update user password and mark token as used atomically
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ])

  return { success: true, message: "Senha redefinida com sucesso!" }
}
