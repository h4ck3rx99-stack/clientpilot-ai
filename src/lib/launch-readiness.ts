import { prisma } from "./prisma";
import { getEmailProviderStatus } from "./email";
import { getPublicEnvInfo } from "./env";

export type ReadinessItem = {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type LaunchReadiness = {
  account: ReadinessItem[];
  ai: ReadinessItem[];
  email: ReadinessItem[];
  campaign: ReadinessItem[];
  safety: ReadinessItem[];
  warnings: string[];
  blockers: string[];
  recommendedNextAction: string;
  overall: "ready" | "needs-work" | "blocked";
  blockerCount: number;
  warningCount: number;
};

export async function getLaunchReadiness(userId: string): Promise<LaunchReadiness> {
  const account: ReadinessItem[] = [];
  const ai: ReadinessItem[] = [];
  const email: ReadinessItem[] = [];
  const campaign: ReadinessItem[] = [];
  const safety: ReadinessItem[] = [];
  const warnings: string[] = [];
  const blockers: string[] = [];

  // --- Account ---
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  account.push({ label: "Logged in", status: user ? "pass" : "fail", detail: user ? `As ${user.email}` : "Not logged in" });

  const profile = await prisma.userProfile.findFirst({ where: { userId }, select: { businessName: true, senderName: true } });
  if (profile?.businessName && profile?.senderName) {
    account.push({ label: "Profile completed", status: "pass", detail: `${profile.businessName} / ${profile.senderName}` });
  } else {
    account.push({ label: "Profile completed", status: "fail", detail: "Business name and sender name required" });
    blockers.push("Complete your profile");
  }

  const backupCount = await prisma.campaign.count({ where: { userId } });
  account.push({ label: "Backup export available", status: backupCount > 0 ? "warn" : "pass", detail: "Export in Settings > Backup" });

  // --- AI ---
  const env = getPublicEnvInfo();
  const groqKeySet = !!process.env.GROQ_API_KEY;

  if (groqKeySet) {
    ai.push({ label: "Groq configured", status: "pass", detail: `Model: ${env.groqModel}` });
  } else {
    ai.push({ label: "Groq configured", status: "warn", detail: "Missing GROQ_API_KEY — local fallback will be used" });
    warnings.push("Groq API key missing, local fallback will be used");
  }

  ai.push({ label: "AI fallback available", status: "pass", detail: "Local rules always available" });
  ai.push({ label: "Bulk max leads per run", status: "pass", detail: `${env.bulkLeadLimit}` });
  ai.push({ label: "Bulk delay", status: "pass", detail: `${env.bulkDelay}ms` });

  // --- Email ---
  const emailStatus = getEmailProviderStatus();

  email.push({ label: "EMAIL_MODE", status: "pass", detail: emailStatus.mode });

  if (emailStatus.smtpConfigured) {
    email.push({ label: "SMTP configured", status: "pass", detail: `Host: ${emailStatus.smtpHost || "set"}` });
  } else {
    email.push({ label: "SMTP configured", status: emailStatus.mode === "smtp" ? "fail" : "warn", detail: emailStatus.mode === "smtp" ? "SMTP mode enabled but not configured" : "Not configured — simulation mode only" });
    if (emailStatus.mode === "smtp" && !emailStatus.smtpConfigured) {
      blockers.push("EMAIL_MODE is smtp but SMTP is not configured");
    }
  }

  const isLocalhost = (process.env.APP_URL || "").includes("localhost");
  if (isLocalhost && emailStatus.mode === "smtp") {
    email.push({ label: "APP_URL", status: "fail", detail: "localhost — unsubscribe links will not work publicly" });
    blockers.push("APP_URL is localhost but EMAIL_MODE is smtp");
  } else if (isLocalhost) {
    email.push({ label: "APP_URL", status: "warn", detail: "localhost — set APP_URL for production" });
    warnings.push("APP_URL is localhost, set to public URL before production");
  } else {
    email.push({ label: "APP_URL", status: "pass", detail: env.appUrl });
  }

  email.push({ label: "Unsubscribe page available", status: "pass", detail: "/unsubscribe/[token] is public" });

  const dailyLimit = parseInt(process.env.REAL_SEND_DAILY_LIMIT || "20", 10);
  email.push({ label: "Real send daily limit", status: dailyLimit > 50 ? "warn" : "pass", detail: String(dailyLimit) });
  if (dailyLimit > 50) warnings.push("Real send daily limit is above 50");

  const batchLimit = parseInt(process.env.REAL_SEND_BATCH_LIMIT || "10", 10);
  email.push({ label: "Batch limit", status: "pass", detail: String(batchLimit) });

  // --- Campaign ---
  const campaignCount = await prisma.campaign.count({ where: { userId } });
  let leadCount = 0;
  let analyzedCount = 0;
  let draftCount = 0;
  let queuedCount = 0;

  if (campaignCount > 0) {
    campaign.push({ label: "At least one campaign exists", status: "pass", detail: `${campaignCount} campaign(s)` });

    const activeCount = await prisma.campaign.count({ where: { userId, status: "ACTIVE" } });
    campaign.push({ label: "Campaign ACTIVE", status: activeCount > 0 ? "pass" : "warn", detail: activeCount > 0 ? `${activeCount} active` : "No active campaigns" });
    if (activeCount === 0) warnings.push("No campaign is set to ACTIVE status");

    leadCount = await prisma.lead.count({ where: { userId } });
    campaign.push({ label: "Campaign has leads", status: leadCount > 0 ? "pass" : "fail", detail: `${leadCount} leads` });
    if (leadCount === 0) blockers.push("Add leads to a campaign");

    analyzedCount = await prisma.lead.count({ where: { userId, status: { in: ["ANALYZED", "REJECTED"] } } });
    campaign.push({ label: "Campaign has analyzed leads", status: analyzedCount > 0 ? "pass" : "warn", detail: `${analyzedCount} analyzed` });
    if (analyzedCount === 0 && leadCount > 0) warnings.push("Leads exist but none analyzed yet");

    draftCount = await prisma.emailDraft.count({ where: { userId } });
    campaign.push({ label: "Campaign has drafts", status: draftCount > 0 ? "pass" : "warn", detail: `${draftCount} drafts` });

    queuedCount = await prisma.emailDraft.count({ where: { userId, status: "QUEUED" } });
    campaign.push({ label: "Campaign has queued drafts", status: queuedCount > 0 ? "pass" : "warn", detail: `${queuedCount} queued` });
  } else {
    campaign.push({ label: "At least one campaign exists", status: "fail", detail: "No campaigns" });
    blockers.push("Create a campaign");
  }

  // --- Safety ---
  safety.push({ label: "Review queue enabled", status: "pass", detail: "Drafts default to DRAFT status, must be manually queued" });
  safety.push({ label: "Daily limits enabled", status: "pass", detail: `Daily limit: ${dailyLimit}, batch: ${batchLimit}` });
  safety.push({ label: "Unsubscribe enabled", status: "pass", detail: "Manual unsubscribe + token-based public unsubscribe" });

  const hasSourceUrlLeads = await prisma.lead.count({ where: { userId, sourceUrl: { not: null } } });
  safety.push({ label: "Source URL required", status: hasSourceUrlLeads > 0 ? "pass" : "warn", detail: "Source URLs help compliance" });

  const hasSimulatedSend = await prisma.emailSendLog.count({ where: { userId, simulated: true } });
  safety.push({ label: "Simulated send completed", status: hasSimulatedSend > 0 ? "pass" : "warn", detail: hasSimulatedSend > 0 ? "Yes" : "Run a simulated send first" });
  if (hasSimulatedSend === 0) warnings.push("No simulated send completed yet");

  const hasTestEmail = await prisma.testEmailLog.count({ where: { userId } });
  safety.push({ label: "Test email sent", status: hasTestEmail > 0 ? "pass" : "warn", detail: hasTestEmail > 0 ? "Yes" : "Send a test email first" });

  // --- Overall ---
  const allItems = [...account, ...ai, ...email, ...campaign, ...safety];
  const fails = allItems.filter((i) => i.status === "fail").length;
  const warns = allItems.filter((i) => i.status === "warn").length;

  let overall: "ready" | "needs-work" | "blocked";
  let recommendedNextAction: string;
  const leadCt = leadCount ?? 0;
  const analyzedCt = analyzedCount ?? 0;
  const draftCt = draftCount ?? 0;
  const queuedCt = queuedCount ?? 0;

  if (fails > 0) {
    overall = "blocked";
    recommendedNextAction = blockers[0] || "Fix blockers before launching";
  } else if (warns > 0) {
    overall = "needs-work";
    if (campaignCount === 0) recommendedNextAction = "Create a campaign";
    else if (leadCt === 0) recommendedNextAction = "Add leads";
    else if (analyzedCt === 0) recommendedNextAction = "Analyze leads";
    else if (draftCt === 0) recommendedNextAction = "Generate drafts";
    else if (queuedCt === 0) recommendedNextAction = "Queue drafts for sending";
    else if (hasSimulatedSend === 0) recommendedNextAction = "Run a simulated send";
    else if (hasTestEmail === 0) recommendedNextAction = "Send a test email";
    else recommendedNextAction = "Review warnings before sending real emails";
  } else {
    overall = "ready";
    recommendedNextAction = "You are ready for personal outreach. Start with 3-5 real emails per day.";
  }

  return {
    account, ai, email, campaign, safety,
    warnings, blockers,
    recommendedNextAction,
    overall,
    blockerCount: fails,
    warningCount: warns,
  };
}
