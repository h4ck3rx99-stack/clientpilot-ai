type AlertVariant = "info" | "warning" | "danger" | "success";

const variants: Record<AlertVariant, string> = {
  info: "border-indigo-800/30 bg-indigo-950/10 text-indigo-400",
  warning: "border-yellow-800/30 bg-yellow-950/20 text-yellow-400",
  danger: "border-rose-800/30 bg-rose-950/20 text-rose-400",
  success: "border-emerald-800/30 bg-emerald-950/20 text-emerald-400",
};

export function Alert({ variant = "info", className = "", children }: { variant?: AlertVariant; className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border p-3 text-xs ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
