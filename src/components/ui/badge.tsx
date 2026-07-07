type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const variants: Record<BadgeVariant, string> = {
  default: "border border-zinc-700 bg-zinc-800/50 text-zinc-400",
  success: "border border-emerald-700/50 bg-emerald-950/30 text-emerald-400",
  warning: "border border-yellow-700/50 bg-yellow-950/30 text-yellow-400",
  danger: "border border-rose-700/50 bg-rose-950/30 text-rose-400",
  info: "border border-indigo-700/50 bg-indigo-950/30 text-indigo-400",
};

export function Badge({ variant = "default", className = "", children }: { variant?: BadgeVariant; className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
