import { StepIndicator } from "@/components/onboarding/StepIndicator"
import { StepObra } from "@/components/onboarding/StepObra"

export default function OnboardingObraPage() {
  return (
    <>
      <StepIndicator currentStep={2} />
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <StepObra />
      </div>
    </>
  )
}
