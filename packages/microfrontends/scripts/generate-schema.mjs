// Generates schema.json (editor autocomplete/validation for zones.json) from the zod schema.
// Usage: node scripts/generate-schema.mjs [--check]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import { zonesConfigSchema } from '../src/schema.ts';

const schemaPath = new URL('../schema.json', import.meta.url);
const schema = `${JSON.stringify(z.toJSONSchema(zonesConfigSchema), null, 2)}\n`;

if (!process.argv.includes('--check')) {
	writeFileSync(schemaPath, schema);
	process.exit(0);
}

if (!existsSync(schemaPath) || readFileSync(schemaPath, 'utf8') !== schema) {
	console.error('[microfrontends] schema.json is out of date. Run: pnpm --filter @repo/microfrontends generate:schema');
	process.exit(1);
}
