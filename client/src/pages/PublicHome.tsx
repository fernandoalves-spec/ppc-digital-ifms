import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileCheck2,
  FileText,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

const modules = [
  {
    icon: FileText,
    title: "Ingestão inteligente de PPCs",
    description:
      "Receba documentos em PDF, extraia a estrutura acadêmica e transforme conteúdo disperso em dados utilizáveis.",
  },
  {
    icon: BarChart3,
    title: "Leitura gerencial em tempo real",
    description:
      "Acompanhe áreas, semestres, carga horária e pendências com uma visão executiva mais clara.",
  },
  {
    icon: ShieldCheck,
    title: "Fluxo institucional de aprovação",
    description:
      "Organize a indicação de áreas docentes e reduza gargalos entre gestão, coordenação e equipes acadêmicas.",
  },
];

const proofPoints = [
  "Identidade visual alinhada ao contexto institucional do IFMS",
  "Acesso unificado para gestão, coordenação e usuários acadêmicos",
  "Base preparada para decisões com menos retrabalho manual",
];

const operationalMetrics = [
  { value: "Fluxo único", label: "da leitura do PPC à aprovação" },
  { value: "Visão consolidada", label: "de cursos, disciplinas e ofertas" },
  { value: "Mais clareza", label: "para decisões acadêmicas e relatórios" },
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
      <div className="app-shell flex items-center justify-center">
        <div className="glass-panel flex items-center gap-4 rounded-3xl px-8 py-6">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Preparando o ambiente</p>
            <p className="text-sm text-slate-500">Carregando experiência institucional</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="app-shell overflow-hidden">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-hero)] shadow-lg shadow-emerald-950/15">
              <GraduationCap className="h-6 w-6 text-[var(--color-hero-foreground)]" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-950">PPC Digital</p>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">IFMS</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 lg:flex">
            <a href="#modulos" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950">
              Módulos
            </a>
            <a href="#beneficios" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950">
              Benefícios
            </a>
            <a href="#governanca" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950">
              Governança
            </a>
          </nav>

          <a href={getLoginUrl()}>
            <Button className="h-11 rounded-full bg-[var(--color-primary)] px-6 text-white shadow-lg shadow-emerald-900/15 hover:brightness-110">
              Entrar no sistema
            </Button>
          </a>
        </div>
      </header>

      <main>
        <section className="container grid gap-12 py-14 md:py-20 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div className="space-y-8">
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" />
              Plataforma institucional para gestão de PPCs
            </span>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl xl:text-6xl">
                Uma operação acadêmica mais clara, confiável e preparada para decisão.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                O PPC Digital organiza projetos pedagógicos, estrutura aprovações e transforma documentos em uma base
                de consulta prática para o Instituto Federal de Mato Grosso do Sul.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={getLoginUrl()}>
                <Button
                  size="lg"
                  className="h-12 rounded-full bg-[var(--color-primary)] px-7 text-white shadow-xl shadow-emerald-900/15 hover:brightness-110"
                >
                  Acessar ambiente institucional
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href="#modulos">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-[color:var(--color-border)] bg-white/70 px-7 text-slate-800 hover:bg-white"
                >
                  Conhecer módulos
                </Button>
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {operationalMetrics.map((item) => (
                <div key={item.label} className="glass-panel rounded-3xl p-4">
                  <p className="text-lg font-bold text-slate-950">{item.value}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-12 h-36 w-36 rounded-full bg-emerald-300/30 blur-3xl" />
            <div className="absolute -right-8 bottom-10 h-40 w-40 rounded-full bg-amber-300/35 blur-3xl" />

            <div className="glass-panel relative rounded-[2rem] p-5 md:p-7">
              <div className="rounded-[1.75rem] bg-[var(--color-hero)] p-6 text-[var(--color-hero-foreground)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100/80">
                      Painel de gestão
                    </p>
                    <h2 className="mt-3 text-2xl font-bold tracking-tight">Panorama acadêmico com leitura executiva</h2>
                  </div>
                  <Badge className="rounded-full bg-white/12 px-3 py-1 text-[var(--color-hero-foreground)] hover:bg-white/12">
                    IFMS
                  </Badge>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-emerald-50/80">Governança distribuída</p>
                        <p className="text-lg font-semibold">Cursos, campus e áreas conectados</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-emerald-50/75">
                      Consolide a leitura de dados acadêmicos com menos fricção operacional.
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl shadow-black/10">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Fluxo principal</p>
                    <div className="mt-5 space-y-4">
                      {[
                        "Entrada de PPC e extração estruturada",
                        "Mapeamento de áreas e validações",
                        "Acompanhamento analítico e relatórios",
                      ].map((step) => (
                        <div key={step} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                          <p className="text-sm leading-6 text-slate-600">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-emerald-100 bg-white p-5">
                  <p className="text-sm text-slate-500">Organização documental</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Centralizada</p>
                </div>
                <div className="rounded-3xl border border-amber-100 bg-white p-5">
                  <p className="text-sm text-slate-500">Leitura analítica</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Mais clara</p>
                </div>
                <div className="rounded-3xl border border-sky-100 bg-white p-5">
                  <p className="text-sm text-slate-500">Tomada de decisão</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Mais segura</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="modulos" className="container py-8 md:py-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <span className="eyebrow">Módulos estratégicos</span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Um ecossistema pensado para o ciclo acadêmico completo.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Da leitura do documento à gestão das pendências, a plataforma reúne fluxos que normalmente ficam
              fragmentados entre planilhas, arquivos e mensagens.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {modules.map((module) => (
              <article key={module.title} className="glass-panel rounded-[1.75rem] p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-hero)] text-white shadow-lg shadow-emerald-950/15">
                  <module.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">{module.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{module.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="beneficios" className="container py-8 md:py-12">
          <div className="page-shell grid gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
            <div className="space-y-5">
              <span className="eyebrow">Benefícios institucionais</span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">Mais consistência visual e operacional.</h2>
              <p className="text-base leading-7 text-slate-600">
                O novo posicionamento do produto fortalece a percepção de qualidade, organiza a navegação e apoia a
                comunicação entre gestão, coordenação e áreas acadêmicas.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-[var(--color-surface-strong)] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Users2 className="h-5 w-5 text-emerald-700" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">Experiência mais orientada por contexto</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Menus, atalhos e indicadores passam a falar a linguagem das tarefas reais do dia a dia.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-[var(--color-surface-strong)] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <FileCheck2 className="h-5 w-5 text-amber-700" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">Menos ruído, mais confiança</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Superfícies, contrastes e estados visuais passam a comunicar prioridade e status com clareza.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="governanca" className="container py-8 md:py-12">
          <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
            <div className="glass-panel rounded-[2rem] p-8">
              <span className="eyebrow">Governança acadêmica</span>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
                Estrutura visual com responsabilidade institucional.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                O redesenho respeita a identidade do IFMS e organiza a plataforma para comunicar solidez, controle e
                maturidade digital em todos os pontos da experiência.
              </p>
            </div>

            <div className="space-y-4">
              {proofPoints.map((item) => (
                <div key={item} className="glass-panel flex items-start gap-4 rounded-[1.5rem] p-5">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm leading-7 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="container py-10">
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/70 bg-white/70 px-6 py-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">PPC Digital IFMS</p>
            <p className="text-sm text-slate-500">Pró-Reitoria de Desenvolvimento Institucional</p>
          </div>
          <a href={getLoginUrl()}>
            <Button className="rounded-full bg-[var(--color-hero)] px-6 text-white hover:brightness-110">
              Entrar com conta institucional
            </Button>
          </a>
        </div>
      </footer>
    </div>
  );
}
