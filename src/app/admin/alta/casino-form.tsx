"use client";

import { useEffect, useState, useTransition } from "react";
import {
  accionActualizarCasino,
  accionBuscarCasinos,
  accionCrearCasino,
  accionObtenerCasino,
  buscarCuentasParaCobraEn,
} from "./actions";
import { ReglasBono } from "./reglas-bono";

function slugify(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 6);
}

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";
const labelClass = "text-sm";

export function CasinoForm() {
  const [casinoId, setCasinoId] = useState<string | null>(null);
  const editando = casinoId !== null;

  const [nombreCasino, setNombreCasino] = useState("");
  const [noCasino, setNoCasino] = useState("1");
  const [letra, setLetra] = useState("");
  const [perfil, setPerfil] = useState("");
  const [idOverride, setIdOverride] = useState<string | null>(null);
  const idNuevo = nombreCasino && letra && perfil ? `${slugify(nombreCasino)}.${letra.toLowerCase()}.${perfil}` : "";
  const id = editando ? casinoId! : (idOverride ?? idNuevo);
  const [statusCasino, setStatusCasino] = useState<"ACTIVO" | "BLOQUEADO" | "ALERTA">("ACTIVO");
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [statusPerfil, setStatusPerfil] = useState<"VERIFICADO" | "EN_PROCESO" | "SIN_VERIFICACION">("SIN_VERIFICACION");
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [requiereMismoCliente, setRequiereMismoCliente] = useState(false);
  const [cobraEnId, setCobraEnId] = useState("");
  const [cuentasLetraFetched, setCuentasLetraFetched] = useState<{ id: string; banco: string; perfil: string }[]>([]);
  const cuentasLetra = letra.trim() ? cuentasLetraFetched : [];
  const [nota, setNota] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [buscarQuery, setBuscarQuery] = useState("");
  const [buscarResultados, setBuscarResultados] = useState<
    { id: string; nombreCasino: string; letra: string; perfil: string; statusCasino: string }[]
  >([]);

  useEffect(() => {
    if (!letra.trim()) return;
    let cancelado = false;
    buscarCuentasParaCobraEn(letra).then((data) => {
      if (!cancelado) setCuentasLetraFetched(data);
    });
    return () => {
      cancelado = true;
    };
  }, [letra]);

  useEffect(() => {
    if (!buscarQuery.trim()) return;
    const handle = setTimeout(() => {
      startTransition(async () => setBuscarResultados(await accionBuscarCasinos(buscarQuery)));
    }, 250);
    return () => clearTimeout(handle);
  }, [buscarQuery]);
  const buscarVisibles = buscarQuery.trim() ? buscarResultados : [];

  function limpiar() {
    setCasinoId(null);
    setNombreCasino("");
    setNoCasino("1");
    setLetra("");
    setPerfil("");
    setIdOverride(null);
    setStatusCasino("ACTIVO");
    setSaldoInicial("0");
    setStatusPerfil("SIN_VERIFICACION");
    setUsuario("");
    setContrasena("");
    setRequiereMismoCliente(false);
    setCobraEnId("");
    setNota("");
    setMensaje(null);
    setBuscarQuery("");
  }

  function cargar(cId: string) {
    setMensaje(null);
    startTransition(async () => {
      const c = await accionObtenerCasino(cId);
      setCasinoId(c.id);
      setNombreCasino(c.nombreCasino);
      setNoCasino(c.noCasino.toString());
      setLetra(c.letra);
      setPerfil(c.perfil);
      setStatusCasino(c.statusCasino);
      setSaldoInicial(c.saldoInicial.toString());
      setStatusPerfil(c.statusPerfil);
      setUsuario(c.usuario ?? "");
      setContrasena(c.contrasena ?? "");
      setRequiereMismoCliente(c.requiereMismoCliente);
      setCobraEnId(c.cobraEnId ?? "");
      setNota(c.nota ?? "");
      setBuscarQuery("");
    });
  }

  function submit() {
    setMensaje(null);
    const datosComunes = {
      noCasino: parseInt(noCasino, 10) || 0,
      nombreCasino,
      letra,
      perfil,
      saldoInicial: parseFloat(saldoInicial) || 0,
      statusPerfil,
      usuario: usuario || undefined,
      contrasena: contrasena || undefined,
      requiereMismoCliente,
      cobraEnId: cobraEnId || undefined,
      nota: nota || undefined,
    };
    startTransition(async () => {
      const result = editando
        ? await accionActualizarCasino(casinoId!, { ...datosComunes, statusCasino })
        : await accionCrearCasino({ id, ...datosComunes });
      if (result.ok) {
        const texto = editando ? `Casino ${id} actualizado.` : `Casino ${id} creado.`;
        if (!editando) limpiar();
        setMensaje(texto);
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>
          Buscar casino existente para editar
          <input
            type="text"
            placeholder="ID, nombre del casino…"
            className={inputClass}
            value={buscarQuery}
            onChange={(e) => setBuscarQuery(e.target.value)}
          />
        </label>
        {buscarVisibles.length > 0 && (
          <ul className="mt-1 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
            {buscarVisibles.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => cargar(r.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span className="block font-medium text-slate-900">{r.nombreCasino}</span>
                  <span className="block text-xs text-slate-400">
                    {r.letra}.{r.perfil} · {r.id} · {r.statusCasino}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editando && (
        <div className="flex items-center justify-between rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Editando casino <strong className="mx-1">{casinoId}</strong>
          <button type="button" onClick={limpiar} className="text-xs underline">
            Cancelar / dar de alta uno nuevo
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className={labelClass}>
          Nombre del casino
          <input className={inputClass} value={nombreCasino} onChange={(e) => setNombreCasino(e.target.value)} />
        </label>
        <label className={labelClass}>
          No. de catálogo
          <input type="number" className={inputClass} value={noCasino} onChange={(e) => setNoCasino(e.target.value)} />
        </label>
        <label className={labelClass}>
          Letra
          <input className={inputClass} value={letra} onChange={(e) => setLetra(e.target.value.toUpperCase())} maxLength={1} />
        </label>
        <label className={labelClass}>
          Perfil
          <input className={inputClass} value={perfil} onChange={(e) => setPerfil(e.target.value)} />
        </label>
      </div>
      <label className={labelClass}>
        ID de casino
        {!editando && <p className="mt-0.5 text-xs font-normal text-slate-400">Formato sugerido: casino.X.perfil</p>}
        <input className={inputClass} value={id} disabled={editando} onChange={(e) => setIdOverride(e.target.value)} />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {editando && (
          <label className={labelClass}>
            Status del casino
            <select className={inputClass} value={statusCasino} onChange={(e) => setStatusCasino(e.target.value as typeof statusCasino)}>
              <option value="ACTIVO">Activo</option>
              <option value="BLOQUEADO">Bloqueado</option>
              <option value="ALERTA">Alerta</option>
            </select>
          </label>
        )}
        <label className={labelClass}>
          Saldo inicial
          <input type="number" step="0.01" className={inputClass} value={saldoInicial} onChange={(e) => setSaldoInicial(e.target.value)} />
        </label>
        <label className={labelClass}>
          Status del perfil
          <select className={inputClass} value={statusPerfil} onChange={(e) => setStatusPerfil(e.target.value as typeof statusPerfil)}>
            <option value="SIN_VERIFICACION">Sin verificación</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="VERIFICADO">Verificado</option>
          </select>
        </label>
        <label className={labelClass}>
          Cobra en (cuenta bancaria)
          <select className={inputClass} value={cobraEnId} onChange={(e) => setCobraEnId(e.target.value)}>
            <option value="">— sin asignar —</option>
            {cuentasLetra.map((c) => (
              <option key={c.id} value={c.id}>
                {c.banco} ({c.perfil})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Usuario
          <input className={inputClass} value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        </label>
        <label className={labelClass}>
          Contraseña
          <input className={inputClass} value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={requiereMismoCliente}
          onChange={(e) => setRequiereMismoCliente(e.target.checked)}
        />
        Requiere que los depósitos sean del banco del mismo cliente (muestra advertencia en Nuevo Movimiento)
      </label>
      <label className={labelClass}>
        Nota
        <textarea className={inputClass} value={nota} onChange={(e) => setNota(e.target.value)} />
      </label>
      {mensaje && <p className="text-sm text-slate-600">{mensaje}</p>}
      <button
        type="button"
        disabled={pending || !id || !nombreCasino || !letra || !perfil}
        onClick={submit}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {editando ? "Guardar cambios" : "Dar de alta casino"}
      </button>

      {editando && (
        <div className="border-t border-slate-200 pt-4">
          <ReglasBono casinoId={casinoId!} />
        </div>
      )}
    </div>
  );
}
