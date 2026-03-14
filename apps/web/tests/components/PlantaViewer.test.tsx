import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"

// Mock react-pdf
vi.mock("react-pdf", () => ({
  Document: ({ children, onLoadSuccess }: { children: React.ReactNode; onLoadSuccess?: (data: { numPages: number }) => void }) => {
    // Simulate successful load
    if (onLoadSuccess) {
      onLoadSuccess({ numPages: 3 })
    }
    return <div data-testid="pdf-document">{children}</div>
  },
  Page: ({ pageNumber, scale }: { pageNumber: number; scale: number }) => (
    <div data-testid="pdf-page" data-page={pageNumber} data-scale={scale} />
  ),
  pdfjs: {
    GlobalWorkerOptions: { workerSrc: "" },
  },
}))

// Mock server actions
vi.mock("@/lib/actions/pin", () => ({
  createPin: vi.fn().mockResolvedValue({ success: true, pin: { id: "new-pin" } }),
  listPinsByRevisao: vi.fn().mockResolvedValue([]),
}))

vi.mock("@/lib/actions/planta", () => ({
  getPresignedReadUrl: vi.fn().mockResolvedValue("https://r2.example.com/signed-url"),
}))

vi.mock("@/lib/actions/thread", () => ({
  getThread: vi.fn().mockResolvedValue(null),
  addMessage: vi.fn().mockResolvedValue({ success: true }),
  deleteMessage: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock coordinates utility
vi.mock("@/lib/utils/coordinates", () => ({
  clickToNormalized: vi.fn().mockReturnValue({ x: 0.5, y: 0.5 }),
  normalizedToPixels: vi.fn().mockReturnValue({ left: 100, top: 100 }),
}))

// Import components after mocks
import { PlantaViewerClient } from "@/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/PlantaViewerClient"
import { PinLayer } from "@/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/PinLayer"
import { ViewerToolbar } from "@/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/ViewerToolbar"

const mockRevisao = {
  id: "revisao-1",
  revisao: "R0",
  changelog: "Inicial",
  tilesReady: false,
  tilesPrefix: null,
  pageCount: 3,
  r2Key: "plantas/tenant/file.pdf",
  createdAt: new Date("2026-01-01"),
}

const mockPlanta = {
  id: "planta-1",
  nome: "Planta Arquitetonica",
  disciplina: "ARQUITETURA",
  obraId: "obra-1",
}

const mockPin = {
  id: "pin-1",
  tenantId: "tenant-1",
  plantaRevisaoId: "revisao-1",
  authorId: "user-1",
  x: 0.3,
  y: 0.4,
  pageNumber: 1,
  deletedAt: null,
  createdAt: new Date("2026-01-01"),
  author: { id: "user-1", name: "Joao Silva", image: null },
  _count: { thread: 2 },
  messageCount: 2,
}

describe("ViewerToolbar", () => {
  it("renders toolbar with zoom controls", () => {
    render(
      <ViewerToolbar
        plantaNome="Planta A"
        scale={1.0}
        onScaleChange={vi.fn()}
        pageNumber={1}
        numPages={3}
        onPageChange={vi.fn()}
        revisoes={[mockRevisao]}
        currentRevisaoId="revisao-1"
        onRevisaoChange={vi.fn()}
      />
    )
    expect(screen.getByText("100%")).toBeTruthy()
    expect(screen.getByLabelText("Reduzir zoom")).toBeTruthy()
    expect(screen.getByLabelText("Aumentar zoom")).toBeTruthy()
  })

  it("renders page navigation", () => {
    render(
      <ViewerToolbar
        plantaNome="Planta A"
        scale={1.0}
        onScaleChange={vi.fn()}
        pageNumber={2}
        numPages={5}
        onPageChange={vi.fn()}
        revisoes={[mockRevisao]}
        currentRevisaoId="revisao-1"
        onRevisaoChange={vi.fn()}
      />
    )
    expect(screen.getByText(/Pag\. 2 de 5/)).toBeTruthy()
  })

  it("renders the plant name on the left", () => {
    render(
      <ViewerToolbar
        plantaNome="Planta Eletrica"
        scale={1.0}
        onScaleChange={vi.fn()}
        pageNumber={1}
        numPages={1}
        onPageChange={vi.fn()}
        revisoes={[mockRevisao]}
        currentRevisaoId="revisao-1"
        onRevisaoChange={vi.fn()}
      />
    )
    expect(screen.getByText("Planta Eletrica")).toBeTruthy()
  })
})

describe("PinLayer", () => {
  it("renders pins at correct percentage positions", () => {
    render(
      <div style={{ position: "relative", width: "1000px", height: "800px" }}>
        <PinLayer
          pins={[mockPin]}
          tempPin={null}
          selectedPinId={null}
          onPinSelect={vi.fn()}
          currentUserId="user-1"
        />
      </div>
    )

    // Pin is at x=0.3 -> left: 30%, y=0.4 -> top: 40%
    const pinBtn = screen.getByRole("button", { name: /Pin de Joao Silva/i })
    expect(pinBtn).toBeTruthy()
    expect(pinBtn.style.left).toBe("30%")
    expect(pinBtn.style.top).toBe("40%")
  })

  it("calls onPinSelect when a pin is clicked", () => {
    const onPinSelect = vi.fn()
    render(
      <div style={{ position: "relative" }}>
        <PinLayer
          pins={[mockPin]}
          tempPin={null}
          selectedPinId={null}
          onPinSelect={onPinSelect}
          currentUserId="user-1"
        />
      </div>
    )
    fireEvent.click(screen.getByRole("button", { name: /Pin de Joao Silva/i }))
    expect(onPinSelect).toHaveBeenCalledWith("pin-1")
  })

  it("renders the selected pin with highlighted ring class", () => {
    render(
      <div style={{ position: "relative" }}>
        <PinLayer
          pins={[mockPin]}
          tempPin={null}
          selectedPinId="pin-1"
          onPinSelect={vi.fn()}
          currentUserId="user-1"
        />
      </div>
    )
    const pinBtn = screen.getByRole("button", { name: /Pin de Joao Silva/i })
    expect(pinBtn.className).toContain("z-20")
  })

  it("renders tempPin with pulsing animation class", () => {
    const { container } = render(
      <div style={{ position: "relative" }}>
        <PinLayer
          pins={[]}
          tempPin={{ x: 0.5, y: 0.5, pageNumber: 1 }}
          selectedPinId={null}
          onPinSelect={vi.fn()}
          currentUserId="user-1"
        />
      </div>
    )
    // tempPin should have animate-pulse class
    const pulsingEl = container.querySelector(".animate-pulse")
    expect(pulsingEl).toBeTruthy()
  })
})

describe("PlantaViewerClient - CLIENTE role is read-only", () => {
  it("does not set cursor to crosshair when role is CLIENTE", () => {
    const { container } = render(
      <PlantaViewerClient
        planta={mockPlanta}
        revisoes={[mockRevisao]}
        initialPins={[]}
        currentRevisao={mockRevisao}
        userRole="CLIENTE"
        userId="user-2"
        initialPdfUrl="https://r2.example.com/plantas/tenant/file.pdf"
      />
    )
    // CLIENTE should have default cursor, not crosshair
    const viewerContainer = container.querySelector("[data-viewer-container]")
    expect(viewerContainer).toBeTruthy()
    // cursor should be default for CLIENTE
    expect(viewerContainer?.getAttribute("style")).toContain("cursor: default")
  })

  it("renders the viewer with the planta name in toolbar", () => {
    render(
      <PlantaViewerClient
        planta={mockPlanta}
        revisoes={[mockRevisao]}
        initialPins={[]}
        currentRevisao={mockRevisao}
        userRole="ADMIN"
        userId="user-1"
        initialPdfUrl="https://r2.example.com/plantas/tenant/file.pdf"
      />
    )
    expect(screen.getByText("Planta Arquitetonica")).toBeTruthy()
  })
})

describe("PlantaViewerClient - ThreadSidebar opens on pin selection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does not show ThreadSidebar initially", () => {
    render(
      <PlantaViewerClient
        planta={mockPlanta}
        revisoes={[mockRevisao]}
        initialPins={[mockPin]}
        currentRevisao={mockRevisao}
        userRole="ADMIN"
        userId="user-1"
        initialPdfUrl="https://r2.example.com/plantas/tenant/file.pdf"
      />
    )
    expect(screen.queryByTestId("thread-sidebar")).toBeNull()
  })

  it("shows ThreadSidebar when a pin is clicked", async () => {
    render(
      <PlantaViewerClient
        planta={mockPlanta}
        revisoes={[mockRevisao]}
        initialPins={[mockPin]}
        currentRevisao={mockRevisao}
        userRole="ADMIN"
        userId="user-1"
        initialPdfUrl="https://r2.example.com/plantas/tenant/file.pdf"
      />
    )

    const pinBtn = screen.getByRole("button", { name: /Pin de Joao Silva/i })
    fireEvent.click(pinBtn)

    expect(screen.getByTestId("thread-sidebar")).toBeTruthy()
  })
})
