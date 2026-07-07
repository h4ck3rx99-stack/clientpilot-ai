import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-sm mx-4 text-center">
        <div className="size-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-zinc-500">?</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Page not found.</h1>
        <p className="text-sm text-zinc-500 mb-6">
          This page does not exist or has been moved.
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
