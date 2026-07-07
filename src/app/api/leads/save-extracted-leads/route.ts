import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLead } from "@/lib/leads";
import { createLeadActivity } from "@/lib/lead-activity";
import { findDuplicateLeadByEmail, validateExtractedLead } from "@/lib/lead-discovery";
import type { ExtractedLead } from "@/lib/lead-discovery";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const { campaignId, leads } = body as {
      campaignId: string;
      leads: ExtractedLead[];
    };

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads to save" }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.userId !== session.userId) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const saved: ExtractedLead[] = [];
    const skipped: { lead: ExtractedLead; reason: string }[] = [];

    for (const lead of leads) {
      const validation = validateExtractedLead(lead);
      if (!validation.valid) {
        skipped.push({ lead, reason: validation.errors.join("; ") });
        continue;
      }

      const isDuplicate = await findDuplicateLeadByEmail(campaignId, lead.email);
      if (isDuplicate) {
        skipped.push({ lead, reason: "Duplicate email in this campaign" });
        continue;
      }

      const created = await createLead(session.userId, campaignId, {
        companyName: lead.companyName,
        website: lead.website,
        email: lead.email,
        sourceUrl: lead.sourceUrl,
        industry: lead.industry || campaign.targetNiche,
        fitScore: 0,
        status: "NEW",
        discoverySource: "pasted_source",
        extractionConfidence: lead.confidence,
        extractionNotes: lead.notes,
      });

      try {
        await createLeadActivity(session.userId, {
          leadId: created.id,
          campaignId,
          type: "LEAD_DISCOVERED",
          message: "Lead imported from pasted source.",
        });
      } catch {
        // activity logging is non-critical
      }

      saved.push(lead);
    }

    return NextResponse.json({
      saved: saved.length,
      skipped: skipped.length,
      skippedDetails: skipped,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
