"use client";

import { useEffect, useState, useTransition } from "react";
import { accionCrearCasino, accionCrearCuenta, buscarCuentasParaCobraEn } from "./actions";

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

export function CuentaForm() {
  const [banco, setBanco] = useState("");
  const [letra, setLetra] = useState("");
  const [perfil, setPerfil] = useState("");
  const [id, setId] = useState("");
  const [idTocado, setIdTocado] = useState(false);
  const [tipoCuenta, setTipoCuenta] = useState<"BASICA" | "SIN_LIMITE" | "MEJORADA">("BASICA");
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
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (idTocado) return;
    if (banco && letra && perfil) {
      setId(`${slugify(banco)}.${letra.toLowerCase()}.${perfil}`);
    }
  }, [banco, letra, perfil, idTocado]);

  function limpiar() {
    setBanco("");
    setLetra("");
    setPerfil("");
    setId("");
    setIdTocado(false);
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
  }

  function submit() {
    setMensaje(null);
    startTransition(async () => {
      const result = await accionCrearCuenta({
        id,
        tipoCuenta,
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
      });
      if (result.ok) {
        setMensaje(`Cuenta ${id} creada.`);
        limpiar();
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  return (
    <div className="space-y-3">
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
        <p className="mt-0.5 text-xs font-normal text-slate-400">Formato sugerido: banco.X.perfil</p>
        <input
          className={inputClass}
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setIdTocado(true);
          }}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className={labelClass}>
          Tipo de cuenta
          <select className={inputClass} value={tipoCuenta} onChange={(e) => setTipoCuenta(e.target.value as typeof tipoCuenta)}>
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
      {mensaje && <p className="text-sm text-slate-600">{mensaje}</p>}
      <button
        type="button"
        disabled={pending || !id || !banco || !letra || !perfil}
        onClick={submit}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        Dar de alta cuenta
      </button>
    </div>
  );
}

export function CasinoForm() {
  const [nombreCasino, setNombreCasino] = useState("");
  const [noCasino, setNoCasino] = useState("1");
  const [letra, setLetra] = useState("");
  const [perfil, setPerfil] = useState("");
  const [id, setId] = useState("");
  const [idTocado, setIdTocado] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [statusPerfil, setStatusPerfil] = useState<"VERIFICADO" | "EN_PROCESO" | "SIN_VERIFICACION">("SIN_VERIFICACION");
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cobraEnId, setCobraEnId] = useState("");
  const [cuentasLetra, setCuentasLetra] = useState<{ id: string; banco: string; perfil: string }[]>([]);
  const [nota, setNota] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (idTocado) return;
    if (nombreCasino && letra && perfil) {
      setId(`${slugify(nombreCasino)}.${letra.toLowerCase()}.${perfil}`);
    }
  }, [nombreCasino, letra, perfil, idTocado]);

  useEffect(() => {
    if (!letra.trim()) {
      setCuentasLetra([]);
      return;
    }
    buscarCuentasParaCobraEn(letra).then(setCuentasLetra);
  }, [letra]);

  function limpiar() {
    setNombreCasino("");
    setNoCasino("1");
    setLetra("");
    setPerfil("");
    setId("");
    setIdTocado(false);
    setSaldoInicial("0");
    setUsuario("");
    setContrasena("");
    setCobraEnId("");
    setNota("");
  }

  function submit() {
    setMensaje(null);
    startTransition(async () => {
      const result = await accionCrearCasino({
        id,
        noCasino: parseInt(noCasino, 10) || 0,
        nombreCasino,
        letra,
        perfil,
        saldoInicial: parseFloat(saldoInicial) || 0,
        statusPerfil,
        usuario: usuario || undefined,
        contrasena: contrasena || undefined,
        cobraEnId: cobraEnId || undefined,
        nota: nota || undefined,
      });
      if (result.ok) {
        setMensaje(`Casino ${id} creado.`);
        limpiar();
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  return (
    <div className="space-y-3">
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
        <p className="mt-0.5 text-xs font-normal text-slate-400">Formato sugerido: casino.X.perfil</p>
        <input
          className={inputClass}
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setIdTocado(true);
          }}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        Dar de alta casino
      </button>
    </div>
  );
}
