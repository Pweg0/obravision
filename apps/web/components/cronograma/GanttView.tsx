"use client"

import React, { useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { differenceInDays } from "date-fns"
import { CloudRain } from "lucide-react"
import { updateTarefaDates } from "@/lib/actions/cronograma"
import { EtapaForm } from "./EtapaForm"
import { TarefaForm } from "./TarefaForm"
import { Button } from "@/components/ui/button"

// Dynamically import Gantt + Willow theme with SSR disabled
// CSS must be imported for the chart to render (bars, grid, timeline)
const GanttModule = dynamic(
  () => Promise.all([
    import("@svar-ui/react-gantt"),
    // @ts-expect-error - CSS module import has no type declarations
    import("@svar-ui/react-gantt/all.css"),
  ]).then(([m]) => {
    const { Gantt, Willow } = m
    // eslint-disable-next-line react/display-name
    return { default: (props: Record<string, unknown>) => (
      <Willow>
        <Gantt {...props} />
      </Willow>
    )}
  }),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Carregando cronograma...</div> }
)

export interface TarefaData {
  id: string
  tenantId: string
  obraId: string
  etapaId: string
  nome: string
  responsavelId: string | null
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "ATRASADA"
  startDate: Date
  endDate: Date
  climaSensivel: boolean | null
  progressoReal: number
  createdAt: Date
  updatedAt: Date
  /** Populated by listCronograma when an active weather alert exists for this tarefa */
  temAlertaChuva?: "weather_preliminary" | "weather_confirmed" | null
}

export interface EtapaData {
  id: string
  tenantId: string
  obraId: string
  nome: string
  ordem: number
  climaSensivel: boolean
  createdAt: Date
  updatedAt: Date
  tarefas: TarefaData[]
}

interface Member {
  id: string
  userId: string
  role: string
  user?: { id: string; name: string | null; email: string | null; image: string | null }
}

interface GanttViewProps {
  etapas: EtapaData[]
  obraId: string
  members: Member[]
  currentUserRole: string
}

type GanttTask = {
  id: string
  text: string
  start: Date
  duration: number
  end?: Date
  parent?: string
  type?: string
  progress?: number
  open?: boolean
  /** custom fields */
  _status?: string
  _climaSensivel?: boolean | null
  _delayDays?: number
  _alertaChuva?: "weather_preliminary" | "weather_confirmed" | null
}

function getTaskColor(tarefa: TarefaData): string {
  if (tarefa.status === "ATRASADA") return "#DC2626" // red-600
  // Check if ahead of schedule
  const today = new Date()
  const totalDays = differenceInDays(tarefa.endDate, tarefa.startDate) + 1
  if (totalDays > 0 && tarefa.startDate <= today) {
    const daysSinceStart = differenceInDays(today, tarefa.startDate) + 1
    const expectedPct = Math.min(100, (daysSinceStart / totalDays) * 100)
    if (tarefa.progressoReal > expectedPct && tarefa.endDate > today) {
      return "#2563EB" // blue-600 = ahead of schedule
    }
  }
  return "#1A6B5A" // verde-obra = on-time
}

function getDelayDays(tarefa: TarefaData): number {
  if (tarefa.status !== "ATRASADA") return 0
  const today = new Date()
  return differenceInDays(today, tarefa.endDate)
}

