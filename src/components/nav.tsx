import Link from "next/link";
import { auth, signOut } from "@/auth";

const OPERATOR_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/movimientos/nuevo", label: "Nuevo Movimiento" },
  { href: "/apuestas/cerrar", label: "Cerrar Apuesta" },
];

const ADMIN_LINKS = [
  { href: "/admin/alta", label: "Alta Cuenta/Casino" },
  { href: "/admin/status", label: "Editar Status" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/tarjetas", label: "Tarjetas" },
  { href: "/admin/clientes", label: "Clientes" },
];

export async function Nav() {
  const session = await auth();
  if (!session?.user) return null;

  const links = [...OPERATOR_LINKS, ...(session.user.rol === "ADMIN" ? ADMIN_LINKS : [])];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-semibold text-slate-900">Bet180</span>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-slate-600 hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>
            {session.user.name} ·{" "}
            {session.user.rol === "ADMIN" ? "Admin" : `Letra ${session.user.letra}`}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="text-slate-600 hover:text-slate-900 underline">
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
