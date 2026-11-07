# Spoken (web)

Vercel-ready Next.js app for the reward-based voice language tutor.

## Local

```bash
cd web
cp .env.example .env.local
# put GEMINI_API_KEY in .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Voice answers use the browser Speech Recognition API (Chrome / Edge). Typing works as a fallback.

## Deploy on Vercel

1. Import the repo (or this `web` folder).
2. Set **Root Directory** to `HandCraftedCode/web` if the repo root is `No_Ai` / `HandCraftedCode`.
3. Add env var `GEMINI_API_KEY` in the Vercel project settings.
4. Deploy.

API routes:

- `POST /api/question` — `{ language, difficulty, topic? }`
- `POST /api/grade` — `{ language, question, expected, answer }`

Q-learning runs in the browser so session state needs no database.
