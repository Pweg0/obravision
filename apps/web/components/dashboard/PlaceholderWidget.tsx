import { Lock } from "lucide-react"

interface PlaceholderWidgetProps {
  title: string
  description?: string
}

export function PlaceholderWidget({ title, description }: PlaceholderWidgetProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-premium overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm text-muted-foreground">{title}</h3>
        <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
          Em breve
        </span>
      </div>
      <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground max-w-[200px]">
          {description ?? "Disponivel em breve"}
        </p>
      </div>
    </div>
  )
}
