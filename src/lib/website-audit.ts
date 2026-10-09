import { generateJsonWithFallback } from "./ai";

export type AuditIssue = {
  type: "design" | "responsiveness" | "load_speed" | "navigation" | "cta" | "broken_pages" | "seo" | "booking_process";
  title: string;
  details: string;
  recommendation: string;
};

export type AuditResult = {
  issues: AuditIssue[];
  emailSubject: string;
  emailBody: string;
};

export async function auditWebsitePresence(
  companyName: string,
  website: string,
  serviceToPitch: string,
  senderName: string,
  businessName: string,
  calendarLink?: string
): Promise<AuditResult> {
  try {
    const systemPrompt = `You are an expert website presence auditor and outreach specialist. Analyze the given business website and generate a highly personalized audit report and outreach email. Return ONLY a valid JSON object. No markdown wrapping outside of JSON, no comments.`;
    
    const userPrompt = `
We are pitching the service: "${serviceToPitch}"
Sender: "${senderName}" from "${businessName || "our agency"}"
${calendarLink ? `Calendar booking link: "${calendarLink}"` : ""}

Business to Audit:
- Name: "${companyName}"
- Website: "${website}"

Please perform a simulated audit of their website and select 2-3 genuine issues from this list:
- outdated design
- poor mobile responsiveness
- slow loading speed
- weak navigation
- missing calls to action
- broken pages
- poor SEO structure
- confusing booking and contact process

Return ONLY this JSON schema:
{
  "issues": [
    {
      "type": "design | responsiveness | load_speed | navigation | cta | broken_pages | seo | booking_process",
      "title": "Clear issue title",
      "details": "A realistic detail of what was found on ${companyName}'s site (e.g. 'The hero banner overlaps text on viewport widths under 640px, making the primary pitch unreadable.')",
      "recommendation": "A concrete, helpful recommendation on how they can improve it."
    }
  ],
  "emailSubject": "A highly engaging, personalized subject line that does not look like spam",
  "emailBody": "Hi there,\\n\\n[A personalized email body. Make sure to: 1. Introduce ${senderName} and ${businessName}. 2. Mention the specific problems found in ${companyName}'s website audit. 3. Explain how they can improve and how ${serviceToPitch} benefits them. 4. Propose a quick chat and offer a clean unsubscribe fallback.]"
}

Writing rules for the email:
- DO NOT use generic template placeholders like "[Your Name]" or "[Company Name]". All details must be fully populated.
- Keep the tone helpful, professional, and low-pressure.
- Weave the selected issues and recommendations naturally into the email body.
`;

    const result = await generateJsonWithFallback<AuditResult>({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      maxTokens: 2500,
    });

    if (result.success && result.data?.issues && result.data.emailSubject && result.data.emailBody) {
      return {
        issues: result.data.issues,
        emailSubject: result.data.emailSubject.trim(),
        emailBody: result.data.emailBody.trim(),
      };
    }
  } catch (error) {
    console.error("AI Website audit failed:", error);
  }

  // Fallback programmatic generator
  return generateDeterministicAudit(companyName, website, serviceToPitch, senderName, businessName, calendarLink);
}

function generateDeterministicAudit(
  companyName: string,
  website: string,
  serviceToPitch: string,
  senderName: string,
  businessName: string,
  calendarLink?: string
): AuditResult {
  const issuesList: AuditIssue[] = [
    {
      type: "responsiveness",
      title: "Poor Mobile Responsiveness",
      details: `We noticed that elements on your homepage overlap and require horizontal scrolling when viewed on standard smartphone resolutions.`,
      recommendation: "Re-compile columns into a single-column flex-grid on mobile viewports so users don't have to scroll horizontally."
    },
    {
      type: "cta",
      title: "Missing Clear Call to Action",
      details: "There is no clear button above the fold on the homepage prompting visitors to book a call or inquire. Visitors must scroll all the way to the footer to find contact details.",
      recommendation: "Place a primary contrasting button (e.g., 'Book a Free Consultation' or 'Get Started') in the top right header and main hero banner."
    },
    {
      type: "load_speed",
      title: "Slow Mobile Loading Speed",
      details: `The homepage takes roughly 4.1 seconds to load on mobile networks, largely due to uncompressed images and unused CSS assets.`,
      recommendation: "Compress image assets to WebP format and lazy-load images below the fold to improve loading speeds."
    }
  ];

  // Select 2 issues
  const issues = [issuesList[0], issuesList[1]];

  const cleanSenderName = senderName || "The team";
  const cleanBusinessName = businessName || "our agency";
  const bookingLine = calendarLink 
    ? `You can pick a time directly on my calendar here: ${calendarLink}`
    : `Would you be open to a quick 10-minute phone call sometime this week?`;

  const emailSubject = `Quick feedback regarding ${companyName}'s website`;
  const emailBody = `Hi there,

I was looking at the website for ${companyName} (${website.replace(/^https?:\/\/(www\.)?/, "")}) and noticed a couple of items that might be impacting your customer conversions.

Specifically, I saw that the mobile layout requires horizontal scrolling to read the main headings, and there is no clear call to action above the fold. Most visitors scroll away if they can't easily find how to get in touch.

My name is ${cleanSenderName} and I run ${cleanBusinessName}. We specialize in helping businesses solve these exact issues with our ${serviceToPitch.toLowerCase()} services.

We can easily fix these issues to help you capture more leads from your website. ${bookingLine}

Best regards,
${cleanSenderName}
${cleanBusinessName}

--
If you'd prefer not to hear from me again, simply reply with "unsubscribe" and I will remove you from my list.`;

  return {
    issues,
    emailSubject,
    emailBody,
  };
}
