import { NextRequest, NextResponse } from "next/server";
import { sendDraft, simulateSendDraft } from "@/lib/sending";
import { getEmailProvider } from "@/lib/email";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  if (!draftId) {
    return NextResponse.json({ error: "draftId is required" }, { status: 400 });
  }

  const provider = getEmailProvider();
  const result = provider.name === "simulation"
    ? await simulateSendDraft(draftId)
    : await sendDraft(draftId);

  return NextResponse.json(result, { status: 200 });
}
