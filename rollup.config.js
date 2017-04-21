import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  entry: 'src/js/adapter_core.js',
  dest: './bundle.js',
  moduleName: 'adapter',
  format: 'umd',
  plugins: [
    resolve({
      jsnext: true,
      main: true
    }),
    commonjs()
  ]
};
