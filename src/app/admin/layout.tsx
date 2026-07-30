import { redirect } from "next/navigation";
import { auth } from "@/auth";

// La restricción por pantalla vive en proxy.ts y en el layout de cada
// subcarpeta que la necesite; aquí solo se exige estar autenticado, ya que
// ADMIN, GESTOR y OPERADOR pueden acceder a alguna pantalla bajo /admin.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }
  return <>{children}</>;
}
