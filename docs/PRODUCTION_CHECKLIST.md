# Production Checklist

Use this checklist before sending real emails from a deployed instance.

## Environment

- [ ] Set a strong, unique `AUTH_SECRET` (32+ random characters)
- [ ] Set `APP_URL` to your public domain (not localhost)
- [ ] Verify `DATABASE_URL` points to your production database
- [ ] Set `NODE_ENV=production`

## AI

- [ ] Obtain and set `GROQ_API_KEY` (free tier is sufficient)
- [ ] Verify AI analysis works: test analyze + draft on a sample lead
- [ ] Keep `AI_MAX_BULK_LEADS_PER_RUN` at 25 or lower
- [ ] Keep `AI_BULK_DELAY_MS` at 2500 or higher to avoid rate limits

## Email — Simulation Phase

- [ ] Keep `EMAIL_MODE=simulation`
- [ ] Create a test campaign with sample leads
- [ ] Generate and review drafts
- [ ] Run simulated send
- [ ] Check send history for expected results
- [ ] Verify unsubscribe system:
  - [ ] Open `/unsubscribe/[token]` for a test email
  - [ ] Confirm unsubscribe flow works

## Email — SMTP Phase

- [ ] Configure SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`)
- [ ] Set `EMAIL_MODE=smtp`
- [ ] Verify SPF record for your sending domain
- [ ] Verify DKIM signing is configured
- [ ] Verify DMARC policy is set
- [ ] Send one test email to yourself first
- [ ] Set `REAL_SEND_DAILY_LIMIT` low (10–20)
- [ ] Keep `REAL_SEND_BATCH_LIMIT` at 5–10
- [ ] Keep `REAL_SEND_DELAY_MS` at 5000 or higher

## Safety Checks

- [ ] Review queue is enabled (emails are never sent without review)
- [ ] Unsubscribe links are present in all email bodies
- [ ] Unsubscribe page is accessible at `/unsubscribe/[token]`
- [ ] Daily send limits are configured per campaign
- [ ] Global daily send limit is set
- [ ] Duplicate sending prevention is active
- [ ] You have an honest sender identity (real name, real business)

## Legal & Compliance

- [ ] You have a legitimate business reason to contact each lead
- [ ] Leads were not obtained via automated scraping
- [ ] You have a privacy policy (if collecting data)
- [ ] You process unsubscribe requests promptly

## Monitoring

- [ ] Check send history regularly
- [ ] Monitor bounce rates
- [ ] Monitor unsubscribe rates
- [ ] Adjust daily limits based on deliverability

## Google Login (Optional)

- [ ] Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in production environment
- [ ] Set production `GOOGLE_REDIRECT_URI`:
  ```
  https://your-domain.com/api/auth/google/callback
  ```
- [ ] Add production redirect URI in Google Cloud Console
- [ ] Keep `GOOGLE_CLIENT_SECRET` private (never expose to browser)
- [ ] Test Google login on production before real use
- [ ] Verify email/password login still works alongside Google login

## Launch Checklist

- [ ] Run the launch checklist at `/launch`
- [ ] Send a test email to yourself at `/settings/test-email`
- [ ] Confirm unsubscribe link works with your public `APP_URL`
- [ ] Confirm backup export works at `/settings/backup`
- [ ] Verify no blockers or warnings before sending real emails
- [ ] Keep your first real batch tiny (3-5 emails)
- [ ] Visit `/daily` to establish a daily outreach routine
- [ ] Read `/settings/deliverability` for deliverability best practices

## Never Do

- Do not send to purchased email lists
- Do not send to scraped contacts
- Do not send without unsubscribe links
- Do not ignore unsubscribe requests
- Do not set daily limits above 50 without testing deliverability
- Do not send unsolicited bulk email (spam)
