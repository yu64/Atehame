import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: "test",
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { outputFolder: "temp/playwright-report" }]],
  outputDir: "temp/playwright-output",
  use: {
    actionTimeout: 0,
    baseURL: process.env.PW_BASE_URL ?? "http://localhost:5174",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  // テスト前に開発サーバを自動で起動する（既に起動している場合は使い回す）
  webServer: {
    command: "npm run dev",
    port: 5174,
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: "Chrome",
      use: {
        channel: "chrome",
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "Firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },
    {
      name: "WebKit",
      use: {
        ...devices["Desktop Safari"],
      },
    },
  ],
});
