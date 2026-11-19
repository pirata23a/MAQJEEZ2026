import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppProvider } from "@/context/app-context";
import { ToastProvider } from "@/context/toast-context";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { ProductsProvider } from "@/context/products-context";
import { PosProvider } from "@/context/pos-context";
import { FinanceProvider } from "@/context/finance-context";
import { MLProvider } from "@/context/ml-context";
import { AppLayout } from "@/components/layout/AppLayout";
import { Login } from "@/pages/Login";
import { Inicio } from "@/pages/Inicio";
import { Dashboard } from "@/pages/Dashboard";
import { Metricas } from "@/pages/Metricas";
import { Alertas } from "@/pages/Alertas";
import { Historico } from "@/pages/Historico";
import { Suscripcion } from "@/pages/Suscripcion";
import { Productos } from "@/pages/Productos";
import { Combos } from "@/pages/Combos";
import { Movimientos } from "@/pages/Movimientos";
import { LocalFisico } from "@/pages/LocalFisico";
import { Ventas } from "@/pages/Ventas";
import { Finanzas } from "@/pages/Finanzas";
import { Proveedores } from "@/pages/Proveedores";
import { Configuracion } from "@/pages/Configuracion";
import { CanalConecta } from "@/pages/CanalConecta";
import { MercadoLibre } from "@/pages/MercadoLibre";
import { Placeholder } from "@/pages/Placeholder";
import { nav } from "@/data/nav";

const realPages: Record<string, ReactNode> = {
  "/": <Inicio />,
  "/dashboard": <Dashboard />,
  "/metricas": <Metricas />,
  "/mercado-libre": <MercadoLibre />,
  "/mercado-pago": <CanalConecta slug="mercado-pago" />,
  "/tiendanube": <CanalConecta slug="tiendanube" />,
  "/tienda-negocio": <CanalConecta slug="tienda-negocio" />,
  "/empretienda": <CanalConecta slug="empretienda" />,
  "/woocommerce": <CanalConecta slug="woocommerce" />,
  "/canales-externos": <CanalConecta slug="canales-externos" />,
  "/local-fisico": <LocalFisico />,
  "/ventas": <Ventas />,
  "/productos": <Productos />,
  "/combos": <Combos />,
  "/movimientos": <Movimientos />,
  "/alertas": <Alertas />,
  "/historico": <Historico />,
  "/finanzas": <Finanzas />,
  "/proveedores": <Proveedores />,
  "/configuracion": <Configuracion />,
  "/suscripcion": <Suscripcion />,
};

function AuthedApp() {
  return (
    <ProductsProvider>
      <PosProvider>
        <FinanceProvider>
          <MLProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  {nav.map((item) => (
                    <Route
                      key={item.to}
                      path={item.to}
                      element={realPages[item.to] ?? <Placeholder title={item.label} icon={item.icon} />}
                    />
                  ))}
                  <Route
                    path="*"
                    element={<Placeholder title="Página no encontrada" icon={nav[0].icon} description="La ruta que buscás no existe." />}
                  />
                </Route>
              </Routes>
            </BrowserRouter>
          </MLProvider>
        </FinanceProvider>
      </PosProvider>
    </ProductsProvider>
  );
}

function Gate() {
  const { status } = useAuth();
  if (status === "loading")
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  if (status === "guest") return <Login />;
  return <AuthedApp />;
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </ToastProvider>
    </AppProvider>
  );
}
