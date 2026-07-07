import { NextRequest, NextResponse } from "next/server";
import { sendDraft, simulateSendDraft } from "@/lib/sending";
import { getEmailProvider } from "@/lib/email";
import { getSession } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: draftId } = await params;
  if (!draftId) {
    return NextResponse.json({ error: "draftId is required" }, { status: 400 });
  }

  const env = getEnv();
  const provider = getEmailProvider();

  if (env.EMAIL_MODE === "smtp") {
    const { confirmed } = await request.json();
    if (!confirmed) {
      return NextResponse.json({ error: "Confirmation required for real SMTP sending." }, { status: 400 });
    }
  }

  const result = provider.name === "simulation"
    ? await simulateSendDraft(session.userId, draftId)
    : await sendDraft(session.userId, draftId);

  return NextResponse.json(result, { status: 200 });
}
