# First 50 Leads Playbook

A simple, safe workflow to test ClientPilot AI with your first real outreach campaign.

## 1. Pick One Offer

Start with one specific offer you can deliver. Choose from:

- **Website Audit** — Free homepage audit (for local businesses, restaurants, gyms, clinics, coaching centers)
- **AI Automation Idea** — Free automation workflow idea (for education institutes, clinics, agencies, service businesses)
- **Dashboard / CRM Workflow** — Free workflow audit (for agencies, consultants, growing small businesses)

Use the playbook at `/playbook/first-50` to create a campaign from any of these templates.

## 2. Pick One Niche and Location

- Choose one industry (e.g., "dentists in Austin")
- Choose one location (e.g., "Austin, TX")
- Do not mix multiple niches in your first campaign

## 3. Add 10 Leads

- Use public business directories, Google Maps listings, or business websites
- Add source URLs for every lead
- Start with 10, then scale to 25, then to 50
- Use the CSV import at `/campaigns/[id]/leads/import`
- Never use personal email addresses without business context

## 4. Analyze + Draft

- Run Analyze + Draft on your leads
- Review fit scores — focus on leads scoring 75+
- Wait 2-3 seconds between batches if processing many leads

## 5. Review Every Draft

- Open each draft at `/campaigns/[id]/emails`
- Check the quality score
- Fix personalization
- Remove template placeholders
- Keep tone professional and helpful

## 6. Simulate Send

- Queue only your best drafts
- Run a simulated send
- Review send history for any issues
- Never skip simulation before going real

## 7. Send Tiny Batch

- Configure SMTP in settings
- Start with 3-5 real emails per day
- Gradually increase as you see replies

## 8. Track Replies

- Update pipeline status for every reply
- Mark INTERESTED, MEETING_BOOKED, WON, or LOST
- Move NOT_INTERESTED leads out of active rotation

## 9. Follow Up After 2+ Days

- Set follow-up dates in the lead editor
- Generate follow-up drafts for interested leads
- Keep follow-ups short and low-pressure
- Stop after 2-3 follow-ups with no reply

## 10. Stop Rules

- Stop contacting unsubscribed leads
- Stop contacting people who say not interested
- Do not send hundreds from a fresh inbox
- Do not use fake claims or testimonials
- Do not email contacts without source URLs
- Keep daily limit low at first (10-20)

## 11. What to Measure

- Leads added
- High-fit leads (score 75+)
- Drafts generated
- Emails sent
- Replies received
- Interested leads
- Meetings booked
- Won leads

Track these in your campaign dashboard and pipeline views.
