import { describe, expect, it } from "vitest"

import { getIconForUrl } from "@/lib/get-icon-for-url"

describe("getIconForUrl", () => {
  it("returns 'github' for github.com URLs", () => {
    expect(getIconForUrl("https://github.com/user/repo")).toBe("github")
    expect(getIconForUrl("https://www.github.com/user")).toBe("github")
  })

  it("returns 'linkedin' for linkedin.com URLs", () => {
    expect(getIconForUrl("https://linkedin.com/in/user")).toBe("linkedin")
    expect(getIconForUrl("https://www.linkedin.com/in/user")).toBe("linkedin")
  })

  it("returns 'twitter' for twitter.com and x.com URLs", () => {
    expect(getIconForUrl("https://twitter.com/user")).toBe("twitter")
    expect(getIconForUrl("https://x.com/user")).toBe("twitter")
    expect(getIconForUrl("https://www.x.com/user")).toBe("twitter")
  })

  it("returns 'instagram' for instagram.com URLs", () => {
    expect(getIconForUrl("https://instagram.com/user")).toBe("instagram")
    expect(getIconForUrl("https://www.instagram.com/user")).toBe("instagram")
  })

  it("returns 'youtube' for youtube.com URLs", () => {
    expect(getIconForUrl("https://youtube.com/channel/123")).toBe("youtube")
  })

  it("returns 'codepen' for codepen.io URLs", () => {
    expect(getIconForUrl("https://codepen.io/user")).toBe("codepen")
  })

  it("returns 'link' for unknown hosts", () => {
    expect(getIconForUrl("https://example.com")).toBe("link")
    expect(getIconForUrl("https://mysite.dev")).toBe("link")
  })

  it("returns 'link' for invalid URLs", () => {
    expect(getIconForUrl("not-a-url")).toBe("link")
    expect(getIconForUrl("")).toBe("link")
  })
})
