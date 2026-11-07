import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "@/components/SignupForm";

async function SignupContent() {
  const session = await auth();
  if (session?.user) {
    redirect("/practice");
  }

  return (
    <>
      <p className="eyebrow">Account</p>
      <h1>Create account</h1>
      <p className="lede">
        Sign up with email and password. Practice routes stay locked until you
        are signed in.
      </p>
      <SignupForm />
    </>
  );
}

export default function SignupPage() {
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
              <h1>Create account</h1>
              <p className="lede">Loading…</p>
            </>
          }
        >
          <SignupContent />
        </Suspense>
      </div>
    </main>
  );
}
