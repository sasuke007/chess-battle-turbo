import { build } from 'esbuild';
import { readdirSync } from 'fs';

const scenarios = readdirSync('src/scenarios')
  .filter(f => f.endsWith('.ts'))
  .map(f => `src/scenarios/${f}`);

await build({
  entryPoints: scenarios,
  bundle: true,
  outdir: 'dist',
  format: 'cjs',
  platform: 'neutral',
  target: 'es2020',
  mainFields: ['module', 'main'],
  external: ['k6', 'k6/*'],
  sourcemap: false,
  minify: false,
});

console.log(`Built ${scenarios.length} scenarios → dist/`);
