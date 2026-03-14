/**
 * Auth-related TypeScript types for ProjetaPro.
 * These extend Auth.js session types with application-specific fields.
 */

// Role enum matching Prisma schema
export enum Role {
  ADMIN = "ADMIN",
  ENGENHEIRO = "ENGENHEIRO",
  CLIENTE = "CLIENTE",
}

// Session user type extension
export interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  empresaId?: string | null
  role: Role
  onboardingStep: number
}

// Auth.js session type extension
export interface AppSession {
  user: SessionUser
  expires: string
}

// JWT token extension
export interface AppJWT {
  id: string
  empresaId?: string | null
  role: Role
  onboardingStep: number
}

// Register form data
export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

// Login form data
export interface LoginFormData {
  email: string
  password: string
}

// Forgot password form data
export interface ForgotPasswordFormData {
  email: string
}

// Reset password form data
export interface ResetPasswordFormData {
  token: string
  password: string
  confirmPassword: string
}
