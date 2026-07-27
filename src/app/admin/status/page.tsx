import { prisma } from "@/lib/prisma";
import { StatusTable } from "./status-table";

export default async function EditarStatusPage() {
  const cuentas = await prisma.cuenta.findMany({
    orderBy: [{ letra: "asc" }, { perfil: "asc" }],
    select: { id: true, letra: true, perfil: true, banco: true, status: true, tipoCuenta: true, nombreCliente: true },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Editar Status</h1>
      <p className="mb-4 text-sm text-slate-500">Cambia el status o tipo de cualquier cuenta, de cualquier letra.</p>
      <StatusTable cuentas={cuentas} />
    </div>
  );
}
