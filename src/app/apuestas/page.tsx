import { auth } from "@/auth";
import { listApuestas } from "@/lib/apuestas";
import { ApuestasTable } from "./apuestas-table";

export default async function ApuestasPage() {
  const session = await auth();
  if (!session?.user) return null;
  const actor = { rol: session.user.rol, letra: session.user.letra };

  const apuestas = await listApuestas(actor);

  const filas = apuestas
    // las filas con apuestaRelacionadaId son registros internos de ganancia, no apuestas colocadas
    .filter((a) => a.apuestaRelacionadaId === null)
    .map((a) => ({
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
      posibleGanancia: a.posibleGanancia.toNumber(),
      statusApuesta: a.statusApuesta,
      resultadoGanancia: a.gananciasRelacionadas[0]?.resultadoGanancia?.toNumber() ?? null,
    }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Apuestas Colocadas</h1>
      <p className="mb-4 text-sm text-slate-500">Todas las apuestas registradas: En juego, Ganadas y Perdidas.</p>
      <ApuestasTable apuestas={filas} />
    </div>
  );
}
