import { formatMoney } from "@/lib/format";
import { flujoDeMovimientos, gananciaPorCasino } from "@/lib/reportes";

export default async function ReportesPage() {
  const [flujo, ganancia] = await Promise.all([flujoDeMovimientos(), gananciaPorCasino()]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Reportes</h1>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Flujo de movimientos</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Entrada</p>
            <p className="mt-1 text-xl font-semibold text-emerald-900">{formatMoney(flujo.ENTRADA.total)}</p>
            <p className="text-xs text-emerald-600">{flujo.ENTRADA.count} movimiento(s)</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">Salida</p>
            <p className="mt-1 text-xl font-semibold text-red-900">{formatMoney(flujo.SALIDA.total)}</p>
            <p className="text-xs text-red-600">{flujo.SALIDA.count} movimiento(s)</p>
          </div>
          <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Interna</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{formatMoney(flujo.INTERNA.total)}</p>
            <p className="text-xs text-slate-500">{flujo.INTERNA.count} movimiento(s)</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Ganancia por casino</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Perfil</th>
                <th className="px-3 py-2">Casino</th>
                <th className="px-3 py-2">Depósitos totales</th>
                <th className="px-3 py-2">Apuestas totales</th>
                <th className="px-3 py-2">Cobros totales</th>
                <th className="px-3 py-2">Ganancia Neta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ganancia.filas.map((f) => (
                <tr key={f.casinoId}>
                  <td className="px-3 py-2">
                    {f.letra}.{f.perfil}
                  </td>
                  <td className="px-3 py-2">{f.nombreCasino}</td>
                  <td className="px-3 py-2">{formatMoney(f.depositos)}</td>
                  <td className="px-3 py-2">{formatMoney(f.apuestas)}</td>
                  <td className="px-3 py-2">{formatMoney(f.cobros)}</td>
                  <td className={`px-3 py-2 font-medium ${f.gananciaNeta.isNegative() ? "text-red-600" : "text-emerald-700"}`}>
                    {formatMoney(f.gananciaNeta)}
                  </td>
                </tr>
              ))}
              {ganancia.filas.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-400" colSpan={6}>
                    Sin casinos.
                  </td>
                </tr>
              )}
            </tbody>
            {ganancia.filas.length > 0 && (
              <tfoot className="bg-slate-50 font-semibold">
                <tr>
                  <td className="px-3 py-2" colSpan={2}>
                    Total general
                  </td>
                  <td className="px-3 py-2">{formatMoney(ganancia.total.depositos)}</td>
                  <td className="px-3 py-2">{formatMoney(ganancia.total.apuestas)}</td>
                  <td className="px-3 py-2">{formatMoney(ganancia.total.cobros)}</td>
                  <td className={`px-3 py-2 ${ganancia.total.gananciaNeta.isNegative() ? "text-red-600" : "text-emerald-700"}`}>
                    {formatMoney(ganancia.total.gananciaNeta)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
