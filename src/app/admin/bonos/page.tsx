import { BonosDisponibles } from "./bonos-disponibles";
import { RolloverPendiente } from "./rollover-pendiente";

export default function BonosPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Bonos</h1>
      <p className="mb-4 text-sm text-slate-500">
        Promociones activas configuradas por casino y si ya se pueden volver a reclamar. Configúralas desde
        Gestión → Casinos.
      </p>
      <RolloverPendiente />
      <BonosDisponibles />
    </div>
  );
}
