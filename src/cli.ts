#!/usr/bin/env node
import { buildViteSSR } from './build';
import { startServer } from './dev/server';

const [, , ...args] = process.argv;

const options = {} as Record<string, any>;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  const nextArg = args[i + 1];
  if (arg.startsWith('--')) {
    options[arg.replace('--', '')] =
      !nextArg || nextArg.startsWith('--') ? true : nextArg;
  }
}

const [command] = args;

if (command === 'build') {
  (async () => {
    const { mode, ssr, watch } = options;

    await buildViteSSR({
      clientOptions: { mode, build: { watch } },
      serverOptions: { mode, build: { ssr } },
    });

    if (!watch) {
      process.exit();
    }
  })();
} else if (
  command === 'dev' ||
  command === undefined ||
  command.startsWith('-')
) {
  void startServer(options);
} else {
  console.log(`Command "${command}" not supported`);
}
