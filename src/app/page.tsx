import Link from "next/link";
import { auth } from "@/auth";
import { etiquetaCorta, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { calcularSaldosCasinos, calcularSaldosCuentas } from "@/lib/saldos";

const Decimal = Prisma.Decimal;

function sum(values: Iterable<Prisma.Decimal>): Prisma.Decimal {
  let total = new Decimal(0);
  for (const v of values) total = total.plus(v);
  return total;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const actor = { rol: session.user.rol, letra: session.user.letra };
  const esAdmin = actor.rol === "ADMIN";

  const cuentaWhere = esAdmin ? {} : { letra: actor.letra! };
  const casinoWhere = esAdmin ? {} : { letra: actor.letra! };

  const [cuentas, casinos, saldosCuentas, saldosCasinos, pendientes] = await Promise.all([
    prisma.cuenta.findMany({ where: cuentaWhere, orderBy: [{ letra: "asc" }, { perfil: "asc" }] }),
    prisma.casino.findMany({ where: casinoWhere, orderBy: [{ letra: "asc" }, { perfil: "asc" }] }),
    calcularSaldosCuentas(cuentaWhere),
    calcularSaldosCasinos(casinoWhere),
    prisma.movimiento.findMany({
      where: { estado: "PENDIENTE", cuenta: esAdmin ? undefined : { letra: actor.letra! } },
      include: { cuenta: { select: { letra: true, perfil: true, banco: true, nombreCliente: true } } },
      orderBy: { fecha: "desc" },
    }),
  ]);

  const totalCuentas = sum(saldosCuentas.values());
  const totalCasinos = sum(saldosCasinos.values());

  const letras = esAdmin ? [...new Set(cuentas.map((c) => c.letra).concat(casinos.map((c) => c.letra)))].sort() : [];
  const consolidadoPorLetra = letras.map((letra) => {
    const cuentasLetra = cuentas.filter((c) => c.letra === letra);
    const casinosLetra = casinos.filter((c) => c.letra === letra);
    return {
      letra,
      saldoCuentas: sum(cuentasLetra.map((c) => saldosCuentas.get(c.id) ?? new Decimal(0))),
      saldoCasinos: sum(casinosLetra.map((c) => saldosCasinos.get(c.id) ?? new Decimal(0))),
      numCuentas: cuentasLetra.length,
      numCasinos: casinosLetra.length,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          {esAdmin ? "Vista consolidada de todas las letras." : `Tus cuentas y casinos — Letra ${actor.letra}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Saldo total en cuentas</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatMoney(totalCuentas)}</p>
          <p className="mt-1 text-xs text-slate-400">{cuentas.length} cuenta(s)</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Saldo total en casinos</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatMoney(totalCasinos)}</p>
          <p className="mt-1 text-xs text-slate-400">{casinos.length} casino(s)</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Movimientos pendientes</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{pendientes.length}</p>
          <p className="mt-1 text-xs text-slate-400">requieren confirmación</p>
        </div>
      </div>

      {pendientes.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-medium text-amber-800">Alertas: movimientos pendientes</p>
          <ul className="space-y-1 text-sm text-amber-900">
            {pendientes.map((m) => (
              <li key={m.id}>
                {etiquetaCorta(m.cuenta.banco, m.cuenta.perfil)} · {m.cuenta.nombreCliente ?? "sin cliente asignado"} —{" "}
                {formatMoney(m.monto)} ({m.tipoMovimiento})
              </li>
            ))}
          </ul>
        </div>
      )}

      {esAdmin && (
        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Consolidado por letra</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Letra</th>
                  <th className="px-4 py-2">Cuentas</th>
                  <th className="px-4 py-2">Saldo cuentas</th>
                  <th className="px-4 py-2">Casinos</th>
                  <th className="px-4 py-2">Saldo casinos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consolidadoPorLetra.map((row) => (
                  <tr key={row.letra}>
                    <td className="px-4 py-2 font-medium text-slate-900">{row.letra}</td>
                    <td className="px-4 py-2">{row.numCuentas}</td>
                    <td className="px-4 py-2">{formatMoney(row.saldoCuentas)}</td>
                    <td className="px-4 py-2">{row.numCasinos}</td>
                    <td className="px-4 py-2">{formatMoney(row.saldoCasinos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Cuentas</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Perfil</th>
                  <th className="px-4 py-2">Banco</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cuentas.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2">
                      {c.letra}.{c.perfil}
                    </td>
                    <td className="px-4 py-2">{c.banco}</td>
                    <td className="px-4 py-2">{c.status.replace("_", " ")}</td>
                    <td className="px-4 py-2">{formatMoney(saldosCuentas.get(c.id) ?? 0)}</td>
                  </tr>
                ))}
                {cuentas.length === 0 && (
                  <tr>
                    <td className="px-4 py-3 text-slate-400" colSpan={4}>
                      Sin cuentas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Casinos</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Perfil</th>
                  <th className="px-4 py-2">Casino</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {casinos.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2">
                      {c.letra}.{c.perfil}
                    </td>
                    <td className="px-4 py-2">{c.nombreCasino}</td>
                    <td className="px-4 py-2">{c.statusCasino}</td>
                    <td className="px-4 py-2">{formatMoney(saldosCasinos.get(c.id) ?? 0)}</td>
                  </tr>
                ))}
                {casinos.length === 0 && (
                  <tr>
                    <td className="px-4 py-3 text-slate-400" colSpan={4}>
                      Sin casinos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/movimientos/nuevo"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Nuevo Movimiento
        </Link>
        <Link
          href="/apuestas/cerrar"
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cerrar Apuesta
        </Link>
      </div>
    </div>
  );
}
