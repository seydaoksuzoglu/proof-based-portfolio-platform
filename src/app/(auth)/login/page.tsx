import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Tekrar Hoş Geldiniz</CardTitle>
        <CardDescription>
          Portföyünüzü yönetmek için giriş yapın.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <div className="mt-4 text-center text-sm">
          Hesabınız yok mu?{" "}
          <Link href="/register" className="underline underline-offset-4">
            Kayıt Ol
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
