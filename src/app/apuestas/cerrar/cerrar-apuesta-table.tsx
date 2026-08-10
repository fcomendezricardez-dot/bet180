"use client";

import { useMemo, useState, useTransition } from "react";
import { etiquetaCorta } from "@/lib/format";
import { accionCerrarGanada, accionCerrarPerdida } from "./actions";

type Fila = {
  id: number;
  fecha: string;
  letra: string;
  perfil: string;
  casino: string;
  cliente: string | null;
  noApuesta: string | null;
  evento: string;
  descripcion: string | null;
  mercado: string;
  momio: number;
  saldoReal: number;
  bono: number;
  tipoBono: "FREEBET" | "DINERO" | null;
  posibleGanancia: number;
};

const MERCADO_LABEL: Record<string, string> = { LOCAL: "Local", EMPATE: "Empate", VISITANTE: "Visitante" };

const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
const fechaHora = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

function agruparPorEvento(filas: Fila[]) {
  const grupos = new Map<string, Fila[]>();
  for (const f of filas) {
    const grupo = grupos.get(f.evento) ?? [];
    grupo.push(f);
    grupos.set(f.evento, grupo);
  }
  return [...grupos.entries()].map(([evento, apuestas]) => {
    const porMercado = new Map<string, number>();
    let totalApostado = 0;
    let totalPosibleGanancia = 0;
    for (const a of apuestas) {
      const apostado = a.saldoReal + a.bono;
      porMercado.set(a.mercado, (porMercado.get(a.mercado) ?? 0) + apostado);
      totalApostado += apostado;
      totalPosibleGanancia += a.posibleGanancia;
    }
    return { evento, apuestas, porMercado, totalApostado, totalPosibleGanancia };
  });
}

export function CerrarApuestaTable({ apuestas }: { apuestas: Fila[] }) {
  const [filas, setFilas] = useState(apuestas);
  const [busqueda, setBusqueda] = useState("");
  const [gananciaAbierta, setGananciaAbierta] = useState<number | null>(null);
  const [montoGanancia, setMontoGanancia] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const grupos = useMemo(() => {
    const filtradas = busqueda.trim()
      ? filas.filter((f) => f.evento.toLowerCase().includes(busqueda.trim().toLowerCase()))
      : filas;
    return agruparPorEvento(filtradas);
  }, [filas, busqueda]);

  function marcarPerdida(id: number) {
    setError(null);
    startTransition(async () => {
      const result = await accionCerrarPerdida(id);
      if (result.ok) {
        setFilas((prev) => prev.filter((f) => f.id !== id));
      } else {
        setError(result.error);
      }
    });
  }

  function confirmarGanada(id: number) {
    const monto = parseFloat(montoGanancia);
    if (Number.isNaN(monto) || monto <= 0) {
      setError("Ingresa un monto de ganancia válido.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await accionCerrarGanada(id, monto);
      if (result.ok) {
        setFilas((prev) => prev.filter((f) => f.id !== id));
        setGananciaAbierta(null);
        setMontoGanancia("");
      } else {
        setError(result.error);
      }
    });
  }

  if (filas.length === 0) {
    return <p className="text-sm text-slate-400">No hay apuestas En juego.</p>;
  }

  return (
    <div className="space-y-6">
      <input
        type="text"
        placeholder="Buscar evento..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full max-w-sm rounded border border-slate-300 px-3 py-1.5 text-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {grupos.length === 0 && <p className="text-sm text-slate-400">Sin eventos que coincidan con la búsqueda.</p>}

      {grupos.map((grupo) => (
        <div key={grupo.evento} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2">
            <span className="font-medium text-slate-900">{grupo.evento}</span>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {[...grupo.porMercado.entries()].map(([mercado, monto]) => (
                <span key={mercado} className="rounded bg-slate-200 px-2 py-1 font-medium text-slate-700">
                  {MERCADO_LABEL[mercado] ?? mercado}: {money(monto)}
                </span>
              ))}
              <span className="rounded bg-slate-900 px-2 py-1 font-medium text-white">
                Apostado: {money(grupo.totalApostado)}
              </span>
              <span className="rounded bg-emerald-600 px-2 py-1 font-medium text-white">
                Posible ganancia: {money(grupo.totalPosibleGanancia)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Cuenta</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">No. apuesta</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-3 py-2">Mercado</th>
                  <th className="px-3 py-2">Momio</th>
                  <th className="px-3 py-2">Efectivo</th>
                  <th className="px-3 py-2">Bono</th>
                  <th className="px-3 py-2">Posible Ganancia</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grupo.apuestas.map((f) => (
                  <tr key={f.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-500">{fechaHora(f.fecha)}</td>
                    <td className="px-3 py-2">{etiquetaCorta(f.casino, f.perfil)}</td>
                    <td className="px-3 py-2">{f.cliente ?? "sin cliente asignado"}</td>
                    <td className="px-3 py-2">{f.noApuesta ?? "—"}</td>
                    <td className="px-3 py-2">{f.descripcion ?? "—"}</td>
                    <td className="px-3 py-2">{MERCADO_LABEL[f.mercado] ?? f.mercado}</td>
                    <td className="px-3 py-2">{f.momio}</td>
                    <td className="px-3 py-2">{money(f.saldoReal)}</td>
                    <td className="px-3 py-2">
                      {money(f.bono)}
                      {f.bono > 0 && f.tipoBono && (
                        <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                          {f.tipoBono === "FREEBET" ? "Freebet" : "Dinero"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">{money(f.posibleGanancia)}</td>
                    <td className="px-3 py-2">
                      {gananciaAbierta === f.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            autoFocus
                            placeholder={f.posibleGanancia.toString()}
                            value={montoGanancia}
                            onChange={(e) => setMontoGanancia(e.target.value)}
                            className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => confirmarGanada(f.id)}
                            className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGananciaAbierta(null);
                              setMontoGanancia("");
                            }}
                            className="text-xs text-slate-500 underline"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              setGananciaAbierta(f.id);
                              setMontoGanancia(f.posibleGanancia.toString());
                              setError(null);
                            }}
                            className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Ganada
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => marcarPerdida(f.id)}
                            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Perdida
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
