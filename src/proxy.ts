import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login"];

type Rol = "ADMIN" | "OPERADOR" | "GESTOR";

/** Roles permitidos por cada subruta de /admin; ADMIN siempre tiene acceso a todo. */
const ADMIN_PATH_ROLES: [string, Rol[]][] = [
  ["/admin/status", []],
  ["/admin/arqueo", []],
  ["/admin/usuarios", []],
  ["/admin/alta", ["GESTOR"]],
  ["/admin/seguimiento", ["GESTOR"]],
  ["/admin/aperturas", ["GESTOR"]],
  ["/admin/agenda", ["GESTOR"]],
  ["/admin/reportes", ["GESTOR", "OPERADOR"]],
  ["/admin/clientes", ["GESTOR", "OPERADOR"]],
  ["/admin/atencion", ["GESTOR", "OPERADOR"]],
  ["/admin/bonos", ["OPERADOR"]],
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron")
  ) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    const rol = req.auth.user.rol as Rol;
    if (rol !== "ADMIN") {
      const entry = ADMIN_PATH_ROLES.find(([p]) => pathname.startsWith(p));
      const permitido = entry ? entry[1].includes(rol) : false;
      if (!permitido) {
        return NextResponse.redirect(new URL("/", req.nextUrl.origin));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
