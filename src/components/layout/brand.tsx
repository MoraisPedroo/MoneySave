import { PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[30%] bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <PiggyBank style={{ width: size * 0.56, height: size * 0.56 }} strokeWidth={2.1} />
    </span>
  );
}

export function Logo({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className="text-lg font-bold tracking-tight">
        Money<span className="text-primary">Save</span>
      </span>
    </span>
  );
}
