"use client";

import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-sm mx-4 text-center">
        <div className="size-12 rounded-xl bg-rose-500/20 border border-rose-800/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">!</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Something went wrong.</h1>
        <p className="text-sm text-zinc-500 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
