import type { ScoreBreakdown } from "@/lib/scoring";

export default function ScoreBreakdownCard({
  breakdown,
}: {
  breakdown: ScoreBreakdown;
}) {
  const categories = [
    { key: "Service match", ...breakdown.serviceMatch },
    { key: "Pain signal", ...breakdown.painSignal },
    { key: "Business activity", ...breakdown.businessActivity },
    { key: "Reachability", ...breakdown.reachability },
    { key: "Personalization", ...breakdown.personalization },
  ];

  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const pct = cat.max > 0 ? Math.round((cat.score / cat.max) * 100) : 0;
        return (
          <div key={cat.key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400">{cat.key}</span>
              <span className="text-zinc-500">
                {cat.score}/{cat.max}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 70
                    ? "bg-green-500"
                    : pct >= 40
                    ? "bg-amber-500"
                    : "bg-zinc-600"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {cat.reason && (
              <p className="text-[11px] text-zinc-600 mt-0.5">{cat.reason}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
