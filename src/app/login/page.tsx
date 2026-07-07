"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();

    if (res.ok) {
      router.push("/onboarding");
    } else {
      setError(data.error || "Invalid email or password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-sm w-full mx-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h1 className="text-xl font-bold mb-1">Log in</h1>
          <p className="text-sm text-zinc-500 mb-6">Access your ClientPilot AI dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-800/30 bg-rose-950/20 p-3">
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs text-zinc-500 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs text-zinc-500 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                placeholder="Min 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-40 transition-colors"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="text-xs text-zinc-600 mt-6 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
