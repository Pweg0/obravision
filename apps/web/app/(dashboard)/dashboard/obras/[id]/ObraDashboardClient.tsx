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
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react"

interface ObraStatus {
  id: string
  name: string
  color: string
}

interface RecentPlanta {
  id: string
  revisao: string
  changelog: string
  plantaNome: string
  disciplina: string
  createdAt: string
}

interface RecentRdo {
  id: string
  data: string
  texto: string | null
  tarefaNome: string | null
  createdAt: string
}

interface RecentTarefa {
  id: string
  nome: string
  status: string
  progressoReal: number
  etapaNome: string
  updatedAt: string
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
  progressoGeral: number
  recentPlantas: RecentPlanta[]
  recentRdos: RecentRdo[]
  recentTarefas: RecentTarefa[]
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "agora"
  if (diffMin < 60) return `ha ${diffMin}min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `ha ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return "ontem"
  return `ha ${diffD}d`
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: "Pendente", color: "text-gray-500" },
  EM_ANDAMENTO: { label: "Em andamento", color: "text-blue-500" },
  CONCLUIDA: { label: "Concluida", color: "text-green-500" },
  ATRASADA: { label: "Atrasada", color: "text-red-500" },
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
  progressoGeral,
  recentPlantas,
  recentRdos,
  recentTarefas,
}: ObraDashboardClientProps) {
  const basePath = `/dashboard/obras/${obraId}`

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
        <p className="text-sm text-muted-foreground mt-1">Visao geral da obra</p>
      </div>

      {/* Row 1: Progress + Stats cards + Chart placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card: Progressao da obra */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Progressao da obra
          </h3>
          {/* Progress bar */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold">{progressoGeral}%</span>
              <span className="text-xs text-muted-foreground">concluido</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${progressoGeral}%`,
                  background:
                    progressoGeral >= 80
                      ? "#22c55e"
                      : progressoGeral >= 40
                      ? "#3b82f6"
                      : "#f59e0b",
                }}
              />
            </div>
          </div>
          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-3">
            <Link href={`${basePath}/equipe`} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{memberCount}</p>
                <p className="text-xs text-muted-foreground">Membros</p>
              </div>
            </Link>
            <Link href={`${basePath}/plantas`} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Map className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{plantaCount}</p>
                <p className="text-xs text-muted-foreground">Plantas</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Card: Orcamento sinapi vs real */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Orcamento sinapi vs real
          </h3>
          {hasOrcamento ? (
            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div className="w-full space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">SINAPI (previsto)</span>
                    <span className="text-muted-foreground">100%</span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full">
                    <div className="h-2.5 bg-blue-500 rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Real (executado)</span>
                    <span className="text-muted-foreground">{progressoGeral}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full">
                    <div
                      className="h-2.5 bg-orange-500 rounded-full transition-all"
                      style={{ width: `${progressoGeral}%` }}
                    />
                  </div>
                </div>
              </div>
              <Link
                href={`${basePath}/orcamento`}
                className="mt-4 text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Ver orcamento completo <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <DollarSign className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Orcamento nao criado</p>
              <Link
                href={`${basePath}/orcamento`}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Criar orcamento
              </Link>
            </div>
          )}
        </div>

        {/* Card: Ultimas modificacoes no projeto */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Ultimas modificacoes
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href={`${basePath}/cronograma`} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{etapaCount}</p>
                <p className="text-xs text-muted-foreground">Etapas</p>
              </div>
            </Link>
            <Link href={`${basePath}/rdo`} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{rdoCount}</p>
                <p className="text-xs text-muted-foreground">Diarios</p>
              </div>
            </Link>
          </div>
          {/* Mini recent tasks */}
          <div className="space-y-2">
            {recentTarefas.slice(0, 3).map((t) => {
              const st = statusLabels[t.status] ?? { label: t.status, color: "text-gray-500" }
              return (
                <div key={t.id} className="flex items-center gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    t.status === "CONCLUIDA" ? "bg-green-500" :
                    t.status === "EM_ANDAMENTO" ? "bg-blue-500" :
                    t.status === "ATRASADA" ? "bg-red-500" : "bg-gray-400"
                  }`} />
                  <span className="truncate flex-1 font-medium">{t.nome}</span>
                  <span className="text-muted-foreground">{t.progressoReal}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Secondary metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href={`${basePath}/orcamento`} className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-yellow-500" />
            </div>
          </div>
          <p className="text-xl font-bold">{hasOrcamento ? "Criado" : "Pendente"}</p>
          <p className="text-xs text-muted-foreground">Orcamento</p>
        </Link>
        <Link href={`${basePath}/compras`} className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-pink-500" />
            </div>
          </div>
          <p className="text-xl font-bold">{requisicaoCount}</p>
          <p className="text-xs text-muted-foreground">Compras</p>
        </Link>
        <Link href={`${basePath}/medicoes`} className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Ruler className="w-4 h-4 text-teal-500" />
            </div>
          </div>
          <p className="text-xl font-bold">{medicaoCount}</p>
          <p className="text-xs text-muted-foreground">Medicoes</p>
        </Link>
        <Link href={`${basePath}/estoque`} className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
          <p className="text-xl font-bold">—</p>
          <p className="text-xs text-muted-foreground">Estoque</p>
        </Link>
      </div>

      {/* Row 3: Activity feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Feed: Plantas */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Novas alteracoes nas plantas</h3>
            <Link href={`${basePath}/plantas`} className="text-xs text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          {recentPlantas.length > 0 ? (
            <div className="space-y-3">
              {recentPlantas.map((p) => (
                <div key={p.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Map className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {p.revisao} — {p.plantaNome}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{p.changelog}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {timeAgo(p.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Map className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma alteracao recente</p>
            </div>
          )}
        </div>

        {/* Feed: Diario de obra */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Novas alteracoes diario</h3>
            <Link href={`${basePath}/rdo`} className="text-xs text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {recentRdos.length > 0 ? (
            <div className="space-y-3">
              {recentRdos.map((r) => (
                <div key={r.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {r.tarefaNome ?? "Entrada geral"}
                    </p>
                    {r.texto && (
                      <p className="text-xs text-muted-foreground truncate">{r.texto}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {new Date(r.data).toLocaleDateString("pt-BR")} · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <BookOpen className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma entrada recente</p>
            </div>
          )}
        </div>

        {/* Feed: Gantt / Tarefas */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Novas alteracoes gantt</h3>
            <Link href={`${basePath}/cronograma`} className="text-xs text-primary hover:underline">
              Ver cronograma
            </Link>
          </div>
          {recentTarefas.length > 0 ? (
            <div className="space-y-3">
              {recentTarefas.map((t) => {
                const st = statusLabels[t.status] ?? { label: t.status, color: "text-gray-500" }
                return (
                  <div key={t.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CalendarDays className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{t.etapaNome}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className={`text-xs ${st.color}`}>{st.label}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{t.progressoReal}%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {timeAgo(t.updatedAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <CalendarDays className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma tarefa cadastrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
