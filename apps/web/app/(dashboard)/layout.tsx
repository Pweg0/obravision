import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@projetapro/db"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { SocketProvider } from "@/providers/SocketProvider"
import { NotificationToast } from "@/components/notifications/NotificationToast"
import { Toaster } from "sonner"

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (!session.user.empresaId) {
    redirect("/onboarding/empresa")
  }

  // Fetch obra IDs that this user is a member of (for SocketProvider room joins)
  let obraIds: string[] = []
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: session.user.empresaId },
    })

    if (empresa) {
      const memberships = await prisma.obraMember.findMany({
        where: {
          userId: session.user.id,
          tenantId: empresa.tenantId,
        },
        select: { obraId: true },
      })
      obraIds = memberships.map((m) => m.obraId)
    }
  } catch {
    // Non-fatal — socket will connect without joining rooms
  }

  return (
    <SocketProvider obraIds={obraIds}>
      <Toaster position="bottom-right" richColors />
      <NotificationToast />
      <DashboardLayout
        user={{
          name: session.user.name ?? null,
          email: session.user.email ?? null,
          image: session.user.image ?? null,
          role: session.user.role,
        }}
      >
        {children}
      </DashboardLayout>
    </SocketProvider>
  )
}
