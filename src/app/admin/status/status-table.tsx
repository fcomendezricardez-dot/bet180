"use client";

import { useState, useTransition } from "react";
import { etiquetaCorta } from "@/lib/format";
import { accionActualizarStatus } from "./actions";

type Fila = {
  id: string;
  letra: string;
  perfil: string;
  banco: string;
  nombreCliente: string | null;
  status: "POR_VERIFICAR" | "ACTIVA" | "BLOQUEADA" | "BAJA" | "SIN_ACCESO";
  tipoCuenta: "BASICA" | "SIN_LIMITE" | "MEJORADA" | null;
};

function FilaEditable({ fila }: { fila: Fila }) {
  const [status, setStatus] = useState(fila.status);
  const [tipoCuenta, setTipoCuenta] = useState<"BASICA" | "SIN_LIMITE" | "MEJORADA" | "">(
    fila.tipoCuenta ?? "",
  );
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cambiado = status !== fila.status || tipoCuenta !== (fila.tipoCuenta ?? "");

  function guardar() {
    setMensaje(null);
    startTransition(async () => {
      const result = await accionActualizarStatus(fila.id, status, tipoCuenta || null);
      setMensaje(result.ok ? "Guardado." : `Error: ${result.error}`);
    });
  }

  return (
    <tr>
      <td className="px-3 py-2">{etiquetaCorta(fila.banco, fila.perfil)}</td>
      <td className="px-3 py-2">{fila.nombreCliente ?? "sin cliente asignado"}</td>
      <td className="px-3 py-2">
        <select
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as Fila["status"])}
        >
          <option value="POR_VERIFICAR">Por verificar</option>
          <option value="ACTIVA">Activa</option>
          <option value="BLOQUEADA">Bloqueada</option>
          <option value="BAJA">Baja</option>
          <option value="SIN_ACCESO">Sin acceso</option>
        </select>
      </td>
      <td className="px-3 py-2">
        <select
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          value={tipoCuenta}
          onChange={(e) => setTipoCuenta(e.target.value as "BASICA" | "SIN_LIMITE" | "MEJORADA" | "")}
        >
          <option value="">Sin definir</option>
          <option value="BASICA">Básica</option>
          <option value="SIN_LIMITE">Sin límite</option>
          <option value="MEJORADA">Mejorada</option>
        </select>
      </td>
      <td className="px-3 py-2">
        <button
          type="button"
          disabled={!cambiado || pending}
          onClick={guardar}
          className="rounded bg-slate-900 px-3 py-1 text-xs text-white hover:bg-slate-800 disabled:opacity-40"
        >
          Guardar
        </button>
        {mensaje && <span className="ml-2 text-xs text-slate-500">{mensaje}</span>}
      </td>
    </tr>
  );
}

export function StatusTable({ cuentas }: { cuentas: Fila[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-3 py-2">Cuenta</th>
            <th className="px-3 py-2">Cliente</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Tipo</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cuentas.map((c) => (
            <FilaEditable key={c.id} fila={c} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
