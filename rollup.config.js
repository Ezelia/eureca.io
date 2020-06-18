import typescript from 'rollup-plugin-typescript2';
import dts from "rollup-plugin-dts";


export default [
  {
    external: ['fs', 'http', 'url'],
    input: 'src/index.ts',
    output: [{
      file: 'dist/EurecaServer.js',
      format: 'cjs'
    }],
    plugins: [
      typescript(),
    ]
  },
  {
    input: 'src/Client.class.ts',
    output: [{
      file: 'dist/EurecaClient.js',
      format: 'iife',
      name: 'Eureca'
    }],
    plugins: [
      typescript(),
    ]
  },
  {
    input: 'src/index.ts',
    output: [{ file: "dist/Eureca.d.ts", format: "es" }],
    plugins: [dts()]
  }
];