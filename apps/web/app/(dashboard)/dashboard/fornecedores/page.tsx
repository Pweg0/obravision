import { listFornecedores } from "@/lib/actions/fornecedor"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { FornecedoresClient } from "./FornecedoresClient"

export default async function FornecedoresPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const fornecedores = await listFornecedores()

  return (
    <div className="space-y-6">
      <FornecedoresClient
        initialFornecedores={fornecedores}
        currentUserRole={session.user.role}
      />
    </div>
  )
}
