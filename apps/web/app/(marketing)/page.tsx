import type { Metadata } from "next"
import { HeroSection } from "@/components/marketing/HeroSection"
import { FeaturesSection } from "@/components/marketing/FeaturesSection"
import { LeadCaptureForm } from "@/components/marketing/LeadCaptureForm"
import { Footer } from "@/components/marketing/Footer"

export const metadata: Metadata = {
  title: "ObraVision — Gestao de Obras Visual",
  description:
    "Plataforma de gestao de obras com comentarios ancorados em plantas, versionamento de projetos e integracao campo-escritorio para engenheiros e construtoras brasileiras.",
  openGraph: {
    title: "ObraVision — Gestao de Obras Visual",
    description:
      "Comentarios ancorados diretamente nas plantas, versionamento de projetos e integracao campo-escritorio para a construcao civil brasileira.",
    type: "website",
  },
}

export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <LeadCaptureForm />
      <Footer />
    </>
  )
}
