export type Actor = {
  rol: "ADMIN" | "OPERADOR";
  letra: string | null;
};

export class ForbiddenError extends Error {
  constructor(message = "No tienes permiso para realizar esta acción.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Solo ADMIN puede continuar (alta de cuentas/casinos, editar status, reportes). */
export function assertAdmin(actor: Actor) {
  if (actor.rol !== "ADMIN") throw new ForbiddenError();
}

/** ADMIN opera cualquier letra; OPERADOR solo la suya. */
export function assertLetraAccess(actor: Actor, letra: string) {
  if (actor.rol === "ADMIN") return;
  if (actor.letra !== letra) throw new ForbiddenError();
}
