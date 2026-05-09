import { beforeEach, vi } from "vitest"

// Her testten önce env değişkenlerini sabit tut
beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "x".repeat(32))
  vi.stubEnv("NODE_ENV", "test")
  vi.stubEnv("RESEND_API_KEY", "")
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
})
