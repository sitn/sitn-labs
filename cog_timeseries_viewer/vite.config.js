import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/web/diffusion/lidar/mnc/', // for local use '', for test use: '/web/diffusion/lidar/mnc/' for production (docker) use '/mnc/'
  publicDir: 'public',
  plugins: [],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@assets/*': fileURLToPath(new URL('./src/assets/', import.meta.url)),
      '@public/*': fileURLToPath(new URL('./public/', import.meta.url)),
    }
  }
})
