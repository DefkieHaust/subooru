import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: true },
    },
  ],
  webServer: {
    command: 'node server/index.js',
    port: 3000,
    reuseExistingServer: true,
    timeout: 10000,
    env: { NODE_ENV: 'test' },
  },
})
