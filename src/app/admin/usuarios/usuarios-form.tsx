"use client";

import { useEffect, useState, useTransition } from "react";
import {
  accionActualizarUsuario,
  accionCrearUsuario,
  accionListUsuarios,
  accionObtenerUsuario,
} from "./actions";

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";
const labelClass = "text-sm";

type Fila = {
  id: string;
  email: string;
  nombre: string;
  rol: "ADMIN" | "OPERADOR" | "GESTOR";
  letra: string | null;
  activo: boolean;
};

export function UsuariosForm() {
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const editando = usuarioId !== null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<"ADMIN" | "OPERADOR" | "GESTOR">("OPERADOR");
  const [letra, setLetra] = useState("");
  const [activo, setActivo] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [lista, setLista] = useState<Fila[]>([]);

  function recargarLista() {
    startTransition(async () => setLista(await accionListUsuarios()));
  }

  useEffect(() => {
    recargarLista();
  }, []);

  function limpiar() {
    setUsuarioId(null);
    setEmail("");
    setPassword("");
    setNombre("");
    setRol("OPERADOR");
    setLetra("");
    setActivo(true);
    setMensaje(null);
  }

  function cargar(id: string) {
    setMensaje(null);
    startTransition(async () => {
      const u = await accionObtenerUsuario(id);
      setUsuarioId(u.id);
      setEmail(u.email);
      setPassword("");
      setNombre(u.nombre);
      setRol(u.rol);
      setLetra(u.letra ?? "");
      setActivo(u.activo);
    });
  }

  function submit() {
    setMensaje(null);
    const datosComunes = {
      email,
      nombre,
      rol,
      letra: rol === "OPERADOR" ? letra.toUpperCase() : undefined,
      activo,
    };
    startTransition(async () => {
      const result = editando
        ? await accionActualizarUsuario(usuarioId!, { ...datosComunes, ...(password ? { password } : {}) })
        : await accionCrearUsuario({ ...datosComunes, password });
      if (result.ok) {
        const texto = editando ? `Usuario ${email} actualizado.` : `Usuario ${email} creado.`;
        if (!editando) limpiar();
        setMensaje(texto);
        recargarLista();
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  const puedeGuardar =
    !pending && !!email && !!nombre && (rol !== "OPERADOR" || !!letra) && (editando || password.length >= 6);

  return (
    <div className="space-y-4">
      <div>
        <p className={labelClass}>Usuarios existentes</p>
        <ul className="mt-1 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
          {lista.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => cargar(u.id)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="block font-medium text-slate-900">
                  {u.nombre} · {u.email}
                </span>
                <span className="block text-xs text-slate-400">
                  {u.rol === "ADMIN" ? "Administrador" : u.rol === "GESTOR" ? "Gestor" : `Operador · Letra ${u.letra}`}{" "}
                  ·{" "}
                  {u.activo ? "Activo" : "Inactivo"}
                </span>
              </button>
            </li>
          ))}
          {lista.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">Sin usuarios.</li>}
        </ul>
      </div>

      {editando && (
        <div className="flex items-center justify-between rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Editando usuario <strong className="mx-1">{email}</strong>
          <button type="button" onClick={limpiar} className="text-xs underline">
            Cancelar / dar de alta uno nuevo
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Correo
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className={labelClass}>
          Nombre
          <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className={labelClass}>
          {editando ? "Nueva contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className={labelClass}>
          Rol
          <select
            className={inputClass}
            value={rol}
            onChange={(e) => setRol(e.target.value as "ADMIN" | "OPERADOR" | "GESTOR")}
          >
            <option value="OPERADOR">Operador</option>
            <option value="GESTOR">Gestor</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </label>
        {rol === "OPERADOR" && (
          <label className={labelClass}>
            Letra asignada
            <input
              className={inputClass}
              value={letra}
              maxLength={1}
              onChange={(e) => setLetra(e.target.value.toUpperCase())}
            />
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Activo (puede iniciar sesión)
        </label>
      </div>

      {mensaje && <p className="text-sm text-slate-600">{mensaje}</p>}
      <button
        type="button"
        disabled={!puedeGuardar}
        onClick={submit}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {editando ? "Guardar cambios" : "Dar de alta usuario"}
      </button>
    </div>
  );
}
