# HandCraftedCode

No AI was used in the development of this project.

## Python CLI

Voice/typed reward tutor:

```bash
cd src
python UserReward.py
```

Needs `GEMINI_API_KEY`, plus Whisper stack for local mic transcription.

## Web (Vercel)

Adaptive voice practice UI lives in [`web/`](web/):

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Deploy notes: see [`web/README.md`](web/README.md). Set Vercel root to `HandCraftedCode/web` and add `GEMINI_API_KEY`.
