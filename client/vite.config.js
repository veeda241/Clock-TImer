import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/timer': 'http://localhost:3000',
            '/logo.jpeg': 'http://localhost:3000',
        }
    }
})
