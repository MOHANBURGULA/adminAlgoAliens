import { Logger } from '@nestjs/common'
import { LOCAL_JUDGE0_URL_DEFAULT } from './execution-language'

const JUDGE0_STARTUP_ATTEMPTS_DEFAULT = 15
const JUDGE0_STARTUP_RETRY_DELAY_MS_DEFAULT = 2000
const JUDGE0_STARTUP_TIMEOUT_MS_DEFAULT = 2000

function getPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function waitForJudge0Startup() {
  if (process.env.JUDGE0_STARTUP_CHECK === 'false') {
    return true
  }

  const logger = new Logger('Judge0Startup')
  const judge0BaseUrl =
    process.env.JUDGE0_URL?.trim() || LOCAL_JUDGE0_URL_DEFAULT
  const attempts = getPositiveInteger(
    process.env.JUDGE0_STARTUP_ATTEMPTS,
    JUDGE0_STARTUP_ATTEMPTS_DEFAULT,
  )
  const retryDelayMs = getPositiveInteger(
    process.env.JUDGE0_STARTUP_RETRY_DELAY_MS,
    JUDGE0_STARTUP_RETRY_DELAY_MS_DEFAULT,
  )
  const timeoutMs = getPositiveInteger(
    process.env.JUDGE0_STARTUP_TIMEOUT_MS,
    JUDGE0_STARTUP_TIMEOUT_MS_DEFAULT,
  )

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(`${judge0BaseUrl}/languages`, {
        signal: controller.signal,
      })

      if (response.ok) {
        clearTimeout(timeout)
        logger.log(`Judge0 is available at ${judge0BaseUrl}`)
        return true
      }

      clearTimeout(timeout)
      logger.warn(
        `Judge0 health check attempt ${attempt}/${attempts} returned ${response.status}. Retrying in ${retryDelayMs}ms.`,
      )
    } catch (error) {
      clearTimeout(timeout)

      const message = error instanceof Error ? error.message : String(error)
      logger.warn(
        `Judge0 health check attempt ${attempt}/${attempts} failed: ${message}. Retrying in ${retryDelayMs}ms.`,
      )
    }

    if (attempt < attempts) {
      await sleep(retryDelayMs)
    }
  }

  logger.error(
    `Judge0 is not reachable at ${judge0BaseUrl}. The backend will keep starting, but code execution requests may fail until Judge0 is ready.`,
  )

  return false
}
