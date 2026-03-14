import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { listStatuses } from "@/lib/actions/status"
import { StatusManager } from "../StatusManager"

export default async function StatusPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await params
  const session = await auth()

  if (!session?.user?.empresaId) {
    notFound()
  }

  const statuses = await listStatuses()

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Status</h1>
      <StatusManager statuses={statuses} currentUserRole={session.user.role} />
    </div>
  )
}
