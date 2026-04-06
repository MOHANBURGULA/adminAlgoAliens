const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const COMPOSE_FILE_NAMES = [
  'docker-compose.yml',
  'docker-compose.yaml',
  'docker-compose.dev.yml',
  'docker-compose.dev.yaml',
]

const SEARCH_ROOTS = [
  process.cwd(),
  path.resolve(process.cwd(), '..'),
  path.resolve(process.cwd(), '..', '..'),
]
const OPTIONAL_FLAGS = new Set(['--optional', '--soft-fail'])

function isOptionalStartup() {
  if (process.env.JUDGE0_OPTIONAL_STARTUP === 'true') {
    return true
  }

  return process.argv.slice(2).some((arg) => OPTIONAL_FLAGS.has(arg))
}

function resolveComposeFile() {
  const envComposeFile = process.env.JUDGE0_COMPOSE_FILE?.trim()

  if (envComposeFile) {
    const absoluteComposeFile = path.resolve(envComposeFile)

    if (!fs.existsSync(absoluteComposeFile)) {
      throw new Error(
        `JUDGE0_COMPOSE_FILE points to "${absoluteComposeFile}", but that file does not exist.`,
      )
    }

    return absoluteComposeFile
  }

  for (const root of SEARCH_ROOTS) {
    for (const composeFileName of COMPOSE_FILE_NAMES) {
      const candidate = path.resolve(root, 'judge0', composeFileName)

      if (fs.existsSync(candidate)) {
        return candidate
      }
    }
  }

  const searchedLocations = SEARCH_ROOTS.flatMap((root) =>
    COMPOSE_FILE_NAMES.map((composeFileName) =>
      path.resolve(root, 'judge0', composeFileName),
    ),
  )

  throw new Error(
    `Unable to locate the Judge0 compose file. Set JUDGE0_COMPOSE_FILE or place Judge0 in one of these locations:\n- ${searchedLocations.join('\n- ')}`,
  )
}

function resolveComposeCommand() {
  const dockerComposeV2 = spawnSync('docker', ['compose', 'version'], {
    stdio: 'ignore',
  })

  if (dockerComposeV2.status === 0) {
    return {
      argsPrefix: ['compose'],
      command: 'docker',
    }
  }

  const dockerComposeV1 = spawnSync('docker-compose', ['version'], {
    stdio: 'ignore',
  })

  if (dockerComposeV1.status === 0) {
    return {
      argsPrefix: [],
      command: 'docker-compose',
    }
  }

  throw new Error(
    'Docker Compose was not found. Install Docker Desktop or docker-compose and retry.',
  )
}

function assertDockerDaemonAvailable() {
  const dockerInfo = spawnSync('docker', ['info'], {
    stdio: 'ignore',
  })

  if (dockerInfo.status !== 0) {
    throw new Error(
      'Docker Desktop is not running. Start Docker Desktop and retry.',
    )
  }
}

function startJudge0() {
  const composeFile = resolveComposeFile()
  const composeDirectory = path.dirname(composeFile)
  const { argsPrefix, command } = resolveComposeCommand()
  assertDockerDaemonAvailable()
  const composeArgs = [...argsPrefix, '-f', composeFile, 'up', '-d']

  console.log(`[judge0] Using compose file: ${composeFile}`)

  const result = spawnSync(command, composeArgs, {
    cwd: composeDirectory,
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(
      `Judge0 could not be started because "${command} ${composeArgs.join(' ')}" exited with code ${result.status || 1}.`,
    )
  }

  console.log('[judge0] Judge0 is running in detached mode.')
}

const optionalStartup = isOptionalStartup()

try {
  startJudge0()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)

  if (optionalStartup) {
    console.warn(
      `[judge0] ${message} Continuing without local Judge0; backend startup will continue, but code execution requests may fail until Judge0 is available.`,
    )
    process.exit(0)
  }

  console.error(`[judge0] ${message}`)
  process.exit(1)
}
