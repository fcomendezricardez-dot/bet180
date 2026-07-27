import { UsuariosForm } from "./usuarios-form";

export default function UsuariosPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Usuarios</h1>
      <p className="mb-4 text-sm text-slate-500">
        Crea y edita los accesos de cada operador (correo, contraseña, letra asignada). Solo administradores.
      </p>
      <UsuariosForm />
    </div>
  );
}
