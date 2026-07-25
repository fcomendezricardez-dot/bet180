"use client";

import { useEffect, useState, useTransition } from "react";
import {
  accionActualizarCuenta,
  accionBuscarClientes,
  accionBuscarCuentas,
  accionCrearCuenta,
  accionObtenerCuenta,
} from "./actions";

function slugify(banco: string) {
  return banco
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 6);
}

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";
const labelClass = "text-sm";

type ClienteOpcion = { id: string; nombreCompleto: string };

export function CuentaForm() {
  const [cuentaId, setCuentaId] = useState<string | null>(null);
  const editando = cuentaId !== null;

  const [banco, setBanco] = useState("");
  const [letra, setLetra] = useState("");
  const [perfil, setPerfil] = useState("");
  const [idOverride, setIdOverride] = useState<string | null>(null);
  const idNuevo = banco && letra && perfil ? `${slugify(banco)}.${letra.toLowerCase()}.${perfil}` : "";
  const id = editando ? cuentaId! : (idOverride ?? idNuevo);
  const [status, setStatus] = useState<"POR_VERIFICAR" | "ACTIVA" | "BLOQUEADA" | "BAJA" | "SIN_ACCESO">(
    "POR_VERIFICAR",
  );
  const [tipoCuenta, setTipoCuenta] = useState<"" | "BASICA" | "SIN_LIMITE" | "MEJORADA">("BASICA");
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [clabe, setClabe] = useState("");
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [token, setToken] = useState("");
  const [nip, setNip] = useState("");
  const [nombrePerfil, setNombrePerfil] = useState("");
  const [nTarjeta, setNTarjeta] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [ubicacionCustodia, setUbicacionCustodia] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteResultados, setClienteResultados] = useState<ClienteOpcion[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteActivo, setClienteActivo] = useState(false);

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [buscarQuery, setBuscarQuery] = useState("");
  const [buscarResultados, setBuscarResultados] = useState<
    { id: string; banco: string; letra: string; perfil: string; status: string }[]
  >([]);

  useEffect(() => {
    if (!buscarQuery.trim()) return;
    const handle = setTimeout(() => {
      startTransition(async () => setBuscarResultados(await accionBuscarCuentas(buscarQuery)));
    }, 250);
    return () => clearTimeout(handle);
  }, [buscarQuery]);
  const buscarVisibles = buscarQuery.trim() ? buscarResultados : [];

  useEffect(() => {
    if (!clienteQuery.trim()) return;
    const handle = setTimeout(() => {
      startTransition(async () => setClienteResultados(await accionBuscarClientes(clienteQuery)));
    }, 250);
    return () => clearTimeout(handle);
  }, [clienteQuery]);
  const clienteVisibles = clienteQuery.trim() ? clienteResultados : [];

  function limpiar() {
    setCuentaId(null);
    setBanco("");
    setLetra("");
    setPerfil("");
    setIdOverride(null);
    setStatus("POR_VERIFICAR");
    setTipoCuenta("BASICA");
    setSaldoInicial("0");
    setClabe("");
    setUsuario("");
    setContrasena("");
    setToken("");
    setNip("");
    setNombrePerfil("");
    setNTarjeta("");
    setExp("");
    setCvv("");
    setUbicacionCustodia("");
    setObservaciones("");
    setClienteQuery("");
    setClienteId("");
    setClienteNombre("");
    setClienteActivo(false);
    setMensaje(null);
    setBuscarQuery("");
  }

  function cargar(cId: string) {
    setMensaje(null);
    startTransition(async () => {
      const c = await accionObtenerCuenta(cId);
      setCuentaId(c.id);
      setBanco(c.banco);
      setLetra(c.letra);
      setPerfil(c.perfil);
      setStatus(c.status);
      setTipoCuenta(c.tipoCuenta ?? "");
      setSaldoInicial(c.saldoInicial.toString());
      setClabe(c.clabe ?? "");
      setUsuario(c.usuario ?? "");
      setContrasena(c.contrasena ?? "");
      setToken(c.token ?? "");
      setNip(c.nip ?? "");
      setNombrePerfil(c.nombrePerfil ?? "");
      setNTarjeta(c.nTarjeta ?? "");
      setExp(c.exp ?? "");
      setCvv(c.cvv ?? "");
      setUbicacionCustodia(c.ubicacionCustodia ?? "");
      setObservaciones(c.observaciones ?? "");
      setClienteId(c.idCliente ?? "");
      setClienteNombre(c.nombreCliente ?? "");
      setClienteActivo(c.clienteActivo);
      setBuscarQuery("");
    });
  }

  function elegirCliente(c: ClienteOpcion) {
    setClienteId(c.id);
    setClienteNombre(c.nombreCompleto);
    setClienteQuery("");
  }

  function submit() {
    setMensaje(null);
    const datosComunes = {
      tipoCuenta: tipoCuenta || undefined,
      letra,
      perfil,
      banco,
      saldoInicial: parseFloat(saldoInicial) || 0,
      clabe: clabe || undefined,
      usuario: usuario || undefined,
      contrasena: contrasena || undefined,
      token: token || undefined,
      nip: nip || undefined,
      nombrePerfil: nombrePerfil || undefined,
      nTarjeta: nTarjeta || undefined,
      exp: exp || undefined,
      cvv: cvv || undefined,
      ubicacionCustodia: ubicacionCustodia || undefined,
      observaciones: observaciones || undefined,
      idCliente: clienteId || undefined,
      nombreCliente: clienteNombre || undefined,
      clienteActivo,
    };
    startTransition(async () => {
      const result = editando
        ? await accionActualizarCuenta(cuentaId!, { ...datosComunes, status })
        : await accionCrearCuenta({ id, ...datosComunes });
      if (result.ok) {
        const texto = editando ? `Cuenta ${id} actualizada.` : `Cuenta ${id} creada.`;
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
          Buscar cuenta existente para editar
          <input
            type="text"
            placeholder="ID, banco…"
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
                  <span className="block font-medium text-slate-900">{r.id}</span>
                  <span className="block text-xs text-slate-400">
                    {r.letra}.{r.perfil} · {r.banco} · {r.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editando && (
        <div className="flex items-center justify-between rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Editando cuenta <strong className="mx-1">{cuentaId}</strong>
          <button type="button" onClick={limpiar} className="text-xs underline">
            Cancelar / dar de alta una nueva
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className={labelClass}>
          Banco
          <input className={inputClass} value={banco} onChange={(e) => setBanco(e.target.value)} />
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
        ID de cuenta
        {!editando && <p className="mt-0.5 text-xs font-normal text-slate-400">Formato sugerido: banco.X.perfil</p>}
        <input
          className={inputClass}
          value={id}
          disabled={editando}
          onChange={(e) => setIdOverride(e.target.value)}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {editando && (
          <label className={labelClass}>
            Status
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="POR_VERIFICAR">Por verificar</option>
              <option value="ACTIVA">Activa</option>
              <option value="BLOQUEADA">Bloqueada</option>
              <option value="BAJA">Baja</option>
              <option value="SIN_ACCESO">Sin acceso</option>
            </select>
          </label>
        )}
        <label className={labelClass}>
          Tipo de cuenta
          <select className={inputClass} value={tipoCuenta} onChange={(e) => setTipoCuenta(e.target.value as typeof tipoCuenta)}>
            <option value="">Sin definir</option>
            <option value="BASICA">Básica</option>
            <option value="SIN_LIMITE">Sin límite</option>
            <option value="MEJORADA">Mejorada</option>
          </select>
        </label>
        <label className={labelClass}>
          Saldo inicial
          <input type="number" step="0.01" className={inputClass} value={saldoInicial} onChange={(e) => setSaldoInicial(e.target.value)} />
        </label>
        <label className={labelClass}>
          Nombre del perfil
          <input className={inputClass} value={nombrePerfil} onChange={(e) => setNombrePerfil(e.target.value)} />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className={labelClass}>
          CLABE
          <input className={inputClass} value={clabe} onChange={(e) => setClabe(e.target.value)} />
        </label>
        <label className={labelClass}>
          Usuario
          <input className={inputClass} value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        </label>
        <label className={labelClass}>
          Contraseña
          <input className={inputClass} value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
        </label>
        <label className={labelClass}>
          Token
          <input className={inputClass} value={token} onChange={(e) => setToken(e.target.value)} />
        </label>
        <label className={labelClass}>
          NIP
          <input className={inputClass} value={nip} onChange={(e) => setNip(e.target.value)} />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className={labelClass}>
          No. de tarjeta
          <input className={inputClass} value={nTarjeta} onChange={(e) => setNTarjeta(e.target.value)} />
        </label>
        <label className={labelClass}>
          Vencimiento
          <input className={inputClass} placeholder="MM/AA" value={exp} onChange={(e) => setExp(e.target.value)} />
        </label>
        <label className={labelClass}>
          CVV
          <input className={inputClass} value={cvv} onChange={(e) => setCvv(e.target.value)} />
        </label>
        <label className={labelClass}>
          Ubicación / custodia
          <input className={inputClass} value={ubicacionCustodia} onChange={(e) => setUbicacionCustodia(e.target.value)} />
        </label>
      </div>
      <label className={labelClass}>
        Observaciones
        <textarea className={inputClass} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      </label>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-sm font-medium text-slate-700">Cliente vinculado (equipo {letra || "?"}.{perfil || "?"})</p>
        {clienteId ? (
          <div className="flex items-center justify-between text-sm">
            <span>
              {clienteNombre} <span className="text-slate-400">({clienteId})</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setClienteId("");
                setClienteNombre("");
              }}
              className="text-xs text-slate-500 underline"
            >
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
        {!clienteId && clienteVisibles.length > 0 && (
          <ul className="mt-1 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
            {clienteVisibles.map((c) => (
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
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clienteActivo} onChange={(e) => setClienteActivo(e.target.checked)} />
            Cliente activo en esta cuenta
          </label>
        )}
      </div>

      {mensaje && <p className="text-sm text-slate-600">{mensaje}</p>}
      <button
        type="button"
        disabled={pending || !id || !banco || !letra || !perfil}
        onClick={submit}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {editando ? "Guardar cambios" : "Dar de alta cuenta"}
      </button>
    </div>
  );
}
