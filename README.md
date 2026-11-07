# QLearningHackathon

**Spoken** — adaptive voice language practice. Gemini asks questions and grades answers; tabular Q-learning raises or eases difficulty from rewards.

**Live app:** [https://qlearninghackathon.vercel.app](https://qlearninghackathon.vercel.app)

## What’s in the repo

| Path | What it is |
| --- | --- |
| [`web/`](web/) | Next.js app (Vercel): login, voice practice, Q-learning in the browser |
| [`src/`](src/) | Python CLI tutor (Whisper mic + Gemini grading) |

## Web app (primary)

```bash
cd web
cp .env.example .env.local
# fill GEMINI_API_KEY, DATABASE_URL, AUTH_SECRET, AUTH_URL
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Full setup (Neon, Auth.js, Vercel env vars): see [`web/README.md`](web/README.md).

### Env vars (web)

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Question generation + grading (`gemini-3.8-flash`) |
| `DATABASE_URL` | Neon Postgres (accounts) — no space after `=` |
| `AUTH_SECRET` | Auth.js session signing (`openssl rand -base64 32`) |
| `AUTH_URL` | App origin (`http://localhost:3000` or prod URL) |
| `AUTH_TRUST_HOST` | Set `true` on Vercel |

### Deploy

- Vercel project root: **`web`**
- Production: [qlearninghackathon.vercel.app](https://qlearninghackathon.vercel.app)
- Repo: [github.com/AlexWoods1/QLearningHackathon](https://github.com/AlexWoods1/QLearningHackathon)

## Python CLI

```bash
cd src
# set GEMINI_API_KEY
python UserReward.py
```

Needs a local Whisper install for mic transcription (`transcription.py`).
