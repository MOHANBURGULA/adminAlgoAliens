import AdminShellLayout from "@/components/admin/AdminShellLayout"
import { assertAdminFeatureEnabled } from "@/lib/admin-route-guard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  assertAdminFeatureEnabled()

  return <AdminShellLayout>{children}</AdminShellLayout>
}
