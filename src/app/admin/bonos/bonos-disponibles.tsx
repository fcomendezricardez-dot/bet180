"use client";

import { useEffect, useState, useTransition } from "react";
import { accionBonosDisponibles, accionRegistrarReclamoBono } from "./actions";

type Bono = Awaited<ReturnType<typeof accionBonosDisponibles>>[number];

const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
const fecha = (d: Date | string) => new Intl.DateTimeFormat("es-MX").format(new Date(d));

const TIPO_LABEL: Record<Bono["tipo"], string> = {
  DEPOSITO_MES: "Primer depósito del mes",
  CADA_N_DIAS: "Cada N días",
  BIENVENIDA: "Bienvenida (una vez)",
};

function ReclamarForm({ bono, onDone }: { bono: Bono; onDone: () => void }) {
  const [monto, setMonto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function registrar() {
    setMensaje(null);
    startTransition(async () => {
      const result = await accionRegistrarReclamoBono(bono.id, parseFloat(monto) || 0);
      if (result.ok) {
        setAbierto(false);
        setMonto("");
        onDone();
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
      >
        Registrar reclamo
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        step="0.01"
        autoFocus
        placeholder="Monto depositado"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        className="w-28 rounded border border-slate-300 px-2 py-1 text-xs"
      />
      <button
        type="button"
        disabled={pending || !monto}
        onClick={registrar}
        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        Confirmar
      </button>
      <button type="button" onClick={() => setAbierto(false)} className="text-xs text-slate-500 underline">
        Cancelar
      </button>
      {mensaje && <span className="text-xs text-red-600">{mensaje}</span>}
    </div>
  );
}

export function BonosDisponibles() {
  const [bonos, setBonos] = useState<Bono[]>([]);
  const [cargado, setCargado] = useState(false);

  function recargar() {
    accionBonosDisponibles().then((data) => {
      setBonos(data);
      setCargado(true);
    });
  }

  useEffect(() => {
    recargar();
  }, []);

  if (!cargado) return <p className="text-sm text-slate-400">Cargando…</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-3 py-2">Casino</th>
            <th className="px-3 py-2">Bono</th>
            <th className="px-3 py-2">Tabla de depósito → bono</th>
            <th className="px-3 py-2">Último reclamo</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bonos.map((b) => (
            <tr key={b.id}>
              <td className="px-3 py-2">
                {b.casino.nombreCasino} <span className="text-xs text-slate-400">({b.casino.letra}.{b.casino.perfil})</span>
              </td>
              <td className="px-3 py-2">
                {b.nombre} <span className="text-xs text-slate-400">({TIPO_LABEL[b.tipo]})</span>
              </td>
              <td className="px-3 py-2 text-xs text-slate-500">
                {b.multiplicador ? (
                  <span>Depósito × {b.multiplicador}</span>
                ) : (
                  <>
                    {b.tiers.map((t) => (
                      <div key={t.id}>
                        {money(t.depositoMin)}
                        {t.depositoMax ? `–${money(t.depositoMax)}` : "+"} → {money(t.bonoMonto)}
                      </div>
                    ))}
                    {b.tiers.length === 0 && "—"}
                  </>
                )}
              </td>
              <td className="px-3 py-2">{b.ultimoReclamo ? fecha(b.ultimoReclamo) : "Nunca"}</td>
              <td className="px-3 py-2">
                {b.disponible ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Disponible ahora
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    {b.proximaFecha ? `Disponible el ${fecha(b.proximaFecha)}` : "No disponible"}
                  </span>
                )}
              </td>
              <td className="px-3 py-2">{b.disponible && <ReclamarForm bono={b} onDone={recargar} />}</td>
            </tr>
          ))}
          {bonos.length === 0 && (
            <tr>
              <td className="px-3 py-3 text-slate-400" colSpan={6}>
                Sin reglas de bono activas. Configúralas desde Gestión → Casinos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
