import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: path.resolve(__dirname, 'src/content.ts'),
        background: path.resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (!name) return 'assets/[name]-[hash][extname]';
          const base = path.parse(name).base;
          if (base.includes('lockdown') || base === 'content.css') {
            return 'content.css';
          }
          return 'assets/' + base;
        },
      },
    },
  },
});
