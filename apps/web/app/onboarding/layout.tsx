import { StepIndicator } from "@/components/onboarding/StepIndicator"

// Determine current step from the URL path for step indicator
// We render the layout without dynamic step tracking — step is determined per-page
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-primary">ProjetaPro</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure sua conta</p>
        </div>
        {children}
      </div>
    </div>
  )
}
