import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/__tests__/**/*.test.{js,jsx}'],
    environment: 'happy-dom',
    setupFiles: ['src/__tests__/setup.js'],
    css: false,
  },
})
