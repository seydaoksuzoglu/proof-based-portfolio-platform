/**
 * Plan 4.2.4 — GitHub Import UI bileşeni.
 * GitHub kullanıcı adı input + "İçe Aktar" butonu.
 * Sonuç: kaç proje eklendi/güncellendi gösterilir.
 */

"use client"

import { useState } from "react"
import { Code2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function GitHubImport() {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleImport() {
    const trimmed = username.trim()
    if (!trimmed) {
      toast.error("GitHub kullanıcı adı girin")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/github/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUsername: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Import başarısız oldu")
        return
      }

      const result: { imported: number; updated: number } = await res.json()

      if (result.imported === 0 && result.updated === 0) {
        toast.info("İçe aktarılacak yeni repo bulunamadı.")
      } else {
        const parts: string[] = []
        if (result.imported > 0) parts.push(`${result.imported} yeni proje eklendi`)
        if (result.updated > 0) parts.push(`${result.updated} proje güncellendi`)
        toast.success(parts.join(", "))
      }

      setUsername("")
      // Sayfayı yenile → yeni projeler görünsün
      window.location.reload()
    } catch {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Code2 className="size-5 text-muted-foreground" />
        <Label className="font-medium">GitHub Import</Label>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        GitHub kullanıcı adınızı girerek public repo&apos;larınızı proje olarak içe aktarın.
      </p>
      <div className="flex gap-2">
        <Input
          id="github-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="kullanıcı-adı"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleImport()
          }}
        />
        <Button
          id="github-import-btn"
          onClick={handleImport}
          disabled={loading || !username.trim()}
          size="sm"
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "İçe Aktar"
          )}
        </Button>
      </div>
    </div>
  )
}
