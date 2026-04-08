import { useAuth } from "@/_core/hooks/useAuth";
import BrandMark from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Users2,
} from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

const modules = [
  {
    icon: FileText,
    title: "Ingestao inteligente de PPC",
    description:
      "Receba PDFs, extraia a estrutura academica e transforme conteudo em dados acionaveis.",
  },
  {
    icon: ClipboardList,
    title: "Fluxo institucional de aprovacao",
    description:
      "Organize solicitacoes entre gestao, coordenacao e areas academicas com rastreabilidade.",
  },
  {
    icon: LayoutDashboard,
    title: "Leitura executiva em tempo real",
    description:
      "Acompanhe indicadores de cursos, ofertas e pendencias em um painel unificado.",
  },
];

const benefits = [
  "Visual institucional consistente com a marca IFMS",
  "Navegacao simples para desktop e dispositivos moveis",
  "Decisao academica com menos retrabalho operacional",
];

export default function PublicHome() {
  const { loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel flex items-center gap-3 rounded-2xl px-6 py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--ifms-green-600)] border-t-transparent" />
          <p className="text-sm font-medium text-[var(--ifms-green-900)]">Carregando ambiente institucional...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-30 border-b border-[var(--ifms-green-100)] bg-white/96 backdrop-blur-sm">
        <div className="container flex min-h-16 items-center justify-between gap-4 py-3">
          <BrandMark variant="horizontal" imgClassName="h-10 w-auto" />

          <nav className="hidden items-center gap-6 lg:flex">
            <a href="#modulos" className="text-sm text-[var(--ifms-text-soft)] hover:text-[var(--ifms-green-900)]">
              Modulos
            </a>
            <a href="#beneficios" className="text-sm text-[var(--ifms-text-soft)] hover:text-[var(--ifms-green-900)]">
              Beneficios
            </a>
            <a href="#governanca" className="text-sm text-[var(--ifms-text-soft)] hover:text-[var(--ifms-green-900)]">
              Governanca
            </a>
          </nav>

          <a href={getLoginUrl()}>
            <Button className="h-10 rounded-full bg-[var(--ifms-green-600)] px-5 text-white hover:bg-[var(--ifms-green-700)]">
              Entrar
            </Button>
          </a>
        </div>
      </header>

      <main className="pb-10">
        <section className="container grid gap-8 py-10 md:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <span className="eyebrow">Plataforma institucional IFMS</span>

            <div className="space-y-4">
              <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ifms-green-900)] sm:text-4xl lg:text-5xl">
                Gestao de PPC mais clara, rapida e confiavel.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--ifms-text-soft)] sm:text-lg">
                O PPC Digital organiza projetos pedagogicos, reduz ruido operacional e melhora a tomada de decisao em
                toda a rede do Instituto Federal de Mato Grosso do Sul.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={getLoginUrl()}>
                <Button size="lg" className="h-11 rounded-full bg-[var(--ifms-green-600)] px-6 text-white hover:bg-[var(--ifms-green-700)]">
                  Acessar ambiente institucional
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href="#modulos">
                <Button size="lg" variant="outline" className="h-11 rounded-full border-[var(--ifms-green-200)] px-6 text-[var(--ifms-green-900)] hover:bg-[var(--ifms-green-50)]">
                  Ver modulos
                </Button>
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--ifms-green-100)] bg-white p-4">
                <p className="text-lg font-bold text-[var(--ifms-green-900)]">Fluxo unico</p>
                <p className="mt-1 text-sm text-[var(--ifms-text-soft)]">Do upload ao acompanhamento</p>
              </div>
              <div className="rounded-2xl border border-[var(--ifms-green-100)] bg-white p-4">
                <p className="text-lg font-bold text-[var(--ifms-green-900)]">Visao consolidada</p>
                <p className="mt-1 text-sm text-[var(--ifms-text-soft)]">Cursos, areas e ofertas</p>
              </div>
              <div className="rounded-2xl border border-[var(--ifms-red-100)] bg-white p-4">
                <p className="text-lg font-bold text-[var(--ifms-red-700)]">Mais seguranca</p>
                <p className="mt-1 text-sm text-[var(--ifms-text-soft)]">Decisao institucional</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--ifms-green-100)] bg-white p-5 shadow-[var(--ifms-shadow-soft)] md:p-6">
            <div className="hero-strip rounded-2xl p-5 text-white md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Painel de gestao</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Leitura executiva para operacao academica</h2>
              <div className="mt-5 space-y-3 text-sm text-white/85">
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Entrada e extracao de PPC</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Aprovacoes e pendencias por area</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Relatorios institucionais consolidados</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--ifms-green-100)] bg-[var(--ifms-green-50)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--ifms-green-700)]">Gestao</p>
                <p className="mt-2 text-sm text-[var(--ifms-text-soft)]">Prioridades operacionais com menos friccao.</p>
              </div>
              <div className="rounded-2xl border border-[var(--ifms-red-100)] bg-[var(--ifms-red-50)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--ifms-red-600)]">Governanca</p>
                <p className="mt-2 text-sm text-[var(--ifms-text-soft)]">Rastreabilidade e clareza institucional.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="modulos" className="container py-6 md:py-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="eyebrow">Modulos estrategicos</span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--ifms-green-900)] md:text-3xl">
                Um ecossistema pensado para o ciclo academico completo.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[var(--ifms-text-soft)]">
              Da leitura do documento a gestao das pendencias, o sistema conecta etapas que antes estavam dispersas.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {modules.map((module) => (
              <article key={module.title} className="rounded-2xl border border-[var(--ifms-green-100)] bg-white p-5 shadow-[var(--ifms-shadow-soft)]">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ifms-green-600)] text-white">
                  <module.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--ifms-green-900)]">{module.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--ifms-text-soft)]">{module.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="beneficios" className="container py-6 md:py-10">
          <div className="grid gap-4 rounded-3xl border border-[var(--ifms-green-100)] bg-white p-5 md:grid-cols-3 md:p-6">
            <div className="md:col-span-1">
              <span className="eyebrow">Beneficios institucionais</span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--ifms-green-900)]">Mais consistencia visual e operacional.</h2>
            </div>

            <div className="space-y-3 md:col-span-2">
              {benefits.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-[var(--ifms-green-100)] bg-[var(--ifms-green-50)] p-4">
                  <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                    <CheckCircle2 className="h-4 w-4 text-[var(--ifms-green-700)]" />
                  </span>
                  <p className="text-sm leading-7 text-[var(--ifms-text)]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="governanca" className="container py-6 md:py-10">
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-[var(--ifms-green-100)] bg-white p-5">
              <Users2 className="h-5 w-5 text-[var(--ifms-green-700)]" />
              <h3 className="mt-3 text-lg font-semibold text-[var(--ifms-green-900)]">Experiencia orientada por contexto</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--ifms-text-soft)]">Navegacao e indicadores desenhados para tarefas reais do dia a dia.</p>
            </article>
            <article className="rounded-2xl border border-[var(--ifms-green-100)] bg-white p-5">
              <ShieldCheck className="h-5 w-5 text-[var(--ifms-green-700)]" />
              <h3 className="mt-3 text-lg font-semibold text-[var(--ifms-green-900)]">Clareza em status e prioridade</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--ifms-text-soft)]">Contraste e hierarquia para decidir mais rapido com menos erro operacional.</p>
            </article>
            <article className="rounded-2xl border border-[var(--ifms-red-100)] bg-white p-5">
              <CheckCircle2 className="h-5 w-5 text-[var(--ifms-red-600)]" />
              <h3 className="mt-3 text-lg font-semibold text-[var(--ifms-green-900)]">Conformidade com identidade IFMS</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--ifms-text-soft)]">Paleta, tipografia e aplicacao visual alinhadas ao contexto institucional.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="container pb-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-[var(--ifms-green-100)] bg-white px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <BrandMark variant="horizontal" imgClassName="h-9 w-auto" />
            <p className="text-sm text-[var(--ifms-text-soft)]">Pro-reitoria de Desenvolvimento Institucional</p>
          </div>
          <a href={getLoginUrl()}>
            <Button className="rounded-full bg-[var(--ifms-green-600)] px-6 text-white hover:bg-[var(--ifms-green-700)]">Entrar com conta institucional</Button>
          </a>
        </div>
      </footer>
    </div>
  );
}
