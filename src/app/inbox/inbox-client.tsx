"use client";

import { useState } from "react";
import AppShell from "@/components/app-shell";

type Reply = {
  id: string;
  leadId: string;
  body: string;
  category: string;
  createdAt: string;
};

type Lead = {
  id: string;
  companyName: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  pipelineStatus: string;
  emailSubject: string | null;
  emailBody: string | null;
  replies: Reply[];
};

type InboxClientProps = {
  userEmail: string;
  initialLeadsWithReplies: Lead[];
  allSentLeads: { id: string; companyName: string; email: string | null }[];
};

export default function InboxClient({
  userEmail,
  initialLeadsWithReplies,
  allSentLeads,
}: InboxClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeadsWithReplies);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(
    initialLeadsWithReplies.length > 0 ? initialLeadsWithReplies[0] : null
  );

  // Simulation state
  const [simulatingCategory, setSimulatingCategory] = useState("interested");
  const [simulatingLeadId, setSimulatingLeadId] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  // Action Required response state
  const [meetingNote, setMeetingNote] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  // Global alerts
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Tabs for Inbox filtering
  // "action_required" (interested, pricing, more_info) | "follow_up" | "archived" (not_interested, unsubscribe) | "all"
  const [inboxTab, setInboxTab] = useState<"action_required" | "follow_up" | "archived" | "all">(
    "action_required"
  );

  // Filter leads based on replies and pipelineStatus
  const filteredLeads = leads.filter((lead) => {
    const latestReply = lead.replies[0];
    if (!latestReply) return false;

    if (inboxTab === "action_required") {
      return ["interested", "asking_pricing", "more_info"].includes(latestReply.category);
    }
    if (inboxTab === "follow_up") {
      return latestReply.category === "follow_up_later";
    }
    if (inboxTab === "archived") {
      return ["not_interested", "unsubscribe", "auto_reply"].includes(latestReply.category);
    }
    return true; // "all"
  });

  // Get human readable category badge
  function getCategoryBadge(cat: string) {
    const styles: Record<string, string> = {
      interested: "bg-emerald-950 text-emerald-400 border-emerald-900/50",
      asking_pricing: "bg-indigo-950 text-indigo-400 border-indigo-900/50",
      more_info: "bg-blue-950 text-blue-400 border-blue-900/50",
      not_interested: "bg-zinc-900 text-zinc-400 border-zinc-800",
      follow_up_later: "bg-amber-950 text-amber-400 border-amber-900/50",
      auto_reply: "bg-zinc-950 text-zinc-500 border-zinc-900",
      unsubscribe: "bg-rose-950 text-rose-400 border-rose-900/50",
    };

    const labels: Record<string, string> = {
      interested: "Interested",
      asking_pricing: "Pricing Ask",
      more_info: "More Info",
      not_interested: "No Thanks",
      follow_up_later: "Follow Up Later",
      auto_reply: "Auto Reply",
      unsubscribe: "Unsubscribed",
    };

    return (
      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${styles[cat] || styles.more_info}`}>
        {labels[cat] || cat}
      </span>
    );
  }

  // Trigger Inbox Reply Simulation
  async function handleSimulateReply() {
    setIsSimulating(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/replies/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: simulatingLeadId || undefined,
          category: simulatingCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Simulation failed");
      } else {
        setSuccessMsg(`Simulated reply received from "${data.leadName}" classified as "${data.category}"!`);
        
        // Refresh Inbox data
        const refreshRes = await fetch("/api/replies");
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setLeads(freshData);
          // Auto select the new/updated lead
          const matched = freshData.find((l: Lead) => l.id === data.leadId);
          if (matched) {
            setSelectedLead(matched);
          }
        }
      }
    } catch {
      setErrorMsg("Network error simulating reply.");
    } finally {
      setIsSimulating(false);
    }
  }

  // Book sales call / update meeting details
  async function handleBookMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead) return;
    setIsBooking(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineStatus: "MEETING_BOOKED",
          // Append meeting note to notes/details
          phone: selectedLead.phone, // unchanged
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update pipeline stage");
      } else {
        setSuccessMsg(`Sales Call booked for "${selectedLead.companyName}"! Moved to Meeting Booked.`);
        // Update local lead status
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, pipelineStatus: "MEETING_BOOKED" } : l))
        );
        setSelectedLead((prev) => prev ? { ...prev, pipelineStatus: "MEETING_BOOKED" } : null);
        setMeetingNote("");
      }
    } catch {
      setErrorMsg("Network error booking call.");
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <AppShell activePage="/inbox" email={userEmail}>
      
      {/* Notifications */}
      {errorMsg && (
        <div className="rounded-lg border border-rose-800/30 bg-rose-950/20 p-4 mb-6 transition-all duration-300">
          <p className="text-xs text-rose-400">{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-800/30 bg-emerald-950/20 p-4 mb-6 transition-all duration-300">
          <p className="text-xs text-emerald-400">{successMsg}</p>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-1">Inbox</h1>
      <p className="text-sm text-zinc-500 mb-6">Review warm replies, automatic categorization, and book sales calls.</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Inbox Left Sidebar: Threads and Filter Tabs */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Inbox Filter Tabs */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-1 flex flex-col gap-0.5">
            <button
              onClick={() => setInboxTab("action_required")}
              className={`w-full text-left py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex justify-between items-center ${
                inboxTab === "action_required" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>Action Required</span>
              <span className="bg-indigo-950 text-indigo-400 border border-indigo-900/50 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {leads.filter((l) => ["interested", "asking_pricing", "more_info"].includes(l.replies[0]?.category)).length}
              </span>
            </button>
            <button
              onClick={() => setInboxTab("follow_up")}
              className={`w-full text-left py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex justify-between items-center ${
                inboxTab === "follow_up" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>Follow Up Later</span>
              <span className="bg-amber-950 text-amber-400 border border-amber-900/50 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {leads.filter((l) => l.replies[0]?.category === "follow_up_later").length}
              </span>
            </button>
            <button
              onClick={() => setInboxTab("archived")}
              className={`w-full text-left py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex justify-between items-center ${
                inboxTab === "archived" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>Declined / Unsubscribed</span>
              <span className="bg-zinc-900 text-zinc-400 border border-zinc-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {leads.filter((l) => ["not_interested", "unsubscribe", "auto_reply"].includes(l.replies[0]?.category)).length}
              </span>
            </button>
            <button
              onClick={() => setInboxTab("all")}
              className={`w-full text-left py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex justify-between items-center ${
                inboxTab === "all" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>All Threads</span>
              <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {leads.length}
              </span>
            </button>
          </div>

          {/* List of filtered threads */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 space-y-2 max-h-[400px] overflow-y-auto">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block px-1">Threads</span>
            
            {filteredLeads.length === 0 ? (
              <p className="text-xs text-zinc-500 p-2 text-center">No replies in this category.</p>
            ) : (
              <div className="space-y-1">
                {filteredLeads.map((lead) => {
                  const latestReply = lead.replies[0];
                  return (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-colors flex flex-col gap-1 ${
                        selectedLead?.id === lead.id
                          ? "bg-zinc-800 border-indigo-500/50"
                          : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800/40"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-white truncate max-w-[110px]">{lead.companyName}</span>
                        {latestReply && getCategoryBadge(latestReply.category)}
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {latestReply ? latestReply.body : "No message"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Inbox Center Content & Call Booker Workspace (2/4 width) */}
        <div className="lg:col-span-2 space-y-4">
          {selectedLead ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-6">
              
              {/* Lead detail headers */}
              <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedLead.companyName}</h2>
                  <p className="text-xs text-zinc-500 mt-1">{selectedLead.email} &middot; {selectedLead.phone || "No Phone"}</p>
                </div>
                {selectedLead.website && (
                  <a
                    href={selectedLead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium truncate max-w-[150px]"
                  >
                    {selectedLead.website.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                )}
              </div>

              {/* Message thread panel */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                
                {/* 1. Outgoing Outreach Email */}
                {selectedLead.emailBody && (
                  <div className="bg-zinc-950/20 border border-zinc-800/60 rounded-lg p-4 space-y-2 text-xs max-w-[90%] mr-auto">
                    <div className="flex items-center justify-between text-[9px] text-zinc-500">
                      <span>OUTGOING OUTREACH</span>
                      <span>To: {selectedLead.email}</span>
                    </div>
                    <strong className="block text-zinc-300 font-semibold">{selectedLead.emailSubject}</strong>
                    <p className="text-zinc-400 whitespace-pre-wrap leading-relaxed mt-1 font-mono text-[10px]">{selectedLead.emailBody}</p>
                  </div>
                )}

                {/* 2. Received Replies */}
                {selectedLead.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="bg-indigo-950/15 border border-indigo-900/20 rounded-lg p-4 space-y-2 text-xs max-w-[90%] ml-auto"
                  >
                    <div className="flex items-center justify-between text-[9px] text-indigo-400 font-medium">
                      <span>INCOMING REPLY &middot; {getCategoryBadge(reply.category)}</span>
                      <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed mt-1">{reply.body}</p>
                  </div>
                ))}

              </div>

              {/* Action Required: Meeting Link or suggest slots */}
              {selectedLead.pipelineStatus !== "MEETING_BOOKED" ? (
                <div className="border-t border-zinc-800/80 pt-4 space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Book Sales Call</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Send a booking link or coordinate availability slots.</p>
                  </div>
                  
                  <form onSubmit={handleBookMeeting} className="space-y-3">
                    <div>
                      <label className="block text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Time Slots / Suggested Slots Note</label>
                      <textarea
                        rows={2}
                        value={meetingNote}
                        onChange={(e) => setMeetingNote(e.target.value)}
                        placeholder="e.g. Free Thursday at 2 PM or Friday at 10 AM. Or schedule using this link."
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isBooking}
                      className="w-full h-10 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-xs font-semibold text-white disabled:opacity-40 transition-colors flex items-center justify-center"
                    >
                      {isBooking ? "Scheduling Call..." : "Confirm & Mark Call as Booked"}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="border-t border-zinc-800/80 pt-4">
                  <div className="rounded-lg bg-emerald-950/20 border border-emerald-900/30 p-4 text-center">
                    <p className="text-xs text-emerald-400 font-semibold">Sales Meeting Booked!</p>
                    <p className="text-[10px] text-zinc-500 mt-1">This lead has successfully transitioned from discovery to booked consultation call.</p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-12 text-center">
              <p className="text-xs text-zinc-500">Select a message thread from the sidebar list to view email history and manage responses.</p>
            </div>
          )}
        </div>

        {/* Inbox Right Sidebar: Developer Reply Simulator (1/4 width) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Inbox Simulator</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Test classification & pipeline rules.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Pick Recipient Lead</label>
                <select
                  value={simulatingLeadId}
                  onChange={(e) => setSimulatingLeadId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Random Contacted Lead --</option>
                  {allSentLeads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.companyName} ({l.email ? l.email.slice(0, 15) + "..." : "No Email"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Response Type</label>
                <select
                  value={simulatingCategory}
                  onChange={(e) => setSimulatingCategory(e.target.value)}
                  className="w-full h-9 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="interested">Interested (Wants meeting)</option>
                  <option value="asking_pricing">Asking Pricing (Cost inquiry)</option>
                  <option value="more_info">More Info (Requesting details)</option>
                  <option value="not_interested">Not Interested (Polite reject)</option>
                  <option value="follow_up_later">Follow Up Later (Busy now)</option>
                  <option value="auto_reply">Auto Reply (Out of office)</option>
                  <option value="unsubscribe">Unsubscribe (Opt out demand)</option>
                </select>
              </div>

              <button
                onClick={handleSimulateReply}
                disabled={isSimulating}
                className="w-full h-9 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white disabled:opacity-40 transition-colors flex items-center justify-center"
              >
                {isSimulating ? "Simulating reply..." : "Simulate Incoming Reply"}
              </button>

              <p className="text-[9px] text-zinc-600 leading-relaxed">
                Clicking this will simulate receiving an email from the client, classify it using the AI provider, record the thread, and update their pipeline card.
              </p>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
