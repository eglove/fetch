import { projectBuilder } from '@ethang/project-builder/project-builder.js'

await projectBuilder('fetch', 'master', {
  preVersionBumpScripts: ['UPDATE', 'PRUNE'],
  postVersionBumpScripts: ['DEDUPE', 'LINT'],
  publishDirectory: 'dist',
  tsConfigOverrides: {
    include: ['src/**/*'],
    compilerOptions: {
      emitDeclarationOnly: true,
    }
  },
  tsupOptions: {
    format: ['cjs', 'esm'],
    minify: true,
    outDir: 'dist',
    entry: ['src/*'],
  }
})
