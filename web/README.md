# Spoken (web)

Next.js app for reward-based voice language practice. Deployed on Vercel with Neon Postgres auth.

**Production:** [https://qlearninghackathon.vercel.app](https://qlearninghackathon.vercel.app)

## Features

- Email/password signup + login (Auth.js JWT sessions)
- Practice gated behind auth (`/practice`)
- Browser speech recognition (Chrome / Edge / many mobile browsers); typing fallback
- Gemini 3.8 Flash for questions and grading
- Client-side tabular Q-learning for difficulty

## Local setup

```bash
cd web
cp .env.example .env.local
npm install
```

### 1. Gemini

Get an API key from [Google AI Studio](https://aistudio.google.com/apikey) and set:

```env
GEMINI_API_KEY=...
# optional
# GEMINI_MODEL=gemini-3.8-flash
```

### 2. Neon database

1. Create a project at [neon.tech](https://console.neon.tech) (or Vercel → Storage → Neon).
2. Copy the connection URI into `.env.local` — **no space after `=`**:

```env
DATABASE_URL=postgresql://user:pass@ep-....neon.tech/neondb?sslmode=require
```

3. Push the schema:

```bash
npm run db:push
```

(`drizzle.config.ts` loads `.env.local` automatically.)

### 3. Auth

```env
AUTH_SECRET=   # openssl rand -base64 32
AUTH_URL=http://localhost:3000
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → create an account → start practice.

## Deploy on Vercel

1. Import [AlexWoods1/QLearningHackathon](https://github.com/AlexWoods1/QLearningHackathon).
2. Set **Root Directory** to `web`.
3. Add env vars (Production + Preview as needed):

| Name | Example |
| --- | --- |
| `GEMINI_API_KEY` | your key |
| `DATABASE_URL` | Neon URI |
| `AUTH_SECRET` | long random string |
| `AUTH_URL` | `https://qlearninghackathon.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |

4. Ensure `npm run db:push` has been run once against that `DATABASE_URL`.
5. Deploy (`vercel --prod` from `web/`, or Git push if the project is linked).

CLI (already linked for this project):

```bash
cd web
vercel env ls
vercel deploy --prod
```

## API routes

| Method | Path | Body |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | `{ email, password, name? }` |
| `GET`/`POST` | `/api/auth/*` | Auth.js handlers |
| `POST` | `/api/question` | `{ language, difficulty, topic? }` |
| `POST` | `/api/grade` | `{ language, question, expected, answer }` |

## Notes

- Q-learning state lives in the browser for the session; Neon stores users only.
- Mobile speech uses non-continuous recognition + transcript dedupe to avoid repeated words.
- Prefer the stable prod URL (`qlearninghackathon.vercel.app`) so `AUTH_URL` matches cookies.
