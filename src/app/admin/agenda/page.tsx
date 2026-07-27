import { auth } from "@/auth";
import { agendaCombinada } from "@/lib/agenda";

const fechaHora = (d: Date) =>
  new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" }).format(d);

const badgeTipo: Record<"SEGUIMIENTO" | "APERTURA", string> = {
  SEGUIMIENTO: "bg-amber-100 text-amber-700",
  APERTURA: "bg-sky-100 text-sky-700",
};

const badgePrioridad: Record<"BAJA" | "MEDIA" | "ALTA", string> = {
  BAJA: "bg-slate-100 text-slate-600",
  MEDIA: "bg-amber-100 text-amber-700",
  ALTA: "bg-red-100 text-red-700",
};

export default async function AgendaPage() {
  const session = await auth();
  if (!session?.user) return null;
  const actor = { rol: session.user.rol, letra: session.user.letra };

  const items = await agendaCombinada(actor);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const atrasados = items.filter((i) => i.fecha < hoy);
  const proximos = items.filter((i) => i.fecha >= hoy);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Agenda</h1>
      <p className="mb-4 text-sm text-slate-500">
        Seguimientos pendientes con fecha de entrega y Aperturas agendadas, juntos y ordenados por fecha.
      </p>

      {atrasados.length > 0 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="mb-2 text-sm font-medium text-red-800">{atrasados.length} atrasado(s)</p>
          <TablaAgenda items={atrasados} />
        </div>
      )}

      <TablaAgenda items={proximos} />
    </div>
  );
}

function TablaAgenda({ items }: { items: Awaited<ReturnType<typeof agendaCombinada>> }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2">Tipo</th>
            <th className="px-3 py-2">Título</th>
            <th className="px-3 py-2">Cliente</th>
            <th className="px-3 py-2">Responsable</th>
            <th className="px-3 py-2">Prioridad</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((i) => (
            <tr key={`${i.tipo}-${i.id}`}>
              <td className="px-3 py-2 whitespace-nowrap">{fechaHora(i.fecha)}</td>
              <td className="px-3 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeTipo[i.tipo]}`}>
                  {i.tipo === "SEGUIMIENTO" ? "Seguimiento" : "Apertura"}
                </span>
              </td>
              <td className="px-3 py-2">{i.titulo}</td>
              <td className="px-3 py-2">{i.cliente ?? "—"}</td>
              <td className="px-3 py-2">{i.responsable ?? "—"}</td>
              <td className="px-3 py-2">
                {i.prioridad ? (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgePrioridad[i.prioridad]}`}>
                    {i.prioridad}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td className="px-3 py-3 text-slate-400" colSpan={6}>
                Nada agendado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
