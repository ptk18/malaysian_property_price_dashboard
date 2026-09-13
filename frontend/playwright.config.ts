import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:3017",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command:
        "../.venv/bin/python -m uvicorn api.main:app --app-dir .. --host 127.0.0.1 --port 8017",
      url: "http://127.0.0.1:8017/api/health",
      env: { AI_ENABLED: "false", CORS_ORIGINS: "http://127.0.0.1:3017" },
      reuseExistingServer: false,
    },
    {
      command: "npm run build && npm run start",
      url: "http://127.0.0.1:3017",
      env: {
        NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8017",
        PORT: "3017",
        HOSTNAME: "127.0.0.1",
      },
      timeout: 120000,
      reuseExistingServer: false,
    },
  ],
});
