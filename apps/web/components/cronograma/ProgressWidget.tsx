"use client"

import { useMemo } from "react"

interface ProgressDataPoint {
  date: string
  planned: number
  actual: number
}

interface ProgressWidgetProps {
  data: ProgressDataPoint[]
  obraName?: string
}

/**
 * S-curve line chart comparing planned vs actual progress over time.
 * Rendered as pure SVG — no recharts dependency required.
 * Colors: Planejado = #1A6B5A (dark green), Real = #4CAF84 (lighter green)
 */
export function ProgressWidget({ data, obraName }: ProgressWidgetProps) {
  const WIDTH = 400
  const HEIGHT = 200
  const PADDING = { top: 16, right: 16, bottom: 32, left: 36 }

  const chartWidth = WIDTH - PADDING.left - PADDING.right
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom

  const hasData = data.length >= 2

  const { plannedPath, actualPath, xLabels } = useMemo(() => {
    if (!hasData) {
      return { plannedPath: "", actualPath: "", xLabels: [] }
    }

    const n = data.length
    const xScale = (i: number) => (i / (n - 1)) * chartWidth
    const yScale = (v: number) => chartHeight - (v / 100) * chartHeight

    const planned = data
      .map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(d.planned).toFixed(1)}`)
      .join(" ")

    const actual = data
      .map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(d.actual).toFixed(1)}`)
      .join(" ")

    // Show at most 5 x-axis date labels
    const labelIndices =
      n <= 5
        ? Array.from({ length: n }, (_, i) => i)
        : [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1]

    const labels = labelIndices.map((i) => ({
      x: xScale(i),
      label: data[i].date.slice(5), // "MM-DD"
    }))

    return { plannedPath: planned, actualPath: actual, xLabels: labels }
  }, [data, hasData, chartWidth, chartHeight])

  // Y-axis tick labels
  const yTicks = [0, 25, 50, 75, 100]

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold text-sm">Progresso da Obra</h3>
          {obraName && <p className="text-xs text-muted-foreground mt-0.5">{obraName}</p>}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block bg-[#1A6B5A]" />
            Planejado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block bg-[#4CAF84]" />
            Real
          </span>
        </div>
      </div>

      <div className="p-4">
        {!hasData ? (
          <div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">
            Sem dados de cronograma para exibir
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full"
            role="img"
            aria-label="Grafico de progresso planejado vs real"
          >
            <g transform={`translate(${PADDING.left},${PADDING.top})`}>
              {/* Grid lines + Y-axis labels */}
              {yTicks.map((tick) => {
                const y = chartHeight - (tick / 100) * chartHeight
                return (
                  <g key={tick}>
                    <line
                      x1={0}
                      x2={chartWidth}
                      y1={y}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth={1}
                      strokeDasharray={tick === 0 ? "none" : "4 2"}
                    />
                    <text
                      x={-4}
                      y={y + 4}
                      textAnchor="end"
                      fontSize={9}
                      fill="#9ca3af"
                    >
                      {tick}%
                    </text>
                  </g>
                )
              })}

              {/* X-axis labels */}
              {xLabels.map(({ x, label }) => (
                <text
                  key={label}
                  x={x}
                  y={chartHeight + 18}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#9ca3af"
                >
                  {label}
                </text>
              ))}

              {/* Planned line */}
              <path
                d={plannedPath}
                fill="none"
                stroke="#1A6B5A"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Actual line */}
              <path
                d={actualPath}
                fill="none"
                stroke="#4CAF84"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray="6 2"
              />
            </g>
          </svg>
        )}
      </div>
    </div>
  )
}
