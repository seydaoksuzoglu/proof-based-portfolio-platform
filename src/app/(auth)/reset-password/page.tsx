"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

export default function ResetPasswordRequestPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await fetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Enumeration'ı önlemek için her zaman aynı mesaj
      setIsSubmitted(true);
      toast.success("Talep gönderildi.");
    } catch {
      toast.error("Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Parola Sıfırlama</CardTitle>
        <CardDescription>
          Parolanızı sıfırlamak için e-posta adresinizi girin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Eğer bu e-posta adresiyle kayıtlı bir hesabınız varsa, parola sıfırlama bağlantısı gönderildi.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Giriş&apos;e Dön</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="ornek@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Gönderiliyor..." : "Bağlantı Gönder"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
