import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
     tailwindcss()],
  server: {
    host: true,
    port: 3000,
    },
  build: {
    rollupOptions: {
      external: []
    }
  }
})



// import { defineConfig } from 'vite'
// export default defineConfig({
//   plugins: [
//     tailwindcss(),
//   ],
// })
