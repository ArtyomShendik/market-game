import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    // Все ассеты остаются файлами: их грузит AssetManager, а не бандл.
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
