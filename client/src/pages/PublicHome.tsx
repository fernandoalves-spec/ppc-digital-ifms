import { useAuth } from "@/_core/hooks/useAuth";
import BrandMark from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { BookOpen, ClipboardList, FileText } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

const features = [
  {
    icon: FileText,
    title: "Extracao de PDF",
    description: "Importe PPCs em PDF e extraia automaticamente disciplinas, ementas e referencias com IA.",
  },
  {
    icon: BookOpen,
    title: "Dashboard Analitico",
    description: "Visualize indicadores de cursos, areas de ensino e distribuicao de disciplinas em tempo real.",
  },
  {
    icon: ClipboardList,
    title: "Fluxo de Aprovacoes",
    description: "Gerencie solicitacoes de indicacao de area entre administradores e coordenadores de curso.",
  },
];

export default function PublicHome() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) setLocation("/dashboard");
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-8">
          <BrandMark variant="vertical" imgClassName="h-20 w-auto mx-auto" fallbackClassName="justify-center" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">PPC Digital IFMS</h1>
        <p className="mt-3 max-w-md text-base text-slate-500">
          Plataforma institucional para gestao de Projetos Pedagogicos de Curso do Instituto Federal de Mato Grosso do Sul.
        </p>

        <Button
          onClick={() => { window.location.href = getLoginUrl(); }}
          className="mt-8 h-12 rounded-lg bg-green-600 px-8 text-base font-semibold text-white hover:bg-green-700"
        >
          Entrar com conta institucional
        </Button>

        <div className="mt-16 grid w-full max-w-3xl gap-4 md:grid-cols-3">
          {features.map(f => (
            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        IFMS — Instituto Federal de Mato Grosso do Sul
      </footer>
    </div>
  );
}
