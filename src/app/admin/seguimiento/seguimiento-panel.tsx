"use client";

import { Fragment, useEffect, useState, useTransition } from "react";
import {
  accionActualizarSeguimiento,
  accionAgregarAvance,
  accionBuscarClientesSeguimiento,
  accionCasinosYCuentasDeCliente,
  accionCrearSeguimiento,
  accionListAvances,
  accionListOperadoresActivos,
  accionListSeguimientos,
  accionListUsuariosActivos,
} from "./actions";

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";
const labelClass = "text-sm";
const GESTION_CONOCIDA = ["Actualización de datos", "Actualización de fotos", "Otros"];

type Fila = Awaited<ReturnType<typeof accionListSeguimientos>>[number];
type ClienteOpcion = { id: string; nombreCompleto: string };
type CuentasCasinosCliente = Awaited<ReturnType<typeof accionCasinosYCuentasDeCliente>>;

const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
const fecha = (iso: string | Date) => new Intl.DateTimeFormat("es-MX").format(new Date(iso));
const fechaHora = (iso: string | Date) =>
  new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

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

  const [cuentasCasinos, setCuentasCasinos] = useState<CuentasCasinosCliente | null>(null);
  const [casinoId, setCasinoId] = useState("");
  const [cuentaId, setCuentaId] = useState("");

  const [operadores, setOperadores] = useState<{ id: string; nombre: string; letra: string | null }[]>([]);
  const [operadorId, setOperadorId] = useState("");
  const [responsables, setResponsables] = useState<{ id: string; nombre: string }[]>([]);
  const [responsableId, setResponsableId] = useState("");

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    accionListUsuariosActivos().then(setResponsables);
    accionListOperadoresActivos().then(setOperadores);
  }, []);

  useEffect(() => {
    if (!clienteQuery.trim()) return;
    const handle = setTimeout(() => {
      startTransition(async () => setClienteResultados(await accionBuscarClientesSeguimiento(clienteQuery)));
    }, 250);
    return () => clearTimeout(handle);
  }, [clienteQuery]);

  function elegirCliente(c: ClienteOpcion) {
    setClienteId(c.id);
    setClienteNombre(c.nombreCompleto);
    setClienteQuery("");
    setClienteResultados([]);
    setCasinoId("");
    setCuentaId("");
    setCuentasCasinos(null);
    startTransition(async () => setCuentasCasinos(await accionCasinosYCuentasDeCliente(c.id)));
  }

  function quitarCliente() {
    setClienteId("");
    setClienteNombre("");
    setCasinoId("");
    setCuentaId("");
    setCuentasCasinos(null);
  }

  function limpiar() {
    setTitulo("");
    setTipo("");
    setPrioridad("MEDIA");
    setFechaEntrega("");
    setCantidadInvolucrada("");
    setNotas("");
    setClienteQuery("");
    quitarCliente();
    setOperadorId("");
    setResponsableId("");
  }

  function crear() {
    setMensaje(null);
    startTransition(async () => {
      const result = await accionCrearSeguimiento({
        titulo,
        tipo,
        prioridad,
        clienteId: clienteId || undefined,
        operadorId: operadorId || undefined,
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
          Gestión
          <input
            className={inputClass}
            list="gestion-seguimiento"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          />
          <datalist id="gestion-seguimiento">
            {GESTION_CONOCIDA.map((t) => (
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
          Operador (quien reporta)
          <select className={inputClass} value={operadorId} onChange={(e) => setOperadorId(e.target.value)}>
            <option value="">— sin asignar —</option>
            {operadores.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre} ({o.letra})
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Responsable (quien lo resuelve)
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
            <button type="button" onClick={quitarCliente} className="text-xs text-slate-500 underline">
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
                  onClick={() => elegirCliente(c)}
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
        <label className={labelClass}>
          Casino involucrado (opcional)
          <select
            className={inputClass}
            value={casinoId}
            disabled={!clienteId}
            onChange={(e) => setCasinoId(e.target.value)}
          >
            <option value="">{clienteId ? "— sin casino —" : "selecciona un cliente primero"}</option>
            {cuentasCasinos?.casinos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombreCasino} ({c.perfil})
              </option>
            ))}
          </select>
          {clienteId && cuentasCasinos && cuentasCasinos.casinos.length === 0 && (
            <p className="mt-0.5 text-xs text-slate-400">Este cliente no tiene casinos registrados.</p>
          )}
        </label>
        <label className={labelClass}>
          Banco involucrado (opcional)
          <select
            className={inputClass}
            value={cuentaId}
            disabled={!clienteId}
            onChange={(e) => setCuentaId(e.target.value)}
          >
            <option value="">{clienteId ? "— sin banco —" : "selecciona un cliente primero"}</option>
            {cuentasCasinos?.cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.banco} ({c.perfil})
              </option>
            ))}
          </select>
          {clienteId && cuentasCasinos && cuentasCasinos.cuentas.length === 0 && (
            <p className="mt-0.5 text-xs text-slate-400">Este cliente no tiene bancos registrados.</p>
          )}
        </label>
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

function HistorialAvance({ seguimientoId, onCambio }: { seguimientoId: number; onCambio: () => void }) {
  const [avances, setAvances] = useState<{ id: number; fecha: Date | string; descripcion: string; registradoPor: string }[]>([]);
  const [cargado, setCargado] = useState(false);
  const [nuevo, setNuevo] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function recargar() {
    accionListAvances(seguimientoId).then((data) => {
      setAvances(data);
      setCargado(true);
    });
  }

  useEffect(() => {
    recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seguimientoId]);

  function agregar() {
    setMensaje(null);
    startTransition(async () => {
      const result = await accionAgregarAvance(seguimientoId, nuevo);
      if (result.ok) {
        setNuevo("");
        recargar();
        onCambio();
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  return (
    <div className="space-y-2 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-600">Historial de avance</p>
      {!cargado ? (
        <p className="text-xs text-slate-400">Cargando…</p>
      ) : avances.length === 0 ? (
        <p className="text-xs text-slate-400">Sin avances registrados todavía.</p>
      ) : (
        <ul className="space-y-1">
          {avances.map((a) => (
            <li key={a.id} className="rounded border border-slate-200 bg-white px-2 py-1 text-xs">
              <span className="font-medium text-slate-700">{fechaHora(a.fecha)}</span>
              <span className="ml-2 text-slate-500">({a.registradoPor})</span>
              <p className="mt-0.5 text-slate-700">{a.descripcion}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Agregar avance (ej. cliente envió fotos, falta una)…"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
        />
        <button
          type="button"
          disabled={pending || !nuevo.trim()}
          onClick={agregar}
          className="rounded bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Agregar
        </button>
      </div>
      {mensaje && <p className="text-xs text-red-600">{mensaje}</p>}
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
  const [expandido, setExpandido] = useState<number | null>(null);
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
                  <th className="px-3 py-2">Gestión</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Prioridad</th>
                  <th className="px-3 py-2">Operador</th>
                  <th className="px-3 py-2">Responsable</th>
                  <th className="px-3 py-2">Fecha entrega</th>
                  <th className="px-3 py-2">Casino/Banco</th>
                  <th className="px-3 py-2">Cantidad</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.map((f) => (
                  <Fragment key={f.id}>
                    <tr>
                      <td className="px-3 py-2">{f.titulo}</td>
                      <td className="px-3 py-2">{f.tipo}</td>
                      <td className="px-3 py-2">{f.cliente ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgePrioridad[f.prioridad]}`}>
                          {f.prioridad}
                        </span>
                      </td>
                      <td className="px-3 py-2">{f.operador ?? "—"}</td>
                      <td className="px-3 py-2">{f.responsable ?? "—"}</td>
                      <td className="px-3 py-2">{f.fechaEntrega ? fecha(f.fechaEntrega) : "—"}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{f.casino ?? f.banco ?? "—"}</td>
                      <td className="px-3 py-2">{f.cantidadInvolucrada !== null ? money(f.cantidadInvolucrada) : "—"}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandido(expandido === f.id ? null : f.id)}
                            className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            {expandido === f.id ? "Ocultar" : `Historial${f.numAvances > 0 ? ` (${f.numAvances})` : ""}`}
                          </button>
                          {f.estado === "PENDIENTE" && (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => completar(f.id)}
                              className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Completar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandido === f.id && (
                      <tr>
                        <td colSpan={10} className="p-0">
                          <HistorialAvance seguimientoId={f.id} onCambio={recargar} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {visibles.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-slate-400" colSpan={10}>
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
