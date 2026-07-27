"use client";

import { useEffect, useState, useTransition } from "react";
import {
  accionActualizarApertura,
  accionBuscarClientesApertura,
  accionCrearApertura,
  accionListAperturas,
  accionListUsuariosActivosApertura,
} from "./actions";

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";
const labelClass = "text-sm";

type Fila = Awaited<ReturnType<typeof accionListAperturas>>[number];
type ClienteOpcion = { id: string; nombreCompleto: string };

const fechaHora = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

function FormularioNuevo({ onCreado }: { onCreado: () => void }) {
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [letra, setLetra] = useState("");
  const [bancoOCasino, setBancoOCasino] = useState("");
  const [fechaCita, setFechaCita] = useState("");
  const [notas, setNotas] = useState("");

  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteResultados, setClienteResultados] = useState<ClienteOpcion[]>([]);
  const [clienteId, setClienteId] = useState("");

  const [responsables, setResponsables] = useState<{ id: string; nombre: string }[]>([]);
  const [responsableId, setResponsableId] = useState("");

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    accionListUsuariosActivosApertura().then(setResponsables);
  }, []);

  useEffect(() => {
    if (!clienteQuery.trim()) return;
    const handle = setTimeout(() => {
      startTransition(async () => setClienteResultados(await accionBuscarClientesApertura(clienteQuery)));
    }, 250);
    return () => clearTimeout(handle);
  }, [clienteQuery]);

  function elegirCliente(c: ClienteOpcion) {
    setClienteId(c.id);
    setNombreCliente(c.nombreCompleto);
    setClienteQuery("");
    setClienteResultados([]);
  }

  function limpiar() {
    setNombreCliente("");
    setTelefono("");
    setLetra("");
    setBancoOCasino("");
    setFechaCita("");
    setNotas("");
    setClienteQuery("");
    setClienteId("");
    setResponsableId("");
  }

  function crear() {
    setMensaje(null);
    startTransition(async () => {
      const result = await accionCrearApertura({
        nombreCliente,
        telefono: telefono || undefined,
        letra: letra || undefined,
        clienteId: clienteId || undefined,
        bancoOCasino,
        fechaCita,
        responsableId: responsableId || undefined,
        notas: notas || undefined,
      });
      if (result.ok) {
        limpiar();
        setMensaje("Apertura agendada.");
        onCreado();
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">Agendar próxima apertura</h3>

      <div>
        <p className={labelClass}>Cliente ya existente (opcional — si no, escribe el nombre abajo)</p>
        <input
          type="text"
          placeholder="Buscar cliente por nombre o ID…"
          className={inputClass}
          value={clienteQuery}
          onChange={(e) => setClienteQuery(e.target.value)}
        />
        {clienteQuery.trim() && clienteResultados.length > 0 && (
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
        {clienteId && (
          <p className="mt-1 text-xs text-emerald-700">
            Vinculado a cliente existente.{" "}
            <button type="button" onClick={() => setClienteId("")} className="underline">
              Quitar
            </button>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Nombre
          <input className={inputClass} value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} />
        </label>
        <label className={labelClass}>
          Teléfono
          <input className={inputClass} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </label>
        <label className={labelClass}>
          Letra
          <input className={inputClass} value={letra} onChange={(e) => setLetra(e.target.value.toUpperCase())} maxLength={1} />
        </label>
        <label className={labelClass}>
          Banco o casino a abrir
          <input className={inputClass} value={bancoOCasino} onChange={(e) => setBancoOCasino(e.target.value)} />
        </label>
        <label className={labelClass}>
          Fecha y hora de la cita
          <input
            type="datetime-local"
            className={inputClass}
            value={fechaCita}
            onChange={(e) => setFechaCita(e.target.value)}
          />
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
      </div>

      <label className={labelClass}>
        Notas
        <textarea className={inputClass} value={notas} onChange={(e) => setNotas(e.target.value)} />
      </label>

      {mensaje && <p className="text-sm text-slate-600">{mensaje}</p>}
      <button
        type="button"
        disabled={pending || !nombreCliente || !bancoOCasino || !fechaCita}
        onClick={crear}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        Agendar
      </button>
    </div>
  );
}

const badgeEstado: Record<Fila["estado"], string> = {
  AGENDADA: "bg-amber-100 text-amber-700",
  REALIZADA: "bg-emerald-100 text-emerald-700",
  CANCELADA: "bg-slate-100 text-slate-500",
};

export function AperturasPanel() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [cargado, setCargado] = useState(false);
  const [filtro, setFiltro] = useState<"AGENDADA" | "REALIZADA" | "CANCELADA" | "TODAS">("AGENDADA");
  const [pending, startTransition] = useTransition();

  function recargar() {
    accionListAperturas().then((data) => {
      setFilas(data);
      setCargado(true);
    });
  }

  useEffect(() => {
    recargar();
  }, []);

  function cambiarEstado(id: number, estado: "REALIZADA" | "CANCELADA") {
    startTransition(async () => {
      await accionActualizarApertura(id, { estado });
      recargar();
    });
  }

  const visibles = filas.filter((f) => filtro === "TODAS" || f.estado === filtro);

  return (
    <div className="space-y-6">
      <FormularioNuevo onCreado={recargar} />

      <div>
        <div className="mb-3 flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["AGENDADA", "REALIZADA", "CANCELADA", "TODAS"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                filtro === f ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f === "AGENDADA" ? "Agendadas" : f === "REALIZADA" ? "Realizadas" : f === "CANCELADA" ? "Canceladas" : "Todas"}
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
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Teléfono</th>
                  <th className="px-3 py-2">Letra</th>
                  <th className="px-3 py-2">Banco/Casino</th>
                  <th className="px-3 py-2">Cita</th>
                  <th className="px-3 py-2">Responsable</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.map((f) => (
                  <tr key={f.id}>
                    <td className="px-3 py-2">{f.cliente ?? f.nombreCliente}</td>
                    <td className="px-3 py-2">{f.telefono ?? "—"}</td>
                    <td className="px-3 py-2">{f.letra ?? "—"}</td>
                    <td className="px-3 py-2">{f.bancoOCasino}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fechaHora(f.fechaCita)}</td>
                    <td className="px-3 py-2">{f.responsable ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeEstado[f.estado]}`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {f.estado === "AGENDADA" && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => cambiarEstado(f.id, "REALIZADA")}
                            className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Realizada
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => cambiarEstado(f.id, "CANCELADA")}
                            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {visibles.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-slate-400" colSpan={8}>
                      Sin aperturas con este filtro.
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
