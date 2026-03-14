"use client"

import { useState, useRef } from "react"
import { getPresignedUploadUrl, createPlanta, createRevisao } from "@/lib/actions/planta"

const DISCIPLINA_LABELS: Record<string, string> = {
  ARQUITETURA: "Arquitetura",
  ESTRUTURAL: "Estrutural",
  ELETRICA: "Eletrica",
  HIDRAULICA: "Hidraulica",
  INCENDIO: "Incendio",
  TOPOGRAFIA: "Topografia",
  CUSTOMIZADO: "Customizado",
}

const DISCIPLINA_TIPOS = Object.keys(DISCIPLINA_LABELS)

interface PlantaUploadFormProps {
  obraId: string
  /** If provided, this is a new revision upload for an existing planta */
  plantaId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function PlantaUploadForm({ obraId, plantaId, onSuccess, onCancel }: PlantaUploadFormProps) {
  const isNewRevision = !!plantaId
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState("")
  const [disciplina, setDisciplina] = useState("ARQUITETURA")
  const [disciplinaCustom, setDisciplinaCustom] = useState("")
  const [changelog, setChangelog] = useState("")
  const [revisao, setRevisao] = useState("R0")
  const [migrarPins, setMigrarPins] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (!selected.name.toLowerCase().endsWith(".pdf")) {
        setError("Apenas arquivos PDF sao aceitos")
        return
      }
      setError(null)
      setFile(selected)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!file) {
      setError("Selecione um arquivo PDF")
      return
    }

    if (!changelog.trim()) {
      setError("Changelog e obrigatorio")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Step 1: Get presigned URL from server
      const { url, key } = await getPresignedUploadUrl(file.name, "application/pdf")

      // Step 2: Upload file directly to R2 with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(percent)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload falhou: ${xhr.status} ${xhr.statusText}`))
          }
        }

        xhr.onerror = () => reject(new Error("Erro de rede durante o upload"))
        xhr.open("PUT", url)
        xhr.setRequestHeader("Content-Type", "application/pdf")
        xhr.send(file)
      })

      setUploadProgress(100)

      // Step 3: Create planta record (if new planta) or revision (if new revision)
      if (!isNewRevision) {
        const plantaFormData = new FormData()
        plantaFormData.set("nome", nome)
        plantaFormData.set("disciplina", disciplina)
        if (disciplina === "CUSTOMIZADO") {
          plantaFormData.set("disciplinaCustom", disciplinaCustom)
        }

        const plantaResult = await createPlanta(obraId, plantaFormData)
        if (plantaResult && "error" in plantaResult) {
          setError(plantaResult.error)
          return
        }

        const newPlantaId = plantaResult?.planta?.id
        if (!newPlantaId) {
          setError("Erro ao criar planta")
          return
        }

        // Create the first revision
        const revisaoFormData = new FormData()
        revisaoFormData.set("changelog", changelog)
        revisaoFormData.set("r2Key", key)
        revisaoFormData.set("fileSize", String(file.size))
        revisaoFormData.set("migrarPins", "false")
        revisaoFormData.set("revisao", revisao)

        const revisaoResult = await createRevisao(newPlantaId, revisaoFormData)
        if (revisaoResult && "error" in revisaoResult) {
          setError(revisaoResult.error)
          return
        }
      } else {
        // New revision on existing planta
        const revisaoFormData = new FormData()
        revisaoFormData.set("changelog", changelog)
        revisaoFormData.set("r2Key", key)
        revisaoFormData.set("fileSize", String(file.size))
        revisaoFormData.set("migrarPins", String(migrarPins))
        revisaoFormData.set("revisao", revisao)

        const result = await createRevisao(plantaId, revisaoFormData)
        if (result && "error" in result) {
          setError(result.error)
          return
        }
      }

      onSuccess?.()
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido durante o upload")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* New planta fields — only shown when creating a new planta */}
      {!isNewRevision && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da planta
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Planta Baixa - Pavimento Tipo"
              required
              minLength={3}
              maxLength={100}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disciplina
            </label>
            <select
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {DISCIPLINA_TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {DISCIPLINA_LABELS[tipo]}
                </option>
              ))}
            </select>
          </div>

          {disciplina === "CUSTOMIZADO" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo customizado
              </label>
              <input
                type="text"
                value={disciplinaCustom}
                onChange={(e) => setDisciplinaCustom(e.target.value)}
                placeholder="Ex: Paisagismo"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
        </>
      )}

      {/* File input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Arquivo PDF
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          required
          className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
        />
        {file && (
          <p className="mt-1 text-xs text-gray-500">
            {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
            {file.size > 5 * 1024 * 1024 && (
              <span className="ml-2 text-amber-600">
                Arquivo grande — sera convertido em segundo plano
              </span>
            )}
          </p>
        )}
      </div>

      {/* Revisao selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Revisao
        </label>
        <select
          value={revisao}
          onChange={(e) => setRevisao(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {Array.from({ length: 21 }, (_, i) => `R${i}`).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Selecione a revisao desta planta (R0 = original)</p>
      </div>

      {/* Changelog */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Changelog <span className="text-red-500">*</span>
        </label>
        <textarea
          value={changelog}
          onChange={(e) => setChangelog(e.target.value)}
          placeholder="Descreva o que foi alterado nesta revisao..."
          required
          maxLength={500}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{changelog.length}/500</p>
      </div>

      {/* Pin migration — only for new revisions on existing plantas */}
      {isNewRevision && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="migrarPins"
            checked={migrarPins}
            onChange={(e) => setMigrarPins(e.target.checked)}
            className="h-4 w-4 text-teal-600 border-gray-300 rounded"
          />
          <label htmlFor="migrarPins" className="text-sm text-gray-700">
            Migrar pins da revisao anterior
          </label>
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Enviando arquivo...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isUploading}
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Enviando..." : isNewRevision ? "Upload nova revisao" : "Upload planta"}
        </button>
      </div>
    </form>
  )
}
