"use client"

import { useState } from "react"
import { MedicaoCard } from "@/components/medicoes/MedicaoCard"
import { MedicaoFisicaForm } from "@/components/medicoes/MedicaoFisicaForm"
import { MedicaoContratoForm } from "@/components/medicoes/MedicaoContratoForm"
import { ProgressoGeral } from "@/components/medicoes/ProgressoGeral"

interface MedicoesClientProps {
  obraId: string
  initialMedicoesFisicas: any[]
  initialMedicoesContrato: any[]
  orcamento: any
  latestProgressoGeral: number
  currentUserRole: string
}

export function MedicoesClient({
  obraId,
  initialMedicoesFisicas,
  initialMedicoesContrato,
  orcamento,
  latestProgressoGeral,
  currentUserRole,
}: MedicoesClientProps) {
  const [showFisicaForm, setShowFisicaForm] = useState(false)
  const [showContratoForm, setShowContratoForm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Medicoes</h2>
      </div>

      {/* Overall progress indicator (from latest physical measurement) */}
      {initialMedicoesFisicas.length > 0 && (
        <ProgressoGeral progresso={latestProgressoGeral} />
      )}

      {/* Medicoes Fisicas section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Medicoes Fisicas</h3>
          {orcamento && (
            <button
              onClick={() => setShowFisicaForm(true)}
              className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Nova Medicao Fisica
            </button>
          )}
        </div>

        {initialMedicoesFisicas.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma medicao fisica registrada.
              {orcamento
                ? " Crie o primeiro boletim de medicao fisica."
                : " Crie um orcamento primeiro para registrar medicoes fisicas."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {initialMedicoesFisicas.map((medicao) => (
              <MedicaoCard
                key={medicao.id}
                medicao={{ ...medicao, obraId }}
                type="fisica"
                currentUserRole={currentUserRole}
              />
            ))}
          </div>
        )}
      </div>

      {/* Medicoes de Contrato section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Medicoes de Contrato</h3>
          <button
            onClick={() => setShowContratoForm(true)}
            className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Nova Medicao de Contrato
          </button>
        </div>

        {initialMedicoesContrato.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma medicao de contrato registrada.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {initialMedicoesContrato.map((medicao) => (
              <MedicaoCard
                key={medicao.id}
                medicao={{ ...medicao, obraId }}
                type="contrato"
                currentUserRole={currentUserRole}
              />
            ))}
          </div>
        )}
      </div>

      {/* Nova Medicao Fisica modal */}
      {showFisicaForm && orcamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nova Medicao Fisica</h2>
              <button
                onClick={() => setShowFisicaForm(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <MedicaoFisicaForm
              obraId={obraId}
              orcamentoId={orcamento.id}
              onSuccess={() => setShowFisicaForm(false)}
              onCancel={() => setShowFisicaForm(false)}
            />
          </div>
        </div>
      )}

      {/* Nova Medicao Contrato modal */}
      {showContratoForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nova Medicao de Contrato</h2>
              <button
                onClick={() => setShowContratoForm(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <MedicaoContratoForm
              obraId={obraId}
              onSuccess={() => setShowContratoForm(false)}
              onCancel={() => setShowContratoForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
