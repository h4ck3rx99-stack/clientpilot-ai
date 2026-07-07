import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const leads = await prisma.lead.findMany({
      where: { campaignId: id, userId: user.id },
      orderBy: { pipelineStatus: "asc" },
    });

    const escape = (v: unknown): string => {
      if (v === null || v === undefined) return '""';
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    };

    const header = "companyName,email,pipelineStatus,fitScore,lastContactedAt,repliedAt,nextFollowUpAt,notes";
    const rows = leads.map(l =>
      [l.companyName, l.email || "", l.pipelineStatus, l.fitScore, l.lastContactedAt?.toISOString() || "", l.repliedAt?.toISOString() || "", l.nextFollowUpAt?.toISOString() || "", l.notes].map(escape).join(",")
    );

    const csv = [header, ...rows].join("\n");
    const filename = `pipeline-${campaign.name.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}
