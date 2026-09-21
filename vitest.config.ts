import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ['src/__tests__/integration/**'],
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    globals: true
  },
})
