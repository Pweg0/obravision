/**
 * Obra-related TypeScript types for ObraVision.
 */

// ObraTipo enum matching Prisma schema
export enum ObraTipo {
  RESIDENCIAL = "RESIDENCIAL",
  COMERCIAL = "COMERCIAL",
  REFORMA = "REFORMA",
}

// Role enum (re-exported from auth, used in obra context)
export { Role } from "./auth"

// Base Obra interface
export interface Obra {
  id: string
  tenantId: string
  nome: string
  logradouro: string
  numero: string
  cidade: string
  estado: string
  cep: string
  tipo: ObraTipo
  area: number // m²
  archived: boolean
  coverUrl?: string | null
  statusId?: string | null
  empresaId: string
  createdAt: Date
  updatedAt: Date
}

// ObraStatus interface
export interface ObraStatus {
  id: string
  tenantId: string
  name: string
  color: string
  empresaId: string
}

// ObraMember interface
export interface ObraMember {
  id: string
  tenantId: string
  userId: string
  obraId: string
  role: import("./auth").Role
  permissions?: Record<string, unknown> | null
  createdAt: Date
}

// Obra with related data
export interface ObraWithStatus extends Obra {
  status?: ObraStatus | null
}

// Obra form data for create/edit
export interface ObraFormData {
  nome: string
  logradouro: string
  numero: string
  cidade: string
  estado: string
  cep: string
  tipo: ObraTipo
  area: number
}
