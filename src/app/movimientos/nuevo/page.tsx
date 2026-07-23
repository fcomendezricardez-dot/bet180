import { widgetDisponibilidad } from "./actions";
import { NuevoMovimientoForm } from "./nuevo-movimiento-form";

export default async function NuevoMovimientoPage() {
  const disponibilidadInicial = await widgetDisponibilidad();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Nuevo Movimiento</h1>
      <NuevoMovimientoForm disponibilidadInicial={disponibilidadInicial} />
    </div>
  );
}
