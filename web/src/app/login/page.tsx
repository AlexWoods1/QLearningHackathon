import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/LoginForm";

async function LoginContent() {
  const session = await auth();
  if (session?.user) {
    redirect("/practice");
  }

  return (
    <>
      <p className="eyebrow">Account</p>
      <h1>Sign in</h1>
      <p className="lede">
        Log in to start adaptive voice practice. Your account is stored in
        Postgres on Neon.
      </p>
      <Suspense fallback={<p className="lede">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="practice-page setup-page">
      <div className="setup-wrap">
        <Link href="/" className="text-link">
          ← Spoken
        </Link>
        <Suspense
          fallback={
            <>
              <p className="eyebrow">Account</p>
              <h1>Sign in</h1>
              <p className="lede">Loading…</p>
            </>
          }
        >
          <LoginContent />
        </Suspense>
      </div>
    </main>
  );
}
