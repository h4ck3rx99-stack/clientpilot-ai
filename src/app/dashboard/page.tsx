import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const user = await requireUser();

  // Construct a simple user profile from direct User model fields
  const profile = {
    id: user.id,
    email: user.email,
    name: user.name,
    businessName: user.businessName,
    senderName: user.senderName,
    senderEmail: user.senderEmail,
    services: user.services,
    defaultCTA: user.defaultCTA,
    calendarLink: user.calendarLink,
  };

  // Retrieve accepted campaign leads
  const acceptedLeads = await prisma.lead.findMany({
    where: {
      userId: user.id,
      status: "ACCEPTED",
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Retrieve unreviewed discovered leads (card review deck)
  const discoveredLeads = await prisma.lead.findMany({
    where: {
      userId: user.id,
      status: "DISCOVERED",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Adapt database lead types to match React prop types
  const serializedAcceptedLeads = acceptedLeads.map(l => ({
    ...l,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  }));

  const serializedDiscoveredLeads = discoveredLeads.map(l => ({
    ...l,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  }));

  return (
    <DashboardClient
      profile={profile}
      initialAcceptedLeads={serializedAcceptedLeads}
      initialDiscoveredLeads={serializedDiscoveredLeads}
    />
  );
}
