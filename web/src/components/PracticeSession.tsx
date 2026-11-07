"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeReward,
  TabularQLearner,
} from "@/lib/qlearning";
import { createRecognizer, speechSupported } from "@/lib/speech";
import type {
  Difficulty,
  GradeResult,
  QuestionItem,
  RoundResult,
  SessionConfig,
} from "@/lib/types";

type Phase =
  | "loading"
  | "ready"
  | "listening"
  | "grading"
  | "feedback"
  | "done"
  | "error";

type Props = {
  config: SessionConfig;
  onExit: () => void;
};

export function PracticeSession({ config, onExit }: Props) {
  const learner = useMemo(() => new TabularQLearner(), []);
  const [state, setState] = useState<Difficulty>("easy");
  const [round, setRound] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [item, setItem] = useState<QuestionItem | null>(null);
  const [answer, setAnswer] = useState("");
  const [partial, setPartial] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [reward, setReward] = useState(0);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [error, setError] = useState("");
  const [voiceOk, setVoiceOk] = useState(false);
  const recognitionRef = useRef<ReturnType<typeof createRecognizer>>(null);
  const finalAnswerRef = useRef("");

  useEffect(() => {
    setVoiceOk(speechSupported());
  }, []);

  useEffect(() => {
    void loadQuestion(1, "easy");
    return () => {
      recognitionRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadQuestion(nextRound: number, currentState: Difficulty) {
    setPhase("loading");
    setError("");
    setAnswer("");
    setPartial("");
    setGrade(null);
    finalAnswerRef.current = "";

    const action = learner.chooseAction(currentState);
    setDifficulty(action);
    setRound(nextRound);
    setState(currentState);

    try {
      const response = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: config.language,
          difficulty: action,
          topic: config.topic || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load question");
      setItem(data);
      setPhase("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load question");
      setPhase("error");
    }
  }

  function startListening() {
    setError("");
    finalAnswerRef.current = "";
    setAnswer("");
    setPartial("");

    const recognition = createRecognizer(
      config.language,
      (text) => setPartial(text),
      (text) => {
        finalAnswerRef.current = text;
        setAnswer(text);
        setPartial(text);
      },
      (message) => {
        setError(`Mic error: ${message}`);
        setPhase("ready");
      },
    );

    if (!recognition) {
      setError("Voice input needs Chrome or Edge on HTTPS (or localhost).");
      return;
    }

    recognitionRef.current = recognition;
    recognition.start();
    setPhase("listening");
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setPhase("ready");
    if (finalAnswerRef.current) {
      setAnswer(finalAnswerRef.current);
    }
  }

  async function submitAnswer() {
    if (!item) return;
    const spoken = (answer || partial || finalAnswerRef.current).trim();
    if (!spoken) {
      setError("Say or type an answer first.");
      return;
    }

    recognitionRef.current?.stop();
    setPhase("grading");
    setError("");

    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: config.language,
          question: item.question,
          expected: item.expected,
          answer: spoken,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Grading failed");

      const nextReward = computeReward(data.correct, difficulty);
      learner.update(state, difficulty, nextReward, difficulty);
      setReward(nextReward);
      setGrade(data);
      setAnswer(spoken);
      if (data.correct) setScore((s) => s + 1);

      setHistory((prev) => [
        ...prev,
        {
          round,
          difficulty,
          question: item.question,
          answer: spoken,
          correct: data.correct,
          reward: nextReward,
          feedback: data.feedback,
          correction: data.correction,
        },
      ]);
      setPhase("feedback");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grading failed");
      setPhase("ready");
    }
  }

  function continueSession() {
    if (round >= config.rounds) {
      setPhase("done");
      return;
    }
    void loadQuestion(round + 1, difficulty);
  }

  const qSnapshot = learner.snapshot();

  return (
    <div className="session">
      <header className="session-bar">
        <button type="button" className="text-link" onClick={onExit}>
          ← Exit
        </button>
        <p className="session-meta">
          Round {Math.min(round, config.rounds)}/{config.rounds} · {config.language}
          {config.topic ? ` · ${config.topic}` : ""}
        </p>
        <p className="session-score">
          Score {score}/{history.length}
        </p>
      </header>

      {phase === "loading" && (
        <div className="panel pulse">
          <p className="eyebrow">Adaptive difficulty</p>
          <h2>Choosing your next prompt…</h2>
        </div>
      )}

      {phase === "error" && (
        <div className="panel">
          <h2>Something broke</h2>
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void loadQuestion(round, state)}
          >
            Retry
          </button>
        </div>
      )}

      {(phase === "ready" ||
        phase === "listening" ||
        phase === "grading") &&
        item && (
          <div className="panel question-panel">
            <div className="difficulty-row">
              <span className={`diff-tag diff-${difficulty}`}>{difficulty}</span>
              {!voiceOk && (
                <span className="note">Voice unavailable — type instead</span>
              )}
            </div>
            <h2>{item.question}</h2>
            {item.hints && <p className="hint">Hint: {item.hints}</p>}

            <div className="answer-box">
              <label htmlFor="answer">Your answer</label>
              <textarea
                id="answer"
                rows={3}
                value={phase === "listening" ? partial || answer : answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={`Reply in ${config.language}…`}
                disabled={phase === "grading" || phase === "listening"}
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="actions">
              {voiceOk && phase !== "listening" && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={startListening}
                  disabled={phase === "grading"}
                >
                  Speak answer
                </button>
              )}
              {phase === "listening" && (
                <button
                  type="button"
                  className="btn btn-secondary recording"
                  onClick={stopListening}
                >
                  Stop listening
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void submitAnswer()}
                disabled={phase === "grading" || phase === "listening"}
              >
                {phase === "grading" ? "Grading…" : "Submit"}
              </button>
            </div>
          </div>
        )}

      {phase === "feedback" && grade && (
        <div className="panel feedback-panel">
          <p className={`result-flag ${grade.correct ? "ok" : "no"}`}>
            {grade.correct ? "Correct" : "Keep going"} · reward {reward > 0 ? "+" : ""}
            {reward}
          </p>
          <p className="heard">You said: “{answer}”</p>
          <p>{grade.feedback}</p>
          {!grade.correct && grade.correction && (
            <p className="correction">Try: {grade.correction}</p>
          )}
          <button type="button" className="btn btn-primary" onClick={continueSession}>
            {round >= config.rounds ? "See results" : "Next round"}
          </button>
        </div>
      )}

      {phase === "done" && (
        <div className="panel done-panel">
          <p className="eyebrow">Session complete</p>
          <h2>
            {score}/{config.rounds} correct
          </h2>
          <p>
            Q-learning steered difficulty from rewards. Harder correct answers
            paid more; misses cost more at higher levels.
          </p>

          <div className="q-table" aria-label="Q-table">
            <div className="q-head">
              <span>State</span>
              <span>easy</span>
              <span>medium</span>
              <span>hard</span>
            </div>
            {(["easy", "medium", "hard"] as Difficulty[]).map((s) => (
              <div key={s} className="q-row">
                <span>{s}</span>
                <span>{qSnapshot[s].easy.toFixed(2)}</span>
                <span>{qSnapshot[s].medium.toFixed(2)}</span>
                <span>{qSnapshot[s].hard.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <ul className="history">
            {history.map((h) => (
              <li key={h.round}>
                <strong>
                  R{h.round} · {h.difficulty}
                </strong>{" "}
                {h.correct ? "✓" : "✗"} ({h.reward > 0 ? "+" : ""}
                {h.reward}) — {h.answer}
              </li>
            ))}
          </ul>

          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={onExit}>
              Practice again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
