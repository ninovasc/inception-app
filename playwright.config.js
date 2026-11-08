import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  globalTimeout: 600000,
  retries: 1,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:8099',
    headless: true,
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'node scripts/serve.js',
    url: 'http://localhost:8099',
    reuseExistingServer: true,
    timeout: 180000
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ]
});