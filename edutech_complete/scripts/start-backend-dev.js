const { spawn } = require('node:child_process')

function startBackend() {
  const child = spawn(
    process.execPath,
    [require.resolve('@nestjs/cli/bin/nest.js'), 'start', '--watch'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        JUDGE0_STARTUP_CHECK: process.env.JUDGE0_STARTUP_CHECK ?? 'false',
      },
      stdio: 'inherit',
    },
  )

  child.on('error', (error) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[backend] ${message}`)
    process.exit(1)
  })

  child.on('exit', (code) => {
    process.exit(code ?? 1)
  })
}

startBackend()
