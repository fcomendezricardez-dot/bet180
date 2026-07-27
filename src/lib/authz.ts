export type Actor = {
  rol: "ADMIN" | "OPERADOR" | "GESTOR";
  letra: string | null;
};

export class ForbiddenError extends Error {
  constructor(message = "No tienes permiso para realizar esta acción.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Solo ADMIN puede continuar (editar status, reportes, arqueo, bonos, usuarios). */
export function assertAdmin(actor: Actor) {
  if (actor.rol !== "ADMIN") throw new ForbiddenError();
}

/** ADMIN o GESTOR pueden continuar (Gestión, Buscador Clientes, Punto de Atención, Seguimiento, Aperturas). */
export function assertGestion(actor: Actor) {
  if (actor.rol !== "ADMIN" && actor.rol !== "GESTOR") throw new ForbiddenError();
}

/** ADMIN y GESTOR operan cualquier letra; OPERADOR solo la suya. */
export function assertLetraAccess(actor: Actor, letra: string) {
  if (actor.rol === "ADMIN" || actor.rol === "GESTOR") return;
  if (actor.letra !== letra) throw new ForbiddenError();
}
