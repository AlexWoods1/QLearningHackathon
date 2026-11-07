"use client";

import { useState } from "react";
import Link from "next/link";
import { PracticeSession } from "@/components/PracticeSession";
import { SetupForm } from "@/components/SetupForm";
import type { SessionConfig } from "@/lib/types";

export default function PracticePage() {
  const [config, setConfig] = useState<SessionConfig | null>(null);

  if (config) {
    return (
      <main className="practice-page">
        <PracticeSession config={config} onExit={() => setConfig(null)} />
      </main>
    );
  }

  return (
    <main className="practice-page setup-page">
      <div className="setup-wrap">
        <Link href="/" className="text-link">
          ← Spoken
        </Link>
        <p className="eyebrow">Reward-based session</p>
        <h1>Set your practice</h1>
        <p className="lede">
          Speak answers into the mic. Q-learning picks the next difficulty from
          your rewards.
        </p>
        <SetupForm onStart={setConfig} />
      </div>
    </main>
  );
}
