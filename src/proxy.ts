import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login"];

/** Subrutas de /admin exclusivas de ADMIN (no accesibles para GESTOR). */
const ADMIN_ONLY_PATHS = ["/admin/status", "/admin/reportes", "/admin/arqueo", "/admin/bonos", "/admin/usuarios"];

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
    const rol = req.auth.user.rol;
    const esAdminOnly = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
    const permitido = rol === "ADMIN" || (rol === "GESTOR" && !esAdminOnly);
    if (!permitido) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
