import { NextRequest, NextResponse } from "next/server";
import { createLead, parseCsvText, validateCsvHeaders, csvRowToInput } from "@/lib/leads";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, csvText } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId is required" },
        { status: 400 }
      );
    }

    if (!csvText?.trim()) {
      return NextResponse.json(
        { error: "CSV text is required" },
        { status: 400 }
      );
    }

    const { headers, rows } = parseCsvText(csvText);
    const headerCheck = validateCsvHeaders(headers);

    if (!headerCheck.valid) {
      return NextResponse.json(
        {
          error: `Missing required CSV columns: ${headerCheck.missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const imported: number[] = [];
    const skipped: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const result = csvRowToInput(headers, rows[i]);
      if (result.error) {
        skipped.push({ row: i + 2, reason: result.error });
        continue;
      }
      if (result.data) {
        await createLead(campaignId, {
          companyName: result.data.companyName,
          website: result.data.website,
          email: result.data.email,
          sourceUrl: result.data.sourceUrl,
          industry: result.data.industry,
          fitScore: 0,
          status: "NEW",
        });
        imported.push(i + 2);
      }
    }

    return NextResponse.json({
      imported: imported.length,
      skipped,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
