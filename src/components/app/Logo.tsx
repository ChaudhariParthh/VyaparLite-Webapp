import icon from "@/assets/vyaparlite-icon-clean.png.asset.json";
import { cn } from "@/lib/utils";

/** Brand logo: storefront icon + "Vyapar" in ink and "Lite" in brand green. `onDark` for ink surfaces. */
export function Logo({ className, compact = false, onDark = false }: { className?: string; compact?: boolean; onDark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 leading-none", className)}>
      <img src={icon.url} alt={compact ? "VyaparLite" : ""} width={32} height={32} className="h-8 w-8 rounded-lg" />
      {!compact && (
        <span className="text-xl font-bold tracking-tight">
          <span className={onDark ? "text-ink-foreground" : "text-foreground"}>Vyapar</span>
          <span className={onDark ? "text-leaf" : "text-income"}>Lite</span>
        </span>
      )}
    </span>
  );
}
