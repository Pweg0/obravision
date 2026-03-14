"use client"

interface EstoqueItem {
  descricao: string
  unidade: string
  saldo: number
  quantidadeMinima: number | null
}

interface EstoqueTableProps {
  items: EstoqueItem[]
}

function getStatus(saldo: number, minima: number | null): { label: string; color: string; bgColor: string } {
  if (minima === null) {
    return { label: "Normal", color: "#059669", bgColor: "#d1fae5" }
  }
  if (saldo < minima) {
    return { label: "Critico", color: "#dc2626", bgColor: "#fee2e2" }
  }
  if (saldo < minima * 2) {
    return { label: "Baixo", color: "#d97706", bgColor: "#fef3c7" }
  }
  return { label: "Normal", color: "#059669", bgColor: "#d1fae5" }
}

export function EstoqueTable({ items }: EstoqueTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhum material em estoque neste deposito</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Material</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Unidade</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Saldo Atual</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Minimo</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => {
            const status = getStatus(item.saldo, item.quantidadeMinima)
            return (
              <tr key={item.descricao} className="hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3 font-medium">{item.descricao}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.unidade}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {item.saldo.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {item.quantidadeMinima !== null
                    ? item.quantidadeMinima.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
                    : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ color: status.color, backgroundColor: status.bgColor }}
                  >
                    {status.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
