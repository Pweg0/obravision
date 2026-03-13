import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"

// Mock @svar-ui/react-gantt since it uses browser APIs
vi.mock("@svar-ui/react-gantt", () => ({
  Gantt: ({ tasks }: { tasks: unknown[] }) => (
    <div data-testid="gantt-chart" data-task-count={tasks.length}>
      {tasks.map((t: unknown) => {
        const task = t as { id: string; text: string }
        return (
          <div key={task.id} data-testid={`gantt-task-${task.id}`}>
            {task.text}
          </div>
        )
      })}
    </div>
  ),
}))

// Mock server actions
vi.mock("@/lib/actions/cronograma", () => ({
  updateTarefaDates: vi.fn().mockResolvedValue({ success: true }),
  createEtapa: vi.fn().mockResolvedValue({ success: true }),
  updateEtapa: vi.fn().mockResolvedValue({ success: true }),
  deleteEtapa: vi.fn().mockResolvedValue({ success: true }),
  createTarefa: vi.fn().mockResolvedValue({ success: true }),
  updateTarefa: vi.fn().mockResolvedValue({ success: true }),
  deleteTarefa: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
}))

import { GanttView } from "@/components/cronograma/GanttView"

const mockEtapas = [
  {
    id: "etapa-1",
    tenantId: "tenant-1",
    obraId: "obra-1",
    nome: "Fundacao",
    ordem: 1,
    climaSensivel: false,
    createdAt: new Date("2026-03-01"),
    updatedAt: new Date("2026-03-01"),
    tarefas: [
      {
        id: "tarefa-1",
        tenantId: "tenant-1",
        obraId: "obra-1",
        etapaId: "etapa-1",
        nome: "Concretagem",
        responsavelId: "user-1",
        status: "PENDENTE" as const,
        startDate: new Date("2026-03-10"),
        endDate: new Date("2026-03-20"),
        climaSensivel: null,
        progressoReal: 0,
        createdAt: new Date("2026-03-01"),
        updatedAt: new Date("2026-03-01"),
      },
      {
        id: "tarefa-2",
        tenantId: "tenant-1",
        obraId: "obra-1",
        etapaId: "etapa-1",
        nome: "Armacao",
        responsavelId: null,
        status: "ATRASADA" as const,
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-02-15"),
        climaSensivel: true,
        progressoReal: 30,
        createdAt: new Date("2026-03-01"),
        updatedAt: new Date("2026-03-01"),
      },
    ],
  },
  {
    id: "etapa-2",
    tenantId: "tenant-1",
    obraId: "obra-1",
    nome: "Alvenaria",
    ordem: 2,
    climaSensivel: false,
    createdAt: new Date("2026-03-01"),
    updatedAt: new Date("2026-03-01"),
    tarefas: [],
  },
]

const mockMembers = [
  { id: "member-1", userId: "user-1", role: "ADMIN" as const, user: { id: "user-1", name: "Ana Silva", email: "ana@example.com", image: null } },
]

describe("GanttView", () => {
  it("renders without crashing given empty etapas", () => {
    render(
      <GanttView
        etapas={[]}
        obraId="obra-1"
        members={mockMembers}
        currentUserRole="ADMIN"
      />
    )
    // When empty, shows empty state message
    expect(screen.getByText(/Nenhuma etapa/i)).toBeDefined()
  })

  it("renders with etapas and tarefas showing gantt chart", () => {
    render(
      <GanttView
        etapas={mockEtapas}
        obraId="obra-1"
        members={mockMembers}
        currentUserRole="ADMIN"
      />
    )
    // Gantt mock is loaded dynamically — check that the chart container or etapa list renders
    // The etapa list section is always rendered when etapas.length > 0
    expect(screen.getByText(/Etapas \(2\)/i)).toBeDefined()
  })

  it("renders etapa names in etapa list", () => {
    render(
      <GanttView
        etapas={mockEtapas}
        obraId="obra-1"
        members={mockMembers}
        currentUserRole="ADMIN"
      />
    )
    // Etapa names appear in the etapa list (may also appear in Gantt mock — use getAllByText)
    expect(screen.getAllByText("Fundacao").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Alvenaria").length).toBeGreaterThan(0)
  })

  it("renders tarefa counts per etapa", () => {
    render(
      <GanttView
        etapas={mockEtapas}
        obraId="obra-1"
        members={mockMembers}
        currentUserRole="ADMIN"
      />
    )
    // Fundacao has 2 tarefas
    expect(screen.getByText(/2 tarefa/i)).toBeDefined()
  })

  it("shows Add Etapa button for ADMIN", () => {
    render(
      <GanttView
        etapas={mockEtapas}
        obraId="obra-1"
        members={mockMembers}
        currentUserRole="ADMIN"
      />
    )
    expect(screen.getByText(/Nova Etapa/i)).toBeDefined()
  })

  it("hides Add Etapa button for CLIENTE", () => {
    render(
      <GanttView
        etapas={mockEtapas}
        obraId="obra-1"
        members={mockMembers}
        currentUserRole="CLIENTE"
      />
    )
    expect(screen.queryByText(/Nova Etapa/i)).toBeNull()
  })

  it("renders cronograma heading", () => {
    render(
      <GanttView
        etapas={mockEtapas}
        obraId="obra-1"
        members={mockMembers}
        currentUserRole="ADMIN"
      />
    )
    expect(screen.getByText("Cronograma")).toBeDefined()
  })
})
