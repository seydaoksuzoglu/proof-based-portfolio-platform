/**
 * Plan 4.1.4 — Public portföy profil kartı.
 * Avatar, fullName ve bio gösterimi.
 * Tema CSS değişkenlerine duyarlı (data-theme üzerinden).
 */

interface ProfileCardProps {
  fullName: string | null
  bio: string | null
  avatarUrl: string | null
}

export function ProfileCard({ fullName, bio, avatarUrl }: ProfileCardProps) {
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      {/* Avatar */}
      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--portfolio-border)] bg-[var(--portfolio-muted)] shadow-lg md:h-36 md:w-36">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={fullName ?? "Avatar"}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-3xl font-bold text-[var(--portfolio-muted-fg)] md:text-5xl">
            {initials}
          </span>
        )}
      </div>

      {/* Name & Bio */}
      <div className="space-y-2">
        {fullName && (
          <h1 className="text-3xl font-bold tracking-tight text-[var(--portfolio-fg)] md:text-4xl">
            {fullName}
          </h1>
        )}
        {bio && (
          <p className="mx-auto max-w-md text-base leading-relaxed text-[var(--portfolio-muted-fg)]">
            {bio}
          </p>
        )}
      </div>
    </div>
  )
}
