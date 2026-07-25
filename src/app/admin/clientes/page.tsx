import { ClientesBuscador } from "./clientes-buscador";

export default function ClientesPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Clientes</h1>
      <p className="mb-4 text-sm text-slate-500">
        Busca un cliente por nombre o ID para ver su ficha completa, sus cuentas bancarias y sus casinos.
      </p>
      <ClientesBuscador />
    </div>
  );
}
