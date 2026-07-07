# ClientPilot AI

Personal-use outreach automation MVP. Helps find best-fit clients, write personalized emails, and safely manage outreach campaigns.

**Current status:** Personal-use MVP — not a public SaaS.

## Features

- AI lead scoring (Groq or deterministic fallback)
- Personalized email draft generation (initial + follow-up variants)
- Review queue — nothing sends without approval
- Simulated sending + optional SMTP real sending
- Pipeline tracking (9 stages: Not Contacted → Won)
- Lead discovery assistant (paste public text, extract leads)
- Unsubscribe management with one-click public page
- Follow-up workflow (FU#1, FU#2)
- Campaign templates for quick start
- Onboarding checklist
- System health page
- Backup/export (JSON download)
- CSV export (leads, drafts, pipeline)
- Email settings with safe testing flow guidance
- AI settings with zero-budget Groq guidance
- Data isolation per user (self-hosted auth)
- Daily send limits, duplicate prevention, compliance checks

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** SQLite via Prisma 5
- **Auth:** bcryptjs + jose (self-hosted, no paid provider)
- **AI:** Groq (primary), Gemini, OpenRouter, local-fallback
- **Email:** Simulation (default) or Nodemailer SMTP
- **No payments, no subscriptions, no team billing**

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd clientpilot-ai
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | Yes | `file:./dev.db` | SQLite path |
| `AUTH_SECRET` | Yes | — | Strong random string for production |
| `APP_URL` | Yes | `http://localhost:3000` | Your deployment URL |
| `GROQ_API_KEY` | No | — | For AI analysis (free tier available) |
| `EMAIL_MODE` | No | `simulation` | `simulation` or `smtp` |
| `SMTP_*` | Only if `EMAIL_MODE=smtp` | — | SMTP credentials |

### 3. Run database setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Create dev user (first time)

```bash
npm run db:claim-local-data
```

This creates a dev login:
- Email: `dev@clientpilot.local`
- Password: `password123`

### 5. Start dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Safety Notes

- **Review queue**: Emails are never sent without review. All drafts must be manually queued before sending.
- **Unsubscribe support**: Every email includes an unsubscribe link. The `/unsubscribe/[token]` page is public and requires no login.
- **Daily limits**: Each campaign has a daily send limit. A global daily limit also applies in SMTP mode.
- **No scraping**: The app does not scrape websites. Lead discovery works by pasting public text.
- **No spam**: Designed for legitimate, personalized outreach. Use with honest sender identity.
- **SMTP confirmation**: Real SMTP sending requires explicit checkbox confirmation before execution.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:claim-local-data` | Create dev user and claim orphan records |
| `npx prisma studio` | Open Prisma Studio to browse the database |
| `npx prisma db push` | Sync schema changes to database |
| `npx prisma migrate dev` | Create a new migration |

## Personal Use Workflow

Recommended flow for first outreach:

1. Set up environment (copy `.env.example` to `.env`, fill in `DATABASE_URL`)
2. Configure Groq API key (optional — app works without it using local rules)
3. Keep `EMAIL_MODE=simulation` for initial testing
4. Create your profile at `/profile`
5. Create a campaign at `/campaigns/new`
6. Add 10-20 leads (manual, CSV import, or discovery assistant)
7. Run Analyze + Draft at `/campaigns/[id]`
8. Review every draft in the email queue at `/campaigns/[id]/emails`
9. Queue good drafts (set status to QUEUED)
10. Run simulated send at `/campaigns/[id]/emails`
11. Check send history at `/campaigns/[id]/send-history`
12. Send a test email at `/settings/test-email`
13. Configure SMTP and switch to real mode only after testing
14. Start with 3-5 real emails per day
15. Track replies in pipeline at `/campaigns/[id]/pipeline`
16. Export backup regularly at `/settings/backup`
17. Run the launch checklist at `/launch` before going real

## Database Note

**SQLite** is fine for local and personal usage. For a public hosted SaaS in the future, migrate to **Postgres**.

## More

See [docs/PRODUCTION_CHECKLIST.md](./docs/PRODUCTION_CHECKLIST.md) before sending real emails.
See [docs/QA_CHECKLIST.md](./docs/QA_CHECKLIST.md) for full manual test.
See [docs/LIMITATIONS.md](./docs/LIMITATIONS.md) for known limitations.
