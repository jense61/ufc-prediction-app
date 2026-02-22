# UFC Prediction App

Production-ready full-stack app for predicting outcomes of **numbered UFC events only** (e.g., UFC 323).

## Stack

- Frontend: Next.js App Router + TypeScript
- Backend: Next.js Route Handlers (`/api/*`)
- Database: PostgreSQL
- ORM: Prisma
- Auth: NextAuth credentials + JWT sessions
- Styling: TailwindCSS (UFC dark theme)
- Scraping: Puppeteer (with Cheerio fallback parsing)
- Scheduling: node-cron
- Timezone: Europe/Brussels via date-fns + date-fns-tz

## Features

- Register and login with email/password (bcrypt hashing)
- View upcoming numbered UFC event and countdown
- Submit exactly one winner pick per main card fight
- Lock predictions after event start time
- Prevent edits once submitted
- Auto-score after result scraping
- Leaderboard sorted by score, then accuracy

## Business Rules Implemented

- Monday 09:00 Europe/Brussels: scrape upcoming numbered UFC event if within 7 days.
- Sunday 11:00 Europe/Brussels: scrape latest numbered UFC results and score users.
- Draw, no contest, and overturned fights: invalidated, no points.
- Fighter replacement detection: compare Monday fighter snapshot to result fighter names; mismatch invalidates fight.
- Yearly reset: leaderboard season resets every Jan 1st (Europe/Brussels).

## Project Structure

- `src/app` - pages and API routes
- `src/components` - reusable UI components
- `src/lib` - shared auth/prisma/time/utils
- `src/server/scrapers` - scraping implementation
- `src/server/services` - event sync and scoring logic
- `src/server/cron` - cron schedule registration
- `src/scripts/start-cron.ts` - dedicated cron process entry
- `prisma/schema.prisma` - relational schema and indexes

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Update `.env` with your PostgreSQL and secrets.

4. Run Prisma migration and client generation:

```bash
npm run prisma:migrate
npm run prisma:generate
```

5. Start app:

```bash
npm run dev
```

6. In separate terminal, start cron worker:

```bash
npm run cron:start
```

## Cron Details

- Monday fetcher expression: `0 9 * * 1`
- Sunday fetcher expression: `0 11 * * 0`
- Yearly season reset expression: `5 0 1 1 *`
- Both run with timezone: `Europe/Brussels`

For manual execution from external scheduler or testing:

- `POST /api/cron/monday`
- `POST /api/cron/sunday`
- `POST /api/cron/season-reset`
- Header required: `x-cron-secret: <CRON_SECRET>`

## Manual Testing (No Real Upcoming Fights)

You can fully test the app without live UFC data:

1. Use Prisma Studio:

```bash
npx prisma studio
```

2. Create one `Event` with a **future** date and `isCompleted=false`, plus 5 `Fight` records.
3. Register 2+ users, login, and submit picks from `/predictions`.
4. Simulate Sunday scoring by editing those fights in Prisma Studio:
	- Set `winner` and `method` for normal wins.
	- Set `isInvalidated=true` (or `method` to draw/no contest/overturned) to verify zero-point rules.
5. Check `/leaderboard` to confirm ranking, score, and accuracy.

To test season reset immediately:

```bash
curl -X POST http://localhost:3000/api/cron/season-reset -H "x-cron-secret: YOUR_SECRET"
```

## Fast Local Seed (Mock Event + Test Users)

Run this from the project root folder:

```bash
npm run seed:mock
```

This creates:

- Event: UFC 999 (future date, main card with 5 fights)
- User 1: alex@testufc.local
- User 2: sam@testufc.local
- Password for both: Test12345!

The script is idempotent for the event and can be re-run while testing.

## Step-by-Step (Windows, Detailed)

1. Open PowerShell.
2. Go to project folder:

```powershell
cd "C:\Users\JensVanHove\OneDrive - element61\Documents\Personal\UFC Prediction App"
```

3. Install dependencies:

```powershell
npm install
```

4. Create local environment file:

```powershell
Copy-Item .env.example .env
```

5. Edit .env and set at least:

- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL=http://localhost:3000
- CRON_SECRET

6. Apply migrations and generate Prisma client:

```powershell
npm run prisma:migrate
npm run prisma:generate
```

7. Seed mock data:

```powershell
npm run seed:mock
```

8. Start app (terminal A):

