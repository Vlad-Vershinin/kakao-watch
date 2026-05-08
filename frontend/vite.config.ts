import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'sign-in': resolve(__dirname, 'src/html/sign-in.html'),
        'sign-up': resolve(__dirname, 'src/html/sign-up.html'),
        'about': resolve(__dirname, 'src/html/about.html'),
        'contacts': resolve(__dirname, 'src/html/contacts.html'),
        'video-player': resolve(__dirname, 'src/html/videoPlayer.html'),
        'upload-video': resolve(__dirname, 'src/html/upload-video.html'),
        'admin-panel': resolve(__dirname, 'src/html/adminPanel.html'),
        'change-video-attributes': resolve(__dirname, 'src/html/change-video-attributes.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      }
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
      '/videos': {
        target: 'http://localhost:5098',
        changeOrigin: true,
      },
    },
  },
})