import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock next/navigation (redirect)
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// Mock next-auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "user-1",
      role: "ADMIN",
      empresaId: "empresa-1",
    },
  }),
}))

// Create a mutable mock for plantaRevisao operations
const mockPlantaRevisaoCount = vi.fn()
const mockPlantaRevisaoCreate = vi.fn()
const mockPlantaFindUnique = vi.fn()
const mockTenantClient = vi.fn()

vi.mock("@obravision/db", () => ({
  prisma: {
    empresa: {
      findUnique: vi.fn().mockResolvedValue({
        id: "empresa-1",
        tenantId: "tenant-1",
      }),
    },
  },
  createTenantClient: mockTenantClient,
}))

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({})),
  PutObjectCommand: vi.fn().mockImplementation((params) => ({ ...params })),
}))

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://r2.example.com/presigned"),
}))

import { createRevisao } from "@/lib/actions/planta"

describe("createRevisao", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CF_ACCOUNT_ID = "test-account"
    process.env.R2_ACCESS_KEY_ID = "test-key"
    process.env.R2_SECRET_ACCESS_KEY = "test-secret"
    process.env.R2_BUCKET_NAME = "test-bucket"
    process.env.API_URL = "http://localhost:4000"
  })

  it("returns an error when changelog is empty", async () => {
    mockTenantClient.mockReturnValue({
      planta: {
        findUnique: vi.fn().mockResolvedValue({
          id: "planta-1",
          obraId: "obra-1",
          tenantId: "tenant-1",
        }),
      },
      plantaRevisao: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn(),
      },
    })

    const formData = new FormData()
    formData.set("changelog", "")
    formData.set("r2Key", "plantas/test.pdf")
    formData.set("fileSize", "1000")

    const result = await createRevisao("planta-1", formData)
    expect(result).toHaveProperty("error")
  })

  it("returns an error when changelog is missing", async () => {
    mockTenantClient.mockReturnValue({
      planta: {
        findUnique: vi.fn().mockResolvedValue({
          id: "planta-1",
          obraId: "obra-1",
          tenantId: "tenant-1",
        }),
      },
      plantaRevisao: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn(),
      },
    })

    const formData = new FormData()
    // no changelog set
    formData.set("r2Key", "plantas/test.pdf")
    formData.set("fileSize", "1000")

    const result = await createRevisao("planta-1", formData)
    expect(result).toHaveProperty("error")
  })

  it("creates revision R0 when no prior revisions exist", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: "rev-1",
      revisao: "R0",
      changelog: "Initial version",
    })

    mockTenantClient.mockReturnValue({
      planta: {
        findUnique: vi.fn().mockResolvedValue({
          id: "planta-1",
          obraId: "obra-1",
          tenantId: "tenant-1",
        }),
      },
      plantaRevisao: {
        count: vi.fn().mockResolvedValue(0),
        create: mockCreate,
      },
    })

    const formData = new FormData()
    formData.set("changelog", "Initial version")
    formData.set("r2Key", "plantas/test.pdf")
    formData.set("fileSize", "1000")

    await createRevisao("planta-1", formData)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          revisao: "R0",
          changelog: "Initial version",
        }),
      })
    )
  })

  it("increments revision number: R0 -> R1 when one revision exists", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: "rev-2",
      revisao: "R1",
      changelog: "Updated design",
    })

    mockTenantClient.mockReturnValue({
      planta: {
        findUnique: vi.fn().mockResolvedValue({
          id: "planta-1",
          obraId: "obra-1",
          tenantId: "tenant-1",
        }),
      },
      plantaRevisao: {
        count: vi.fn().mockResolvedValue(1),
        create: mockCreate,
      },
    })

    const formData = new FormData()
    formData.set("changelog", "Updated design")
    formData.set("r2Key", "plantas/test-v2.pdf")
    formData.set("fileSize", "2000")

    await createRevisao("planta-1", formData)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          revisao: "R1",
        }),
      })
    )
  })

  it("increments revision number: R1 -> R2 when two revisions exist", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: "rev-3",
      revisao: "R2",
      changelog: "Final revision",
    })

    mockTenantClient.mockReturnValue({
      planta: {
        findUnique: vi.fn().mockResolvedValue({
          id: "planta-1",
          obraId: "obra-1",
          tenantId: "tenant-1",
        }),
      },
      plantaRevisao: {
        count: vi.fn().mockResolvedValue(2),
        create: mockCreate,
      },
    })

    const formData = new FormData()
    formData.set("changelog", "Final revision")
    formData.set("r2Key", "plantas/test-v3.pdf")
    formData.set("fileSize", "3000")

    await createRevisao("planta-1", formData)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          revisao: "R2",
        }),
      })
    )
  })
})
