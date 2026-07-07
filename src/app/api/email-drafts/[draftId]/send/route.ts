import { NextRequest, NextResponse } from "next/server";
import { sendDraft, simulateSendDraft } from "@/lib/sending";
import { getEmailProvider } from "@/lib/email";
import { getSession } from "@/lib/auth/session";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { draftId } = await params;
  if (!draftId) {
    return NextResponse.json({ error: "draftId is required" }, { status: 400 });
  }

  const provider = getEmailProvider();
  const result = provider.name === "simulation"
    ? await simulateSendDraft(session.userId, draftId)
    : await sendDraft(session.userId, draftId);

  return NextResponse.json(result, { status: 200 });
}
