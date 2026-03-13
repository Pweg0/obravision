import { StepIndicator } from "@/components/onboarding/StepIndicator"
import { StepEquipe } from "@/components/onboarding/StepEquipe"

export default function OnboardingEquipePage() {
  return (
    <>
      <StepIndicator currentStep={3} />
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <StepEquipe />
      </div>
    </>
  )
}
