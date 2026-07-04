import Link from "next/link";

export default async function AddLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
      <Link
        href={`/campaigns/${id}`}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4 block"
      >
        &larr; Back to campaign
      </Link>
      <h1 className="text-2xl font-bold mb-3">Add leads manually</h1>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <p className="text-sm text-zinc-500">
          Lead import will be available in the next update.
        </p>
      </div>
    </main>
  );
}
