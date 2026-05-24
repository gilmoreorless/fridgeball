import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.tsv'],
  plugins: [svelte({
    compilerOptions: {
      experimental: {
        async: true
      }
    }
  })],
  root: './src/',
  base: './',
});
