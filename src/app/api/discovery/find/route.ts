import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { discover50Clients } from "@/lib/discovery-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { serviceToPitch, targetNiche, targetLocation } = body;

    if (!serviceToPitch || !targetNiche || !targetLocation) {
      return NextResponse.json(
        { error: "serviceToPitch, targetNiche, and targetLocation are required" },
        { status: 400 }
      );
    }

    // 1. Clean up old unreviewed "DISCOVERED" leads for this user to avoid polluting database with raw search data
    await prisma.lead.deleteMany({
      where: {
        userId: session.userId,
        status: "DISCOVERED",
      },
    });

    // 2. Discover exactly 50 clients using AI or fallback generator
    const clients = await discover50Clients(serviceToPitch, targetNiche, targetLocation);

    // 3. Save them to the database
    const savedLeads = await Promise.all(
      clients.map((c) =>
        prisma.lead.create({
          data: {
            userId: session.userId,
            companyName: c.companyName,
            website: c.website,
            email: c.email,
            phone: c.phone,
            location: c.location,
            industry: c.industry,
            serviceToPitch,
            targetNiche,
            targetLocation,
            status: "DISCOVERED",
            suitabilityAnalysis: c.suitabilityAnalysis,
            pipelineStatus: "NOT_CONTACTED",
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: savedLeads.length,
      leads: savedLeads,
    });
  } catch (error) {
    console.error("API discovery error:", error);
    return NextResponse.json(
      { error: "Internal server error during discovery" },
      { status: 500 }
    );
  }
}
