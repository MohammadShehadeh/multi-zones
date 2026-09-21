#!/usr/bin/env node
// Cross-platform `next dev|start` using the port from zones.json.
// Usage: mfe dev | mfe start   (run from an app directory)
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const config = JSON.parse(readFileSync(join(root, 'zones.json'), 'utf8'));
const { name } = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));

const app = config.applications[name];
if (!app) {
	console.error(`[mfe] "${name}" is not listed in zones.json`);
	process.exit(1);
}

const port = String(app.development.local);
const [command, ...rest] = process.argv.slice(2);

if (command !== 'dev' && command !== 'start') {
	console.error('[mfe] usage: mfe <dev|start> [...next args]');
	process.exit(1);
}

if (app.development.host) {
	console.log(`[mfe] ${name} → http://${app.development.host}:${port}`);
}

const nextBin = createRequire(join(process.cwd(), 'package.json')).resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, command, '--port', port, ...rest], {
	stdio: 'inherit',
});
// `code` is null when Next is killed by a signal
child.on('exit', (code) => process.exit(code ?? 1));
