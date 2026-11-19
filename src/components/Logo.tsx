import { cn } from "@/lib/utils";

export function Logo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-brand text-brand-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
          <path
            d="M6 4h12a1 1 0 0 1 1 1v2H5V5a1 1 0 0 1 1-1Z"
            fill="currentColor"
            opacity="0.55"
          />
          <path
            d="M5 7h14l-1 11.2A2 2 0 0 1 16 20H8a2 2 0 0 1-2-1.8L5 7Z"
            fill="currentColor"
          />
          <path
            d="M14.2 10.4v3.3a2.1 2.1 0 1 1-1.5-2"
            stroke="rgb(var(--brand))"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
      {!compact && (
        <span className="text-[17px] font-bold tracking-tight text-fg">
          App<span className="text-brand">Jeez</span>
        </span>
      )}
    </div>
  );
}
