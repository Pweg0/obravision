import { listObras } from "@/lib/actions/obra"
import { ArchivedObrasClient } from "./ArchivedObrasClient"

export default async function ArchivedObrasPage() {
  const obras = await listObras({ archived: true })

  return <ArchivedObrasClient obras={obras} />
}
