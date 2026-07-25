import { ArqueoBuscador } from "./arqueo-buscador";

export default function ArqueoPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Arqueo</h1>
      <p className="mb-4 text-sm text-slate-500">
        Busca un cliente para ver todos sus bancos con su historial de movimientos y saldo.
      </p>
      <ArqueoBuscador />
    </div>
  );
}
