"use client";

import { useRef, useState, useTransition } from "react";
import { accionImportarLetraA, type ResultadoImportacion } from "./actions";

export function ImportarForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);

  function submit() {
    const archivo = inputRef.current?.files?.[0];
    if (!archivo) return;
    setResultado(null);
    const formData = new FormData();
    formData.set("archivo", archivo);
    startTransition(async () => {
      const r = await accionImportarLetraA(formData);
      setResultado(r);
      if (r.ok && inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-4">
      <label className="text-sm">
        Archivo Excel (hojas &quot;Casinos A&quot; y &quot;bancos Gral&quot;)
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="mt-1 block w-full text-sm"
        />
      </label>

      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Importando..." : "Importar"}
      </button>

      {resultado && !resultado.ok && <p className="text-sm text-red-600">Error: {resultado.error}</p>}

      {resultado && resultado.ok && (
        <div className="space-y-2 rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p>
            <strong>Casinos —</strong> creados: {resultado.casinos.creados}, actualizados:{" "}
            {resultado.casinos.actualizados}, omitidos: {resultado.casinos.omitidos}
          </p>
          <p>
            <strong>Bancos —</strong> creados: {resultado.bancos.creados}, actualizados:{" "}
            {resultado.bancos.actualizados}, omitidos: {resultado.bancos.omitidos}, clientes vinculados:{" "}
            {resultado.bancos.clientesVinculados}
          </p>
        </div>
      )}
    </div>
  );
}
