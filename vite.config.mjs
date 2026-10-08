import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const classicAssets = [
  'phrases.js',
  'native.js',
  'main.js',
  'storage.js',
  'personal.js',
  'privacy.html',
  'privacy.css'
];

export default defineConfig({
  publicDir: false,
  server: {
    host: '127.0.0.1',
    port: 1420,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: resolve('index.html')
    }
  },
  plugins: [
    {
      name: 'grens-copy-classic-assets',
      apply: 'build',
      async closeBundle() {
        await mkdir(resolve('dist'), { recursive: true });
        await Promise.all(classicAssets.map((file) => copyFile(resolve(file), resolve('dist', file))));
      }
    }
  ]
});
