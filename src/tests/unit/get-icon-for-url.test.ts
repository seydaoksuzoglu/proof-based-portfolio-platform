import { describe, expect, it } from "vitest"

import { getIconForUrl } from "@/lib/get-icon-for-url"

describe("getIconForUrl (Plan §3.3.1)", () => {
  describe("bilinen host'lar", () => {
    it.each([
      ["https://github.com/seyda", "github"],
      ["https://www.github.com/seyda", "github"],
      ["https://linkedin.com/in/seyda", "linkedin"],
      ["https://www.linkedin.com/in/seyda", "linkedin"],
      ["https://twitter.com/seyda", "twitter"],
      ["https://x.com/seyda", "twitter"],
      ["https://www.x.com/seyda", "twitter"],
      ["https://instagram.com/seyda", "instagram"],
      ["https://youtube.com/@seyda", "youtube"],
      ["https://dribbble.com/seyda", "dribbble"],
      ["https://behance.net/seyda", "behance"],
      ["https://medium.com/@seyda", "medium"],
      ["https://dev.to/seyda", "dev-to"],
      ["https://stackoverflow.com/users/1/seyda", "stack-overflow"],
      ["https://codepen.io/seyda", "codepen"],
    ])("%s → %s", (url, expectedIcon) => {
      expect(getIconForUrl(url)).toBe(expectedIcon)
    })
  })

  describe("hostname normalizasyonu", () => {
    it("büyük harfli host'u küçük harfe çevirir", () => {
      expect(getIconForUrl("https://GITHUB.COM/seyda")).toBe("github")
    })

    it("yol/query'den etkilenmez", () => {
      expect(
        getIconForUrl("https://github.com/seyda/repo?tab=readme#section"),
      ).toBe("github")
    })
  })

  describe("default davranış", () => {
    it("bilinmeyen host için 'link' döner", () => {
      expect(getIconForUrl("https://example.com")).toBe("link")
    })

    it("bilinmeyen subdomain için 'link' döner (whitelist'te yoksa)", () => {
      expect(getIconForUrl("https://blog.example.com")).toBe("link")
    })

    it("geçersiz URL için 'link' döner (throw etmez)", () => {
      expect(getIconForUrl("not-a-url")).toBe("link")
      expect(getIconForUrl("")).toBe("link")
      expect(getIconForUrl("://broken")).toBe("link")
    })
  })
})
