import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
      },
      {
        file: 'dist/index.mjs',
        format: 'es',
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
      }),
      nodeResolve(),
      commonjs(),
    ],
    external: ['dinero.js', 'xmlbuilder2'], // Add any external dependencies here
  },
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
]);
