import serve from 'rollup-plugin-serve';
import resolve from '@rollup/plugin-node-resolve';
import { uglify } from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';

import pkg from './package.json';

const extensions = ['.js', '.ts'];

export default [
  {
    input: './src/index.ts',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' },
      {
        file: pkg['umd:main'],
        name: 'HttpEngine',
        format: 'umd',
        plugins: [process.env.NODE_ENV === 'production' && uglify()],
      },
    ],
    plugins: [
      babel({ extensions }),
      resolve({ extensions }),
      process.env.NODE_ENV === 'development' && serve(),
    ],
  },
];
