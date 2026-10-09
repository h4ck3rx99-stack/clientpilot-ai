"use client";

import { useState } from "react";
import AppShell from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  businessName: string | null;
  senderName: string | null;
  senderEmail: string | null;
  services: string | null;
  defaultCTA: string | null;
  calendarLink: string | null;
};

type Lead = {
  id: string;
  companyName: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  industry: string | null;
  serviceToPitch: string;
  targetNiche: string;
  targetLocation: string;
  status: string;
  suitabilityAnalysis: string | null;
  websiteAudit: string | null; // JSON string
  emailSubject: string | null;
  emailBody: string | null;
  emailStatus: string;
  pipelineStatus: string;
  createdAt: Date;
  updatedAt: Date;
};

type DashboardClientProps = {
  profile: Profile;
  initialAcceptedLeads: Lead[];
  initialDiscoveredLeads: Lead[];
};

export default function DashboardClient({
  profile,
  initialAcceptedLeads,
  initialDiscoveredLeads,
}: DashboardClientProps) {
  // Navigation tabs: "discover" | "outreach" | "pipeline"
  const [activeTab, setActiveTab] = useState<"discover" | "outreach" | "pipeline">("discover");

  // Pitch Config & Discovery state
  const [services, setServices] = useState(profile.services || "Web Design and SEO");
  const [niche, setNiche] = useState("Dentists");
  const [location, setLocation] = useState("Austin, TX");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<Lead[]>(initialDiscoveredLeads);
  const [deckIndex, setDeckIndex] = useState(0);

  // Profile setup settings inline state
  const [businessName, setBusinessName] = useState(profile.businessName || "");
  const [senderName, setSenderName] = useState(profile.senderName || profile.name || "");
  const [senderEmail, setSenderEmail] = useState(profile.senderEmail || profile.email || "");
  const [defaultCTA, setDefaultCTA] = useState(profile.defaultCTA || "Would you be open to a quick 10-minute call?");
  const [calendarLink, setCalendarLink] = useState(profile.calendarLink || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // Outreach Queue state
  const [acceptedLeads, setAcceptedLeads] = useState<Lead[]>(initialAcceptedLeads);
  const [selectedQueueLead, setSelectedQueueLead] = useState<Lead | null>(
    initialAcceptedLeads.length > 0 ? initialAcceptedLeads[0] : null
  );
  const [editingSubject, setEditingSubject] = useState("");
  const [editingBody, setEditingBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Global UI notifications
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const needsProfileSetup = !profile.businessName || !profile.services;

  // Handle Profile Update
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSuccessMsg("");
    setErrorMsg("");
    setIsSavingProfile(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          senderName,
          senderEmail,
          services,
          defaultCTA,
          calendarLink,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.errors?.join(", ") || "Failed to update profile");
      } else {
        setProfileSuccessMsg("Profile branding updated successfully!");
        // Refresh profile settings in place
        profile.businessName = businessName;
        profile.services = services;
        profile.senderName = senderName;
        profile.senderEmail = senderEmail;
        profile.defaultCTA = defaultCTA;
        profile.calendarLink = calendarLink;
      }
    } catch {
      setErrorMsg("Network error saving profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Handle Find 50 Clients
  async function handleFindClients() {
    setErrorMsg("");
    setInfoMsg("");
    setIsDiscovering(true);
    setDeckIndex(0);

    try {
      const res = await fetch("/api/discovery/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceToPitch: services,
          targetNiche: niche,
          targetLocation: location,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to find potential clients");
      } else {
        setDiscoveredLeads(data.leads || []);
        setInfoMsg(`Successfully discovered ${data.count || 0} B2B leads for review!`);
      }
    } catch {
      setErrorMsg("Network error during discovery search.");
    } finally {
      setIsDiscovering(false);
    }
  }

  // Accept a client from deck
  async function handleAcceptLead(lead: Lead) {
    // Add temporary loading state in deck UI
    setInfoMsg("Auditing website and generating draft...");

    try {
      const res = await fetch(`/api/leads/${lead.id}/accept`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to accept lead");
      } else {
        const updatedLead = data.lead;
        // Add to accepted leads state
        setAcceptedLeads((prev) => [updatedLead, ...prev]);
        if (!selectedQueueLead) {
          setSelectedQueueLead(updatedLead);
          setEditingSubject(updatedLead.emailSubject || "");
          setEditingBody(updatedLead.emailBody || "");
        }
        setInfoMsg(`Accepted "${lead.companyName}"! Added to outreach queue.`);
        
        // Remove from deck index
        setDeckIndex((prev) => prev + 1);
      }
    } catch {
      setErrorMsg("Network error accepting lead.");
    }
  }

  // Decline a client from deck
  async function handleDeclineLead(lead: Lead) {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setErrorMsg("Failed to remove declined lead.");
      } else {
        setInfoMsg(`Removed "${lead.companyName}" from discovery.`);
        setDeckIndex((prev) => prev + 1);
      }
    } catch {
      setErrorMsg("Network error declining lead.");
    }
  }

  // Open lead details in outreach queue
  function handleSelectQueueLead(lead: Lead) {
    setSelectedQueueLead(lead);
    setEditingSubject(lead.emailSubject || "");
    setEditingBody(lead.emailBody || "");
    setErrorMsg("");
    setInfoMsg("");
  }

  // Save changes to email draft
  async function handleSaveDraft() {
    if (!selectedQueueLead) return;
    setIsSavingDraft(true);
    setErrorMsg("");
    setProfileSuccessMsg("");

    try {
      const res = await fetch(`/api/leads/${selectedQueueLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailSubject: editingSubject,
          emailBody: editingBody,
          emailStatus: "DRAFT",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to save draft");
      } else {
        // Update local state
        setAcceptedLeads((prev) =>
          prev.map((l) => (l.id === selectedQueueLead.id ? data.lead : l))
        );
        setSelectedQueueLead(data.lead);
        setInfoMsg("Outreach email draft saved successfully.");
      }
    } catch {
      setErrorMsg("Network error saving draft.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  // Approve and queue email
  async function handleQueueEmail() {
    if (!selectedQueueLead) return;
    setErrorMsg("");

    try {
      const res = await fetch(`/api/leads/${selectedQueueLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailSubject: editingSubject,
          emailBody: editingBody,
          emailStatus: "QUEUED",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to queue email");
      } else {
        setAcceptedLeads((prev) =>
          prev.map((l) => (l.id === selectedQueueLead.id ? data.lead : l))
        );
        setSelectedQueueLead(data.lead);
        setInfoMsg("Outreach email approved and QUEUED for sending!");
      }
    } catch {
      setErrorMsg("Network error queueing email.");
    }
  }

  // Send email immediately
  async function handleSendEmail() {
    if (!selectedQueueLead) return;
    setIsSending(true);
    setErrorMsg("");

    try {
      // First save current edits
      await fetch(`/api/leads/${selectedQueueLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailSubject: editingSubject,
          emailBody: editingBody,
        }),
      });

      const res = await fetch(`/api/leads/${selectedQueueLead.id}/send`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to send email");
      } else {
        setAcceptedLeads((prev) =>
          prev.map((l) => (l.id === selectedQueueLead.id ? data.lead : l))
        );
        setSelectedQueueLead(data.lead);
        setInfoMsg(
          data.mode === "smtp"
            ? "Outreach email sent successfully via SMTP!"
            : "Outreach email simulated successfully (Simulation Mode)!"
        );
      }
    } catch {
      setErrorMsg("Network error sending email.");
    } finally {
      setIsSending(false);
    }
  }

  // Refresh website audit
  async function handleRefreshAudit() {
    if (!selectedQueueLead) return;
    setErrorMsg("");
    setInfoMsg("Re-auditing website presence...");

    try {
      const res = await fetch(`/api/leads/${selectedQueueLead.id}/audit`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to refresh audit");
      } else {
        setAcceptedLeads((prev) =>
          prev.map((l) => (l.id === selectedQueueLead.id ? data.lead : l))
        );
        setSelectedQueueLead(data.lead);
        setEditingSubject(data.lead.emailSubject || "");
        setEditingBody(data.lead.emailBody || "");
        setInfoMsg("Website re-audited and email draft updated!");
      }
    } catch {
      setErrorMsg("Network error running website audit.");
    }
  }

  const currentDeckLead = deckIndex < discoveredLeads.length ? discoveredLeads[deckIndex] : null;

  return (
    <AppShell activePage="/dashboard" email={profile.email}>
      {/* Global Alerts */}
      {errorMsg && (
        <div className="rounded-lg border border-rose-800/30 bg-rose-950/20 p-4 mb-6 transition-all duration-300">
          <p className="text-xs text-rose-400">{errorMsg}</p>
        </div>
      )}
      {infoMsg && (
        <div className="rounded-lg border border-indigo-800/30 bg-indigo-950/20 p-4 mb-6 transition-all duration-300">
          <p className="text-xs text-indigo-400">{infoMsg}</p>
        </div>
      )}

      {/* Profile Setup Warning Banner */}
      {needsProfileSetup && (
        <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-amber-300">Complete Profile Branding</h4>
            <p className="text-xs text-zinc-500 mt-1">Configure your agency details and pitch settings so ClientPilot can write authentic emails.</p>
          </div>
          <button
            onClick={() => {
              // Open discovery configurations or tab
              document.getElementById("profile-setup-sidebar")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-amber-600 px-4 text-xs font-semibold text-white hover:bg-amber-500 transition-colors shrink-0"
          >
            Configure Profile
          </button>
        </div>
      )}

      {/* Main Grid: Left Workspace & Right Profile sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Workspace Column (3/4 width) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Glassmorphic Stepper Header */}
          <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/60 p-1">
            <button
              onClick={() => setActiveTab("discover")}
              className={`flex-1 py-3 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === "discover"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              1. Discover & Review
            </button>
            <button
              onClick={() => setActiveTab("outreach")}
              className={`flex-1 py-3 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === "outreach"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              2. Outreach Queue ({acceptedLeads.length})
            </button>
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`flex-1 py-3 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === "pipeline"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              3. Pipeline Board
            </button>
          </div>

          {/* TAB 1: DISCOVER AND REVIEW */}
          {activeTab === "discover" && (
            <div className="space-y-6">
              
              {/* Pitch Configurator & Lead Finder */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Discovery Parameters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Service We Offer</label>
                    <input
                      type="text"
                      value={services}
                      onChange={(e) => setServices(e.target.value)}
                      placeholder="e.g. Website Optimization & Design"
                      className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Target Niche / Industry</label>
                    <input
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g. Gyms, Dental Clinics"
                      className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Austin, TX"
                      className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleFindClients}
                  disabled={isDiscovering}
                  className="w-full h-10 rounded-lg bg-indigo-500 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  {isDiscovering ? "Searching Directories..." : "Find 50 Potential Clients"}
                </button>
              </div>

              {/* Loader Card */}
              {isDiscovering && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-12 text-center flex flex-col items-center justify-center">
                  <div className="size-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
                  <p className="text-xs text-white font-medium">Scanning B2B Directories & Maps</p>
                  <p className="text-[10px] text-zinc-500 mt-1 max-w-xs">ClientPilot is generating 50 targeted prospects in {location} with website profiles and AI suitability parameters...</p>
                </div>
              )}

              {/* Review Deck Container */}
              {!isDiscovering && discoveredLeads.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Discovery Deck ({deckIndex} reviewed / {discoveredLeads.length} total)
                    </h3>
                    {currentDeckLead && (
                      <span className="text-[10px] text-zinc-500">
                        Lead {deckIndex + 1} of {discoveredLeads.length}
                      </span>
                    )}
                  </div>

                  {currentDeckLead ? (
                    <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-2xl backdrop-blur-md transition-all duration-300">
                      
                      {/* Card Header info */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-950/50 border border-indigo-800/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {currentDeckLead.industry || niche}
                          </span>
                          <h2 className="text-xl font-bold text-white mt-2">{currentDeckLead.companyName}</h2>
                          <p className="text-xs text-zinc-500 mt-1">{currentDeckLead.location}</p>
                        </div>
                        {currentDeckLead.website && (
                          <a
                            href={currentDeckLead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium truncate max-w-[150px]"
                          >
                            {currentDeckLead.website.replace(/^https?:\/\/(www\.)?/, "")}
                          </a>
                        )}
                      </div>

                      {/* Contact details */}
                      <div className="border-t border-zinc-800/60 py-3 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Email Address</span>
                          <span className="text-zinc-300 font-mono mt-0.5 block">{currentDeckLead.email || "—"}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Phone Number</span>
                          <span className="text-zinc-300 font-mono mt-0.5 block">{currentDeckLead.phone || "—"}</span>
                        </div>
                      </div>

                      {/* AI Suitability Explanation */}
                      <div className="border-t border-zinc-800/60 pt-4 mt-1">
                        <span className="text-zinc-500 block text-[9px] uppercase tracking-wider mb-1.5">AI Suitability Analysis</span>
                        <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-lg p-3 text-xs text-zinc-300 leading-relaxed">
                          {currentDeckLead.suitabilityAnalysis || "This client fits your parameters and might benefit from digital audits."}
                        </div>
                      </div>

                      {/* Decline/Accept Deck Action Bar */}
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <button
                          onClick={() => handleDeclineLead(currentDeckLead)}
                          className="h-11 rounded-lg border border-rose-800 bg-rose-950/20 text-rose-400 text-xs font-semibold hover:bg-rose-950/40 transition-colors"
                        >
                          Decline & Remove
                        </button>
                        <button
                          onClick={() => handleAcceptLead(currentDeckLead)}
                          className="h-11 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-400 transition-colors"
                        >
                          Accept & Analyze Website
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-12 text-center">
                      <p className="text-xs text-zinc-500">You have reviewed all discovered leads. Click "Find 50 Potential Clients" to discover more!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Empty Deck placeholder */}
              {!isDiscovering && discoveredLeads.length === 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-12 text-center">
                  <p className="text-xs text-zinc-500">No leads in deck. Fill in the parameters above and search to populate client cards.</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: OUTREACH QUEUE */}
          {activeTab === "outreach" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Queue List (1/3 width) */}
              <div className="md:col-span-1 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3 max-h-[600px] overflow-y-auto">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">Outreach Queue</h3>
                {acceptedLeads.length === 0 ? (
                  <p className="text-xs text-zinc-500 p-2">No accepted leads yet. Swipe/accept clients from Tab 1.</p>
                ) : (
                  <div className="space-y-1.5">
                    {acceptedLeads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => handleSelectQueueLead(lead)}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-colors flex flex-col gap-1 ${
                          selectedQueueLead?.id === lead.id
                            ? "bg-zinc-800 border-indigo-500/50"
                            : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold text-white truncate max-w-[120px]">{lead.companyName}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                            lead.emailStatus === "SENT"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-900/50"
                              : lead.emailStatus === "QUEUED"
                              ? "bg-blue-950 text-blue-400 border border-blue-900/50"
                              : "bg-yellow-950/50 text-yellow-400 border border-yellow-900/30"
                          }`}>
                            {lead.emailStatus}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 truncate">{lead.website || lead.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Workspace workspace (2/3 width) */}
              <div className="md:col-span-2 space-y-4">
                {selectedQueueLead ? (
                  <div className="space-y-4">
                    
                    {/* Header info */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{selectedQueueLead.companyName}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">{selectedQueueLead.website}</span>
                      </div>
                      <button
                        onClick={handleRefreshAudit}
                        className="h-8 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-[10px] font-medium hover:bg-zinc-700 transition-colors"
                      >
                        Re-Audit Website
                      </button>
                    </div>

                    {/* Side-by-Side: Audit & Editor */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      
                      {/* Left: Website Audit Report */}
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block border-b border-zinc-800/80 pb-2">
                          Website Presence Audit
                        </span>
                        
                        {selectedQueueLead.websiteAudit ? (
                          <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                            {JSON.parse(selectedQueueLead.websiteAudit).map((issue: any, index: number) => (
                              <div key={index} className="bg-zinc-950/40 border border-zinc-800/50 rounded-lg p-3 space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="size-1.5 rounded-full bg-rose-500" />
                                  <span className="text-xs font-semibold text-rose-400">{issue.title}</span>
                                </div>
                                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{issue.details}</p>
                                <div className="text-[10px] text-emerald-400 mt-1.5 bg-emerald-950/20 border border-emerald-950/30 p-2 rounded">
                                  <strong className="block text-[9px] uppercase tracking-wider mb-0.5 text-emerald-500">Recommendation:</strong>
                                  {issue.recommendation}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500">No audit issues logged. Click "Re-Audit Website".</p>
                        )}
                      </div>

                      {/* Right: Personalized Email Editor */}
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3 flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block border-b border-zinc-800/80 pb-2">
                          Personalized Outreach Email
                        </span>

                        <div className="space-y-3 flex-1 flex flex-col">
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Subject Line</label>
                            <input
                              type="text"
                              value={editingSubject}
                              onChange={(e) => setEditingSubject(e.target.value)}
                              className="w-full h-9 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="flex-1 flex flex-col">
                            <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Email Body</label>
                            <textarea
                              rows={10}
                              value={editingBody}
                              onChange={(e) => setEditingBody(e.target.value)}
                              className="w-full flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-sans leading-relaxed"
                            />
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-3">
                          <button
                            onClick={handleSaveDraft}
                            disabled={isSavingDraft || selectedQueueLead.emailStatus === "SENT"}
                            className="h-9 rounded-lg border border-zinc-700 bg-zinc-800 px-4 text-xs font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-40"
                          >
                            {isSavingDraft ? "Saving..." : "Save Draft"}
                          </button>
                          
                          {selectedQueueLead.emailStatus !== "SENT" ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleQueueEmail}
                                className="h-9 rounded-lg border border-indigo-700 bg-indigo-950/20 text-indigo-400 px-4 text-xs font-semibold hover:bg-indigo-950/40 transition-colors"
                              >
                                Approve & Queue
                              </button>
                              <button
                                onClick={handleSendEmail}
                                disabled={isSending}
                                className="h-9 rounded-lg bg-indigo-500 px-4 text-xs font-semibold text-white hover:bg-indigo-400 transition-colors disabled:opacity-40"
                              >
                                {isSending ? "Sending..." : "Send Email"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                              Email Outbox Sent
                            </span>
                          )}
                        </div>

                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-12 text-center">
                    <p className="text-xs text-zinc-500">Select a lead from the queue on the left to review their website audit and email draft.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: PIPELINE BOARD */}
          {activeTab === "pipeline" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Pipeline Stage: Contacted */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 space-y-3 min-h-[400px]">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 pb-2 flex justify-between items-center">
                  <span>Contacted</span>
                  <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-300 font-semibold">
                    {acceptedLeads.filter((l) => l.pipelineStatus === "CONTACTED").length}
                  </span>
                </h4>
                <div className="space-y-2">
                  {acceptedLeads
                    .filter((l) => l.pipelineStatus === "CONTACTED")
                    .map((lead) => (
                      <div key={lead.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-2 text-xs">
                        <span className="font-semibold text-white block">{lead.companyName}</span>
                        <span className="text-[10px] text-zinc-500 block truncate">{lead.website || lead.email}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Pipeline Stage: Replied */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 space-y-3 min-h-[400px]">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 pb-2 flex justify-between items-center">
                  <span>Replied</span>
                  <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-300 font-semibold">
                    {acceptedLeads.filter((l) => l.pipelineStatus === "REPLIED").length}
                  </span>
                </h4>
                <div className="space-y-2">
                  {acceptedLeads
                    .filter((l) => l.pipelineStatus === "REPLIED")
                    .map((lead) => (
                      <div key={lead.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-2 text-xs">
                        <span className="font-semibold text-white block">{lead.companyName}</span>
                        <span className="text-[10px] text-zinc-500 block truncate">{lead.email}</span>
                        <a href="/inbox" className="text-[10px] text-indigo-400 hover:text-indigo-300 block font-medium underline">
                          Open thread in Inbox &rarr;
                        </a>
                      </div>
                    ))}
                </div>
              </div>

              {/* Pipeline Stage: Interested */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 space-y-3 min-h-[400px]">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider border-b border-emerald-950/40 pb-2 flex justify-between items-center">
                  <span>Interested</span>
                  <span className="bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-semibold">
                    {acceptedLeads.filter((l) => l.pipelineStatus === "INTERESTED").length}
                  </span>
                </h4>
                <div className="space-y-2">
                  {acceptedLeads
                    .filter((l) => l.pipelineStatus === "INTERESTED")
                    .map((lead) => (
                      <div key={lead.id} className="rounded-lg border border-emerald-950/10 border-emerald-900/30 bg-zinc-900/50 p-3 space-y-2 text-xs">
                        <span className="font-semibold text-emerald-300 block">{lead.companyName}</span>
                        <span className="text-[10px] text-zinc-500 block truncate">{lead.email}</span>
                        <a href="/inbox" className="text-[10px] text-indigo-400 hover:text-indigo-300 block font-medium underline">
                          Send meeting link &rarr;
                        </a>
                      </div>
                    ))}
                </div>
              </div>

              {/* Pipeline Stage: Call Booked */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 space-y-3 min-h-[400px]">
                <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider border-b border-indigo-950/40 pb-2 flex justify-between items-center">
                  <span>Call Booked</span>
                  <span className="bg-indigo-950/40 border border-indigo-900/30 px-2 py-0.5 rounded text-[10px] text-indigo-400 font-semibold">
                    {acceptedLeads.filter((l) => l.pipelineStatus === "MEETING_BOOKED").length}
                  </span>
                </h4>
                <div className="space-y-2">
                  {acceptedLeads
                    .filter((l) => l.pipelineStatus === "MEETING_BOOKED")
                    .map((lead) => (
                      <div key={lead.id} className="rounded-lg border border-indigo-950/20 border-indigo-900/20 bg-zinc-900/50 p-3 space-y-2 text-xs">
                        <span className="font-semibold text-white block">{lead.companyName}</span>
                        <span className="text-[10px] text-zinc-500 block truncate">{lead.email}</span>
                        <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-950/40 px-2 py-0.5 rounded block text-center mt-1">
                          Sales Call Scheduled
                        </span>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Sidebar Configuration Column (1/4 width) */}
        <div id="profile-setup-sidebar" className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Outreach Branding</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Customize your sender profile.</p>
            </div>

            {profileSuccessMsg && (
              <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/40 p-2.5">
                <p className="text-[10px] text-emerald-400">{profileSuccessMsg}</p>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">My Business Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Agency"
                  className="w-full h-9 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">Sender Name (Me)</label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full h-9 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">Sender Email</label>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="e.g. name@apex.com"
                  className="w-full h-9 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">Calendar Booking Link</label>
                <input
                  type="url"
                  value={calendarLink}
                  onChange={(e) => setCalendarLink(e.target.value)}
                  placeholder="https://calendly.com/yourlink"
                  className="w-full h-9 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">Default Outreach Call-To-Action</label>
                <textarea
                  rows={3}
                  required
                  value={defaultCTA}
                  onChange={(e) => setDefaultCTA(e.target.value)}
                  placeholder="Would you be open to a quick chat next Tuesday?"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 p-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full h-9 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-xs font-semibold text-white disabled:opacity-40 transition-colors"
              >
                {isSavingProfile ? "Saving Profile..." : "Save Branding Settings"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
