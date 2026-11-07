import { NextResponse } from "next/server";
import { generateQuestion } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const language = String(body.language || "Spanish");
    const difficulty = String(body.difficulty || "easy");
    const topic = body.topic ? String(body.topic) : undefined;

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "difficulty must be easy, medium, or hard" },
        { status: 400 },
      );
    }

    const item = await generateQuestion(language, difficulty, topic);
    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
