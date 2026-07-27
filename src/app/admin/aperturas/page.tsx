import { AperturasPanel } from "./aperturas-panel";

export default function AperturasPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Próx. Apertura</h1>
      <p className="mb-4 text-sm text-slate-500">Agenda la apertura de cuentas nuevas y da seguimiento a la cita.</p>
      <AperturasPanel />
    </div>
  );
}
