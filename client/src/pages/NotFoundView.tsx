import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFoundView() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const target = isAuthenticated ? "/dashboard" : "/";

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass-panel w-full max-w-xl rounded-[2rem] p-8 text-center md:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--ifms-red-50)] text-[var(--ifms-red-600)]">
          <AlertCircle className="h-9 w-9" />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--ifms-green-700)]">
          Erro 404
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--ifms-green-900)] md:text-4xl">
          Página não encontrada
        </h1>
        <div className="mx-auto mt-4 h-1 w-24">
          <div className="ifms-bar" />
        </div>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[var(--ifms-text-soft)] md:text-base">
          O endereço acessado não existe mais ou não está disponível neste contexto da plataforma institucional.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            onClick={() => setLocation(target)}
            className="rounded-full bg-[var(--ifms-green-600)] px-6 text-white hover:bg-[var(--ifms-green-700)]"
          >
            <Home className="mr-2 h-4 w-4" />
            {isAuthenticated ? "Voltar ao dashboard" : "Ir para a página inicial"}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="rounded-full border-[var(--ifms-green-200)] px-6 text-[var(--ifms-green-900)] hover:bg-[var(--ifms-green-50)]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
