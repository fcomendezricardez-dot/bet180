"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  accionRegistrarApuesta,
  accionRegistrarGastoOperativo,
  accionRegistrarMovimientoBancario,
  accionRegistrarPrestamo,
  buscarCasinosPorLetraYPerfil,
  buscarClientesParaMovimiento,
  buscarCuentasPorPerfil,
  widgetDisponibilidad,
} from "./actions";

type Cliente = Awaited<ReturnType<typeof buscarClientesParaMovimiento>>[number];
type Casino = Awaited<ReturnType<typeof buscarCasinosPorLetraYPerfil>>[number];
type Cuenta = Awaited<ReturnType<typeof buscarCuentasPorPerfil>>[number];
type Disponible = Awaited<ReturnType<typeof widgetDisponibilidad>>[number];

const money = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

type Activo = "apuesta" | "deposito" | "prestamo" | "gasto" | null;

const ACTIVO_LABEL: Record<Exclude<Activo, null>, string> = {
  apuesta: "Registrando Apuesta",
  deposito: "Registrando Movimiento Bancario",
  prestamo: "Registrando Préstamo entre Cuentas",
  gasto: "Registrando Gasto Operativo",
};

function useBuscador<T>(fn: (q: string) => Promise<T[]>) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<T[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!query.trim()) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        setResultados(await fn(query));
      });
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return { query, setQuery, resultados: query.trim() ? resultados : [], pending };
}

