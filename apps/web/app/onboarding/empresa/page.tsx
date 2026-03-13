import { StepIndicator } from "@/components/onboarding/StepIndicator"
import { StepEmpresa } from "@/components/onboarding/StepEmpresa"

export default function OnboardingEmpresaPage() {
  return (
    <>
      <StepIndicator currentStep={1} />
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <StepEmpresa />
      </div>
    </>
  )
}
