import { SeguimientoPanel } from "./seguimiento-panel";

export default function SeguimientoPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Seguimiento</h1>
      <p className="mb-4 text-sm text-slate-500">
        Incidencias y trámites de clientes existentes (falta de fotos, banco bloqueado, actualizar INE, etc.).
      </p>
      <SeguimientoPanel />
    </div>
  );
}