```powershell
npm run dev
```

9. Start cron worker (terminal B, same folder):

```powershell
npm run cron:start
```

10. Open browser:

- http://localhost:3000
- Login with one of seeded users at /login
- Submit predictions at /predictions
- Check standings at /leaderboard

11. Simulate results manually in Prisma Studio:

```powershell
npx prisma studio
```

- Open Event UFC 999 and its fights.
- For normal result: set winner and method, keep isInvalidated=false.
- For no-point cases: set isInvalidated=true, or method to Draw / No Contest / Overturned.

12. Trigger yearly reset manually (optional test):

```powershell
curl -X POST http://localhost:3000/api/cron/season-reset -H "x-cron-secret: YOUR_SECRET"
```

## Database Migration Notes

- Schema includes User, Event, Fight, Prediction with indexes and relational constraints.
- `Prediction` enforces uniqueness per `(userId, fightId)`.
- `Event.name` is unique (numbered UFC events).

## Scraping Notes

- Primary strategy: Puppeteer page fetch + HTML parsing.
- Fallback strategy: direct fetch + Cheerio parsing.
- Parser selectors include fallback extraction paths to handle HTML shape changes.

## Route Protection

Middleware protects:

- `/predictions/*`
- `/leaderboard/*`

Unauthenticated users are redirected to `/login`.

## Deploy to Supabase + iPhone (Step-by-Step)

Use this flow to make the app publicly accessible on iPhone, persist data in Supabase, and keep Monday/Sunday jobs running.

### 1) Create Supabase database

1. Create a new Supabase project.
2. In Supabase, open **Project Settings → Database**.
3. Copy both connection strings:
	- **Pooled** connection string (for `DATABASE_URL`)
	- **Direct** connection string (for `DIRECT_URL`)

### 2) Configure local `.env`

Update your local `.env` with:

- `DATABASE_URL` = pooled Supabase URL
- `DIRECT_URL` = direct Supabase URL
- `NEXTAUTH_SECRET` = long random string
- `NEXTAUTH_URL` = `http://localhost:3000` (local)
- `CRON_SECRET` = long random string used by cron callers
- `ONLY_NUMBERED` = `true` or `false`

> `ONLY_NUMBERED=true` keeps numbered UFC events only.
> `ONLY_NUMBERED=false` allows numbered + unnumbered UFC events.

### 3) Push schema to Supabase

From project root:

```powershell
npm.cmd install
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
```

Optional (test users/data):

```powershell
npm.cmd run seed:mock
```

### 4) Deploy app (Vercel recommended)

1. Push repo to GitHub.
2. Import project in Vercel.
3. Add env vars in Vercel (Production):
	- `DATABASE_URL`
	- `DIRECT_URL`
	- `NEXTAUTH_SECRET`
	- `NEXTAUTH_URL` = your deployed URL, e.g. `https://your-app.vercel.app`
	- `CRON_SECRET`
	- `ONLY_NUMBERED`
4. Deploy.

### 5) Run cron jobs in production

This app already exposes cron endpoints.

- `GET/POST /api/cron/monday`
- `GET/POST /api/cron/sunday`
- `GET/POST /api/cron/season-reset`

Authorization supported:

- Header `x-cron-secret: <CRON_SECRET>`
- Header `Authorization: Bearer <CRON_SECRET>`
- Query string `?secret=<CRON_SECRET>`

Set schedules (Europe/Brussels):

- Monday 09:00 → `/api/cron/monday`
- Sunday 11:00 → `/api/cron/sunday`
- Jan 1st 00:05 → `/api/cron/season-reset`

If your scheduler cannot send headers, use the query-string secret form.

### 6) Verify production jobs quickly

Run manual checks once after deploy:

```powershell
Invoke-RestMethod -Method Post -Uri "https://YOUR_DOMAIN/api/cron/monday" -Headers @{"x-cron-secret"="YOUR_CRON_SECRET"}
Invoke-RestMethod -Method Post -Uri "https://YOUR_DOMAIN/api/cron/sunday" -Headers @{"x-cron-secret"="YOUR_CRON_SECRET"}
```

Then check:

- `/predictions` for upcoming event/fights
- `/leaderboard` for scoring updates

### 7) Install on iPhone as a real web app

1. Open your deployed HTTPS URL in Safari.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Launch from the new icon.

The app includes a web manifest and Apple web-app metadata for standalone behavior.