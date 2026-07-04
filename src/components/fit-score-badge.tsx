export default function FitScoreBadge({ score }: { score: number }) {
  const label =
    score >= 75 ? "High Fit" : score >= 50 ? "Medium Fit" : "Low Fit";

  const colorClass =
    score >= 75
      ? "text-green-400 border-green-800 bg-green-950/50"
      : score >= 50
      ? "text-amber-400 border-amber-800 bg-amber-950/50"
      : "text-zinc-400 border-zinc-700 bg-zinc-800/50";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${colorClass}`}
    >
      <span>{score}/100</span>
      <span className="opacity-60">&middot;</span>
      <span>{label}</span>
    </span>
  );
}
