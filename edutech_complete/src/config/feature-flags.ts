import 'dotenv/config'

const enabledEnvValues = new Set(['1', 'true', 'yes', 'on'])

function isEnabled(value?: string | null) {
  if (!value) {
    return false
  }

  return enabledEnvValues.has(value.trim().toLowerCase())
}

export const featureFlags = Object.freeze({
  enableAdmin: isEnabled(process.env.ENABLE_ADMIN),
})

export function whenEnabled<T>(enabled: boolean, values: T[]) {
  return enabled ? values : []
}
