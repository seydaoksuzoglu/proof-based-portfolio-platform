/**
 * Plan 5.1.2 — Settings sayfası.
 * Hesap silme bölümü: AlertDialog ile "Bu işlem geri alınamaz" uyarısı.
 * Parola tekrar isteme input'u.
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleDeleteAccount() {
    if (!password.trim()) {
      toast.error("Lütfen parolanızı girin")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (res.status === 204) {
        toast.success("Hesabınız başarıyla silindi")
        router.push("/login")
        return
      }

      const data = await res.json()
      toast.error(data.error ?? "Hesap silinemedi")
    } catch {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
      setPassword("")
    }
  }

  return (
    <div className="mx-auto max-w-2xl pb-12">
      <h1 className="mb-8 text-2xl font-bold tracking-tight">Ayarlar</h1>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-destructive/30 bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <h2 className="text-lg font-semibold text-destructive">
              Tehlikeli Bölge
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hesabınızı sildiğinizde portföyünüz, projeleriniz ve
              bağlantılarınız dahil tüm verileriniz kalıcı olarak silinir.
              Bu işlem geri alınamaz.
            </p>
          </div>
        </div>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button
              id="delete-account-trigger"
              variant="destructive"
              size="sm"
            >
              <Trash2 className="mr-2 size-4" />
              Hesabımı Sil
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Hesabınızı silmek istediğinizden emin misiniz?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem geri alınamaz. Portföyünüz, projeleriniz ve
                bağlantılarınız dahil tüm verileriniz kalıcı olarak
                silinecektir.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2 py-2">
              <Label htmlFor="confirm-password">
                Devam etmek için parolanızı girin
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolanız"
                disabled={loading}
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={loading}
                onClick={() => setPassword("")}
              >
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                id="confirm-delete-account"
                onClick={(e) => {
                  e.preventDefault()
                  handleDeleteAccount()
                }}
                disabled={loading || !password.trim()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 size-4" />
                )}
                Hesabımı Kalıcı Olarak Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
