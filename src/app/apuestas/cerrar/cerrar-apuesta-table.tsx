"use client";

import { useState, useTransition } from "react";
import { accionCerrarGanada, accionCerrarPerdida } from "./actions";

type Fila = {
  id: number;
  fecha: string;
  letra: string;
  perfil: string;
  casino: string;
  evento: string;
  mercado: string;
  momio: number;
  saldoReal: number;
  bono: number;
  posibleGanancia: number;
};

const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export function CerrarApuestaTable({ apuestas }: { apuestas: Fila[] }) {
  const [filas, setFilas] = useState(apuestas);
  const [gananciaAbierta, setGananciaAbierta] = useState<number | null>(null);
  const [montoGanancia, setMontoGanancia] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">Perfil</th>
              <th className="px-3 py-2">Casino</th>
              <th className="px-3 py-2">Evento</th>
              <th className="px-3 py-2">Mercado</th>
              <th className="px-3 py-2">Momio</th>
              <th className="px-3 py-2">Apostado</th>
              <th className="px-3 py-2">Posible Ganancia</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map((f) => (
              <tr key={f.id}>
                <td className="px-3 py-2">
                  {f.letra}.{f.perfil}
                </td>
                <td className="px-3 py-2">{f.casino}</td>
                <td className="px-3 py-2">{f.evento}</td>
                <td className="px-3 py-2">{f.mercado}</td>
                <td className="px-3 py-2">{f.momio}</td>
                <td className="px-3 py-2">{money(f.saldoReal + f.bono)}</td>
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
  );
}
