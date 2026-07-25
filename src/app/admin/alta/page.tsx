import { GestionTabs } from "./gestion-tabs";

export default function AltaPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Gestión de Bancos, Casinos y Clientes</h1>
      <p className="mb-4 text-sm text-slate-500">
        Da de alta o edita cuentas bancarias, casinos y clientes (Gestión), en cualquier letra. Solo administradores.
      </p>
      <GestionTabs />
    </div>
  );
}
