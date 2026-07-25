import { auth } from "@/auth";
import { cuentasEnRiesgoDeFondeo, proximosARecarga, vencimientosIne } from "@/lib/puntoAtencion";
import { AtencionTabs } from "./atencion-tabs";

export default async function AtencionPage() {
  const session = await auth();
  if (!session?.user) return null;
  const actor = { rol: session.user.rol, letra: session.user.letra };

  const [ine, recargas, fondeo] = await Promise.all([
    vencimientosIne(actor),
    proximosARecarga(actor),
    cuentasEnRiesgoDeFondeo(actor),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Punto de Atención</h1>
      <p className="mb-4 text-sm text-slate-500">
        Lo que requiere acción pronto: INE por vencer, recargas atrasadas y cuentas con fondeo bajo.
      </p>
      <AtencionTabs ine={ine} recargas={recargas} fondeo={fondeo} />
    </div>
  );
}
