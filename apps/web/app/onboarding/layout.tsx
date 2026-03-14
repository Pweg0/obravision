import { StepIndicator } from "@/components/onboarding/StepIndicator"

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
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base"
              style={{ backgroundColor: "#1A6B5A" }}
            >
              P
            </span>
            <h2 className="text-2xl font-bold text-foreground">
              Projeta<span className="text-primary">Pro</span>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">Configure sua conta</p>
        </div>
        {children}
      </div>
    </div>
  )
}
