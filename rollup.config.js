import { terser } from 'rollup-plugin-terser';

export default {
   input: 'src/index.js',
   output: [
      {
        file: 'dist/bundle.min.js',
        format: 'iife',
        plugins: [
          terser()
        ]
      },
      {
         file: 'dist/bundle.es.js',
         format: "es",
         exports: "named",
         plugins: [terser()]
      }
   ]
 };
 