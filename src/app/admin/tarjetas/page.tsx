import { prisma } from "@/lib/prisma";

export default async function TarjetasPage() {
  const cuentas = await prisma.cuenta.findMany({
    orderBy: [{ letra: "asc" }, { perfil: "asc" }],
    select: {
      id: true,
      letra: true,
      perfil: true,
      banco: true,
      nombrePerfil: true,
      nTarjeta: true,
      nip: true,
      cvv: true,
      exp: true,
      ubicacionCustodia: true,
    },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Tarjetas</h1>
      <p className="mb-4 text-sm text-slate-500">Catálogo de tarjetas asociadas a cada cuenta, todas las letras.</p>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">Perfil</th>
              <th className="px-3 py-2">Banco</th>
              <th className="px-3 py-2">Titular</th>
              <th className="px-3 py-2">No. de tarjeta</th>
              <th className="px-3 py-2">NIP</th>
              <th className="px-3 py-2">CVV</th>
              <th className="px-3 py-2">Vencimiento</th>
              <th className="px-3 py-2">Ubicación / custodia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cuentas.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2">
                  {c.letra}.{c.perfil}
                </td>
                <td className="px-3 py-2">{c.banco}</td>
                <td className="px-3 py-2">{c.nombrePerfil ?? "—"}</td>
                <td className="px-3 py-2">{c.nTarjeta ?? "—"}</td>
                <td className="px-3 py-2">{c.nip ?? "—"}</td>
                <td className="px-3 py-2">{c.cvv ?? "—"}</td>
                <td className="px-3 py-2">{c.exp ?? "—"}</td>
                <td className="px-3 py-2">{c.ubicacionCustodia ?? "—"}</td>
              </tr>
            ))}
            {cuentas.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-slate-400" colSpan={8}>
                  Sin cuentas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
