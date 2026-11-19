import { NavLink, useNavigate } from "react-router-dom";
import { PanelLeftClose, PanelLeft, Sparkles } from "lucide-react";
import { nav, groupLabels, type NavItem } from "@/data/nav";
import { Logo } from "@/components/Logo";
import { useML } from "@/context/ml-context";
import { cn } from "@/lib/utils";

const order: NavItem["group"][] = ["main", "canales", "negocio", "cuenta"];

export function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const { totals } = useML();
  const badgeFor = (item: NavItem) =>
    item.to === "/mercado-libre" ? totals.questions : item.badge;
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-surface transition-[width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
        collapsed ? "w-[76px]" : "w-[248px]",
      )}
    >
      {/* brand */}
      <div className="flex h-16 items-center justify-between px-4">
        <Logo compact={collapsed} />
        <button
          onClick={onToggle}
          className="hidden h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg lg:grid"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? <PanelLeft className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
        </button>
      </div>

      {/* nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-1">
        {order.map((group) => {
          const items = nav.filter((n) => n.group === group);
          return (
            <div key={group}>
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
                  {groupLabels[group]}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150",
                          collapsed && "justify-center px-0",
                          isActive
                            ? "bg-brand/10 text-brand"
                            : "text-fg/70 hover:bg-surface-2 hover:text-fg",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && !collapsed && (
                            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" />
                          )}
                          <item.icon
                            className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-brand")}
                            strokeWidth={2}
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                          {!collapsed && badgeFor(item) ? (
                            <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-semibold text-brand-fg">
                              {badgeFor(item)}
                            </span>
                          ) : null}
                          {collapsed && badgeFor(item) ? (
                            <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* upgrade card */}
      {!collapsed && (
        <div className="m-3 rounded-2xl border border-brand/20 bg-brand/[0.06] p-4">
          <div className="mb-1 flex items-center gap-2 text-brand">
            <Sparkles className="h-4 w-4" />
            <span className="text-[13px] font-semibold">Plan Premium</span>
          </div>
          <p className="mb-3 text-[12.5px] leading-snug text-muted">
            Desbloqueá respuestas con IA y facturación masiva.
          </p>
          <button
            onClick={() => {
              navigate("/suscripcion");
              onNavigate?.();
            }}
            className="w-full rounded-lg bg-brand py-2 text-[13px] font-semibold text-brand-fg transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
          >
            Mejorar plan
          </button>
        </div>
      )}
    </aside>
  );
}
