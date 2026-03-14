import { listNotifications } from "@/lib/actions/notification"
import { NotificacoesClient } from "./NotificacoesClient"

export const metadata = {
  title: "Notificacoes — ProjetaPro",
  description: "Seu historico de notificacoes",
}

/**
 * /dashboard/notificacoes — dedicated notifications page (Server Component).
 *
 * Fetches initial 20 notifications server-side and passes to NotificacoesClient
 * for client-side filtering, pagination, and read/unread interactions.
 */
export default async function NotificacoesPage() {
  const notifications = await listNotifications({ limit: 20 })

  return (
    <div className="p-6">
      <NotificacoesClient initialNotifications={notifications} />
    </div>
  )
}
