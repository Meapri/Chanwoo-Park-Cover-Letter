import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/Chanwoo-Park-Cover-Letter/',
  server: {
    port: 5173,
    host: true,
    open: false,
  },
  build: {
    target: 'es2022',
    outDir: 'dist-demo',
  },
});
