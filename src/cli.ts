#!/usr/bin/env node
import { performance } from 'perf_hooks'
import build from './build'
import { startServer } from './dev'

// @ts-ignore
if (!globalThis.__ssr_start_time) {
  // @ts-ignore
  globalThis.__ssr_start_time = performance.now()
}

const [, , ...args] = process.argv

const options = {} as Record<string, any>

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  const nextArg = args[i + 1]
  if (arg.startsWith('--')) {
    options[arg.replace('--', '')] =
      !nextArg || nextArg.startsWith('--') ? true : nextArg
  }
}

const [command] = args

if (command === 'build') {
  // @ts-ignore

  ;(async () => {
    const { mode, ssr, watch } = options

    await build({
      clientOptions: { mode, build: { watch } },
      serverOptions: { mode, build: { ssr } },
    })

    if (!watch) {
      process.exit()
    }
  })()
} else if (
  command === 'dev' ||
  command === undefined ||
  command.startsWith('-')
) {
  startServer(options)
} else {
  console.log(`Command "${command}" not supported`)
}
