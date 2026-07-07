import { prisma } from "./prisma";

export type OnboardingState = {
  id: string;
  userId: string;
  profileCompleted: boolean;
  firstCampaignCreated: boolean;
  firstLeadsAdded: boolean;
  firstLeadsAnalyzed: boolean;
  firstDraftGenerated: boolean;
  firstDraftQueued: boolean;
  firstSendCompleted: boolean;
  dismissed: boolean;
};

const STEPS = [
  "profileCompleted",
  "firstCampaignCreated",
  "firstLeadsAdded",
  "firstLeadsAnalyzed",
  "firstDraftGenerated",
  "firstDraftQueued",
  "firstSendCompleted",
] as const;

export type OnboardingStep = (typeof STEPS)[number];

export const ONBOARDING_STEPS: OnboardingStep[] = [...STEPS];

export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  profileCompleted: "Complete your profile",
  firstCampaignCreated: "Create your first campaign",
  firstLeadsAdded: "Add or discover leads",
  firstLeadsAnalyzed: "Analyze leads",
  firstDraftGenerated: "Generate email drafts",
  firstDraftQueued: "Queue reviewed drafts",
  firstSendCompleted: "Send safely",
};

export function getCompletedCount(state: OnboardingState): number {
  return STEPS.filter((step) => state[step]).length;
}

export function isOnboardingComplete(state: OnboardingState): boolean {
  return STEPS.every((step) => state[step]);
}

export function getNextStep(state: OnboardingState): OnboardingStep | null {
  for (const step of STEPS) {
    if (!state[step]) return step;
  }
  return null;
}

export async function getOrCreateOnboardingState(
  userId: string
): Promise<OnboardingState> {
  const existing = await prisma.onboardingState.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  const state = await refreshOnboardingState(userId);
  return state;
}

export async function refreshOnboardingState(
  userId: string
): Promise<OnboardingState> {
  const [profile, campaignCount, leadCount, analyzedCount, draftCount, queuedCount, sendCount] =
    await Promise.all([
      prisma.userProfile.findFirst({
        where: { userId },
        select: {
          businessName: true,
          senderName: true,
          senderEmail: true,
          services: true,
          defaultCTA: true,
        },
      }),
      prisma.campaign.count({ where: { userId } }),
      prisma.lead.count({ where: { userId } }),
      prisma.lead.count({
        where: { userId, status: { in: ["ANALYZED", "REJECTED"] }, fitScore: { gt: 0 } },
      }),
      prisma.emailDraft.count({ where: { userId } }),
      prisma.emailDraft.count({ where: { userId, status: "QUEUED" } }),
      prisma.emailSendLog.count({ where: { userId, status: "SENT" } }),
    ]);

  const profileCompleted = !!(
    profile?.businessName &&
    profile?.senderName &&
    profile?.senderEmail &&
    profile?.services &&
    profile?.defaultCTA
  );

  const data = {
    profileCompleted,
    firstCampaignCreated: campaignCount > 0,
    firstLeadsAdded: leadCount > 0,
    firstLeadsAnalyzed: analyzedCount > 0,
    firstDraftGenerated: draftCount > 0,
    firstDraftQueued: queuedCount > 0,
    firstSendCompleted: sendCount > 0,
  };

  return prisma.onboardingState.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data },
  });
}

export async function dismissOnboarding(userId: string): Promise<void> {
  await prisma.onboardingState.upsert({
    where: { userId },
    create: { userId, dismissed: true },
    update: { dismissed: true },
  });
}
