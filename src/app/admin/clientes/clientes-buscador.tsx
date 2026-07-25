"use client";

import { useEffect, useState, useTransition } from "react";
import { accionBuscarClientes, accionObtenerFicha } from "./actions";

type Resultado = Awaited<ReturnType<typeof accionBuscarClientes>>[number];
type Ficha = Awaited<ReturnType<typeof accionObtenerFicha>>;

const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

function Campo({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-slate-800">{value ?? "—"}</p>
    </div>
  );
}

export function ClientesBuscador() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!query.trim()) return;
    const handle = setTimeout(() => {
      startTransition(async () => setResultados(await accionBuscarClientes(query)));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const resultadosVisibles = query.trim() ? resultados : [];

  function verFicha(id: string) {
    startTransition(async () => setFicha(await accionObtenerFicha(id)));
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <div>
        <input
          type="text"
          placeholder="Buscar por nombre o ID (ej. CL0013)"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="mt-2 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
          {resultadosVisibles.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => verFicha(r.id)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${ficha?.cliente.id === r.id ? "bg-slate-100" : ""}`}
              >
                <span className="block font-medium text-slate-900">{r.nombreCompleto}</span>
                <span className="block text-xs text-slate-400">
                  {r.id} {r.equipo ? `· ${r.equipo}` : ""} {r.status ? `· ${r.status}` : ""}
                </span>
              </button>
            </li>
          ))}
          {query.trim() && resultadosVisibles.length === 0 && !pending && (
            <li className="px-3 py-2 text-sm text-slate-400">Sin resultados.</li>
          )}
        </ul>
      </div>

      <div>
        {!ficha && <p className="text-sm text-slate-400">Busca un cliente para ver su ficha.</p>}
        {ficha && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{ficha.cliente.nombreCompleto}</h2>
              <p className="text-sm text-slate-500">
                {ficha.cliente.id} · {ficha.cliente.status ?? "sin status"} {ficha.cliente.equipo ? `· ${ficha.cliente.equipo}` : ""}
              </p>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Datos personales</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Campo label="Dirección INE" value={ficha.cliente.direccionIne} />
                <Campo label="Ciudad" value={ficha.cliente.ciudad} />
                <Campo label="Estado" value={ficha.cliente.estado} />
                <Campo label="CP" value={ficha.cliente.cp} />
                <Campo label="CURP" value={ficha.cliente.curp} />
                <Campo label="RFC" value={ficha.cliente.rfc} />
                <Campo
                  label="Fecha de nacimiento"
                  value={ficha.cliente.fechaNacimiento ? new Date(ficha.cliente.fechaNacimiento).toLocaleDateString("es-MX") : null}
                />
                <Campo label="Exp. INE" value={ficha.cliente.expIne} />
                <Campo label="No. INE" value={ficha.cliente.noIne} />
                <Campo label="Teléfono" value={ficha.cliente.telefono} />
                <Campo label="WhatsApp" value={ficha.cliente.whatsapp} />
                <Campo label="Referencia" value={ficha.cliente.nombreReferencia} />
                <Campo label="Ingreso por" value={ficha.cliente.ingresoPor} />
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Datos operativos</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Campo label="Opera" value={ficha.cliente.opera} />
                <Campo label="Correo operativo" value={ficha.cliente.correoOperativo} />
                <Campo label="Contraseña operativa" value={ficha.cliente.contrasenaOperativa} />
                <Campo label="No. línea" value={ficha.cliente.noLinea} />
                <Campo label="Telefonía" value={ficha.cliente.telefonia} />
                <Campo label="Validación" value={ficha.cliente.validacion} />
                <Campo label="Nota" value={ficha.cliente.nota} />
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Cuentas bancarias</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Banco</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">CLABE</th>
                      <th className="px-3 py-2">Usuario</th>
                      <th className="px-3 py-2">Contraseña</th>
                      <th className="px-3 py-2">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ficha.cuentas.map((c) => (
                      <tr key={c.id}>
                        <td className="px-3 py-2">{c.banco}</td>
                        <td className="px-3 py-2">{c.status}</td>
                        <td className="px-3 py-2">{c.clabe ?? "—"}</td>
                        <td className="px-3 py-2">{c.usuario ?? "—"}</td>
                        <td className="px-3 py-2">{c.contrasena ?? "—"}</td>
                        <td className="px-3 py-2">{money(c.saldo)}</td>
                      </tr>
                    ))}
                    {ficha.cuentas.length === 0 && (
                      <tr>
                        <td className="px-3 py-3 text-slate-400" colSpan={6}>
                          Sin cuentas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Casinos</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Casino</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Usuario</th>
                      <th className="px-3 py-2">Contraseña</th>
                      <th className="px-3 py-2">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ficha.casinos.map((c) => (
                      <tr key={c.id}>
                        <td className="px-3 py-2">{c.nombreCasino}</td>
                        <td className="px-3 py-2">{c.statusCasino}</td>
                        <td className="px-3 py-2">{c.usuario ?? "—"}</td>
                        <td className="px-3 py-2">{c.contrasena ?? "—"}</td>
                        <td className="px-3 py-2">{money(c.saldo)}</td>
                      </tr>
                    ))}
                    {ficha.casinos.length === 0 && (
                      <tr>
                        <td className="px-3 py-3 text-slate-400" colSpan={5}>
                          Sin casinos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
