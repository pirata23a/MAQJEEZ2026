import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";

export function Placeholder({
  title,
  icon: Icon,
  description,
}: {
  title: string;
  icon: LucideIcon;
  description?: string;
}) {
  return (
    <div className="animate-fade-up">
      <PageHeader title={title} subtitle={description} />
      <Card className="grid place-items-center px-6 py-20 text-center">
        <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-brand/10 text-brand">
          <Icon className="h-7 w-7" />
          <span className="absolute -bottom-1.5 -right-1.5 grid h-7 w-7 place-items-center rounded-xl border-4 border-surface bg-warning/15 text-warning">
            <Construction className="h-3.5 w-3.5" />
          </span>
        </span>
        <h2 className="mt-5 text-lg font-semibold text-fg">Módulo en construcción</h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted">
          La sección <span className="font-medium text-fg">{title}</span> es parte de las próximas
          fases de AppJeez. El shell ya tiene su lugar en la navegación.
        </p>
      </Card>
    </div>
  );
}
