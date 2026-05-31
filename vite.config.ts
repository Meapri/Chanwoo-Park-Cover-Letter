import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const projectPages = [
  'edge-translate',
  'liquid-glass',
  'pritype',
  'hermes-antigravity',
  'mlx-vlm',
  'plib',
  'gemini-writing-copilot',
  'androlinux-runtime-lab',
  'gemma4-mtp-server',
  'mlx-swift-mtp',
  'libhangul-core',
  'event-log-pipeline',
];

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
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...Object.fromEntries(
          projectPages.map((slug) => [
            `projects/${slug}/index`,
            resolve(__dirname, `projects/${slug}/index.html`),
          ])
        ),
      },
    },
  },
});
