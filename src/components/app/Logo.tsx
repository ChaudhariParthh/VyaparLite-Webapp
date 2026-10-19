import { cn } from "@/lib/utils";

/** Wordmark: serif "Vyapar" + small-caps "lite" with a marigold rupee dot. */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1 leading-none", className)} aria-label="VyaparLite">
      <span aria-hidden className="mr-0.5 inline-block h-2.5 w-2.5 translate-y-[-1px] rounded-full bg-marigold" />
      {!compact && (
        <>
          <span aria-hidden className="font-display text-xl font-medium">Vyapar</span>
          <span aria-hidden className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] opacity-70">lite</span>
        </>
      )}
    </span>
  );
}
