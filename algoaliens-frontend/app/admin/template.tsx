import { assertAdminFeatureEnabled } from "@/lib/admin-route-guard"

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  assertAdminFeatureEnabled()

  return <>{children}</>
}
