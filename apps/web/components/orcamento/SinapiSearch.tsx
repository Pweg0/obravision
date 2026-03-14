"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { searchSinapi } from "@/lib/actions/orcamento"

interface SinapiResult {
  id: string
  codigo: string
  descricao: string
  unidade: string
  custoUnitario: number
  estado: string
}

interface SinapiSearchProps {
  estado?: string
  onSelect: (result: SinapiResult) => void
}

function useDebounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

export function SinapiSearch({ estado = "SP", onSelect }: SinapiSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SinapiResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    useDebounce(async (q: string) => {
      if (!q.trim()) {
        setResults([])
        setShowDropdown(false)
        return
      }
      setIsLoading(true)
      try {
        const data = await searchSinapi(q, estado)
        setResults(data)
        setShowDropdown(data.length > 0)
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [estado]
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }

  function handleSelect(result: SinapiResult) {
    onSelect(result)
    setQuery(result.descricao)
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder="Buscar codigo SINAPI... (ex: concreto fck 25)"
        className="w-full"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-b-0"
              onMouseDown={() => handleSelect(r)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-muted-foreground shrink-0">{r.codigo}</span>
                <span className="text-sm truncate">{r.descricao}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {r.unidade} / {r.custoUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
