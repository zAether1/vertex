import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    include: ['src/__tests__/integration/**/*.integration.test.ts'],
    globals: true,
    setupFiles: ['src/__tests__/integration/setup.ts'],
    testTimeout: 10000
  },
})