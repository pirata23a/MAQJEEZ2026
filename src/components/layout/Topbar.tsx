import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  MessageSquare,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Building2,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

function IconAction({
  icon: Icon,
  badge,
  label,
  onClick,
}: {
  icon: typeof Bell;
  badge?: number;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="relative grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      <Icon className="h-[18px] w-[18px]" />
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function Overlay({ onClose }: { onClose: () => void }) {
  return <button aria-hidden className="fixed inset-0 z-30 cursor-default" onClick={onClose} />;
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useApp();
  const { user, company, logout } = useAuth();
  const [userOpen, setUserOpen] = useState(false);
  const [search, setSearch] = useState("");

  const initials = (user?.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-xl lg:px-6">
      <button
        onClick={onOpenMenu}
        className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate("/productos");
          }}
          placeholder="Buscar productos, ventas, publicaciones…"
          className="h-10 w-full rounded-xl border border-border bg-bg pl-9 pr-16 text-sm text-fg placeholder:text-muted/80 focus:border-brand focus:bg-surface"
        />
        <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted md:block">
          ⌘K
        </kbd>
      </div>

      <div className="flex-1 sm:hidden" />

      {/* company chip */}
      <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-2.5 text-sm">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-brand/12 text-brand">
          <Building2 className="h-3.5 w-3.5" />
        </span>
        <span className="hidden max-w-[160px] truncate font-medium text-fg md:block">
          {company?.name ?? "Mi empresa"}
        </span>
      </div>

      <div className="hidden items-center gap-0.5 sm:flex">
        <IconAction icon={MessageSquare} badge={3} label="Mensajes" onClick={() => navigate("/mercado-libre")} />
        <IconAction icon={Bell} badge={5} label="Notificaciones" onClick={() => navigate("/alertas")} />
      </div>

      <button
        onClick={toggleTheme}
        aria-label="Cambiar tema"
        className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </button>

      <div className="relative">
        <button
          onClick={() => setUserOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-1.5 transition-colors hover:bg-surface-2"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand to-brand/70 text-[12px] font-bold text-brand-fg">
            {initials}
          </span>
          <span className="hidden text-left lg:block">
            <span className="block text-[13px] font-semibold leading-tight text-fg">{user?.name}</span>
            <span className="block text-[11px] capitalize leading-tight text-muted">{user?.role}</span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-muted lg:block" />
        </button>
        {userOpen && (
          <>
            <Overlay onClose={() => setUserOpen(false)} />
            <div className="absolute right-0 z-40 mt-2 w-56 origin-top-right animate-fade-up rounded-2xl border border-border bg-surface p-1.5 shadow-pop">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold text-fg">{user?.name}</p>
                <p className="truncate text-[12px] text-muted">{user?.email}</p>
              </div>
              <div className="my-1 h-px bg-border" />
              {[
                { icon: UserRound, label: "Mi perfil", to: "/configuracion" },
                { icon: Settings, label: "Configuración", to: "/configuracion" },
              ].map((m) => (
                <button
                  key={m.label}
                  onClick={() => {
                    navigate(m.to);
                    setUserOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-fg/80",
                    "transition-colors hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </button>
              ))}
              <div className="my-1 h-px bg-border" />
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
