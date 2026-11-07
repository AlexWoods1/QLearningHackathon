"use client";

import { useState, type FormEvent } from "react";
import type { SessionConfig } from "@/lib/types";

type Props = {
  onStart: (config: SessionConfig) => void;
};

const LANGUAGES = [
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Japanese",
  "Chinese",
  "Korean",
  "English",
];

export function SetupForm({ onStart }: Props) {
  const [language, setLanguage] = useState("Spanish");
  const [topic, setTopic] = useState("");
  const [rounds, setRounds] = useState(5);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onStart({
      language,
      topic: topic.trim(),
      rounds: Math.max(1, Math.min(20, rounds || 5)),
    });
  }

  return (
    <form className="setup" onSubmit={handleSubmit}>
      <label>
        Target language
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </label>

      <label>
        Topic (optional)
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="travel, food, wage gap…"
        />
      </label>

      <label>
        Rounds
        <input
          type="number"
          min={1}
          max={20}
          value={rounds}
          onChange={(e) => setRounds(Number(e.target.value))}
        />
      </label>

      <button type="submit" className="btn btn-primary">
        Start voice practice
      </button>
    </form>
  );
}
