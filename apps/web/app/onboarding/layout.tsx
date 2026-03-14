import { ProjetaProLogo } from "@/components/ProjetaProLogo"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <ProjetaProLogo size="md" />
            <h2 className="text-2xl font-bold text-foreground">
              Projeta <span className="text-primary">Pro</span>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">Configure sua conta</p>
        </div>
        {children}
      </div>
    </div>
  )
}
