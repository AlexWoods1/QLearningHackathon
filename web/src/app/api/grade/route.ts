import { NextResponse } from "next/server";
import { gradeAnswer } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const language = String(body.language || "Spanish");
    const question = String(body.question || "");
    const expected = String(body.expected || "");
    const answer = String(body.answer || "").trim();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "question and answer are required" },
        { status: 400 },
      );
    }

    const grade = await gradeAnswer(language, question, expected, answer);
    return NextResponse.json(grade);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
