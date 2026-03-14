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
  ArrowRight,
  TrendingUp,
  BarChart3,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

// ── Types ──

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

interface OrcamentoEtapa {
  nome: string
  total: number
  itemCount: number
}

interface MedicaoProgresso {
  periodo: string
  status: string
  progresso: number
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
  requisicaoByStatus: Record<string, number>
  requisicaoTotal: number
  pedidoByStatus: Record<string, number>
  pedidoTotal: number
  pedidoValorTotal: number
  cotacaoCount: number
  medicaoCount: number
  progressoGeral: number
  orcamentoEtapas: OrcamentoEtapa[]
  orcamentoTotal: number
  bdi: number
  medicaoProgresso: MedicaoProgresso[]
  recentPlantas: RecentPlanta[]
  recentRdos: RecentRdo[]
  recentTarefas: RecentTarefa[]
}

// ── Helpers ──

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toFixed(0)
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: "Pendente", color: "text-gray-500" },
  EM_ANDAMENTO: { label: "Em andamento", color: "text-blue-500" },
  CONCLUIDA: { label: "Concluida", color: "text-green-500" },
  ATRASADA: { label: "Atrasada", color: "text-red-500" },
}

const REQUISICAO_COLORS: Record<string, string> = {
  RASCUNHO: "#94a3b8",
  PENDENTE: "#f59e0b",
  APROVADA: "#22c55e",
  REJEITADA: "#ef4444",
  CANCELADA: "#6b7280",
}

const REQUISICAO_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
  CANCELADA: "Cancelada",
}

const PEDIDO_COLORS: Record<string, string> = {
  RASCUNHO: "#94a3b8",
  ENVIADO: "#3b82f6",
  CONFIRMADO: "#22c55e",
  ENTREGUE_PARCIAL: "#f59e0b",
  ENTREGUE: "#10b981",
  CANCELADO: "#ef4444",
}

const PEDIDO_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  CONFIRMADO: "Confirmado",
  ENTREGUE_PARCIAL: "Parcial",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
}

const CHART_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
]

// ── Section header ──

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <h2
      className="text-sm font-bold uppercase tracking-wider mb-4"
      style={{ color }}
    >
      {title}
    </h2>
  )
}

// ── Pie chart with legend ──

