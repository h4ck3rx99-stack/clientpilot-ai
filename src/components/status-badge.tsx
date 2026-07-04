const variants: Record<string, string> = {
  DRAFT:
    "text-zinc-400 border-zinc-700 bg-zinc-800/50",
  ACTIVE:
    "text-green-400 border-green-800 bg-green-950/50",
  PAUSED:
    "text-amber-400 border-amber-800 bg-amber-950/50",
  COMPLETED:
    "text-blue-400 border-blue-800 bg-blue-950/50",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${
        variants[status] || variants.DRAFT
      }`}
    >
      {status}
    </span>
  );
}
