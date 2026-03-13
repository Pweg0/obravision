"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { createRdoEntrada, getActiveTask, getCurrentWeather } from "@/lib/actions/rdo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RdoPhotoUpload } from "@/components/rdo/RdoPhotoUpload"

const formSchema = z.object({
  data: z.string().min(1, "Data e obrigatoria"),
  texto: z.string().optional(),
  tarefaId: z.string().optional(),
  climaCondicao: z.string().optional(),
  climaTemp: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().optional()
  ),
  climaUmidade: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().optional()
  ),
  climaFonteDado: z.enum(["open-meteo", "manual"]).optional(),
  // Optional expandable fields
  maoDeObra: z.string().optional(),
  materiais: z.string().optional(),
  ocorrencias: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Tarefa {
  id: string
  nome: string
  etapa?: { nome: string } | null
}

interface RdoFormProps {
  obraId: string
  lat?: number | null
  lon?: number | null
  tarefas?: Tarefa[]
}

export function RdoForm({ obraId, lat, lon, tarefas = [] }: RdoFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [climaFonte, setClimaFonte] = useState<"open-meteo" | "manual" | null>(null)
  const [showMaoDeObra, setShowMaoDeObra] = useState(false)
  const [showMateriais, setShowMateriais] = useState(false)
  const [showOcorrencias, setShowOcorrencias] = useState(false)
  const [createdEntradaId, setCreatedEntradaId] = useState<string | null>(null)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [loadingTask, setLoadingTask] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data: format(new Date(), "yyyy-MM-dd"),
      climaFonteDado: "manual",
    },
  })

  const watchedTarefaId = watch("tarefaId")

  async function handleDateChange(dateStr: string) {
    setValue("data", dateStr)
    if (!dateStr) return

    // Auto-detect active task for the selected date
    setLoadingTask(true)
    try {
      const date = new Date(dateStr)
      const tarefa = await getActiveTask(obraId, date)
      if (tarefa) {
        setValue("tarefaId", tarefa.id)
      }
    } catch {
      // Non-fatal
    } finally {
      setLoadingTask(false)
    }

    // Auto-fetch weather if coordinates available
    if (lat && lon) {
      setLoadingWeather(true)
      try {
        const weather = await getCurrentWeather(lat, lon)
        if (weather) {
          setValue("climaCondicao", weather.condicao)
          setValue("climaTemp", weather.temperatura)
          setValue("climaUmidade", weather.umidade)
          setValue("climaFonteDado", "open-meteo")
          setClimaFonte("open-meteo")
        }
      } catch {
        // Non-fatal: user can fill manually
      } finally {
        setLoadingWeather(false)
      }
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    setError(null)

    try {
      const maoDeObraJson = values.maoDeObra
        ? { notas: values.maoDeObra }
        : undefined

      const materiaisJson = values.materiais
        ? { notas: values.materiais }
        : undefined

      const result = await createRdoEntrada({
        obraId,
        data: new Date(values.data),
        texto: values.texto,
        tarefaId: values.tarefaId || undefined,
        climaCondicao: values.climaCondicao,
        climaTemp: values.climaTemp,
        climaUmidade: values.climaUmidade,
        climaFonteDado: values.climaFonteDado,
        maoDeObra: maoDeObraJson,
        materiais: materiaisJson,
        ocorrencias: values.ocorrencias,
      })

      if ("error" in result) {
        setError(result.error)
        return
      }

      if ("success" in result && result.success) {
        // If photos were staged, save them first
        setCreatedEntradaId(result.entrada.id)

        // If no photos to upload, navigate immediately
        router.push(`/dashboard/obras/${obraId}/rdo`)
        router.refresh()
      }
    } catch {
      setError("Ocorreu um erro ao salvar o diario. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Date field */}
      <div className="space-y-1.5">
        <Label htmlFor="data">Data</Label>
        <Input
          id="data"
          type="date"
          {...register("data")}
          onChange={(e) => handleDateChange(e.target.value)}
        />
        {errors.data && <p className="text-sm text-destructive">{errors.data.message}</p>}
      </div>

      {/* Active task selector */}
      <div className="space-y-1.5">
        <Label htmlFor="tarefaId">
          Tarefa ativa
          {loadingTask && <span className="ml-2 text-xs text-muted-foreground">Detectando...</span>}
        </Label>
        <select
          id="tarefaId"
          {...register("tarefaId")}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Nenhuma tarefa selecionada</option>
          {tarefas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.etapa ? `${t.etapa.nome} — ` : ""}{t.nome}
            </option>
          ))}
        </select>
        {watchedTarefaId && (
          <p className="text-xs text-muted-foreground">Progresso sera recalculado apos salvar</p>
        )}
      </div>

      {/* Texto livre */}
      <div className="space-y-1.5">
        <Label htmlFor="texto">Relatorio do dia</Label>
        <textarea
          id="texto"
          {...register("texto")}
          placeholder="Descreva as atividades realizadas hoje..."
          className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
        />
      </div>

      {/* Clima section */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Clima do dia</h3>
          {climaFonte === "open-meteo" && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Fonte: Open-Meteo
            </span>
          )}
          {loadingWeather && (
            <span className="text-xs text-muted-foreground">Buscando clima...</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="climaCondicao" className="text-xs">Condicao</Label>
            <select
              id="climaCondicao"
              {...register("climaCondicao")}
              onChange={(e) => {
                setValue("climaCondicao", e.target.value)
                setValue("climaFonteDado", "manual")
                setClimaFonte("manual")
              }}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Selecionar</option>
              <option value="Ensolarado">Ensolarado</option>
              <option value="Parcialmente Nublado">Parcialmente Nublado</option>
              <option value="Nublado">Nublado</option>
              <option value="Chuva">Chuva</option>
              <option value="Tempestade">Tempestade</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="climaTemp" className="text-xs">Temp. (C)</Label>
            <Input
              id="climaTemp"
              type="number"
              step="0.1"
              {...register("climaTemp")}
              onChange={(e) => {
                setValue("climaTemp", e.target.value ? parseFloat(e.target.value) : undefined)
                setValue("climaFonteDado", "manual")
                setClimaFonte("manual")
              }}
              className="h-8 text-xs"
              placeholder="28.0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="climaUmidade" className="text-xs">Umidade (%)</Label>
            <Input
              id="climaUmidade"
              type="number"
              step="0.1"
              {...register("climaUmidade")}
              onChange={(e) => {
                setValue("climaUmidade", e.target.value ? parseFloat(e.target.value) : undefined)
                setValue("climaFonteDado", "manual")
                setClimaFonte("manual")
              }}
              className="h-8 text-xs"
              placeholder="65"
            />
          </div>
        </div>
      </div>

      {/* Photos section */}
      {createdEntradaId ? (
        <div className="space-y-1.5">
          <Label>Fotos</Label>
          <RdoPhotoUpload rdoEntradaId={createdEntradaId} />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Salve o diario primeiro para adicionar fotos
          </p>
        </div>
      )}

      {/* Optional expandable sections */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowMaoDeObra(!showMaoDeObra)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showMaoDeObra ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Mao de Obra
        </button>
        {showMaoDeObra && (
          <div className="pl-6 space-y-1.5">
            <textarea
              {...register("maoDeObra")}
              placeholder="Descricao da mao de obra empregada..."
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowMateriais(!showMateriais)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showMateriais ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Materiais
        </button>
        {showMateriais && (
          <div className="pl-6 space-y-1.5">
            <textarea
              {...register("materiais")}
              placeholder="Materiais utilizados ou recebidos..."
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowOcorrencias(!showOcorrencias)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showOcorrencias ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Ocorrencias
        </button>
        {showOcorrencias && (
          <div className="pl-6 space-y-1.5">
            <textarea
              {...register("ocorrencias")}
              placeholder="Registre ocorrencias, problemas ou observacoes importantes..."
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-[#1A6B5A] hover:bg-[#155a4a] text-white"
        >
          {submitting ? "Salvando..." : "Salvar Diario"}
        </Button>
      </div>
    </form>
  )
}
