import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        videoPlayer: resolve(__dirname, 'videoPlayer.html'),
      },
    },
  },
  plugins: [
    tailwindcss(),
  ],
  server: {
    open: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5098',
        changeOrigin: true,
      },
    },
  },
})