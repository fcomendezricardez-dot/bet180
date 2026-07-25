"use client";

import { useEffect, useState, useTransition } from "react";
import { accionArqueoCliente, accionBuscarClientes } from "./actions";

type Resultado = Awaited<ReturnType<typeof accionBuscarClientes>>[number];
type Arqueo = Awaited<ReturnType<typeof accionArqueoCliente>>;

const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
const fechaHora = (d: string | Date) =>
  new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

const ESTADO_CLASE: Record<string, string> = {
  CONFIRMADO: "bg-emerald-100 text-emerald-700",
  PENDIENTE: "bg-amber-100 text-amber-700",
  CANCELADO: "bg-slate-200 text-slate-500",
};

const TIPO_MOV_LABEL: Record<string, string> = {
  DEPOSITO_A_CASINO: "Depósito a Casino",
  RETIRO_DE_CASINO: "Retiro de Casino",
  PRESTAMO_ENTRE_CUENTAS: "Préstamo entre Cuentas",
  GASTO_OPERATIVO: "Gasto Operativo",
};

export function ArqueoBuscador() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [arqueo, setArqueo] = useState<Arqueo | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!query.trim()) return;
    const handle = setTimeout(() => {
      startTransition(async () => setResultados(await accionBuscarClientes(query)));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const resultadosVisibles = query.trim() ? resultados : [];

  function verArqueo(id: string) {
    startTransition(async () => setArqueo(await accionArqueoCliente(id)));
  }

  return (
    <div className="space-y-6">
      <div>
        <input
          type="text"
          placeholder="Buscar cliente por nombre o ID (ej. CL0013)"
          className="w-full max-w-md rounded border border-slate-300 px-3 py-2 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {resultadosVisibles.length > 0 && (
          <ul className="mt-2 max-w-md divide-y divide-slate-100 rounded border border-slate-200 bg-white">
            {resultadosVisibles.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => verArqueo(r.id)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${arqueo?.cliente.id === r.id ? "bg-slate-100" : ""}`}
                >
                  <span className="block font-medium text-slate-900">{r.nombreCompleto}</span>
                  <span className="block text-xs text-slate-400">
                    {r.id} {r.equipo ? `· ${r.equipo}` : ""} {r.status ? `· ${r.status}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim() && resultadosVisibles.length === 0 && !pending && (
          <p className="mt-2 text-sm text-slate-400">Sin resultados.</p>
        )}
      </div>

      {arqueo && (
        <div className="space-y-8">
          <h2 className="text-xl font-semibold text-slate-900">
            {arqueo.cliente.nombreCompleto} <span className="text-sm font-normal text-slate-400">({arqueo.cliente.id})</span>
          </h2>

          {arqueo.bancos.length === 0 && <p className="text-sm text-slate-400">Este cliente no tiene bancos vinculados.</p>}

          {arqueo.bancos.map((b) => (
            <section key={b.id}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  {b.banco} — {b.letra}.{b.perfil}
                </h3>
                <span className="text-sm font-medium text-slate-900">Saldo actual: {money(b.saldoActual)}</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Movimiento</th>
                      <th className="px-3 py-2">Concepto</th>
                      <th className="px-3 py-2">Monto</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-3 py-2 text-xs text-slate-400" colSpan={5}>
                        Saldo inicial
                      </td>
                      <td className="px-3 py-2 font-medium">{money(b.saldoInicial)}</td>
                    </tr>
                    {b.movimientos.map((m) => (
                      <tr key={m.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-500">{fechaHora(m.fecha)}</td>
                        <td className="px-3 py-2">{TIPO_MOV_LABEL[m.tipoMovimiento] ?? m.tipoMovimiento}</td>
                        <td className="px-3 py-2">{m.concepto ?? "—"}</td>
                        <td className={`px-3 py-2 ${m.tipo === "DEPOSITO" ? "text-emerald-700" : "text-red-600"}`}>
                          {m.tipo === "DEPOSITO" ? "+" : "-"}
                          {money(m.monto)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_CLASE[m.estado]}`}>
                            {m.estado}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium">{money(m.saldoDespues)}</td>
                      </tr>
                    ))}
                    {b.movimientos.length === 0 && (
                      <tr>
                        <td className="px-3 py-3 text-slate-400" colSpan={6}>
                          Sin movimientos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
