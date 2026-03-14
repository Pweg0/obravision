"use client"

import Link from "next/link"
import { StatusBadge } from "@/components/obra/StatusBadge"
import {
  Users,
  Map,
  CalendarDays,
  BookOpen,
  DollarSign,
  ShoppingCart,
  Ruler,
} from "lucide-react"

interface ObraStatus {
  id: string
  name: string
  color: string
}

interface ObraDashboardClientProps {
  obraId: string
  obraNome: string
  status: ObraStatus | null
  archived: boolean
  memberCount: number
  plantaCount: number
  etapaCount: number
  rdoCount: number
  hasOrcamento: boolean
  requisicaoCount: number
  medicaoCount: number
}

export function ObraDashboardClient({
  obraId,
  obraNome,
  status,
  archived,
  memberCount,
  plantaCount,
  etapaCount,
  rdoCount,
  hasOrcamento,
  requisicaoCount,
  medicaoCount,
}: ObraDashboardClientProps) {
  const cards = [
    {
      label: "Membros",
      value: memberCount,
      icon: Users,
      href: `/dashboard/obras/${obraId}/equipe`,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Plantas",
      value: plantaCount,
      icon: Map,
      href: `/dashboard/obras/${obraId}/plantas`,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Etapas",
      value: etapaCount,
      icon: CalendarDays,
      href: `/dashboard/obras/${obraId}/cronograma`,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "Diarios",
      value: rdoCount,
      icon: BookOpen,
      href: `/dashboard/obras/${obraId}/rdo`,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Orcamento",
      value: hasOrcamento ? "Criado" : "Pendente",
      icon: DollarSign,
      href: `/dashboard/obras/${obraId}/orcamento`,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Compras",
      value: requisicaoCount,
      icon: ShoppingCart,
      href: `/dashboard/obras/${obraId}/compras`,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    {
      label: "Medicoes",
      value: medicaoCount,
      icon: Ruler,
      href: `/dashboard/obras/${obraId}/medicoes`,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{obraNome}</h1>
          {status && <StatusBadge name={status.name} color={status.color} />}
          {archived && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
              Arquivada
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Visao geral da obra
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-xl border p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-[18px] h-[18px] ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
