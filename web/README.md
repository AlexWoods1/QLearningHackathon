# Spoken (web)

Vercel-ready Next.js app for the reward-based voice language tutor.

## Local

```bash
cd web
cp .env.example .env.local
# set GEMINI_API_KEY, DATABASE_URL, AUTH_SECRET, AUTH_URL
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Voice answers use the browser Speech Recognition API (Chrome / Edge). Typing works as a fallback.

### Auth + database

- Email/password accounts via Auth.js (JWT sessions)
- Users stored in Neon Postgres (`users` table)
- `/practice` requires a signed-in session

Create a free Neon project at [neon.tech](https://neon.tech) (or Vercel → Storage → Neon), copy the connection string into `DATABASE_URL`, then run `npm run db:push`.

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Deploy on Vercel

1. Import the repo.
2. Set **Root Directory** to `web`.
3. Add env vars:
   - `GEMINI_API_KEY`
   - `DATABASE_URL` (Neon)
   - `AUTH_SECRET`
   - `AUTH_URL` (your production URL, e.g. `https://your-app.vercel.app`)
4. Run `npm run db:push` once against the production `DATABASE_URL` (locally with that env set).
5. Deploy.

API routes:

- `POST /api/auth/signup` — `{ email, password, name? }`
- `GET|POST /api/auth/*` — Auth.js handlers
- `POST /api/question` — `{ language, difficulty, topic? }`
- `POST /api/grade` — `{ language, question, expected, answer }`

Q-learning still runs in the browser for the practice session; the database backs accounts.
