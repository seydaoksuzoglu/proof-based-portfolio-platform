import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Sol Panel: Arkaplan Görseli ve Yazılar */}
      <div className="relative hidden w-1/2 lg:flex flex-col justify-end p-12">
        <Image
          src="/images/auth-bg.png"
          alt="Proof-based Portfolio Authentication"
          fill
          className="object-cover"
          priority
        />
        {/* Görselin üzerine tüm ekranı kaplayan yumuşak bir karartma */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Yazılar için şık Buzlu Cam (Glassmorphism) Kartı */}
        <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/20 bg-black/20 p-10 shadow-2xl backdrop-blur-lg">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 mb-6 backdrop-blur-md">
            <span className="text-sm font-medium text-white">🚀 Geleceğin Portföy Platformu</span>
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">
            Proof-Based Portfolio
          </h1>
          <p className="text-lg text-white/90 drop-shadow-md leading-relaxed">
            Yeteneklerinizi sadece söylemekle kalmayın; doğrulanmış kanıtlarla sergileyin, güven inşa edin ve kariyerinizi bir sonraki seviyeye taşıyın.
          </p>
        </div>
      </div>

      {/* Sağ Panel: Form İçeriği (Giriş/Kayıt Sayfaları) */}
      <div className="flex w-full flex-col lg:w-1/2 bg-background relative">
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
