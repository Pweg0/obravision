"use client"

import Link from "next/link"
import { useState } from "react"
import type { ReactNode } from "react"
import { ProjetaProLogo } from "@/components/ProjetaProLogo"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1E293B]">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-[#2563EB]">
              <ProjetaProLogo />
              Projeta Pro
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#funcionalidades" className="hover:text-[#2563EB] transition-colors duration-200">Funcionalidades</a>
              <a href="#como-funciona" className="hover:text-[#2563EB] transition-colors duration-200">Como funciona</a>
              <a href="#planos" className="hover:text-[#2563EB] transition-colors duration-200">Planos</a>
              <a href="#depoimentos" className="hover:text-[#2563EB] transition-colors duration-200">Depoimentos</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-block text-sm font-medium text-gray-600 hover:text-[#2563EB] transition-colors duration-200"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-[#F97316] hover:bg-[#EA580C] rounded-lg transition-colors duration-200"
              >
                Testar gratis
              </Link>
              {/* Hamburger button — mobile only */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-[#2563EB] hover:bg-gray-100 transition-colors duration-200"
                aria-label="Abrir menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  /* X icon */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  /* Hamburger icon */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md">
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              <a
                href="#funcionalidades"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#2563EB] hover:bg-blue-50 transition-colors duration-200"
              >
                Funcionalidades
              </a>
              <a
                href="#como-funciona"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#2563EB] hover:bg-blue-50 transition-colors duration-200"
              >
                Como funciona
              </a>
              <a
                href="#planos"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#2563EB] hover:bg-blue-50 transition-colors duration-200"
              >
                Planos
              </a>
              <a
                href="#depoimentos"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#2563EB] hover:bg-blue-50 transition-colors duration-200"
              >
                Depoimentos
              </a>
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#2563EB] hover:bg-blue-50 transition-colors duration-200"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#F97316] hover:bg-[#EA580C] rounded-lg transition-colors duration-200"
                >
                  Testar gratis
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
