import { CasinoForm, CuentaForm } from "./alta-forms";

export default function AltaPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Alta de Cuenta</h1>
        <p className="mb-4 text-sm text-slate-500">Da de alta una cuenta bancaria nueva, en cualquier letra.</p>
        <CuentaForm />
      </div>
      <div className="border-t border-slate-200 pt-8">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Alta de Casino</h1>
        <p className="mb-4 text-sm text-slate-500">Da de alta una cuenta de casino nueva, en cualquier letra.</p>
        <CasinoForm />
      </div>
    </div>
  );
}
