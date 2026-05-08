import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        videoPlayer: resolve(__dirname, 'src/html/videoPlayer.html'),
        signIn: resolve(__dirname, 'src/html/sign-in.html'),
        signUp: resolve(__dirname, 'src/html/sign-up.html'),
        about: resolve(__dirname, 'src/html/about.html'),
        contacts: resolve(__dirname, 'src/html/contacts.html'),
        adminPanel: resolve(__dirname, 'src/html/adminPanel.html'),
        uploadVideo: resolve(__dirname, 'src/html/upload-video.html'),
        changeVideoAttributes: resolve(__dirname, 'src/html/change-video-attributes.html'),
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
      '/videos': {
        target: 'http://localhost:5098',
        changeOrigin: true,
      },
    },
  },
})