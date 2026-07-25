"use client";

import { useEffect, useState, useTransition } from "react";
import { accionActualizarCliente, accionBuscarClientes, accionCrearCliente, accionObtenerCliente } from "./actions";

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";
const labelClass = "text-sm";

function aFechaInput(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function ClienteForm() {
  const [clienteId, setClienteId] = useState<string | null>(null);
  const editando = clienteId !== null;

  const [status, setStatus] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [direccionIne, setDireccionIne] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [estado, setEstado] = useState("");
  const [cp, setCp] = useState("");
  const [curp, setCurp] = useState("");
  const [rfc, setRfc] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [expIne, setExpIne] = useState("");
  const [idmx, setIdmx] = useState("");
  const [noIne, setNoIne] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [nombreReferencia, setNombreReferencia] = useState("");
  const [noReferencia, setNoReferencia] = useState("");
  const [ingresoPor, setIngresoPor] = useState("");
  const [equipo, setEquipo] = useState("");
  const [opera, setOpera] = useState("");
  const [correoOperativo, setCorreoOperativo] = useState("");
  const [contrasenaOperativa, setContrasenaOperativa] = useState("");
  const [noLinea, setNoLinea] = useState("");
  const [telefonia, setTelefonia] = useState("");
  const [validacion, setValidacion] = useState("");
  const [ultRecarga, setUltRecarga] = useState("");
  const [apertura, setApertura] = useState("");
  const [fechaRegistro, setFechaRegistro] = useState("");
  const [nota, setNota] = useState("");

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [buscarQuery, setBuscarQuery] = useState("");
  const [buscarResultados, setBuscarResultados] = useState<
    { id: string; nombreCompleto: string; status: string | null; equipo: string | null }[]
  >([]);

  useEffect(() => {
    if (!buscarQuery.trim()) return;
    const handle = setTimeout(() => {
      startTransition(async () => setBuscarResultados(await accionBuscarClientes(buscarQuery)));
    }, 250);
    return () => clearTimeout(handle);
  }, [buscarQuery]);
  const buscarVisibles = buscarQuery.trim() ? buscarResultados : [];

  function limpiar() {
    setClienteId(null);
    setStatus("");
    setNombreCompleto("");
    setDireccionIne("");
    setCiudad("");
    setEstado("");
    setCp("");
    setCurp("");
    setRfc("");
    setFechaNacimiento("");
    setExpIne("");
    setIdmx("");
    setNoIne("");
    setTelefono("");
    setWhatsapp("");
    setNombreReferencia("");
    setNoReferencia("");
    setIngresoPor("");
    setEquipo("");
    setOpera("");
    setCorreoOperativo("");
    setContrasenaOperativa("");
    setNoLinea("");
    setTelefonia("");
    setValidacion("");
    setUltRecarga("");
    setApertura("");
    setFechaRegistro("");
    setNota("");
    setMensaje(null);
    setBuscarQuery("");
  }

  function cargar(id: string) {
    setMensaje(null);
    startTransition(async () => {
      const c = await accionObtenerCliente(id);
      setClienteId(c.id);
      setStatus(c.status ?? "");
      setNombreCompleto(c.nombreCompleto);
      setDireccionIne(c.direccionIne ?? "");
      setCiudad(c.ciudad ?? "");
      setEstado(c.estado ?? "");
      setCp(c.cp ?? "");
      setCurp(c.curp ?? "");
      setRfc(c.rfc ?? "");
      setFechaNacimiento(aFechaInput(c.fechaNacimiento));
      setExpIne(c.expIne?.toString() ?? "");
      setIdmx(c.idmx ?? "");
      setNoIne(c.noIne ?? "");
      setTelefono(c.telefono ?? "");
      setWhatsapp(c.whatsapp ?? "");
      setNombreReferencia(c.nombreReferencia ?? "");
      setNoReferencia(c.noReferencia ?? "");
      setIngresoPor(c.ingresoPor ?? "");
      setEquipo(c.equipo ?? "");
      setOpera(c.opera ?? "");
      setCorreoOperativo(c.correoOperativo ?? "");
      setContrasenaOperativa(c.contrasenaOperativa ?? "");
      setNoLinea(c.noLinea ?? "");
      setTelefonia(c.telefonia ?? "");
      setValidacion(c.validacion ?? "");
      setUltRecarga(aFechaInput(c.ultRecarga));
      setApertura(c.apertura ?? "");
      setFechaRegistro(aFechaInput(c.fechaRegistro));
      setNota(c.nota ?? "");
      setBuscarQuery("");
    });
  }

  function submit() {
    setMensaje(null);
    const datos = {
      status: status || undefined,
      nombreCompleto,
      direccionIne: direccionIne || undefined,
      ciudad: ciudad || undefined,
      estado: estado || undefined,
      cp: cp || undefined,
      curp: curp || undefined,
      rfc: rfc || undefined,
      fechaNacimiento: fechaNacimiento || undefined,
      expIne: expIne ? parseInt(expIne, 10) : undefined,
      idmx: idmx || undefined,
      noIne: noIne || undefined,
      telefono: telefono || undefined,
      whatsapp: whatsapp || undefined,
      nombreReferencia: nombreReferencia || undefined,
      noReferencia: noReferencia || undefined,
      ingresoPor: ingresoPor || undefined,
      equipo: equipo || undefined,
      opera: opera || undefined,
      correoOperativo: correoOperativo || undefined,
      contrasenaOperativa: contrasenaOperativa || undefined,
      noLinea: noLinea || undefined,
      telefonia: telefonia || undefined,
      validacion: validacion || undefined,
      ultRecarga: ultRecarga || undefined,
      apertura: apertura || undefined,
      fechaRegistro: fechaRegistro || undefined,
      nota: nota || undefined,
    };
    startTransition(async () => {
      const result = editando
        ? await accionActualizarCliente(clienteId!, datos)
        : await accionCrearCliente(datos);
      if (result.ok) {
        const texto = editando ? `Cliente ${clienteId} actualizado.` : "Cliente creado.";
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
          Buscar cliente existente para editar
          <input
            type="text"
            placeholder="Nombre o ID (ej. CL0013)"
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
                  <span className="block font-medium text-slate-900">{r.nombreCompleto}</span>
                  <span className="block text-xs text-slate-400">
                    {r.id} {r.equipo ? `· ${r.equipo}` : ""} {r.status ? `· ${r.status}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editando && (
        <div className="flex items-center justify-between rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Editando cliente <strong className="mx-1">{clienteId}</strong>
          <button type="button" onClick={limpiar} className="text-xs underline">
            Cancelar / dar de alta uno nuevo
          </button>
        </div>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Datos generales</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            Nombre completo
            <input className={inputClass} value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
          </label>
          <label className={labelClass}>
            Status
            <input className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)} />
          </label>
          <label className={labelClass}>
            Equipo (letra-perfil, ej. a-101)
            <p className="mt-0.5 text-xs font-normal text-slate-400">Conecta al cliente con sus casinos de ese perfil.</p>
            <input className={inputClass} value={equipo} onChange={(e) => setEquipo(e.target.value.toLowerCase())} />
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Identidad</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            Dirección (INE)
            <input className={inputClass} value={direccionIne} onChange={(e) => setDireccionIne(e.target.value)} />
          </label>
          <label className={labelClass}>
            Ciudad
            <input className={inputClass} value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
          </label>
          <label className={labelClass}>
            Estado
            <input className={inputClass} value={estado} onChange={(e) => setEstado(e.target.value)} />
          </label>
          <label className={labelClass}>
            CP
            <input className={inputClass} value={cp} onChange={(e) => setCp(e.target.value)} />
          </label>
          <label className={labelClass}>
            CURP
            <input className={inputClass} value={curp} onChange={(e) => setCurp(e.target.value)} />
          </label>
          <label className={labelClass}>
            RFC
            <input className={inputClass} value={rfc} onChange={(e) => setRfc(e.target.value)} />
          </label>
          <label className={labelClass}>
            Fecha de nacimiento
            <input type="date" className={inputClass} value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
          </label>
          <label className={labelClass}>
            Exp. INE
            <input type="number" className={inputClass} value={expIne} onChange={(e) => setExpIne(e.target.value)} />
          </label>
          <label className={labelClass}>
            IDMX
            <input className={inputClass} value={idmx} onChange={(e) => setIdmx(e.target.value)} />
          </label>
          <label className={labelClass}>
            No. INE
            <input className={inputClass} value={noIne} onChange={(e) => setNoIne(e.target.value)} />
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Contacto</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            Teléfono
            <input className={inputClass} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </label>
          <label className={labelClass}>
            WhatsApp
            <input className={inputClass} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </label>
          <label className={labelClass}>
            Ingreso por
            <input className={inputClass} value={ingresoPor} onChange={(e) => setIngresoPor(e.target.value)} />
          </label>
          <label className={labelClass}>
            Nombre de referencia
            <input className={inputClass} value={nombreReferencia} onChange={(e) => setNombreReferencia(e.target.value)} />
          </label>
          <label className={labelClass}>
            No. de referencia
            <input className={inputClass} value={noReferencia} onChange={(e) => setNoReferencia(e.target.value)} />
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Datos operativos</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            Opera
            <input className={inputClass} value={opera} onChange={(e) => setOpera(e.target.value)} />
          </label>
          <label className={labelClass}>
            Correo operativo
            <input className={inputClass} value={correoOperativo} onChange={(e) => setCorreoOperativo(e.target.value)} />
          </label>
          <label className={labelClass}>
            Contraseña operativa
            <input className={inputClass} value={contrasenaOperativa} onChange={(e) => setContrasenaOperativa(e.target.value)} />
          </label>
          <label className={labelClass}>
            No. línea
            <input className={inputClass} value={noLinea} onChange={(e) => setNoLinea(e.target.value)} />
          </label>
          <label className={labelClass}>
            Telefonía
            <input className={inputClass} value={telefonia} onChange={(e) => setTelefonia(e.target.value)} />
          </label>
          <label className={labelClass}>
            Validación
            <input className={inputClass} value={validacion} onChange={(e) => setValidacion(e.target.value)} />
          </label>
          <label className={labelClass}>
            Última recarga
            <input type="date" className={inputClass} value={ultRecarga} onChange={(e) => setUltRecarga(e.target.value)} />
          </label>
          <label className={labelClass}>
            Apertura
            <input className={inputClass} value={apertura} onChange={(e) => setApertura(e.target.value)} />
          </label>
          <label className={labelClass}>
            Fecha de registro
            <input type="date" className={inputClass} value={fechaRegistro} onChange={(e) => setFechaRegistro(e.target.value)} />
          </label>
        </div>
        <label className={`${labelClass} mt-3 block`}>
          Nota
          <textarea className={inputClass} value={nota} onChange={(e) => setNota(e.target.value)} />
        </label>
      </section>

      {mensaje && <p className="text-sm text-slate-600">{mensaje}</p>}
      <button
        type="button"
        disabled={pending || !nombreCompleto}
        onClick={submit}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {editando ? "Guardar cambios" : "Dar de alta cliente"}
      </button>
    </div>
  );
}
