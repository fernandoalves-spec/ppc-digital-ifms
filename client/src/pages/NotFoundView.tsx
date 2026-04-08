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
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <AlertCircle className="h-9 w-9" />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Erro 404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Página não encontrada</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-600 md:text-base">
          O endereço acessado não existe mais ou não está disponível neste contexto da plataforma.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            onClick={() => setLocation(target)}
            className="rounded-full bg-[var(--color-primary)] px-6 text-white hover:brightness-110"
          >
            <Home className="mr-2 h-4 w-4" />
            {isAuthenticated ? "Voltar ao dashboard" : "Ir para a página inicial"}
          </Button>
          <Button variant="outline" onClick={() => window.history.back()} className="rounded-full px-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
