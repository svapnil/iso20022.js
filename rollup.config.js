import { defineConfig } from 'rollup';
import typescript from 'rollup-plugin-typescript2';

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs'
      },
      {
        file: 'dist/index.mjs',
        format: 'es'
      }
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        useTsconfigDeclarationDir: true
      })
    ]
  }
]);