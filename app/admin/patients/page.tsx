import { authUtils } from "@/lib/auth"
import { redirect } from "next/navigation"

async function PatientsPage() {
  const session = await authUtils.getSession()

  if (!session || !authUtils.canViewData(session.user.role)) {
    redirect("/auth/login")
  }

  return (
    <div>
      <h1>Patients Page</h1>
      {/* Add patient list or other content here */}
    </div>
  )
}

export default PatientsPage
