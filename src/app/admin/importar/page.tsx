import { ImportarForm } from "./importar-form";

export default function ImportarPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Importar Excel (Letra A)</h1>
      <p className="mb-4 text-sm text-slate-500">
        Sube el Excel de cuentas de Casinos y Bancos de la letra A. En registros nuevos usa el saldo y estatus del
        Excel; en registros existentes no toca saldo ni estatus, solo refresca credenciales y notas. Solo
        administradores.
      </p>
      <ImportarForm />
    </div>
  );
}