function StatusPieChart({
  data,
  colors,
  labels,
  title,
  total,
}: {
  data: Record<string, number>
  colors: Record<string, string>
  labels: Record<string, string>
  title: string
  total: number
}) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: labels[key] ?? key,
    value,
    color: colors[key] ?? "#94a3b8",
  }))

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-5 flex flex-col items-center justify-center min-h-[280px]">
        <ShoppingCart className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">Sem dados</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-center mb-1">
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold mt-1">{total}</p>
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [value, name]}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ──

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
  requisicaoByStatus,
  requisicaoTotal,
  pedidoByStatus,
  pedidoTotal,
  pedidoValorTotal,
  cotacaoCount,
  medicaoCount,
  progressoGeral,
  orcamentoEtapas,
  orcamentoTotal,
  bdi,
  medicaoProgresso,
  recentPlantas,
  recentRdos,
  recentTarefas,
}: ObraDashboardClientProps) {
  const basePath = `/dashboard/obras/${obraId}`

  // Prepare budget bar chart data
  const budgetChartData = orcamentoEtapas.map((e) => ({
    nome: e.nome.length > 15 ? e.nome.slice(0, 15) + "..." : e.nome,
    valor: e.total,
  }))

  // Prepare medicao line chart data
  const medicaoChartData = medicaoProgresso.map((m) => ({
    periodo: m.periodo,
    progresso: m.progresso,
  }))

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
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
            Painel gerencial
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <span>Progresso geral: </span>
          <span className="text-lg font-bold text-foreground">
            {progressoGeral}%
          </span>
        </div>
      </div>

      {/* ── Row 1: Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Link href={`${basePath}/equipe`} className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold">{memberCount}</p>
          <p className="text-[11px] text-muted-foreground">Membros</p>
        </Link>
        <Link href={`${basePath}/plantas`} className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
            <Map className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold">{plantaCount}</p>
          <p className="text-[11px] text-muted-foreground">Plantas</p>
        </Link>
        <Link href={`${basePath}/cronograma`} className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
            <CalendarDays className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-xl font-bold">{etapaCount}</p>
          <p className="text-[11px] text-muted-foreground">Etapas</p>
        </Link>
        <Link href={`${basePath}/rdo`} className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold">{rdoCount}</p>
          <p className="text-[11px] text-muted-foreground">Diarios</p>
        </Link>
        <Link href={`${basePath}/compras`} className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center mb-2">
            <ShoppingCart className="w-4 h-4 text-pink-500" />
          </div>
          <p className="text-xl font-bold">{requisicaoTotal}</p>
          <p className="text-[11px] text-muted-foreground">Compras</p>
        </Link>
        <Link href={`${basePath}/medicoes`} className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center mb-2">
            <Ruler className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-xl font-bold">{medicaoCount}</p>
          <p className="text-[11px] text-muted-foreground">Medicoes</p>
        </Link>
        <Link href={`${basePath}/estoque`} className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-2">
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold">—</p>
          <p className="text-[11px] text-muted-foreground">Estoque</p>
        </Link>
      </div>

      {/* ── Row 2: ORCAMENTO section ── */}
      <div>
        <SectionHeader title="Orcamento" color="#d97706" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Budget summary */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Resumo do orcamento</h3>
              <Link
                href={`${basePath}/orcamento`}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Ver completo <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {hasOrcamento ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Custo total</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(orcamentoTotal)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Com BDI ({bdi}%)
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(
                        orcamentoTotal * (1 + bdi / 100)
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Etapas</p>
                    <p className="text-lg font-semibold">
                      {orcamentoEtapas.length}
                    </p>
                  </div>
                </div>
                {/* Progress bar: SINAPI vs Real */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground">
                    SINAPI (previsto) vs Real
                  </p>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Previsto</span>
                      <span>{formatCompact(orcamentoTotal)}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Executado</span>
                      <span>{progressoGeral}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full">
                      <div
                        className="h-2 bg-orange-500 rounded-full transition-all"
                        style={{ width: `${progressoGeral}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Orcamento nao criado
                </p>
                <Link
                  href={`${basePath}/orcamento`}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Criar orcamento
                </Link>
              </div>
            )}
          </div>

          {/* Budget by etapa - bar chart */}
          <div className="rounded-xl border bg-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Custo por etapa</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Total: {formatCurrency(orcamentoTotal)}</span>
              </div>
            </div>
            {budgetChartData.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="nome"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={formatCompact}
                    />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [
                        formatCurrency(Number(value)),
                        "Valor",
                      ]}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                      {budgetChartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma etapa no orcamento
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: COMPRAS EM ANDAMENTO ── */}
      <div>
        <SectionHeader title="Compras em andamento" color="#2563eb" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusPieChart
            data={requisicaoByStatus}
            colors={REQUISICAO_COLORS}
            labels={REQUISICAO_LABELS}
            title="Solicitacoes"
            total={requisicaoTotal}
          />

          <div className="rounded-xl border bg-card p-5 flex flex-col items-center justify-center">
            <p className="text-sm font-semibold text-muted-foreground">
              Cotacoes
            </p>
            <p className="text-3xl font-bold mt-1">{cotacaoCount}</p>
            <div className="h-[180px] flex items-center justify-center">
              {cotacaoCount > 0 ? (
                <div className="text-center space-y-2">
                  <div className="w-[150px] h-[150px] rounded-full border-8 border-blue-500/20 flex items-center justify-center mx-auto">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{cotacaoCount}</p>
                      <p className="text-[10px] text-muted-foreground">
                        recebidas
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem cotacoes</p>
              )}
            </div>
          </div>

          <StatusPieChart
            data={pedidoByStatus}
            colors={PEDIDO_COLORS}
            labels={PEDIDO_LABELS}
            title="Ordens de compra"
            total={pedidoTotal}
          />
        </div>
      </div>

      {/* ── Row 4: MEDICOES - progress over time ── */}
      {medicaoChartData.length > 0 && (
        <div>
          <SectionHeader title="Medicoes - Progresso fisico" color="#0d9488" />
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">
                Progresso acumulado por periodo
              </h3>
              <Link
                href={`${basePath}/medicoes`}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Ver medicoes <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={medicaoChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="periodo"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [`${value}%`, "Progresso"]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="progresso"
                    stroke="#0d9488"
                    fill="#0d9488"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Row 5: Activity feeds ── */}
      <div>
        <SectionHeader title="Ultimas modificacoes" color="#6b7280" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Feed: Plantas */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Alteracoes nas plantas</h3>
              <Link
                href={`${basePath}/plantas`}
                className="text-xs text-primary hover:underline"
              >
                Ver todas
              </Link>
            </div>
            {recentPlantas.length > 0 ? (
              <div className="space-y-3">
                {recentPlantas.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Map className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.revisao} — {p.plantaNome}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.changelog}
                      </p>
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
                <p className="text-xs text-muted-foreground">
                  Nenhuma alteracao recente
                </p>
              </div>
            )}
          </div>

          {/* Feed: Diario de obra */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Alteracoes diario</h3>
              <Link
                href={`${basePath}/rdo`}
                className="text-xs text-primary hover:underline"
              >
                Ver todos
              </Link>
            </div>
            {recentRdos.length > 0 ? (
              <div className="space-y-3">
                {recentRdos.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {r.tarefaNome ?? "Entrada geral"}
                      </p>
                      {r.texto && (
                        <p className="text-xs text-muted-foreground truncate">
                          {r.texto}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {new Date(r.data).toLocaleDateString("pt-BR")} ·{" "}
                        {timeAgo(r.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <BookOpen className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Nenhuma entrada recente
                </p>
              </div>
            )}
          </div>

          {/* Feed: Gantt / Tarefas */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Alteracoes gantt</h3>
              <Link
                href={`${basePath}/cronograma`}
                className="text-xs text-primary hover:underline"
              >
                Ver cronograma
              </Link>
            </div>
            {recentTarefas.length > 0 ? (
              <div className="space-y-3">
                {recentTarefas.map((t) => {
                  const st = statusLabels[t.status] ?? {
                    label: t.status,
                    color: "text-gray-500",
                  }
                  return (
                    <div
                      key={t.id}
                      className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                    >
                      <div className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CalendarDays className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {t.etapaNome}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ·
                          </span>
                          <span className={`text-xs ${st.color}`}>
                            {st.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ·
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t.progressoReal}%
                          </span>
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
                <p className="text-xs text-muted-foreground">
                  Nenhuma tarefa cadastrada
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
