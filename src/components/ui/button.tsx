type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({ variant = "primary", size = "md", className = "", children, disabled, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-500 text-white hover:bg-indigo-400",
    secondary: "border border-zinc-700 text-zinc-300 hover:bg-zinc-800",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    ghost: "text-zinc-400 hover:text-white",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-5 text-sm",
    lg: "h-12 px-6 text-base",
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({ href, variant = "primary", size = "md", className = "", children }: { href: string; variant?: "primary" | "secondary" | "danger" | "ghost"; size?: "sm" | "md" | "lg"; className?: string; children: React.ReactNode }) {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors";
  const variants = {
    primary: "bg-indigo-500 text-white hover:bg-indigo-400",
    secondary: "border border-zinc-700 text-zinc-300 hover:bg-zinc-800",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    ghost: "text-zinc-400 hover:text-white",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-5 text-sm",
    lg: "h-12 px-6 text-base",
  };
  return <a href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>{children}</a>;
}
