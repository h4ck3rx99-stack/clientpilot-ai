"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  businessName: string | null;
  senderName: string | null;
  senderEmail: string | null;
  services: string | null;
  proof: string | null;
  tone: string | null;
  defaultCTA: string | null;
};

export default function ProfileForm({
  profile,
}: {
  profile: Profile | null;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);

    const form = new FormData(e.currentTarget);
    const body = {
      businessName: form.get("businessName") as string,
      senderName: form.get("senderName") as string,
      senderEmail: form.get("senderEmail") as string,
      services: form.get("services") as string,
      proof: form.get("proof") as string,
      tone: form.get("tone") as string,
      defaultCTA: form.get("defaultCTA") as string,
    };

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setErrors(data.errors || ["Failed to save profile"]);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-400">
              {err}
            </p>
          ))}
        </div>
      )}

      <div>
        <label
          htmlFor="businessName"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Business name <span className="text-red-400">*</span>
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          defaultValue={profile?.businessName ?? ""}
          placeholder="e.g. RE Dev Ops"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="senderName"
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            Sender name <span className="text-red-400">*</span>
          </label>
          <input
            id="senderName"
            name="senderName"
            type="text"
            required
            defaultValue={profile?.senderName ?? ""}
            placeholder="e.g. Aayush"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label
            htmlFor="senderEmail"
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            Sender email <span className="text-red-400">*</span>
          </label>
          <input
            id="senderEmail"
            name="senderEmail"
            type="email"
            required
            defaultValue={profile?.senderEmail ?? ""}
            placeholder="e.g. hello@redevops.com"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="services"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Services offered <span className="text-red-400">*</span>
        </label>
        <textarea
          id="services"
          name="services"
          required
          rows={2}
          defaultValue={profile?.services ?? ""}
          placeholder="e.g. Websites, AI automations, dashboards, CRM systems, landing pages, internal tools"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div>
        <label
          htmlFor="proof"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Proof / case studies
        </label>
        <textarea
          id="proof"
          name="proof"
          rows={3}
          defaultValue={profile?.proof ?? ""}
          placeholder="e.g. Built websites for local businesses, worked with early clients, helped businesses create better online presence"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div>
        <label
          htmlFor="tone"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Preferred tone
        </label>
        <input
          id="tone"
          name="tone"
          type="text"
          defaultValue={profile?.tone ?? ""}
          placeholder="e.g. Professional, direct, friendly"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="defaultCTA"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Default CTA <span className="text-red-400">*</span>
        </label>
        <input
          id="defaultCTA"
          name="defaultCTA"
          type="text"
          required
          defaultValue={profile?.defaultCTA ?? ""}
          placeholder="e.g. Would you be open to a quick 15-minute call this week?"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-500 px-6 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting
            ? "Saving..."
            : profile
            ? "Update Profile"
            : "Create Profile"}
        </button>
      </div>
    </form>
  );
}