export function NuevoMovimientoForm({ disponibilidadInicial }: { disponibilidadInicial: Disponible[] }) {
  const [activo, setActivo] = useState<Activo>(null);
  const [disponibilidad, setDisponibilidad] = useState(disponibilidadInicial);

  async function refrescarDisponibilidad() {
    setDisponibilidad(await widgetDisponibilidad());
  }

  // --- Paso 1: buscar cliente (resuelve solo en qué letra.perfil está jugando) ---
  const clienteBuscador = useBuscador(buscarClientesParaMovimiento);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [casinosDelPerfil, setCasinosDelPerfil] = useState<Casino[]>([]);
  const [casino, setCasino] = useState<Casino | null>(null);

  const letraCliente = cliente?.letra;
  const perfilCliente = cliente?.perfil;
  useEffect(() => {
    if (!letraCliente || !perfilCliente) return;
    let cancelado = false;
    buscarCasinosPorLetraYPerfil(letraCliente, perfilCliente).then((data) => {
      if (!cancelado) setCasinosDelPerfil(data);
    });
    return () => {
      cancelado = true;
    };
  }, [letraCliente, perfilCliente]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-8">
        <div className="sticky top-0 z-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm">
          <span className="font-medium text-slate-500">En vivo: </span>
          <span className={activo ? "font-semibold text-slate-900" : "text-slate-400"}>
            {activo ? ACTIVO_LABEL[activo] : "Nada activo"}
          </span>
        </div>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">1. Buscar Cliente</h2>
          <input
            type="text"
            placeholder="Nombre o ID del cliente (ej. CL0013)"
            className="w-full max-w-md rounded border border-slate-300 px-3 py-2 text-sm"
            value={clienteBuscador.query}
            onChange={(e) => {
              clienteBuscador.setQuery(e.target.value);
              setCliente(null);
              setCasino(null);
            }}
          />
          {clienteBuscador.resultados.length > 0 && !cliente && (
            <ul className="mt-2 max-w-md divide-y divide-slate-100 rounded border border-slate-200 bg-white">
              {clienteBuscador.resultados.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setCliente(c)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="block font-medium text-slate-900">{c.nombreCompleto}</span>
                    <span className="block text-xs text-slate-400">
                      {c.id} {c.letra && c.perfil ? `· juega en ${c.letra}.${c.perfil}` : "· sin perfil asignado"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {cliente && (
            <div className="mt-2 flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
              <span>
                Cliente: <strong>{cliente.nombreCompleto}</strong> ({cliente.id})
                {cliente.letra && cliente.perfil ? (
                  <>
                    {" "}
                    — juega en <strong>{cliente.letra}.{cliente.perfil}</strong>
                  </>
                ) : (
                  <span className="text-amber-700"> — sin perfil asignado (revisa Gestión)</span>
                )}
              </span>
              <button
                type="button"
                className="text-emerald-700 underline"
                onClick={() => {
                  setCliente(null);
                  setCasino(null);
                }}
              >
                Cambiar
              </button>
            </div>
          )}

          {cliente?.letra && !casino && casinosDelPerfil.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Casino</th>
                    <th className="px-3 py-2">Saldo</th>
                    <th className="px-3 py-2">Usuario</th>
                    <th className="px-3 py-2">Contraseña</th>
                    <th className="px-3 py-2">Cobra en</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {casinosDelPerfil.map((c) => (
                    <tr key={c.id}>
                      <td className="px-3 py-2">{c.nombreCasino}</td>
                      <td className="px-3 py-2">{money(c.saldo)}</td>
                      <td className="px-3 py-2">{c.usuario ?? "—"}</td>
                      <td className="px-3 py-2">{c.contrasena ?? "—"}</td>
                      <td className="px-3 py-2">{c.cobraEn ? `${c.cobraEn.banco} (${c.cobraEn.letra}.${c.cobraEn.perfil})` : "—"}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setCasino(c)}
                          className="rounded bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-800"
                        >
                          Elegir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {cliente?.letra && casinosDelPerfil.length === 0 && !casino && (
            <p className="mt-2 text-sm text-slate-400">Este perfil no tiene casinos activos.</p>
          )}
          {casino && (
            <div className="mt-2 flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
              <span>
                Casino elegido: <strong>{casino.nombreCasino}</strong> ({casino.letra}.{casino.perfil}) — saldo{" "}
                {money(casino.saldo)}
              </span>
              <button type="button" className="text-emerald-700 underline" onClick={() => setCasino(null)}>
                Cambiar
              </button>
            </div>
          )}
        </section>

        {casino && (
          <ApuestaSeccion
            casino={casino}
            onFocus={() => setActivo("apuesta")}
            onDone={() => setActivo(null)}
          />
        )}

        <MovimientoBancarioSeccion
          casinoSugerido={casino}
          clienteActual={cliente}
          onFocus={() => setActivo("deposito")}
          onDone={() => {
            setActivo(null);
            refrescarDisponibilidad();
          }}
        />

        <PrestamoSeccion
          onFocus={() => setActivo("prestamo")}
          onDone={() => {
            setActivo(null);
            refrescarDisponibilidad();
          }}
        />

        <GastoOperativoSeccion
          onFocus={() => setActivo("gasto")}
          onDone={() => {
            setActivo(null);
            refrescarDisponibilidad();
          }}
        />
      </div>

      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Quién puede prestar +$10,000</h3>
        {disponibilidad.length === 0 && <p className="text-sm text-slate-400">Nadie supera el umbral.</p>}
        <ul className="space-y-2 text-sm">
          {disponibilidad.map((d) => (
            <li key={`${d.letra}.${d.perfil}`} className="flex justify-between">
              <span>
                {d.letra}.{d.perfil}
                {d.nombrePerfil ? ` · ${d.nombrePerfil}` : ""}
              </span>
              <span className="font-medium">{money(d.total)}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function ApuestaSeccion({
  casino,
  onFocus,
  onDone,
}: {
  casino: Casino;
  onFocus: () => void;
  onDone: () => void;
}) {
  const [evento, setEvento] = useState("");
  const [mercado, setMercado] = useState<"LOCAL" | "EMPATE" | "VISITANTE">("LOCAL");
  const [descripcion, setDescripcion] = useState("");
  const [momio, setMomio] = useState("");
  const [efectivo, setEfectivo] = useState("");
  const [bono, setBono] = useState("");
  const [tipoBono, setTipoBono] = useState<"FREEBET" | "DINERO">("FREEBET");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const posibleGanancia = useMemo(() => {
    const m = parseFloat(momio);
    const e = parseFloat(efectivo) || 0;
    const b = parseFloat(bono) || 0;
    if (Number.isNaN(m)) return 0;
    return m * (e + b);
  }, [momio, efectivo, bono]);

  function submit() {
    setMensaje(null);
    startTransition(async () => {
      const result = await accionRegistrarApuesta({
        casinoId: casino.id,
        letra: casino.letra,
        perfil: casino.perfil,
        evento,
        mercado,
        descripcion: descripcion || undefined,
        momio: parseFloat(momio),
        saldoReal: parseFloat(efectivo) || 0,
        bono: parseFloat(bono) || 0,
        tipoBono: parseFloat(bono) > 0 ? tipoBono : undefined,
      });
      if (result.ok) {
        setMensaje("Apuesta registrada.");
        setEvento("");
        setDescripcion("");
        setMomio("");
        setEfectivo("");
        setBono("");
        setTipoBono("FREEBET");
        onDone();
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  const montoInvalido = (parseFloat(efectivo) || 0) + (parseFloat(bono) || 0) <= 0;

  return (
    <section onFocus={onFocus}>
      <h2 className="mb-2 text-lg font-semibold text-slate-900">2. Tabla de Apuesta (opcional)</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">
          Evento
          <input className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={evento} onChange={(e) => setEvento(e.target.value)} />
        </label>
        <label className="text-sm">
          Mercado
          <select className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={mercado} onChange={(e) => setMercado(e.target.value as typeof mercado)}>
            <option value="LOCAL">Local</option>
            <option value="EMPATE">Empate</option>
            <option value="VISITANTE">Visitante</option>
          </select>
        </label>
        <label className="text-sm">
          Descripción
          <input className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </label>
        <label className="text-sm">
          Momio
          <input type="number" step="0.01" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={momio} onChange={(e) => setMomio(e.target.value)} />
        </label>
        <label className="text-sm">
          Efectivo
          <input type="number" step="0.01" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={efectivo} onChange={(e) => setEfectivo(e.target.value)} />
        </label>
        <label className="text-sm">
          Bono
          <input type="number" step="0.01" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={bono} onChange={(e) => setBono(e.target.value)} />
        </label>
        {parseFloat(bono) > 0 && (
          <label className="text-sm">
            Tipo de bono
            <select
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
              value={tipoBono}
              onChange={(e) => setTipoBono(e.target.value as typeof tipoBono)}
            >
              <option value="FREEBET">Freebet (no regresa el capital si gana)</option>
              <option value="DINERO">Dinero (se comporta como efectivo)</option>
            </select>
          </label>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Si la apuesta usa una promoción, puedes repartir el monto entre Efectivo y Bono — se descuentan cada uno de su
        propio saldo. Marca si el bono es Freebet o Dinero para saber cómo calcular el pago si gana.
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Posible Ganancia: <strong>{money(posibleGanancia)}</strong>
      </p>
      {mensaje && <p className="mt-1 text-sm text-slate-600">{mensaje}</p>}
      <button
        type="button"
        disabled={pending || !evento || !momio || montoInvalido}
        onClick={submit}
        className="mt-2 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        Registrar Apuesta
      </button>
    </section>
  );
}

function TablaAccesoCuenta({ cuenta }: { cuenta: Cuenta }) {
  return (
    <div className="mt-2 overflow-x-auto rounded border border-emerald-200 bg-emerald-50 p-3 text-sm">
      <p className="mb-1">
        <strong>
          {cuenta.banco} ({cuenta.letra}.{cuenta.perfil})
        </strong>{" "}
        — disponible {money(cuenta.saldo)}
        {cuenta.pendientes > 0 && (
          <span className="ml-2 rounded bg-amber-200 px-2 py-0.5 text-xs text-amber-900">
            {cuenta.pendientes} pendiente(s)
          </span>
        )}
      </p>
      <p>Cliente dueño: {cuenta.nombreCliente ?? "sin cliente asignado"}</p>
      <p>CLABE: {cuenta.clabe ?? "—"}</p>
      <p>Usuario: {cuenta.usuario ?? "—"} · Contraseña: {cuenta.contrasena ?? "—"}</p>
      <p>Token: {cuenta.token ?? "—"} · NIP: {cuenta.nip ?? "—"}</p>
    </div>
  );
}

function BuscadorCuenta({
  buscador,
  cuenta,
  setCuenta,
  clienteActualId,
}: {
  buscador: ReturnType<typeof useBuscador<Cuenta>>;
  cuenta: Cuenta | null;
  setCuenta: (c: Cuenta | null) => void;
  clienteActualId?: string | null;
}) {
  const resultados = clienteActualId
    ? [...buscador.resultados].sort((a, b) => {
        const aMismo = a.idCliente === clienteActualId ? 0 : 1;
        const bMismo = b.idCliente === clienteActualId ? 0 : 1;
        return aMismo - bMismo;
      })
    : buscador.resultados;

  return (
    <div>
      <input
        type="text"
        placeholder="Perfil, ej. 101"
        className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
        value={buscador.query}
        onChange={(e) => {
          buscador.setQuery(e.target.value);
          setCuenta(null);
        }}
      />
      {resultados.length > 0 && !cuenta && (
        <div className="mt-2 overflow-x-auto rounded border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Perfil</th>
                <th className="px-3 py-2">Banco</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Disponible</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resultados.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2">
                    {c.letra}.{c.perfil}
                  </td>
                  <td className="px-3 py-2">{c.banco}</td>
                  <td className="px-3 py-2">
                    {c.nombreCliente ?? "—"}
                    {clienteActualId && c.idCliente === clienteActualId && (
                      <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">
                        mismo cliente
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{money(c.saldo)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setCuenta(c)}
                      className="rounded bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-800"
                    >
                      Elegir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {cuenta && <TablaAccesoCuenta cuenta={cuenta} />}
    </div>
  );
}

function MovimientoBancarioSeccion({
  casinoSugerido,
  clienteActual,
  onFocus,
  onDone,
}: {
  casinoSugerido: Casino | null;
  clienteActual: Cliente | null;
  onFocus: () => void;
  onDone: () => void;
}) {
  const [tipo, setTipo] = useState<"DEPOSITO_A_CASINO" | "RETIRO_DE_CASINO">("DEPOSITO_A_CASINO");
  const buscador = useBuscador(buscarCuentasPorPerfil);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const otroCliente =
    tipo === "DEPOSITO_A_CASINO" &&
    casinoSugerido?.requiereMismoCliente &&
    cuenta &&
    clienteActual &&
    cuenta.idCliente !== clienteActual.id;
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [estado, setEstado] = useState<"CONFIRMADO" | "PENDIENTE" | "CANCELADO">("CONFIRMADO");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!cuenta || !casinoSugerido) return;
    setMensaje(null);
    startTransition(async () => {
      const result = await accionRegistrarMovimientoBancario({
        tipo,
        cuentaId: cuenta.id,
        casinoId: casinoSugerido.id,
        monto: parseFloat(monto),
        concepto: concepto || undefined,
        estado,
      });
      if (result.ok) {
        setMensaje("Movimiento registrado.");
        setMonto("");
        setConcepto("");
        setCuenta(null);
        onDone();
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  return (
    <section onFocus={onFocus}>
      <h2 className="mb-2 text-lg font-semibold text-slate-900">3. Tipo de Movimiento Bancario</h2>
      {!casinoSugerido && <p className="text-sm text-slate-400">Primero elige un casino en el paso 1.</p>}
      {casinoSugerido && (
        <>
          <select
            className="mb-3 rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
          >
            <option value="DEPOSITO_A_CASINO">Depósito a Casino</option>
            <option value="RETIRO_DE_CASINO">Retiro de Casino</option>
          </select>
          <BuscadorCuenta
            buscador={buscador}
            cuenta={cuenta}
            setCuenta={setCuenta}
            clienteActualId={clienteActual?.id}
          />
          {otroCliente && (
            <p className="mt-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              ⚠ Este casino requiere que el depósito venga del banco del mismo cliente ({clienteActual?.nombreCompleto}).
              Esta cuenta pertenece a: {cuenta?.nombreCliente ?? "sin cliente asignado"}.
            </p>
          )}
          {cuenta && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="text-sm">
                Monto
                <input type="number" step="0.01" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={monto} onChange={(e) => setMonto(e.target.value)} />
              </label>
              <label className="text-sm">
                Concepto
                <input className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
              </label>
              <label className="text-sm">
                Estado
                <select className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)}>
                  <option value="CONFIRMADO">Confirmado</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </label>
            </div>
          )}
          {mensaje && <p className="mt-1 text-sm text-slate-600">{mensaje}</p>}
          <button
            type="button"
            disabled={pending || !cuenta || !monto}
            onClick={submit}
            className="mt-2 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Registrar Movimiento Bancario
          </button>
        </>
      )}
    </section>
  );
}

function PrestamoSeccion({ onFocus, onDone }: { onFocus: () => void; onDone: () => void }) {
  const origenBuscador = useBuscador(buscarCuentasPorPerfil);
  const destinoBuscador = useBuscador(buscarCuentasPorPerfil);
  const [origen, setOrigen] = useState<Cuenta | null>(null);
  const [destino, setDestino] = useState<Cuenta | null>(null);
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [estado, setEstado] = useState<"CONFIRMADO" | "PENDIENTE" | "CANCELADO">("CONFIRMADO");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!origen || !destino) return;
    setMensaje(null);
    startTransition(async () => {
      const result = await accionRegistrarPrestamo({
        cuentaOrigenId: origen.id,
        cuentaDestinoId: destino.id,
        monto: parseFloat(monto),
        concepto: concepto || undefined,
        estado,
      });
      if (result.ok) {
        setMensaje("Préstamo registrado.");
        setMonto("");
        setConcepto("");
        setOrigen(null);
        setDestino(null);
        onDone();
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  return (
    <section onFocus={onFocus} className="border-t border-slate-200 pt-6">
      <h2 className="mb-2 text-lg font-semibold text-slate-900">4. Préstamo entre Cuentas</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Cuenta ORIGEN</p>
          <BuscadorCuenta buscador={origenBuscador} cuenta={origen} setCuenta={setOrigen} />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Cuenta DESTINO</p>
          <BuscadorCuenta buscador={destinoBuscador} cuenta={destino} setCuenta={setDestino} />
        </div>
      </div>
      {origen && destino && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-sm">
            Monto
            <input type="number" step="0.01" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </label>
          <label className="text-sm">
            Concepto
            <input className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
          </label>
          <label className="text-sm">
            Estado
            <select className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)}>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </label>
        </div>
      )}
      {mensaje && <p className="mt-1 text-sm text-slate-600">{mensaje}</p>}
      <button
        type="button"
        disabled={pending || !origen || !destino || !monto}
        onClick={submit}
        className="mt-2 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        Registrar Préstamo
      </button>
    </section>
  );
}

function GastoOperativoSeccion({ onFocus, onDone }: { onFocus: () => void; onDone: () => void }) {
  const buscador = useBuscador(buscarCuentasPorPerfil);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [estado, setEstado] = useState<"CONFIRMADO" | "PENDIENTE" | "CANCELADO">("CONFIRMADO");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!cuenta) return;
    setMensaje(null);
    startTransition(async () => {
      const result = await accionRegistrarGastoOperativo({
        cuentaId: cuenta.id,
        monto: parseFloat(monto),
        concepto: concepto || undefined,
        estado,
      });
      if (result.ok) {
        setMensaje("Gasto registrado.");
        setMonto("");
        setConcepto("");
        setCuenta(null);
        onDone();
      } else {
        setMensaje(`Error: ${result.error}`);
      }
    });
  }

  return (
    <section onFocus={onFocus} className="border-t border-slate-200 pt-6">
      <h2 className="mb-2 text-lg font-semibold text-slate-900">Gasto Operativo</h2>
      <p className="mb-2 text-sm text-slate-500">El dinero sale del sistema, sin cuenta ni casino destino.</p>
      <BuscadorCuenta buscador={buscador} cuenta={cuenta} setCuenta={setCuenta} />
      {cuenta && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-sm">
            Monto
            <input type="number" step="0.01" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </label>
          <label className="text-sm">
            Concepto
            <input className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
          </label>
          <label className="text-sm">
            Estado
            <select className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)}>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </label>
        </div>
      )}
      {mensaje && <p className="mt-1 text-sm text-slate-600">{mensaje}</p>}
      <button
        type="button"
        disabled={pending || !cuenta || !monto}
        onClick={submit}
        className="mt-2 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        Registrar Gasto
      </button>
    </section>
  );
}
