"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import type { cuentasEnRiesgoDeFondeo, proximosARecarga, vencimientosIne } from "@/lib/puntoAtencion";

type Ine = Awaited<ReturnType<typeof vencimientosIne>>;
type Recargas = Awaited<ReturnType<typeof proximosARecarga>>;
type Fondeo = Awaited<ReturnType<typeof cuentasEnRiesgoDeFondeo>>;

function Badge({ children, clase }: { children: React.ReactNode; clase: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${clase}`}>{children}</span>;
}

const TABS = [
  { value: "ine", label: "Vencimiento de INE" },
  { value: "recargas", label: "Próx. a Recarga" },
  { value: "fondeo", label: "Fondeo de Bancos" },
] as const;

type Tab = (typeof TABS)[number]["value"];

export function AtencionTabs({ ine, recargas, fondeo }: { ine: Ine; recargas: Recargas; fondeo: Fondeo }) {
  const [tab, setTab] = useState<Tab>("ine");

  const conteos: Record<Tab, number> = { ine: ine.length, recargas: recargas.length, fondeo: fondeo.length };

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              tab === t.value ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {t.label}
            {conteos[t.value] > 0 && (
              <span
                className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                  tab === t.value ? "bg-white/20" : "bg-slate-200 text-slate-600"
                }`}
              >
                {conteos[t.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "ine" && (
        <section>
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
      )}

      {tab === "recargas" && (
        <section>
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
                    <td className="px-3 py-2">{new Intl.DateTimeFormat("es-MX").format(new Date(c.ultRecarga!))}</td>
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
      )}

      {tab === "fondeo" && (
        <section>
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
      )}
    </div>
  );
}
