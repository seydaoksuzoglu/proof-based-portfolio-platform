"use client";

import { useState, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

function ResetConfirmForm({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const router = useRouter();
  const { token } = use(searchParams);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return <div className="text-center p-4 text-red-500">Geçersiz veya eksik token. Lütfen linki kontrol edin.</div>;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Parolalar eşleşmiyor!");
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Parola sıfırlanamadı.");
      }

      toast.success("Parolanız başarıyla güncellendi! Giriş yapabilirsiniz.");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input 
          type="password" 
          placeholder="Yeni Parola" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          minLength={8}
        />
        <Input 
          type="password" 
          placeholder="Yeni Parola (Tekrar)" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Güncelleniyor..." : "Parolayı Kaydet"}
      </Button>
    </form>
  );
}

export default function ResetPasswordConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Yeni Parola Belirle</CardTitle>
          <CardDescription>Lütfen yeni parolanızı girin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Yükleniyor...</div>}>
            <ResetConfirmForm searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
