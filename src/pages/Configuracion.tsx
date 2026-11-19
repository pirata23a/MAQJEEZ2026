import { useState, type FormEvent } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { api, ApiError } from "@/lib/api";

export function Configuracion() {
  const { user, company } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      toast("Las contraseñas nuevas no coinciden", "error");
      return;
    }
    setBusy(true);
    try {
      await api("/me/password", { method: "POST", body: { currentPassword: current, newPassword: next } });
      toast("Contraseña actualizada");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Configuración" subtitle="Datos de tu cuenta y seguridad." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tu cuenta</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <Row label="Empresa" value={company?.name} />
            <Row label="Usuario" value={user?.name} />
            <Row label="Email" value={user?.email} />
            <Row label="Rol" value={user?.role} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-[18px] w-[18px] text-brand" />
              Cambiar contraseña
            </CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={submit} className="space-y-4">
              <Field label="Contraseña actual">
                <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" required />
              </Field>
              <Field label="Nueva contraseña" hint="Mínimo 6 caracteres">
                <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="••••••••" required />
              </Field>
              <Field label="Repetir nueva contraseña">
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
              </Field>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Actualizar contraseña
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium capitalize text-fg">{value ?? "—"}</span>
    </div>
  );
}
