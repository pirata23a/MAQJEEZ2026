import { useState, type ReactNode } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type HelpStep = { title: string; desc: string };

export function HelpAccordion({
  title = "¿Cómo funciona esta sección?",
  intro,
  steps,
  defaultOpen = false,
}: {
  title?: string;
  intro?: ReactNode;
  steps: HelpStep[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-brand/25 bg-brand/[0.05]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
          <HelpCircle className="h-[18px] w-[18px]" />
        </span>
        <span className="flex-1">
          <span className="block text-[14px] font-semibold text-fg">{title}</span>
          <span className="block text-[12.5px] text-muted">Mini guía rápida · tocá para {open ? "ocultar" : "ver"}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-4 pb-4 pt-1">
            {intro && <p className="text-[13px] leading-relaxed text-fg/80">{intro}</p>}
            <ol className="space-y-2.5">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-bold text-brand-fg tnum">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">
                    <span className="text-[13.5px] font-semibold text-fg">{s.title}</span>
                    <span className="block text-[13px] leading-snug text-muted">{s.desc}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
