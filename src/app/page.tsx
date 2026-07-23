import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-2 text-sm text-slate-500">
        Sesión activa: {session?.user?.email} ({session?.user?.rol}
        {session?.user?.letra ? ` · ${session.user.letra}` : ""})
      </p>
    </div>
  );
}
