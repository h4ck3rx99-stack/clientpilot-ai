# Daily Workflow

Recommended routine for consistent, safe outreach using ClientPilot AI.

## Morning / Start of Session

1. **Check your daily page** (`/daily`)
   - View queued emails, follow-ups due, drafts pending, interested leads, meetings booked
   - Get a quick overview of today's priorities

2. **Review follow-ups** (`/campaigns/[id]/follow-ups`)
   - Check which leads need follow-up today
   - Generate follow-up drafts where needed

3. **Update pipeline from replies**
   - Move REPLIED leads to INTERESTED, MEETING_BOOKED, or NOT_INTERESTED
   - Set next follow-up date for INTERESTED leads
   - Archive LOST and NOT_INTERESTED leads from active rotation

## During Session

4. **Add new leads** (as needed)
   - Use discovery assistant for search ideas
   - Manually paste public business listings
   - Import CSV for bulk additions
   - Add source URLs for every lead

5. **Analyze + Draft** (when new leads are added)
   - Run analysis on new leads
   - Wait for AI scoring
   - Review fit scores

6. **Queue only good emails**
   - Open each draft
   - Review quality score
   - Personalize if needed
   - Mark as QUEUED when ready

## End of Session

7. **Send within configured limits**
   - Run simulated send first if not done yet
   - Review send results
   - Send real emails only if SMTP is configured and tested

8. **Backup your data** (`/settings/backup`)
   - Download backup JSON
   - Store safely

## Safety Reminders

- Never skip reviewing a draft before queuing
- Never send real emails without simulated send first
- Keep daily send limit at 10-20 until you confirm deliverability
- Stop contacting anyone who opts out or says not interested
- Export backup at the end of every session
