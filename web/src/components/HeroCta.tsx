import Link from "next/link";
import { auth } from "@/auth";

export async function HeroCta() {
  const session = await auth();
  const practiceHref = session?.user
    ? "/practice"
    : "/login?callbackUrl=/practice";
  const ctaLabel = session?.user ? "Start practicing" : "Sign in to practice";

  return (
    <div className="hero-cta">
      <Link href={practiceHref} className="btn btn-primary">
        {ctaLabel}
      </Link>
      {!session?.user ? (
        <Link href="/signup" className="btn btn-ghost">
          Create account
        </Link>
      ) : null}
    </div>
  );
}

export function HeroCtaFallback() {
  return (
    <div className="hero-cta">
      <Link href="/login?callbackUrl=/practice" className="btn btn-primary">
        Sign in to practice
      </Link>
      <Link href="/signup" className="btn btn-ghost">
        Create account
      </Link>
    </div>
  );
}
