import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import InboxClient from "./inbox-client";

export default async function InboxPage() {
  const user = await requireUser();

  // Retrieve all leads for this user that have replies logged in the database
  const leadsWithReplies = await prisma.lead.findMany({
    where: {
      userId: user.id,
      replies: {
        some: {},
      },
    },
    include: {
      replies: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Retrieve all leads that have been contacted (emailStatus = SENT) to list in the simulator dropdown
  const sentLeads = await prisma.lead.findMany({
    where: {
      userId: user.id,
      status: "ACCEPTED",
    },
    select: {
      id: true,
      companyName: true,
      email: true,
    },
    orderBy: {
      companyName: "asc",
    },
  });

  // Adapt Date objects into strings for Next.js boundary transfer
  const serializedLeads = leadsWithReplies.map((lead) => ({
    id: lead.id,
    companyName: lead.companyName,
    website: lead.website,
    email: lead.email,
    phone: lead.phone,
    pipelineStatus: lead.pipelineStatus,
    emailSubject: lead.emailSubject,
    emailBody: lead.emailBody,
    replies: lead.replies.map((r) => ({
      id: r.id,
      leadId: r.leadId,
      body: r.body,
      category: r.category,
      createdAt: r.createdAt.toISOString(),
    })),
  }));

  const serializedSentLeads = sentLeads.map((l) => ({
    id: l.id,
    companyName: l.companyName,
    email: l.email,
  }));

  return (
    <InboxClient
      userEmail={user.email}
      initialLeadsWithReplies={serializedLeads}
      allSentLeads={serializedSentLeads}
    />
  );
}
