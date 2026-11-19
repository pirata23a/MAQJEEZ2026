import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };

type ToastState = {
  toast: (message: string, type?: ToastType) => void;
};

const Ctx = createContext<ToastState | null>(null);

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const tones: Record<ToastType, string> = {
  success: "text-success",
  error: "text-danger",
  info: "text-brand",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++seq.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), 3400);
    },
    [remove],
  );

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex animate-fade-up items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-pop"
            >
              <Icon className={cn("mt-0.5 h-[18px] w-[18px] shrink-0", tones[t.type])} />
              <p className="flex-1 text-[13px] font-medium leading-snug text-fg">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                aria-label="Cerrar"
                className="text-muted transition-colors hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used within ToastProvider");
  return v.toast;
}
