import { rimraf } from 'rimraf'
import { build as esbuild } from 'esbuild'
import { globPlugin } from 'esbuild-plugin-glob'
import fs from 'node:fs';
import { execSync } from 'child_process';

await rimraf('dist');

await esbuild({
  bundle: false,
  entryPoints: ['src/*.ts'],
  loader: { '.ts': 'ts' },
  minify: true,
  outdir: 'dist',
  platform: 'browser',
  plugins: [globPlugin()],
  sourcemap: true,
  target: 'esnext',
})

fs.copyFileSync(
  'package.json',
  'dist/package.json',
)

execSync('tsc --project tsconfig.json && cd dist && npm public --access public && cd ..')
