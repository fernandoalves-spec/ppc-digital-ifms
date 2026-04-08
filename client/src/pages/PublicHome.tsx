import { useAuth } from "@/_core/hooks/useAuth";
import BrandMark from "@/components/BrandMark";
import PageHeader from "@/components/layout/PageHeader";
import SectionCard from "@/components/layout/SectionCard";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { ArrowRight, CheckCircle2, ClipboardList, FileText, LayoutDashboard, ShieldCheck, Users2 } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

const modules = [
  {
    icon: FileText,
    title: "Ingestao inteligente de PPC",
    description: "Receba PDFs, extraia estrutura academica e transforme conteudo em dados acionaveis.",
  },
  {
    icon: ClipboardList,
    title: "Fluxo institucional de aprovacao",
    description: "Organize solicitacoes entre gestao, coordenacao e areas academicas com rastreabilidade.",
  },
  {
    icon: LayoutDashboard,
    title: "Leitura executiva em tempo real",
    description: "Acompanhe indicadores de cursos, ofertas e pendencias em um painel unificado.",
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
      <a
        href="#public-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--ifms-green-900)]"
      >
        Ir para o conteudo principal
      </a>
      <header className="sticky top-0 z-30 border-b border-[var(--ifms-green-100)] bg-white/96 backdrop-blur-sm">
        <div className="container flex min-h-16 items-center justify-between gap-4 py-3">
          <BrandMark variant="horizontal" imgClassName="h-10 w-auto" />

          <nav className="hidden items-center gap-6 md:flex" aria-label="Navegacao principal">
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
            <Button className="h-10 rounded-full bg-[var(--ifms-green-600)] px-5 text-white hover:bg-[var(--ifms-green-700)]">Entrar</Button>
          </a>
        </div>
      </header>

      <main id="public-main-content" className="container page-stack pb-10 pt-8 md:pt-10" role="main">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <PageHeader
            badge="Plataforma institucional IFMS"
            title="Gestao de PPC mais clara, rapida e confiavel"
            description="O PPC Digital organiza projetos pedagogicos, reduz ruido operacional e melhora a tomada de decisao em toda a rede do Instituto Federal de Mato Grosso do Sul."
            actions={
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
            }
          />

          <SectionCard className="space-y-4">
            <div className="hero-strip rounded-2xl p-5 text-white md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Painel de gestao</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Leitura executiva para operacao academica</h2>
              <div className="mt-5 space-y-3 text-sm text-white/85">
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Entrada e extracao de PPC</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Aprovacoes e pendencias por area</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Relatorios institucionais consolidados</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MiniHighlight title="Fluxo unico" description="Do upload ao acompanhamento" tone="default" />
              <MiniHighlight title="Visao consolidada" description="Cursos, areas e ofertas" tone="default" />
              <MiniHighlight title="Mais seguranca" description="Decisao institucional" tone="danger" />
            </div>
          </SectionCard>
        </section>

        <section id="modulos" className="page-stack">
          <PageHeader
            badge="Modulos estrategicos"
            title="Um ecossistema para o ciclo academico completo"
            description="Da leitura do documento a gestao das pendencias, o sistema conecta etapas antes dispersas."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {modules.map(module => (
              <SectionCard key={module.title}>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ifms-green-600)] text-white">
                  <module.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--ifms-green-900)]">{module.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--ifms-text-soft)]">{module.description}</p>
              </SectionCard>
            ))}
          </div>
        </section>

        <section id="beneficios" className="page-stack">
          <PageHeader badge="Beneficios institucionais" title="Mais consistencia visual e operacional" />
          <SectionCard className="space-y-3">
            {benefits.map(item => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-[var(--ifms-green-100)] bg-[var(--ifms-green-50)] p-4">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                  <CheckCircle2 className="h-4 w-4 text-[var(--ifms-green-700)]" />
                </span>
                <p className="text-sm leading-7 text-[var(--ifms-text)]">{item}</p>
              </div>
            ))}
          </SectionCard>
        </section>

        <section id="governanca" className="grid gap-4 md:grid-cols-3">
          <GovernanceCard
            icon={<Users2 className="h-5 w-5 text-[var(--ifms-green-700)]" />}
            title="Experiencia orientada por contexto"
            description="Navegacao e indicadores desenhados para tarefas reais do dia a dia."
          />
          <GovernanceCard
            icon={<ShieldCheck className="h-5 w-5 text-[var(--ifms-green-700)]" />}
            title="Clareza em status e prioridade"
            description="Contraste e hierarquia para decidir mais rapido com menos erro operacional."
          />
          <GovernanceCard
            icon={<CheckCircle2 className="h-5 w-5 text-[var(--ifms-red-600)]" />}
            title="Conformidade com identidade IFMS"
            description="Paleta, tipografia e aplicacao visual alinhadas ao contexto institucional."
            tone="danger"
          />
        </section>
      </main>

      <footer className="container pb-8">
        <SectionCard className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <BrandMark variant="horizontal" imgClassName="h-9 w-auto" />
            <p className="text-sm text-[var(--ifms-text-soft)]">Pro-reitoria de Desenvolvimento Institucional</p>
          </div>
          <a href={getLoginUrl()}>
            <Button className="rounded-full bg-[var(--ifms-green-600)] px-6 text-white hover:bg-[var(--ifms-green-700)]">
              Entrar com conta institucional
            </Button>
          </a>
        </SectionCard>
      </footer>
    </div>
  );
}

function MiniHighlight({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "default" | "danger";
}) {
  return (
    <div className={`rounded-2xl border bg-white p-4 ${tone === "danger" ? "border-[var(--ifms-red-100)]" : "border-[var(--ifms-green-100)]"}`}>
      <p className={`text-lg font-bold ${tone === "danger" ? "text-[var(--ifms-red-700)]" : "text-[var(--ifms-green-900)]"}`}>{title}</p>
      <p className="mt-1 text-sm text-[var(--ifms-text-soft)]">{description}</p>
    </div>
  );
}

function GovernanceCard({
  icon,
  title,
  description,
  tone = "default",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: "default" | "danger";
}) {
  return (
    <SectionCard className={tone === "danger" ? "border-[var(--ifms-red-100)]" : undefined}>
      {icon}
      <h3 className="mt-3 text-lg font-semibold text-[var(--ifms-green-900)]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--ifms-text-soft)]">{description}</p>
    </SectionCard>
  );
}
