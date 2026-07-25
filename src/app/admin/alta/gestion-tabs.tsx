"use client";

import { useState } from "react";
import { CuentaForm } from "./cuenta-form";
import { CasinoForm } from "./casino-form";
import { ClienteForm } from "./cliente-form";

const TABS = [
  { value: "cuentas", label: "Bancos" },
  { value: "casinos", label: "Casinos" },
  { value: "clientes", label: "Gestión (Clientes)" },
] as const;

type Tab = (typeof TABS)[number]["value"];

export function GestionTabs() {
  const [tab, setTab] = useState<Tab>("cuentas");

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              tab === t.value ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "cuentas" && <CuentaForm />}
      {tab === "casinos" && <CasinoForm />}
      {tab === "clientes" && <ClienteForm />}
    </div>
  );
}
