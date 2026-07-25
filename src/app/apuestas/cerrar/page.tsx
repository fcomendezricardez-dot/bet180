import { auth } from "@/auth";
import { listApuestas } from "@/lib/apuestas";
import { CerrarApuestaTable } from "./cerrar-apuesta-table";

export default async function CerrarApuestaPage() {
  const session = await auth();
  if (!session?.user) return null;
  const actor = { rol: session.user.rol, letra: session.user.letra };

  const apuestas = await listApuestas(actor, { statusApuesta: "EN_JUEGO" });

  const filas = apuestas.map((a) => ({
    id: a.id,
    fecha: a.fecha.toISOString(),
    letra: a.letra,
    perfil: a.perfil,
    casino: a.casino.nombreCasino,
    noApuesta: a.noApuesta,
    evento: a.evento,
    descripcion: a.descripcion,
    mercado: a.mercado,
    momio: a.momio.toNumber(),
    saldoReal: a.saldoReal.toNumber(),
    bono: a.bono.toNumber(),
    tipoBono: a.tipoBono,
    posibleGanancia: a.posibleGanancia.toNumber(),
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Eventos Activos</h1>
      <p className="mb-4 text-sm text-slate-500">Apuestas En juego. Marca cada una como Ganada o Perdida.</p>
      <CerrarApuestaTable apuestas={filas} />
    </div>
  );
}
