import { requireUser } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import { CardSection } from "@/components/ui/card";

export default async function DeliverabilityPage() {
  const user = await requireUser();

  const items = [
    { title: "Use a real sender identity", detail: "Send using your real name and business email. Generic names like 'Team' reduce trust." },
    { title: "Use a domain email if possible", detail: "Send from your own domain (you@yourcompany.com), not a free Gmail/Outlook address." },
    { title: "Configure SPF/DKIM/DMARC", detail: "Add SPF, DKIM, and DMARC DNS records in your domain provider. This tells email providers your mail is legitimate." },
    { title: "Start with low volume", detail: "New domains and sending addresses need warmup. Start with 3-5 emails per day and increase slowly." },
    { title: "Do not send to random or private emails", detail: "Only send to business contacts you found through public sources. Cold emailing random addresses hurts deliverability." },
    { title: "Always include an unsubscribe link", detail: "ClientPilot AI automatically adds unsubscribe links to all email drafts. Never remove them." },
    { title: "Keep emails short and relevant", detail: "Short, personalized emails perform better. Avoid long sales pitches and excessive formatting." },
    { title: "Do not use fake claims", detail: "Do not make up testimonials, case studies, or statistics. Be honest about what you offer." },
    { title: "Do not blast hundreds from a fresh inbox", detail: "A brand new email account that sends 200 emails in one day will be flagged as spam immediately." },
    { title: "Track replies manually in pipeline", detail: "Update pipeline status when leads reply. Respond promptly to maintain engagement." },
    { title: "Stop contacting people who unsubscribe or say no", detail: "Respect unsubscribe requests and 'not interested' replies. Continuing to contact them harms your sender reputation." },
  ];

  return (
    <AppShell activePage="/settings/deliverability" email={user.email || ""}>
      <h1 className="text-2xl font-bold mb-1">Deliverability Checklist</h1>
      <p className="text-sm text-zinc-500 mb-6">Practical steps to improve email deliverability. DNS configuration is done outside this app.</p>

      <CardSection>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-400">{i + 1}</span>
              <div>
                <p className="font-medium text-white">{item.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </CardSection>

      <CardSection title="Need help with DNS?" className="mt-6">
        <p className="text-xs text-zinc-500">
          SPF, DKIM, and DMARC records are configured in your domain provider&apos;s DNS settings (e.g., Cloudflare, Namecheap, GoDaddy, Google Domains). 
          Check your email provider&apos;s documentation for the exact values to add. This is outside the scope of ClientPilot AI.
        </p>
      </CardSection>
    </AppShell>
  );
}
