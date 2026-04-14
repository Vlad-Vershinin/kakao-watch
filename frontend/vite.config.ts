import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:dns'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ]
})