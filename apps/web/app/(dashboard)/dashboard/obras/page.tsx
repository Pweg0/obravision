import { listObras } from "@/lib/actions/obra"
import { listStatuses } from "@/lib/actions/status"
import { ObrasClient } from "./ObrasClient"

export default async function ObrasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tipo?: string; q?: string }>
}) {
  const params = await searchParams
  const obras = await listObras({
    archived: false,
    statusId: params.status,
    search: params.q,
  })
  const statuses = await listStatuses()

  return <ObrasClient obras={obras} statuses={statuses} />
}
