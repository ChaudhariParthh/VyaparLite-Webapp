import { Wallet } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2 font-bold text-lg tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Wallet className="h-4 w-4" aria-hidden />
      </span>
      {!compact && (
        <span>
          Vyapar<span className="text-primary">Lite</span>
        </span>
      )}
    </span>
  );
}
