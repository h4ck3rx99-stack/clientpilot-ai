# ClientPilot AI — Known Limitations

This document documents intentional limitations and known constraints for the current MVP.

---

## Lead Discovery

- Lead discovery uses **pasted public data** (business listings, directories, social media pages).
- **No automated web scraping** is implemented. Users must find and paste their own source data.
- Extraction accuracy depends on the structure and clarity of the pasted text.
- The local regex parser is a fallback when AI extraction fails — its accuracy is limited.

## AI Provider

- **Groq free-tier limits** may change at any time. Rate limit (429) errors can occur during heavy use.
- If `GROQ_API_KEY` is not set, the app falls back to **local deterministic rules** — output quality is lower.
- The local fallback generates generic pain points, offer angles, and email body text from templates.
- AI-generated email drafts should always be **reviewed and edited** before sending.
- No support for custom AI providers beyond Groq, Gemini, and OpenRouter (each requires their own API key).

## Email Sending

- **SMTP sending deliverability** depends entirely on the sender's mailbox provider limits, reputation, and configuration.
- **SPF, DKIM, and DMARC** DNS records must be configured on the sending domain — this is outside the app.
- Sending too many emails too quickly from a new domain or IP can trigger spam filters.
- **No built-in warmup** or reputation management.
- The simulation mode is the recommended default for testing.

## Database

- **SQLite** is suitable for personal MVP use and single-user testing.
- **Must migrate to Postgres** before deploying as a public SaaS or multi-tenant application.
- SQLite does not handle concurrent write-heavy workloads well.
- No built-in database migration rollback tooling beyond Prisma's `migrate diff`.

## Payments / Subscriptions

- **Not included.** No payment system, pricing tiers, or subscription management exists.
- Adding payments would require integrating Stripe, Paddle, or similar and building a billing backend.

## Import / Restore

- **Backup export works** (JSON download of user data).
- **Import restore is not implemented.** There is no UI or API to re-import a previously exported backup.

## Inbox / Replies

- **Reply tracking is manual.** The app does not monitor inboxes or detect email replies automatically.
- Users must update pipeline status manually when a lead replies.

## Multi-User / Team

- The app is designed as a **single-user tool**.
- No team accounts, role-based access, or shared campaigns exist.
- Each user sees only their own data.

## Security

- JWT-based sessions with HS256 — no refresh token rotation.
- No rate limiting on login/register endpoints (beyond the per-action rate limiter).
- No IP-based access controls or audit logging for admin use.
- `AUTH_SECRET` must be set to a strong random value in production.

## Compliance

- Email drafts include a standard unsubscribe sentence, but **full CAN-SPAM / GDPR compliance** requires legal review outside the app.
- Unsubscribe management is manual — users must add emails to the blocklist themselves.

## CSV Import

- CSV import supports `companyName`, `website`, `email`, and `sourceUrl` columns.
- Other columns are ignored.
- Rows with invalid data are skipped with a reason — no partial rollback.
- No support for XLSX, Google Sheets, or other formats.

## Frontend

- The UI uses Tailwind with a dark theme — no light mode or theme switching.
- No PWA support, push notifications, or offline mode.
- Mobile responsiveness is basic — the app is optimized for desktop use.
