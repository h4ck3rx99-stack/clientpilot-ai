export function Card({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardSection({ title, className = "", children }: { title?: string; className?: string; children: React.ReactNode }) {
  return (
    <Card className={className}>
      {title && <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>}
      {children}
    </Card>
  );
}
