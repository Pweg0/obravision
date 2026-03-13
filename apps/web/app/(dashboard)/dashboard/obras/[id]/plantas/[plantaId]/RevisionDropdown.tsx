"use client"

import { useState } from "react"

type Revisao = {
  id: string
  revisao: string
  changelog: string
  createdAt: Date
}

interface RevisionDropdownProps {
  revisoes: Revisao[]
  currentRevisaoId: string
  onRevisaoChange: (revisaoId: string) => void
}

/**
 * Dropdown to navigate between plant revisions.
 * Latest revision is labeled "atual".
 */
export function RevisionDropdown({
  revisoes,
  currentRevisaoId,
  onRevisaoChange,
}: RevisionDropdownProps) {
  const [open, setOpen] = useState(false)

  const currentRevisao = revisoes.find((r) => r.id === currentRevisaoId) ?? revisoes[0]
  const latestRevisaoId = revisoes[0]?.id

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{currentRevisao?.revisao ?? "R0"}</span>
        {currentRevisaoId === latestRevisaoId && (
          <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
            atual
          </span>
        )}
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-20 mt-1 w-56 rounded-md border border-gray-200 bg-white shadow-lg">
            <ul className="max-h-60 overflow-auto py-1" role="listbox">
              {revisoes.map((revisao) => (
                <li key={revisao.id}>
                  <button
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      revisao.id === currentRevisaoId ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                    onClick={() => {
                      onRevisaoChange(revisao.id)
                      setOpen(false)
                    }}
                    role="option"
                    aria-selected={revisao.id === currentRevisaoId}
                  >
                    <span className="font-medium">{revisao.revisao}</span>
                    {revisao.id === latestRevisaoId && (
                      <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                        atual
                      </span>
                    )}
                    <span className="ml-auto truncate text-xs text-gray-500">
                      {revisao.changelog.substring(0, 24)}
                      {revisao.changelog.length > 24 ? "…" : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
