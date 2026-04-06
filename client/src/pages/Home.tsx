import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { GraduationCap, BarChart3, FileText, Shield } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="animate-spin w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <header className="border-b border-green-100 bg-white/80 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">PPC Digital</h1>
              <p className="text-xs text-slate-500">IFMS</p>
            </div>
          </div>
          <a href={getLoginUrl()}>
            <Button className="bg-green-600 hover:bg-green-700">Entrar</Button>
          </a>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Gestão Inteligente de Projetos Pedagógicos de Curso
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Sistema completo para análise, gestão e acompanhamento de PPCs do Instituto Federal de Mato Grosso do Sul.
            Upload de PDFs com extração automática via inteligência artificial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-100 p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Extração Automática</h3>
            <p className="text-sm text-slate-500">Upload de PPC em PDF com extração inteligente de curso, campus, disciplinas, ementas e referências.</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Dashboards Analíticos</h3>
            <p className="text-sm text-slate-500">Visão geral de aulas por semestre, área e curso com gráficos interativos e relatórios em PDF.</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Fluxo de Aprovação</h3>
            <p className="text-sm text-slate-500">Administradores solicitam e coordenadores indicam a área docente de cada disciplina.</p>
          </div>
        </div>

        <div className="text-center mt-12">
          <a href={getLoginUrl()}>
            <Button size="lg" className="bg-green-600 hover:bg-green-700 px-8">
              Acessar o Sistema
            </Button>
          </a>
        </div>
      </main>

      <footer className="border-t border-green-100 py-6 text-center">
        <p className="text-sm text-slate-400">PPC Digital IFMS — Pró-reitoria de Desenvolvimento Institucional</p>
      </footer>
    </div>
  );
}
