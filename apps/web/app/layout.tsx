import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/ThemeProvider"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
})

export const metadata: Metadata = {
  title: "Projeta Pro",
  description: "Gestao Inteligente para Engenharia Civil",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${plusJakarta.className} antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
