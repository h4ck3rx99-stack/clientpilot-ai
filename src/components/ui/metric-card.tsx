import { Card } from "./card";

export function MetricCard({ label, value, color = "text-white" }: { label: string; value: string | number; color?: string }) {
  return (
    <Card>
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}
