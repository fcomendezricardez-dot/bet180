"use client";

import { useEffect, useState, useTransition } from "react";
import {
  accionActualizarReglaBono,
  accionCrearReglaBono,
  accionEliminarReglaBono,
  accionListReglasBono,
} from "./actions";

type Regla = Awaited<ReturnType<typeof accionListReglasBono>>[number];
type Tier = { depositoMin: string; depositoMax: string; bonoMonto: string };

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";
const labelClass = "text-sm";
const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const TIPO_LABEL: Record<Regla["tipo"], string> = {
  DEPOSITO_MES: "Primer depósito del mes",
  CADA_N_DIAS: "Cada N días",
  BIENVENIDA: "Bienvenida (una vez)",
};

function tierVacio(): Tier {
  return { depositoMin: "", depositoMax: "", bonoMonto: "" };
}

export function ReglasBono({ casinoId }: { casinoId: string }) {
  const [reglas, setReglas] = useState<Regla[]>([]);
  const [editandoId, setEditandoId] = useState<number | "nueva" | null>(null);
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<Regla["tipo"]>("CADA_N_DIAS");
  const [diaCorteMes, setDiaCorteMes] = useState("15");
  const [cadaDias, setCadaDias] = useState("25");
  const [momioMinimo, setMomioMinimo] = useState("");
  const [montoMinimo, setMontoMinimo] = useState("");
  const [multiplicador, setMultiplicador] = useState("");
  const [activo, setActivo] = useState(true);
  const [notas, setNotas] = useState("");
  const [tiers, setTiers] = useState<Tier[]>([tierVacio()]);

  function cargarReglas() {
    startTransition(async () => setReglas(await accionListReglasBono(casinoId)));
  }

  useEffect(() => {
    cargarReglas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casinoId]);

  function limpiarForm() {
    setEditandoId(null);
    setNombre("");
    setTipo("CADA_N_DIAS");
    setDiaCorteMes("15");
    setCadaDias("25");
    setMomioMinimo("");
    setMontoMinimo("");
    setMultiplicador("");
    setActivo(true);
    setNotas("");
    setTiers([tierVacio()]);
    setMensaje(null);
  }

  function editar(r: Regla) {
    setEditandoId(r.id);
    setNombre(r.nombre);
    setTipo(r.tipo);
    setDiaCorteMes(r.diaCorteMes?.toString() ?? "15");
    setCadaDias(r.cadaDias?.toString() ?? "25");
    setMomioMinimo(r.momioMinimo?.toString() ?? "");
    setMontoMinimo(r.montoMinimo?.toString() ?? "");
    setMultiplicador(r.multiplicador?.toString() ?? "");
    setActivo(r.activo);
    setNotas(r.notas ?? "");
    setTiers(
      r.tiers.length > 0
        ? r.tiers.map((t) => ({
            depositoMin: t.depositoMin.toString(),
            depositoMax: t.depositoMax?.toString() ?? "",
            bonoMonto: t.bonoMonto.toString(),
          }))
        : [tierVacio()],
    );
    setMensaje(null);
  }

  function eliminar(id: number) {
    if (!confirm("¿Eliminar esta regla de bono? También se borra su historial de reclamos.")) return;
    startTransition(async () => {
      const result = await accionEliminarReglaBono(id);
      if (result.ok) {
        cargarReglas();
        if (editandoId === id) limpiarForm();
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  function guardar() {
    setMensaje(null);
    const tiersLimpios = tiers
      .filter((t) => t.depositoMin !== "" && t.bonoMonto !== "")
      .map((t) => ({
        depositoMin: parseFloat(t.depositoMin) || 0,
        depositoMax: t.depositoMax ? parseFloat(t.depositoMax) : undefined,
        bonoMonto: parseFloat(t.bonoMonto) || 0,
      }));

    const datos = {
      nombre,
      tipo,
      diaCorteMes: tipo === "DEPOSITO_MES" ? parseInt(diaCorteMes, 10) || undefined : undefined,
      cadaDias: tipo === "CADA_N_DIAS" ? parseInt(cadaDias, 10) || undefined : undefined,
      momioMinimo: tipo === "BIENVENIDA" && momioMinimo ? parseFloat(momioMinimo) : undefined,
      montoMinimo: tipo === "BIENVENIDA" && montoMinimo ? parseFloat(montoMinimo) : undefined,
      multiplicador: multiplicador ? parseFloat(multiplicador) : undefined,
      activo,
      notas: notas || undefined,
      tiers: tiersLimpios,
    };

    startTransition(async () => {
      const result =
        editandoId === "nueva" || editandoId === null
          ? await accionCrearReglaBono({ casinoId, ...datos })
          : await accionActualizarReglaBono(editandoId, datos);
      if (result.ok) {
        limpiarForm();
        cargarReglas();
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  const mostrandoForm = editandoId !== null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Reglas de Bono / Promociones</h3>

      {!mostrandoForm && (
        <div className="space-y-2">
          {reglas.map((r) => (
            <div key={r.id} className="rounded border border-slate-200 bg-white p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-900">{r.nombre}</span>{" "}
                  <span className="text-xs text-slate-400">
                    ({TIPO_LABEL[r.tipo]}
                    {r.tipo === "CADA_N_DIAS" && r.cadaDias ? ` · cada ${r.cadaDias} días` : ""}
                    {r.tipo === "DEPOSITO_MES" && r.diaCorteMes ? ` · hasta el día ${r.diaCorteMes}` : ""})
                  </span>
                  {!r.activo && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-500">inactiva</span>}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => editar(r)} className="text-xs text-slate-600 underline">
                    Editar
                  </button>
                  <button type="button" onClick={() => eliminar(r.id)} className="text-xs text-red-600 underline">
                    Eliminar
                  </button>
                </div>
              </div>
              {r.multiplicador ? (
                <p className="mt-1 text-xs text-slate-500">Bono = depósito × {r.multiplicador}</p>
              ) : (
                r.tiers.length > 0 && (
                  <ul className="mt-1 text-xs text-slate-500">
                    {r.tiers.map((t) => (
                      <li key={t.id}>
                        Depositas {money(t.depositoMin)}
                        {t.depositoMax ? `–${money(t.depositoMax)}` : "+"} → bono {money(t.bonoMonto)}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          ))}
          {reglas.length === 0 && <p className="text-sm text-slate-400">Sin reglas de bono configuradas.</p>}
          <button
            type="button"
            onClick={() => setEditandoId("nueva")}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            + Nueva regla de bono
          </button>
        </div>
      )}

      {mostrandoForm && (
        <div className="space-y-3 rounded border border-slate-200 bg-slate-50 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              Nombre
              <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>
            <label className={labelClass}>
              Tipo
              <select className={inputClass} value={tipo} onChange={(e) => setTipo(e.target.value as Regla["tipo"])}>
                <option value="CADA_N_DIAS">Cada N días</option>
                <option value="DEPOSITO_MES">Primer depósito del mes</option>
                <option value="BIENVENIDA">Bienvenida (una vez)</option>
              </select>
            </label>
            {tipo === "CADA_N_DIAS" && (
              <label className={labelClass}>
                Cada cuántos días
                <input type="number" className={inputClass} value={cadaDias} onChange={(e) => setCadaDias(e.target.value)} />
              </label>
            )}
            {tipo === "DEPOSITO_MES" && (
              <label className={labelClass}>
                Día límite del mes
                <input type="number" min="1" max="31" className={inputClass} value={diaCorteMes} onChange={(e) => setDiaCorteMes(e.target.value)} />
              </label>
            )}
            {tipo === "BIENVENIDA" && (
              <>
                <label className={labelClass}>
                  Momio mínimo (decimal, ej. 1.5)
                  <input type="number" step="0.01" className={inputClass} value={momioMinimo} onChange={(e) => setMomioMinimo(e.target.value)} />
                </label>
                <label className={labelClass}>
                  Monto mínimo de apuesta
                  <input type="number" step="0.01" className={inputClass} value={montoMinimo} onChange={(e) => setMontoMinimo(e.target.value)} />
                </label>
              </>
            )}
            <label className={labelClass}>
              Multiplicador (ej. 2 = el doble del depósito)
              <p className="mt-0.5 text-xs font-normal text-slate-400">Si lo llenas, ignora la tabla de tiers de abajo.</p>
              <input type="number" step="0.01" className={inputClass} value={multiplicador} onChange={(e) => setMultiplicador(e.target.value)} />
            </label>
          </div>

          <div className={multiplicador ? "opacity-40" : ""}>
            <p className="mb-1 text-sm font-medium text-slate-700">Tabla de depósito → bono</p>
            {tiers.map((t, i) => (
              <div key={i} className="mb-2 grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Depósito mínimo"
                  className={inputClass}
                  value={t.depositoMin}
                  onChange={(e) => setTiers(tiers.map((x, j) => (i === j ? { ...x, depositoMin: e.target.value } : x)))}
                />
                <input
                  type="number"
                  placeholder="Depósito máximo (vacío = sin tope)"
                  className={inputClass}
                  value={t.depositoMax}
                  onChange={(e) => setTiers(tiers.map((x, j) => (i === j ? { ...x, depositoMax: e.target.value } : x)))}
                />
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Bono otorgado"
                    className={inputClass}
                    value={t.bonoMonto}
                    onChange={(e) => setTiers(tiers.map((x, j) => (i === j ? { ...x, bonoMonto: e.target.value } : x)))}
                  />
                  <button
                    type="button"
                    onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
                    className="text-xs text-red-600"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setTiers([...tiers, tierVacio()])}
              className="text-xs text-slate-600 underline"
            >
              + Agregar tier
            </button>
          </div>

          <label className={labelClass}>
            Notas
            <textarea className={inputClass} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Regla activa
          </label>

          {mensaje && <p className="text-sm text-red-600">{mensaje}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || !nombre}
              onClick={guardar}
              className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Guardar regla
            </button>
            <button type="button" onClick={limpiarForm} className="text-xs text-slate-500 underline">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
