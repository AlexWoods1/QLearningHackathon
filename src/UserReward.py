"""
Tabular Q-learning reward for voice-prompted language learning.

Gemini generates questions and grades answers. Reward scales with
difficulty; the Q-table picks the next difficulty via epsilon-greedy.
"""

from __future__ import annotations

import json
import os
import random
import urllib.error
import urllib.request
from pathlib import Path

DIFFICULTIES = ("easy", "medium", "hard")
DIFFICULTY_WEIGHT = {"easy": 1.0, "medium": 2.0, "hard": 3.0}

GEMINI_MODEL = "gemini-3.8-flash"
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)


def compute_reward(correct: bool, difficulty: str) -> float:
    weight = DIFFICULTY_WEIGHT[difficulty]
    return weight if correct else -0.5 * weight


class TabularQLearner:
    """Q[state][action] for adaptive difficulty selection."""

    def __init__(
        self,
        states: tuple[str, ...] = DIFFICULTIES,
        actions: tuple[str, ...] = DIFFICULTIES,
        alpha: float = 0.3,
        gamma: float = 0.9,
        epsilon: float = 0.2,
    ):
        self.states = states
        self.actions = actions
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.q: dict[str, dict[str, float]] = {
            s: {a: 0.0 for a in actions} for s in states
        }

    def choose_action(self, state: str) -> str:
        if random.random() < self.epsilon:
            return random.choice(self.actions)
        action_values = self.q[state]
        best = max(action_values.values())
        tied = [a for a, v in action_values.items() if v == best]
        return random.choice(tied)

    def update(self, state: str, action: str, reward: float, next_state: str) -> None:
        old = self.q[state][action]
        bootstrap = max(self.q[next_state].values())
        self.q[state][action] = old + self.alpha * (
            reward + self.gamma * bootstrap - old
        )

    def summary(self) -> str:
        lines = ["Q-table (state -> action values):"]
        for state in self.states:
            vals = "  ".join(
                f"{action}={self.q[state][action]:.2f}" for action in self.actions
            )
            lines.append(f"  {state}: {vals}")
        return "\n".join(lines)


class GeminiTutor:
    """Question generation and answer grading via Gemini."""

    def __init__(self, api_key: str | None = None, language: str = "Spanish"):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.language = language
        if not self.api_key:
            raise RuntimeError(
                "Set GEMINI_API_KEY in the environment before running UserReward."
            )

    def _generate(self, prompt: str) -> str:
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            # Gemini 3.x: no temperature/top_p/top_k; use thinkingLevel instead.
            "generationConfig": {
                "thinkingConfig": {"thinkingLevel": "LOW"},
            },
        }
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            f"{GEMINI_URL}?key={self.api_key}",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                body = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Gemini HTTP {exc.code}: {detail}") from exc

        try:
            return body["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError, TypeError) as exc:
            raise RuntimeError(f"Unexpected Gemini response: {body}") from exc

    def _parse_json(self, text: str) -> dict:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()
        return json.loads(cleaned)

    def generate_question(self, difficulty: str, topic: str | None = None) -> dict:
        topic_line = f"Topic focus: {topic}." if topic else "Pick a useful everyday topic."
        prompt = f"""
You are a language tutor for {self.language} learners.
Create one {difficulty} voice-prompt style question.
{topic_line}

Return ONLY valid JSON with keys:
- "question": the prompt spoken/shown to the learner (in English, asking them to reply in {self.language})
- "expected": a short model answer in {self.language}
- "hints": one brief hint string
""".strip()
        return self._parse_json(self._generate(prompt))

    def grade_answer(self, question: str, expected: str, user_answer: str) -> dict:
        prompt = f"""
You grade a {self.language} learner's spoken/typed answer.
Be fair to near-correct wording, spelling, and minor grammar slips.

Question: {question}
Expected answer: {expected}
Learner answer: {user_answer}

Return ONLY valid JSON with keys:
- "correct": boolean
- "feedback": short coaching note in English
- "correction": improved {self.language} answer (same as learner if already good)
""".strip()
        result = self._parse_json(self._generate(prompt))
        result["correct"] = bool(result.get("correct"))
        return result


# Whisper language codes for common tutor targets (None = auto-detect).
WHISPER_LANG = {
    "spanish": "es",
    "english": "en",
    "french": "fr",
    "german": "de",
    "italian": "it",
    "portuguese": "pt",
    "japanese": "ja",
    "chinese": "zh",
    "korean": "ko",
}


def get_user_answer(
    audio_path: str | None = None,
    language: str | None = None,
    typed: bool = False,
) -> str:
    whisper_lang = WHISPER_LANG.get((language or "").lower())
    if typed:
        return input("Your answer: ").strip()
    if audio_path:
        from transcription import transcribe

        return transcribe(Path(audio_path), language=whisper_lang).strip()

    from transcription import listen_and_transcribe

    text = listen_and_transcribe(language=whisper_lang)
    if text:
        print(f'Heard: "{text}"')
    return text


def run_session(
    rounds: int = 5,
    language: str = "Spanish",
    topic: str | None = None,
    audio_path: str | None = None,
    typed: bool = False,
) -> TabularQLearner:
    tutor = GeminiTutor(language=language)
    learner = TabularQLearner()
    state = "easy"
    score = 0

    print(f"Language: {language} | rounds: {rounds}")
    if typed:
        print("Type answers in the target language.\n")
    else:
        print("Answer verbally: speak after each question, press Enter when done.\n")

    for i in range(1, rounds + 1):
        action = learner.choose_action(state)
        print(f"--- Round {i}/{rounds} | state={state} -> difficulty={action} ---")

        item = tutor.generate_question(action, topic=topic)
        print(f"Q: {item['question']}")
        if item.get("hints"):
            print(f"Hint: {item['hints']}")

        user_answer = get_user_answer(
            audio_path=audio_path, language=language, typed=typed
        )
        if not user_answer:
            print("Empty answer; counting as incorrect.")
            grade = {
                "correct": False,
                "feedback": "No answer given.",
                "correction": item.get("expected", ""),
            }
        else:
            grade = tutor.grade_answer(
                item["question"], item.get("expected", ""), user_answer
            )

        reward = compute_reward(grade["correct"], action)
        next_state = action
        learner.update(state, action, reward, next_state)
        state = next_state

        if grade["correct"]:
            score += 1
            print(f"Correct (+{reward:g}). {grade.get('feedback', '')}")
        else:
            print(f"Incorrect ({reward:g}). {grade.get('feedback', '')}")
            if grade.get("correction"):
                print(f"Correction: {grade['correction']}")

        print()

    print(f"Session score: {score}/{rounds}")
    print(learner.summary())
    return learner


def main() -> None:
    language = input("Target language [Spanish]: ").strip() or "Spanish"
    topic = input("Topic (optional): ").strip() or None
    rounds_raw = input("Rounds [5]: ").strip() or "5"
    rounds = max(1, int(rounds_raw))
    mode = input("Answer mode [voice]/typed: ").strip().lower()
    typed = mode in {"typed", "type", "t", "text"}
    run_session(rounds=rounds, language=language, topic=topic, typed=typed)


if __name__ == "__main__":
    main()
