"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createFornecedor } from "@/lib/actions/fornecedor"

const CATEGORIAS_OPTIONS = [
  "materiais",
  "servicos",
  "equipamentos",
  "ferramentas",
  "concreto",
  "aco",
  "ceramica",
  "hidraulica",
  "eletrica",
  "outros",
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fornecedor = Record<string, any> & {
  id: string
  nome: string
  cnpj?: string | null
  contato?: string | null
  email?: string | null
  telefone?: string | null
  categorias: string[]
}

interface FornecedorFormProps {
  onSuccess: (fornecedor: Fornecedor) => void
  onCancel: () => void
  compact?: boolean
}

export function FornecedorForm({ onSuccess, onCancel, compact = false }: FornecedorFormProps) {
  const [nome, setNome] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [contato, setContato] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [categorias, setCategorias] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleCategoria(cat: string) {
    setCategorias((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await createFornecedor({
        nome,
        cnpj: cnpj || undefined,
        contato: contato || undefined,
        email: email || undefined,
        telefone: telefone || undefined,
        categorias,
      })
      if ("error" in result) {
        setError(result.error)
      } else if ("fornecedor" in result) {
        onSuccess(result.fornecedor as Fornecedor)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="forn-nome">Nome *</Label>
        <Input
          id="forn-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Razao social ou nome fantasia"
          required
          autoFocus
        />
      </div>

      {!compact && (
        <>
          <div className="space-y-1">
            <Label htmlFor="forn-cnpj">CNPJ</Label>
            <Input
              id="forn-cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="forn-contato">Contato</Label>
              <Input
                id="forn-contato"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                placeholder="Nome do responsavel"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="forn-telefone">Telefone</Label>
              <Input
                id="forn-telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="forn-email">Email</Label>
            <Input
              id="forn-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@fornecedor.com.br"
            />
          </div>

          <div className="space-y-2">
            <Label>Categorias</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategoria(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    categorias.includes(cat)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar Fornecedor"}
        </Button>
      </div>
    </form>
  )
}
