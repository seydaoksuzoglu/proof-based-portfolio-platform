import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Hesap Oluştur</CardTitle>
        <CardDescription>
          Portföyünüzü oluşturmak için bir hesap açın.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
        <div className="mt-4 text-center text-sm">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Giriş Yap
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
