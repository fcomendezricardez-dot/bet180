"use client";

import { useState } from "react";
import { etiquetaCorta } from "@/lib/format";

type StatusApuesta = "EN_JUEGO" | "GANADA" | "PERDIDA";

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
  statusApuesta: StatusApuesta;
  resultadoGanancia: number | null;
};

const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
const fechaHora = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

const FILTROS: { value: "TODAS" | StatusApuesta; label: string }[] = [
  { value: "TODAS", label: "Todas" },
  { value: "EN_JUEGO", label: "En juego" },
  { value: "GANADA", label: "Ganadas" },
  { value: "PERDIDA", label: "Perdidas" },
];

const badgeClase: Record<StatusApuesta, string> = {
  EN_JUEGO: "bg-amber-100 text-amber-700",
  GANADA: "bg-emerald-100 text-emerald-700",
  PERDIDA: "bg-red-100 text-red-700",
};

const badgeLabel: Record<StatusApuesta, string> = {
  EN_JUEGO: "En juego",
  GANADA: "Ganada",
  PERDIDA: "Perdida",
};

export function ApuestasTable({ apuestas }: { apuestas: Fila[] }) {
  const [filtro, setFiltro] = useState<"TODAS" | StatusApuesta>("TODAS");
  const [letra, setLetra] = useState<string>("TODAS");

  const letras = Array.from(new Set(apuestas.map((a) => a.letra))).sort();

  const visibles = apuestas.filter((a) => {
    if (filtro !== "TODAS" && a.statusApuesta !== filtro) return false;
    if (letra !== "TODAS" && a.letra !== letra) return false;
    return true;
  });

  const totales = {
    enJuego: apuestas.filter((a) => a.statusApuesta === "EN_JUEGO").length,
    ganadas: apuestas.filter((a) => a.statusApuesta === "GANADA").length,
    perdidas: apuestas.filter((a) => a.statusApuesta === "PERDIDA").length,
    riesgoEnJuego: apuestas
      .filter((a) => a.statusApuesta === "EN_JUEGO")
      .reduce((acc, a) => acc + a.saldoReal + a.bono, 0),
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-400">En juego</p>
          <p className="text-lg font-semibold text-amber-600">{totales.enJuego}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-400">Ganadas</p>
          <p className="text-lg font-semibold text-emerald-600">{totales.ganadas}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-400">Perdidas</p>
          <p className="text-lg font-semibold text-red-600">{totales.perdidas}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-400">Monto en riesgo (En juego)</p>
          <p className="text-lg font-semibold text-slate-900">{money(totales.riesgoEnJuego)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltro(f.value)}
              className={`rounded px-3 py-1 text-xs font-medium ${
                filtro === f.value ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {letras.length > 1 && (
          <select
            value={letra}
            onChange={(e) => setLetra(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            <option value="TODAS">Todas las letras</option>
            {letras.map((l) => (
              <option key={l} value={l}>
                Letra {l}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Cuenta</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">No. apuesta</th>
              <th className="px-3 py-2">Evento</th>
              <th className="px-3 py-2">Descripción</th>
              <th className="px-3 py-2">Mercado</th>
              <th className="px-3 py-2">Momio</th>
              <th className="px-3 py-2">Efectivo</th>
              <th className="px-3 py-2">Bono</th>
              <th className="px-3 py-2">Posible Ganancia</th>
              <th className="px-3 py-2">Resultado</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibles.map((a) => (
              <tr key={a.id}>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-500">{fechaHora(a.fecha)}</td>
                <td className="px-3 py-2">{etiquetaCorta(a.casino, a.perfil)}</td>
                <td className="px-3 py-2">{a.cliente ?? "sin cliente asignado"}</td>
                <td className="px-3 py-2">{a.noApuesta ?? "—"}</td>
                <td className="px-3 py-2">{a.evento}</td>
                <td className="px-3 py-2">{a.descripcion ?? "—"}</td>
                <td className="px-3 py-2">{a.mercado}</td>
                <td className="px-3 py-2">{a.momio}</td>
                <td className="px-3 py-2">{money(a.saldoReal)}</td>
                <td className="px-3 py-2">
                  {money(a.bono)}
                  {a.bono > 0 && a.tipoBono && (
                    <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                      {a.tipoBono === "FREEBET" ? "Freebet" : "Dinero"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{money(a.posibleGanancia)}</td>
                <td className="px-3 py-2">{a.resultadoGanancia !== null ? money(a.resultadoGanancia) : "—"}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClase[a.statusApuesta]}`}>
                    {badgeLabel[a.statusApuesta]}
                  </span>
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-slate-400" colSpan={13}>
                  Sin apuestas con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
