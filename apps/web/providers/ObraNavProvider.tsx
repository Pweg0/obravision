"use client"

import { createContext, useContext } from "react"

interface ObraNavContextValue {
  obraId: string
  obraNome: string
}

const ObraNavContext = createContext<ObraNavContextValue | null>(null)

export function useObraNav() {
  return useContext(ObraNavContext)
}

export function ObraNavProvider({
  obraId,
  obraNome,
  children,
}: ObraNavContextValue & { children: React.ReactNode }) {
  return (
    <ObraNavContext.Provider value={{ obraId, obraNome }}>
      {children}
    </ObraNavContext.Provider>
  )
}
