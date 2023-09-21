import { rimraf } from 'rimraf'
import fs from 'node:fs';
import { execSync } from 'child_process';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

packageJson.peerDependencies = packageJson.dependencies;

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

await rimraf('dist');

execSync('tsc --project tsconfig.build.json')

fs.copyFileSync(
  'package.json',
  'dist/package.json',
)

execSync('cd dist && npm publish --access public && cd ..')
