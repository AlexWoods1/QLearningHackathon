const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return key;
}

export async function generateText(prompt: string): Promise<string> {
  const response = await fetch(`${GEMINI_URL}?key=${getApiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // Gemini 3.x: no temperature/top_p/top_k; use thinkingLevel instead.
      generationConfig: {
        thinkingConfig: { thinkingLevel: "LOW" },
      },
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `Gemini HTTP ${response.status}: ${JSON.stringify(body)}`,
    );
  }

  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error(`Unexpected Gemini response: ${JSON.stringify(body)}`);
  }
  return text.trim();
}

export function parseJsonObject<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned) as T;
}

export async function generateQuestion(
  language: string,
  difficulty: string,
  topic?: string,
) {
  const topicLine = topic?.trim()
    ? `Topic focus: ${topic.trim()}.`
    : "Pick a useful everyday topic.";

  const prompt = `
You are a language tutor for ${language} learners.
Create one ${difficulty} voice-prompt style question.
${topicLine}

Return ONLY valid JSON with keys:
- "question": the prompt spoken/shown to the learner (in English, asking them to reply in ${language})
- "expected": a short model answer in ${language}
- "hints": one brief hint string
`.trim();

  return parseJsonObject<{
    question: string;
    expected: string;
    hints: string;
  }>(await generateText(prompt));
}

export async function gradeAnswer(
  language: string,
  question: string,
  expected: string,
  userAnswer: string,
) {
  const prompt = `
You grade a ${language} learner's spoken/typed answer.
Be fair to near-correct wording, spelling, and minor grammar slips.

Question: ${question}
Expected answer: ${expected}
Learner answer: ${userAnswer}

Return ONLY valid JSON with keys:
- "correct": boolean
- "feedback": short coaching note in English
- "correction": improved ${language} answer (same as learner if already good)
`.trim();

  const result = parseJsonObject<{
    correct: boolean;
    feedback: string;
    correction: string;
  }>(await generateText(prompt));

  return {
    correct: Boolean(result.correct),
    feedback: result.feedback ?? "",
    correction: result.correction ?? expected,
  };
}
