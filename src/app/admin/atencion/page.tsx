import { auth } from "@/auth";
import { formatMoney } from "@/lib/format";
import { cuentasEnRiesgoDeFondeo, proximosARecarga, vencimientosIne } from "@/lib/puntoAtencion";

function Badge({ children, clase }: { children: React.ReactNode; clase: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${clase}`}>{children}</span>;
}

export default async function AtencionPage() {
  const session = await auth();
  if (!session?.user) return null;
  const actor = { rol: session.user.rol, letra: session.user.letra };

  const [ine, recargas, fondeo] = await Promise.all([
    vencimientosIne(actor),
    proximosARecarga(actor),
    cuentasEnRiesgoDeFondeo(actor),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Punto de Atención</h1>
        <p className="mb-4 text-sm text-slate-500">Lo que requiere acción pronto: INE por vencer, recargas atrasadas y cuentas con fondeo bajo.</p>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Vencimiento de INE</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Equipo</th>
                <th className="px-3 py-2">Vence</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ine.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2">
                    {c.nombreCompleto} <span className="text-xs text-slate-400">({c.id})</span>
                  </td>
                  <td className="px-3 py-2">{c.equipo ?? "—"}</td>
                  <td className="px-3 py-2">{c.expIne}</td>
                  <td className="px-3 py-2">
                    {c.aniosParaVencer < 0 && <Badge clase="bg-red-100 text-red-700">Vencida</Badge>}
                    {c.aniosParaVencer === 0 && <Badge clase="bg-amber-100 text-amber-700">Vence este año</Badge>}
                    {c.aniosParaVencer === 1 && <Badge clase="bg-amber-50 text-amber-600">Vence el próximo año</Badge>}
                  </td>
                </tr>
              ))}
              {ine.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-400" colSpan={4}>
                    Ninguna INE vence pronto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Próx. a Recarga</h2>
        <p className="mb-2 text-xs text-slate-500">
          Si pasan 5 meses sin recargar, la telefonía puede dar de baja el número.
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Equipo</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2">Última recarga</th>
                <th className="px-3 py-2">Meses sin recargar</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recargas.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2">
                    {c.nombreCompleto} <span className="text-xs text-slate-400">({c.id})</span>
                  </td>
                  <td className="px-3 py-2">{c.equipo ?? "—"}</td>
                  <td className="px-3 py-2">{c.telefono ?? "—"}</td>
                  <td className="px-3 py-2">{new Intl.DateTimeFormat("es-MX").format(c.ultRecarga!)}</td>
                  <td className="px-3 py-2">{c.meses.toFixed(1)}</td>
                  <td className="px-3 py-2">
                    {c.meses >= 5 && <Badge clase="bg-red-100 text-red-700">Riesgo de baja</Badge>}
                    {c.meses >= 4 && c.meses < 5 && <Badge clase="bg-amber-100 text-amber-700">Urgente</Badge>}
                    {c.meses >= 3 && c.meses < 4 && <Badge clase="bg-amber-50 text-amber-600">Próximo</Badge>}
                  </td>
                </tr>
              ))}
              {recargas.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-400" colSpan={6}>
                    Nadie está próximo a necesitar recarga.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Fondeo de Bancos</h2>
        <p className="mb-2 text-xs text-slate-500">
          Cuentas con saldo promedio del mes por debajo de $5,000 (algunos bancos cobran comisión). El promedio se
          calcula con una foto diaria del saldo, así que los primeros días del mes puede haber pocos datos todavía.
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Banco</th>
                <th className="px-3 py-2">Perfil</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Promedio del mes</th>
                <th className="px-3 py-2">Días registrados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fondeo.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2">{c.banco}</td>
                  <td className="px-3 py-2">
                    {c.letra}.{c.perfil}
                  </td>
                  <td className="px-3 py-2">{c.nombreCliente ?? "—"}</td>
                  <td className="px-3 py-2 font-medium text-red-600">{formatMoney(c.promedioMes ?? 0)}</td>
                  <td className="px-3 py-2">{c.diasRegistrados}</td>
                </tr>
              ))}
              {fondeo.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-400" colSpan={5}>
                    Ninguna cuenta con datos de este mes está por debajo del mínimo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