export function GanttView({ etapas, obraId, members, currentUserRole }: GanttViewProps) {
  const [isPending, startTransition] = useTransition()
  const [showEtapaForm, setShowEtapaForm] = useState(false)
  const [showTarefaForm, setShowTarefaForm] = useState(false)
  const [editingEtapa, setEditingEtapa] = useState<EtapaData | null>(null)
  const [editingTarefa, setEditingTarefa] = useState<TarefaData | null>(null)
  const [selectedEtapaId, setSelectedEtapaId] = useState<string | null>(null)

  const canEdit = currentUserRole === "ADMIN" || currentUserRole === "ENGENHEIRO"

  // Build flat task array for the Gantt component
  const tasks: GanttTask[] = []

  for (const etapa of etapas) {
    // Compute etapa date range from children, or fallback to today
    const tarefaDates = etapa.tarefas.map((t) => ({
      start: new Date(t.startDate),
      end: new Date(t.endDate),
    }))

    const etapaStart =
      tarefaDates.length > 0
        ? new Date(Math.min(...tarefaDates.map((d) => d.start.getTime())))
        : new Date()
    const etapaEnd =
      tarefaDates.length > 0
        ? new Date(Math.max(...tarefaDates.map((d) => d.end.getTime())))
        : new Date()

    const etapaDuration = Math.max(1, differenceInDays(etapaEnd, etapaStart) + 1)

    tasks.push({
      id: etapa.id,
      text: etapa.nome,
      start: etapaStart,
      duration: etapaDuration,
      type: "summary",
      open: true,
    })

    for (const tarefa of etapa.tarefas) {
      const delayDays = getDelayDays(tarefa)
      const tStart = new Date(tarefa.startDate)
      const tEnd = new Date(tarefa.endDate)
      const tDuration = Math.max(1, differenceInDays(tEnd, tStart) + 1)
      tasks.push({
        id: tarefa.id,
        text:
          tarefa.status === "ATRASADA" && delayDays > 0
            ? `${tarefa.nome} (-${delayDays}d)`
            : tarefa.nome,
        start: tStart,
        duration: tDuration,
        parent: etapa.id,
        progress: tarefa.progressoReal,
        _status: tarefa.status,
        _climaSensivel: tarefa.climaSensivel,
        _delayDays: delayDays,
        _alertaChuva: tarefa.temAlertaChuva ?? null,
      })
    }
  }

  function handleTaskUpdate(task: GanttTask) {
    startTransition(async () => {
      const endDate = new Date(task.start)
      endDate.setDate(endDate.getDate() + (task.duration - 1))
      await updateTarefaDates(task.id, {
        startDate: task.start,
        endDate,
      })
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cronograma</h2>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingEtapa(null)
                setShowEtapaForm(true)
              }}
            >
              + Nova Etapa
            </Button>
            {etapas.length > 0 && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingTarefa(null)
                  setSelectedEtapaId(etapas[0]?.id ?? null)
                  setShowTarefaForm(true)
                }}
                style={{ backgroundColor: "#1A6B5A" }}
                className="text-white hover:opacity-90"
              >
                + Nova Tarefa
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Weather alert indicator: tarefas with active rain alerts */}
      {(() => {
        const alertTarefas = etapas
          .flatMap((e) => e.tarefas)
          .filter((t) => t.temAlertaChuva != null)
        if (alertTarefas.length === 0) return null
        return (
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <CloudRain className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Alertas de chuva ativos ({alertTarefas.length} tarefa{alertTarefas.length > 1 ? "s" : ""})
              </span>
            </div>
            <ul className="space-y-1">
              {alertTarefas.map((t) => {
                const isConfirmed = t.temAlertaChuva === "weather_confirmed"
                return (
                  <li key={t.id} className="flex items-center gap-2 text-xs">
                    <CloudRain
                      className="h-3 w-3 flex-shrink-0"
                      style={{ color: isConfirmed ? "#DC2626" : "#EA580C" }}
                    />
                    <span className="text-orange-900">
                      {t.nome}
                      <span
                        className="ml-1 font-medium"
                        style={{ color: isConfirmed ? "#DC2626" : "#EA580C" }}
                      >
                        ({isConfirmed ? "chuva confirmada amanha" : "chuva prevista em 3 dias"})
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })()}

      {/* Etapa list with inline actions */}
      {etapas.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2 bg-muted/30 border-b">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Etapas ({etapas.length})
            </p>
          </div>
          <ul className="divide-y">
            {etapas.map((etapa) => (
              <li key={etapa.id} className="flex items-center justify-between px-4 py-2">
                <div>
                  <span className="text-sm font-medium">{etapa.nome}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {etapa.tarefas.length} tarefa(s)
                  </span>
                  {etapa.climaSensivel && (
                    <span className="ml-2 text-xs text-blue-600">sensivel ao clima</span>
                  )}
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingEtapa(etapa)
                        setShowEtapaForm(true)
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="text-xs text-[#1A6B5A] hover:opacity-80"
                      onClick={() => {
                        setEditingTarefa(null)
                        setSelectedEtapaId(etapa.id)
                        setShowTarefaForm(true)
                      }}
                    >
                      + Tarefa
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gantt chart */}
      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhuma etapa ou tarefa cadastrada.
          </p>
          {canEdit && (
            <p className="text-muted-foreground text-xs mt-1">
              Crie uma etapa para comecar o cronograma.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <GanttModule
            tasks={tasks}
            scales={[
              { unit: "month", step: 1, format: "%F %Y" },
              { unit: "day", step: 1, format: "%j" },
            ]}
            cellWidth={40}
            cellHeight={38}
          />
        </div>
      )}

      {isPending && (
        <p className="text-xs text-muted-foreground text-center">Salvando alteracoes...</p>
      )}

      {/* EtapaForm modal */}
      {showEtapaForm && (
        <EtapaForm
          obraId={obraId}
          etapa={editingEtapa}
          nextOrdem={etapas.length + 1}
          onClose={() => setShowEtapaForm(false)}
        />
      )}

      {/* TarefaForm modal */}
      {showTarefaForm && (
        <TarefaForm
          obraId={obraId}
          etapaId={selectedEtapaId ?? etapas[0]?.id ?? ""}
          etapas={etapas.map((e) => ({ id: e.id, nome: e.nome }))}
          tarefa={editingTarefa}
          members={members}
          onClose={() => setShowTarefaForm(false)}
        />
      )}
    </div>
  )
}
