import { defineConfig } from 'rolldown';

export default defineConfig([
  {
    input: 'add.js',
    output: { format: 'esm', file: '../functions/api/add.js' },
  },
  {
    input: 'del.js',
    output: { format: 'esm', file: '../functions/api/del.js' },
  },
    {
    input: 'get.js',
    output: { format: 'esm', file: '../functions/api/get.js' },
  },
  {
    input: 'list.js',
    output: { format: 'esm', file: '../functions/api/list.js' },
  },
  {
    input: 'viddel.js',
    output: { format: 'esm', file: '../functions/api/viddel.js' },
  },
  {
    input: 'vidget.js',
    output: { format: 'esm', file: '../functions/api/vidget.js' },
  },
  {
    input: 'vidput.js',
    output: { format: 'esm', file: '../functions/api/vidput.js' },
  }
]);
