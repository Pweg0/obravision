import { describe, it, expect, vi, beforeEach } from "vitest"

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

// Mock Prisma
vi.mock("@obravision/db", () => ({
  prisma: {
    empresa: {
      findUnique: vi.fn().mockResolvedValue({
        id: "empresa-1",
        tenantId: "tenant-1",
      }),
    },
    planta: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    plantaRevisao: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
    },
  },
  createTenantClient: vi.fn(() => ({
    planta: {
      create: vi.fn().mockResolvedValue({ id: "planta-1", nome: "Planta A" }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    plantaRevisao: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: "rev-1", revisao: "R0" }),
    },
  })),
}))

// Mock R2 / AWS SDK
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({})),
  PutObjectCommand: vi.fn().mockImplementation((params) => ({ ...params })),
}))

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://r2.example.com/presigned-url"),
}))

// Import the action after all mocks are set up
import { getPresignedUploadUrl } from "@/lib/actions/planta"

describe("getPresignedUploadUrl", () => {
  beforeEach(() => {
    process.env.CF_ACCOUNT_ID = "test-account"
    process.env.R2_ACCESS_KEY_ID = "test-key"
    process.env.R2_SECRET_ACCESS_KEY = "test-secret"
    process.env.R2_BUCKET_NAME = "test-bucket"
  })

  it("returns an object with url and key properties", async () => {
    const result = await getPresignedUploadUrl("test.pdf", "application/pdf")
    expect(result).toHaveProperty("url")
    expect(result).toHaveProperty("key")
  })

  it("returns a url string", async () => {
    const result = await getPresignedUploadUrl("test.pdf", "application/pdf")
    expect(typeof result.url).toBe("string")
  })

  it("returns a key starting with 'plantas/'", async () => {
    const result = await getPresignedUploadUrl("myfile.pdf", "application/pdf")
    expect(result.key).toMatch(/^plantas\//)
  })

  it("includes the original filename in the key", async () => {
    const result = await getPresignedUploadUrl("blueprint.pdf", "application/pdf")
    expect(result.key).toContain("blueprint.pdf")
  })
})
