"use client";

import { useEffect, useState, useTransition } from "react";
import { accionMarcarRolloverLiberado, accionReclamosConRolloverPendiente } from "./actions";

type Reclamo = Awaited<ReturnType<typeof accionReclamosConRolloverPendiente>>[number];

const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
const fecha = (d: Date | string) => new Intl.DateTimeFormat("es-MX").format(new Date(d));

function etiquetaCasino(casino: { nombreCasino: string; perfil: string }) {
  return `${casino.nombreCasino.slice(0, 4)}${casino.perfil}`;
}

export function RolloverPendiente() {
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [cargado, setCargado] = useState(false);
  const [pending, startTransition] = useTransition();

  function recargar() {
    accionReclamosConRolloverPendiente().then((data) => {
      setReclamos(data);
      setCargado(true);
    });
  }

  useEffect(() => {
    recargar();
  }, []);

  function marcarLiberado(id: number) {
    startTransition(async () => {
      await accionMarcarRolloverLiberado(id, true);
      recargar();
    });
  }

  if (!cargado) return null;
  if (reclamos.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-semibold text-slate-900">Rollover pendiente</h2>
      <p className="mb-2 text-xs text-slate-500">
        Progreso calculado con las apuestas de dinero real vinculadas a cada reclamo. Ganadoras cuentan lo menor entre
        arriesgado y ganado; perdedoras cuentan lo arriesgado; el bono no cuenta.
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">Casino</th>
              <th className="px-3 py-2">Bono</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Progreso</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reclamos.map((r) => {
              const pct = Math.min(100, Math.round((r.progreso / r.rolloverRequerido) * 100));
              return (
                <tr key={r.id}>
                  <td className="px-3 py-2">
                    <span className="font-medium">{etiquetaCasino(r.casino)}</span>
                    <span className="block text-xs text-slate-400">{r.cliente?.nombreCompleto ?? "sin cliente asignado"}</span>
                  </td>
                  <td className="px-3 py-2">{r.nombreRegla}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{fecha(r.fecha)}</td>
                  <td className="px-3 py-2">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full ${r.completo ? "bg-emerald-500" : "bg-amber-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {money(r.progreso)} de {money(r.rolloverRequerido)} ({pct}%)
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => marcarLiberado(r.id)}
                      className="rounded bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      Marcar liberado
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
