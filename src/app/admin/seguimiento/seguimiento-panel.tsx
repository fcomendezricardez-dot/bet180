"use client";

import { useEffect, useState, useTransition } from "react";
import {
  accionActualizarSeguimiento,
  accionBuscarCasinosSeguimiento,
  accionBuscarClientesSeguimiento,
  accionBuscarCuentasSeguimiento,
  accionCrearSeguimiento,
  accionListSeguimientos,
  accionListUsuariosActivos,
} from "./actions";

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";
const labelClass = "text-sm";
const TIPOS_CONOCIDOS = ["Falta de fotos", "Banco bloqueado", "Actualizar INE"];

type Fila = Awaited<ReturnType<typeof accionListSeguimientos>>[number];
type ClienteOpcion = { id: string; nombreCompleto: string };
type CasinoOpcion = { id: string; nombreCasino: string; letra: string; perfil: string };
type CuentaOpcion = { id: string; banco: string; letra: string; perfil: string };

const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
const fecha = (iso: string) => new Intl.DateTimeFormat("es-MX").format(new Date(iso));

function FormularioNuevo({ onCreado }: { onCreado: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");
  const [prioridad, setPrioridad] = useState<"BAJA" | "MEDIA" | "ALTA">("MEDIA");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [cantidadInvolucrada, setCantidadInvolucrada] = useState("");
  const [notas, setNotas] = useState("");

  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteResultados, setClienteResultados] = useState<ClienteOpcion[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");

  const [responsables, setResponsables] = useState<{ id: string; nombre: string }[]>([]);
  const [responsableId, setResponsableId] = useState("");

  const [casinoQuery, setCasinoQuery] = useState("");
  const [casinoResultados, setCasinoResultados] = useState<CasinoOpcion[]>([]);
  const [casinoId, setCasinoId] = useState("");
  const [casinoNombre, setCasinoNombre] = useState("");

  const [cuentaQuery, setCuentaQuery] = useState("");
  const [cuentaResultados, setCuentaResultados] = useState<CuentaOpcion[]>([]);
  const [cuentaId, setCuentaId] = useState("");
  const [cuentaNombre, setCuentaNombre] = useState("");

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    accionListUsuariosActivos().then(setResponsables);
  }, []);

  useEffect(() => {
    if (!clienteQuery.trim()) return;
    const handle = setTimeout(() => {
      startTransition(async () => setClienteResultados(await accionBuscarClientesSeguimiento(clienteQuery)));
    }, 250);
    return () => clearTimeout(handle);
  }, [clienteQuery]);

  useEffect(() => {
    if (!casinoQuery.trim()) return;
    const handle = setTimeout(() => {
      startTransition(async () => setCasinoResultados(await accionBuscarCasinosSeguimiento(casinoQuery)));
    }, 250);
    return () => clearTimeout(handle);
  }, [casinoQuery]);

  useEffect(() => {
    if (!cuentaQuery.trim()) return;
    const handle = setTimeout(() => {
      startTransition(async () => setCuentaResultados(await accionBuscarCuentasSeguimiento(cuentaQuery)));
    }, 250);
    return () => clearTimeout(handle);
  }, [cuentaQuery]);

  function limpiar() {
    setTitulo("");
    setTipo("");
    setPrioridad("MEDIA");
    setFechaEntrega("");
    setCantidadInvolucrada("");
    setNotas("");
    setClienteQuery("");
    setClienteId("");
    setClienteNombre("");
    setResponsableId("");
    setCasinoQuery("");
    setCasinoId("");
    setCasinoNombre("");
    setCuentaQuery("");
    setCuentaId("");
    setCuentaNombre("");
  }

  function crear() {
    setMensaje(null);
    startTransition(async () => {
      const result = await accionCrearSeguimiento({
        titulo,
        tipo,
        prioridad,
        clienteId: clienteId || undefined,
        responsableId: responsableId || undefined,
        fechaEntrega: fechaEntrega || undefined,
        casinoInvolucradoId: casinoId || undefined,
        bancoInvolucradoId: cuentaId || undefined,
        cantidadInvolucrada: cantidadInvolucrada ? parseFloat(cantidadInvolucrada) : undefined,
        notas: notas || undefined,
      });
      if (result.ok) {
        limpiar();
        setMensaje("Seguimiento creado.");
        onCreado();
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">Nuevo seguimiento</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Título
          <input className={inputClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </label>
        <label className={labelClass}>
          Tipo
          <input
            className={inputClass}
            list="tipos-seguimiento"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          />
          <datalist id="tipos-seguimiento">
            {TIPOS_CONOCIDOS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
        <label className={labelClass}>
          Prioridad
          <select className={inputClass} value={prioridad} onChange={(e) => setPrioridad(e.target.value as typeof prioridad)}>
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
          </select>
        </label>
        <label className={labelClass}>
          Fecha de entrega
          <input type="date" className={inputClass} value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
        </label>
        <label className={labelClass}>
          Responsable
          <select className={inputClass} value={responsableId} onChange={(e) => setResponsableId(e.target.value)}>
            <option value="">— sin asignar —</option>
            {responsables.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Cantidad involucrada (opcional)
          <input
            type="number"
            step="0.01"
            className={inputClass}
            value={cantidadInvolucrada}
            onChange={(e) => setCantidadInvolucrada(e.target.value)}
          />
        </label>
      </div>

      <div>
        <p className={labelClass}>Cliente</p>
        {clienteId ? (
          <div className="mt-1 flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span>{clienteNombre}</span>
            <button type="button" onClick={() => { setClienteId(""); setClienteNombre(""); }} className="text-xs text-slate-500 underline">
              Quitar
            </button>
          </div>
        ) : (
          <input
            type="text"
            placeholder="Buscar cliente por nombre o ID…"
            className={inputClass}
            value={clienteQuery}
            onChange={(e) => setClienteQuery(e.target.value)}
          />
        )}
        {!clienteId && clienteQuery.trim() && clienteResultados.length > 0 && (
          <ul className="mt-1 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
            {clienteResultados.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => { setClienteId(c.id); setClienteNombre(c.nombreCompleto); setClienteQuery(""); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {c.nombreCompleto} <span className="text-xs text-slate-400">({c.id})</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className={labelClass}>Casino involucrado (opcional)</p>
          {casinoId ? (
            <div className="mt-1 flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span>{casinoNombre}</span>
              <button type="button" onClick={() => { setCasinoId(""); setCasinoNombre(""); }} className="text-xs text-slate-500 underline">
                Quitar
              </button>
            </div>
          ) : (
            <input
              type="text"
              placeholder="Buscar casino…"
              className={inputClass}
              value={casinoQuery}
              onChange={(e) => setCasinoQuery(e.target.value)}
            />
          )}
          {!casinoId && casinoQuery.trim() && casinoResultados.length > 0 && (
            <ul className="mt-1 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
              {casinoResultados.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => { setCasinoId(c.id); setCasinoNombre(`${c.nombreCasino} (${c.perfil})`); setCasinoQuery(""); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {c.nombreCasino} <span className="text-xs text-slate-400">({c.letra}.{c.perfil})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className={labelClass}>Banco involucrado (opcional)</p>
          {cuentaId ? (
            <div className="mt-1 flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span>{cuentaNombre}</span>
              <button type="button" onClick={() => { setCuentaId(""); setCuentaNombre(""); }} className="text-xs text-slate-500 underline">
                Quitar
              </button>
            </div>
          ) : (
            <input
              type="text"
              placeholder="Buscar banco…"
              className={inputClass}
              value={cuentaQuery}
              onChange={(e) => setCuentaQuery(e.target.value)}
            />
          )}
          {!cuentaId && cuentaQuery.trim() && cuentaResultados.length > 0 && (
            <ul className="mt-1 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
              {cuentaResultados.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => { setCuentaId(c.id); setCuentaNombre(`${c.banco} (${c.perfil})`); setCuentaQuery(""); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {c.banco} <span className="text-xs text-slate-400">({c.letra}.{c.perfil})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <label className={labelClass}>
        Notas
        <textarea className={inputClass} value={notas} onChange={(e) => setNotas(e.target.value)} />
      </label>

      {mensaje && <p className="text-sm text-slate-600">{mensaje}</p>}
      <button
        type="button"
        disabled={pending || !titulo || !tipo}
        onClick={crear}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        Crear seguimiento
      </button>
    </div>
  );
}

const badgePrioridad: Record<Fila["prioridad"], string> = {
  BAJA: "bg-slate-100 text-slate-600",
  MEDIA: "bg-amber-100 text-amber-700",
  ALTA: "bg-red-100 text-red-700",
};

export function SeguimientoPanel() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [cargado, setCargado] = useState(false);
  const [filtro, setFiltro] = useState<"PENDIENTE" | "COMPLETADO" | "TODOS">("PENDIENTE");
  const [pending, startTransition] = useTransition();

  function recargar() {
    accionListSeguimientos().then((data) => {
      setFilas(data);
      setCargado(true);
    });
  }

  useEffect(() => {
    recargar();
  }, []);

  function completar(id: number) {
    startTransition(async () => {
      await accionActualizarSeguimiento(id, { estado: "COMPLETADO" });
      recargar();
    });
  }

  const visibles = filas.filter((f) => filtro === "TODOS" || f.estado === filtro);

  return (
    <div className="space-y-6">
      <FormularioNuevo onCreado={recargar} />

      <div>
        <div className="mb-3 flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["PENDIENTE", "COMPLETADO", "TODOS"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                filtro === f ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f === "PENDIENTE" ? "Pendientes" : f === "COMPLETADO" ? "Completados" : "Todos"}
            </button>
          ))}
        </div>

        {!cargado ? (
          <p className="text-sm text-slate-400">Cargando…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2">Título</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Prioridad</th>
                  <th className="px-3 py-2">Responsable</th>
                  <th className="px-3 py-2">Fecha entrega</th>
                  <th className="px-3 py-2">Casino/Banco</th>
                  <th className="px-3 py-2">Cantidad</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.map((f) => (
                  <tr key={f.id}>
                    <td className="px-3 py-2">{f.titulo}</td>
                    <td className="px-3 py-2">{f.tipo}</td>
                    <td className="px-3 py-2">{f.cliente ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgePrioridad[f.prioridad]}`}>
                        {f.prioridad}
                      </span>
                    </td>
                    <td className="px-3 py-2">{f.responsable ?? "—"}</td>
                    <td className="px-3 py-2">{f.fechaEntrega ? fecha(f.fechaEntrega) : "—"}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">{f.casino ?? f.banco ?? "—"}</td>
                    <td className="px-3 py-2">{f.cantidadInvolucrada !== null ? money(f.cantidadInvolucrada) : "—"}</td>
                    <td className="px-3 py-2">
                      {f.estado === "PENDIENTE" ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => completar(f.id)}
                          className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Completar
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Completado</span>
                      )}
                    </td>
                  </tr>
                ))}
                {visibles.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-slate-400" colSpan={9}>
                      Sin seguimientos con este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
