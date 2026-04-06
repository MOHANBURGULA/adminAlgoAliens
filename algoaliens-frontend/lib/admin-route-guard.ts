import "server-only"

import { notFound } from "next/navigation"
import { FEATURES } from "@/config/features"

export function assertAdminFeatureEnabled() {
  if (!FEATURES.ENABLE_ADMIN) {
    notFound()
  }
}
