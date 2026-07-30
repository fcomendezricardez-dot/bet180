import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ApuestasLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.rol === "GESTOR") redirect("/");
  return <>{children}</>;
}
