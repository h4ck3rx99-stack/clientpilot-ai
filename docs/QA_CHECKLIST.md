# ClientPilot AI — QA Checklist

Manual test checklist for pre-release stabilization.

---

## Auth

- [ ] Visit `/login` — form renders, no auth required
- [ ] Submit empty login — error shown
- [ ] Submit wrong credentials — generic "Invalid email or password"
- [ ] Register with valid data — creates account, logs in, redirects
- [ ] Register with duplicate email — generic error, no email enumeration
- [ ] Register with short password — error shown
- [ ] Logout — cookie cleared, redirected to login
- [ ] Visit protected page while logged out — redirected to `/login`
- [ ] Visit `/` while logged in — shows dashboard link

## Profile

- [ ] Visit `/profile` while logged in — form loads with saved data
- [ ] Save profile — data persists on reload
- [ ] Visit `/profile` while logged out — redirects to login

## Campaign

- [ ] Visit `/campaigns` — lists user's campaigns only
- [ ] Create campaign — appears in list
- [ ] Create campaign missing fields — validation errors
- [ ] Visit `/campaigns/[id]` — campaign detail loads
- [ ] Visit another user's campaign ID — 404 not found
- [ ] Edit campaign — changes persist
- [ ] Toggle campaign status (DRAFT/ACTIVE/PAUSED)

## Leads

- [ ] Add lead manually — appears in lead table
- [ ] Add lead missing required fields — validation errors
- [ ] Edit lead — changes persist
- [ ] Import CSV — rows imported, invalid rows skipped with reasons
- [ ] Import CSV with missing columns — clear error
- [ ] Visit another user's lead — 404 not found

## Discovery

- [ ] Visit `/campaigns/[id]/discover` — search queries generated
- [ ] Extract leads from pasted text — results shown
- [ ] Save extracted leads — saved to campaign
- [ ] Duplicate email detection — skipped on save

## AI (Analyze + Draft)

- [ ] Analyze single lead — fit score calculated, AI or local fallback
- [ ] Analyze all leads — batch processing works
- [ ] Generate draft for single lead — DRAFT created
- [ ] Bulk generate drafts — respects AI_MAX_BULK_LEADS_PER_RUN
- [ ] Bulk respects AI_BULK_DELAY_MS
- [ ] Re-analyze does not duplicate drafts for same lead
- [ ] AI errors do not crash the page — graceful fallback
- [ ] Works without GROQ_API_KEY — local rules used
- [ ] Works with GROQ_API_KEY — AI used

## Drafts / Email Queue

- [ ] Visit `/campaigns/[id]/emails` — drafts listed with filters
- [ ] Filter by status/type
- [ ] Review/edit draft — subject/body editable
- [ ] Mark draft as QUEUED
- [ ] Cancelled/SENT drafts are read-only
- [ ] Visit another user's draft — 404 not found

## Simulation Sending

- [ ] Run simulated send — send logs created
- [ ] Draft status updates to SENT
- [ ] Lead pipeline updates to CONTACTED
- [ ] lastContactedAt updates
- [ ] Activity created
- [ ] Send history shows Sim badges
- [ ] Unsubscribed leads are skipped

## SMTP Sending

- [ ] Requires campaign ACTIVE
- [ ] Requires draft QUEUED
- [ ] Enforces daily limits (campaign + global)
- [ ] Skips unsubscribed emails
- [ ] Sends sequentially, respects delay
- [ ] Includes unsubscribe link
- [ ] Logs provider/messageId if available
- [ ] Does not expose SMTP passwords

## Pipeline

- [ ] Visit `/campaigns/[id]/pipeline` — columns render
- [ ] Update lead pipeline status
- [ ] Add notes to lead
- [ ] Set next follow-up date
- [ ] Activity logged for pipeline changes

## Follow-ups

- [ ] Visit `/campaigns/[id]/follow-ups` — stats shown
- [ ] Generate follow-up drafts — candidates shown
- [ ] Max 2 follow-ups per lead enforced
- [ ] Review/edit follow-up draft
- [ ] Queue and send follow-up

## Unsubscribe

- [ ] Manual add via `/unsubscribes` — email added
- [ ] Duplicate email shows "already unsubscribed"
- [ ] Public unsubscribe token page works without login
- [ ] Unsubscribed email skipped during send
- [ ] Unsubscribed API route requires auth

## Exports

- [ ] Export campaign leads CSV — downloads valid CSV
- [ ] Export backup JSON — downloads JSON
- [ ] Backup excludes passwordHash and secrets
- [ ] Backup includes current user's data only

## Settings

- [ ] `/settings/ai` — shows provider statuses and config
- [ ] `/settings/email` — shows mode and SMTP config
- [ ] `/settings/system` — shows system health
- [ ] `/settings/backup` — data overview + export
- [ ] `/settings/dev-tools` — dev mode only, redirects in prod
- [ ] Setup status card shows current progress

## Security / Data Isolation

- [ ] Direct URL to another user's campaign → 404
- [ ] Direct URL to another user's lead → 404
- [ ] Direct URL to another user's draft → 404
- [ ] API returns 401 for unauthenticated requests
- [ ] GET /api/unsubscribes requires auth
- [ ] PUT /api/leads/[id] requires auth + ownership
- [ ] POST /api/leads/generate-draft requires auth
- [ ] POST /api/campaigns creates with userId
- [ ] GET /api/campaigns returns user's campaigns only

## Edge Cases

- [ ] Empty state renders for zero campaigns, leads, drafts
- [ ] No GROQ_API_KEY — app still works
- [ ] No SMTP config — app still works with simulation
- [ ] 0 leads in campaign — no errors
- [ ] Large CSV import — handles gracefully
- [ ] Back button after actions — no stale data issues
