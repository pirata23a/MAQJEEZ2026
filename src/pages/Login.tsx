import { useState, type FormEvent } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

export function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register({ company, name, email, password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor");
    } finally {
      setBusy(false);
    }
  };

  const useDemo = () => {
    setMode("login");
    setEmail("demo@appjeez.com");
    setPassword("demo1234");
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* brand side */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand p-10 text-brand-fg lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 10%, rgb(255 255 255 / 0.25), transparent), radial-gradient(50% 50% at 90% 90%, rgb(0 0 0 / 0.25), transparent)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M5 7h14l-1 11.2A2 2 0 0 1 16 20H8a2 2 0 0 1-2-1.8L5 7Z" fill="currentColor" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight">AppJeez</span>
        </div>
        <div className="relative">
          <h1 className="max-w-md text-3xl font-bold leading-tight tracking-tight">
            Centralizá tu comercio en un solo lugar.
          </h1>
          <p className="mt-3 max-w-md text-brand-fg/80">
            Stock, ventas, Mercado Libre, local físico y finanzas. Todo tu negocio, ordenado.
          </p>
        </div>
        <div className="relative flex gap-6 text-sm text-brand-fg/80">
          <span><strong className="text-brand-fg">+34M</strong> comprobantes</span>
          <span><strong className="text-brand-fg">+20k</strong> comercios</span>
        </div>
      </div>

      {/* form side */}
      <div className="flex items-center justify-center bg-bg px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-fg">
            {mode === "login" ? "Ingresá a tu cuenta" : "Creá tu comercio"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {mode === "login"
              ? "Gestioná todos tus canales desde AppJeez."
              : "Registrá tu empresa y empezá a usar AppJeez."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <>
                <Field label="Nombre del comercio / empresa">
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Mi Comercio S.A." required />
                </Field>
                <Field label="Tu nombre">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" required />
                </Field>
              </>
            )}
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@tucomercio.com" required />
            </Field>
            <Field label="Contraseña">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>

            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger/[0.08] px-3 py-2 text-[13px] text-danger">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {mode === "login" ? "Ingresar" : "Crear cuenta"}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between text-[13px]">
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="font-medium text-brand hover:underline"
            >
              {mode === "login" ? "Crear una cuenta nueva" : "Ya tengo cuenta"}
            </button>
            {mode === "login" && (
              <button onClick={useDemo} className="text-muted hover:text-fg">
                Usar cuenta demo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
