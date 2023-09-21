import { rimraf } from 'rimraf'
import { build as esbuild } from 'esbuild'
import fs from 'node:fs';
import { execSync } from 'child_process';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

packageJson.peerDependencies = packageJson.dependencies;

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

await rimraf('dist');

await esbuild({
  bundle: false,
  entryPoints: ['src/*.ts'],
  loader: { '.ts': 'ts' },
  minify: true,
  outdir: 'dist',
  platform: 'browser',
  sourcemap: true,
  target: 'esnext',
  outExtension: {'.js': '.mjs'}
})

fs.copyFileSync(
  'package.json',
  'dist/package.json',
)

execSync('tsc --project tsconfig.build.json && cd dist && npm publish --access public && cd ..')
