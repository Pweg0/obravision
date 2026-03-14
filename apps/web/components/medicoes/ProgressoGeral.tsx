"use client"

interface ProgressoGeralProps {
  progresso: number
}

export function ProgressoGeral({ progresso }: ProgressoGeralProps) {
  const color =
    progresso > 75 ? "#16a34a" : progresso > 50 ? "#d97706" : "#dc2626"
  const displayValue = progresso.toFixed(1)

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Progresso Geral da Obra
      </p>
      <div className="flex items-end gap-3">
        <span
          className="text-4xl font-bold leading-none"
          style={{ color }}
        >
          {displayValue}%
        </span>
      </div>
      {/* Progress bar */}
      <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, progresso)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
