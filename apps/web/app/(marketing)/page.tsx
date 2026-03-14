import type { Metadata } from "next"
import { HeroSection } from "@/components/marketing/HeroSection"
import { TrustBar } from "@/components/marketing/TrustBar"
import { StatsSection } from "@/components/marketing/StatsSection"
import { FeaturesSection } from "@/components/marketing/FeaturesSection"
import { HowItWorks } from "@/components/marketing/HowItWorks"
import { DetailedFeature } from "@/components/marketing/DetailedFeature"
import { PricingSection } from "@/components/marketing/PricingSection"
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection"
import { FaqSection } from "@/components/marketing/FaqSection"
import { FinalCta } from "@/components/marketing/FinalCta"
import { Footer } from "@/components/marketing/Footer"

export const metadata: Metadata = {
  title: "Projeta Pro — Gestao Inteligente para Engenharia Civil",
  description:
    "Gerencie sua empresa de engenharia civil com eficiencia. Obras, estoque, plantas e equipe em uma unica plataforma.",
  openGraph: {
    title: "Projeta Pro — Gestao Inteligente para Engenharia Civil",
    description:
      "Gerencie sua empresa de engenharia civil com eficiencia. Obras, estoque, plantas e equipe em uma unica plataforma.",
    type: "website",
  },
}

export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <StatsSection />
      <FeaturesSection />
      <HowItWorks />
      <DetailedFeature />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCta />
      <Footer />
    </>
  )
}
