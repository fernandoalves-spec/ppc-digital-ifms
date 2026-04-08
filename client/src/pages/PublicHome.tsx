import { useAuth } from "@/_core/hooks/useAuth";
import BrandMark from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Shield,
  Sparkles,
  Upload,
  Users2,
  Zap,
} from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

const modules = [
  {
    step: "01",
    icon: Upload,
    title: "Ingestão inteligente de PPC",
    description:
      "Envie PDFs institucionais e deixe o sistema extrair automaticamente a estrutura acadêmica, disciplinas, cargas horárias e áreas de ensino.",
  },
  {
    step: "02",
    icon: ClipboardList,
    title: "Fluxo de aprovação rastreável",
    description:
      "Organize solicitações entre gestão, coordenação e áreas acadêmicas com histórico completo e notificações automáticas.",
  },
  {
    step: "03",
    icon: LayoutDashboard,
    title: "Painel executivo em tempo real",
    description:
      "Acompanhe indicadores de cursos, ofertas e pendências em um painel unificado com gráficos e alertas inteligentes.",
  },
];

const stats = [
  { icon: Building2, value: "14", label: "Campus atendidos" },
  { icon: GraduationCap, value: "60+", label: "Cursos gerenciados" },
  { icon: BookOpen, value: "1.200+", label: "Disciplinas catalogadas" },
  { icon: MapPin, value: "MS", label: "Mato Grosso do Sul" },
];

const benefits = [
  {
    icon: Zap,
    title: "Redução de retrabalho",
    description: "Automatize a leitura de documentos e elimine o lançamento manual de dados acadêmicos.",
  },
  {
    icon: Shield,
    title: "Segurança institucional",
    description: "Controle de acesso por perfil com rastreabilidade completa de todas as operações.",
  },
  {
    icon: Sparkles,
    title: "Identidade visual IFMS",
    description: "Interface desenvolvida seguindo o manual de marca do Instituto Federal de Mato Grosso do Sul.",
  },
  {
    icon: Users2,
    title: "Colaboração entre equipes",
    description: "Coordenadores, gestores e áreas acadêmicas trabalhando no mesmo ambiente de forma integrada.",
  },
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
    <div className="min-h-screen overflow-x-hidden bg-white font-[Open_Sans,Arial,sans-serif]">
      {/* Skip link */}
      <a
        href="#public-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--ifms-green-900)]"
      >
        Ir para o conteudo principal
      </a>

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-[var(--ifms-green-100)] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1260px] min-h-16 items-center justify-between gap-4 px-4 py-3">
          <BrandMark variant="horizontal" imgClassName="h-10 w-auto" />

          <nav className="hidden items-center gap-6 md:flex" aria-label="Navegacao principal">
            <a href="#como-funciona" className="text-sm font-medium text-[var(--ifms-text-soft)] transition-colors hover:text-[var(--ifms-green-800)]">
              Como funciona
            </a>
            <a href="#modulos" className="text-sm font-medium text-[var(--ifms-text-soft)] transition-colors hover:text-[var(--ifms-green-800)]">
              Modulos
            </a>
            <a href="#beneficios" className="text-sm font-medium text-[var(--ifms-text-soft)] transition-colors hover:text-[var(--ifms-green-800)]">
              Beneficios
            </a>
          </nav>

          <a href={getLoginUrl()}>
            <Button className="h-10 rounded-full bg-[var(--ifms-green-600)] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[var(--ifms-green-700)]">
              Entrar
            </Button>
          </a>
        </div>
      </header>

      <main id="public-main-content" role="main">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, var(--ifms-green-950) 0%, var(--ifms-green-800) 55%, var(--ifms-green-700) 100%)",
            }}
            aria-hidden="true"
          />
          {/* Decorative blobs */}
          <div
            className="absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, var(--ifms-green-300) 0%, transparent 70%)" }}
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-20 left-1/3 h-[340px] w-[340px] rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, var(--ifms-red-500) 0%, transparent 70%)" }}
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-[1260px] px-4 pb-20 pt-16 md:pb-28 md:pt-24">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              {/* Left: text */}
              <div className="space-y-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ifms-green-300)]" />
                  Plataforma institucional IFMS
                </span>

                <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-[3.25rem]">
                  Gestão de PPC{" "}
                  <span className="text-[var(--ifms-green-300)]">mais clara,</span>
                  <br />
                  rápida e confiável
                </h1>

                <p className="max-w-lg text-base leading-relaxed text-white/80 md:text-lg">
                  O PPC Digital organiza projetos pedagógicos, reduz ruído operacional e melhora a
                  tomada de decisão em toda a rede do Instituto Federal de Mato Grosso do Sul.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <a href={getLoginUrl()}>
                    <Button
                      size="lg"
                      className="h-12 rounded-full bg-white px-7 text-base font-semibold text-[var(--ifms-green-900)] shadow-lg hover:bg-[var(--ifms-green-50)]"
                    >
                      Acessar o sistema
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                  <a href="#como-funciona">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-full border-white/30 px-7 text-base font-semibold text-white backdrop-blur-sm hover:border-white/50 hover:bg-white/10"
                    >
                      Como funciona
                    </Button>
                  </a>
                </div>
              </div>

              {/* Right: dashboard preview card */}
              <div className="hidden lg:block">
                <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/60">
                      Painel de gestão – visão executiva
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Cursos ativos", value: "63", color: "bg-[var(--ifms-green-400)]" },
                        { label: "Pendências", value: "7", color: "bg-[var(--ifms-red-500)]" },
                        { label: "Áreas", value: "12", color: "bg-[var(--ifms-green-300)]" },
                      ].map(kpi => (
                        <div key={kpi.label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                          <div className={`h-1.5 w-6 rounded-full ${kpi.color} mb-3`} />
                          <p className="text-2xl font-bold text-white">{kpi.value}</p>
                          <p className="mt-1 text-xs text-white/60">{kpi.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 space-y-2.5">
                      <p className="text-xs font-semibold text-white/70">Últimas ações</p>
                      {[
                        { text: "PPC de Informática enviado para aprovação", dot: "bg-[var(--ifms-green-400)]" },
                        { text: "Coordenador respondeu solicitação pendente", dot: "bg-[var(--ifms-green-300)]" },
                        { text: "Relatório mensal gerado com sucesso", dot: "bg-white/40" },
                      ].map(item => (
                        <div key={item.text} className="flex items-center gap-2.5">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
                          <span className="text-xs text-white/70">{item.text}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <CheckCircle2 className="h-4 w-4 text-[var(--ifms-green-400)]" />
                        <p className="mt-2 text-sm font-semibold text-white">Fluxo único</p>
                        <p className="mt-0.5 text-xs text-white/60">Do envio ao acompanhamento</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <FileText className="h-4 w-4 text-[var(--ifms-green-300)]" />
                        <p className="mt-2 text-sm font-semibold text-white">Dados acionáveis</p>
                        <p className="mt-0.5 text-xs text-white/60">Extraídos direto do PDF</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom wave */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none" aria-hidden="true">
            <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-14">
              <path d="M0 56L1440 56L1440 28C1200 0 960 0 720 28C480 56 240 56 0 28L0 56Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section className="bg-white py-12" aria-label="Numeros institucionais">
          <div className="mx-auto max-w-[1260px] px-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {stats.map(stat => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-2 rounded-3xl border border-[var(--ifms-green-100)] bg-[var(--ifms-green-50)] p-6 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ifms-green-600)] text-white">
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-[var(--ifms-green-900)]">{stat.value}</p>
                  <p className="text-xs font-medium text-[var(--ifms-text-soft)]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="como-funciona" className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-[1260px] px-4">
            <div className="mb-12 text-center">
              <span className="eyebrow">Como funciona</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--ifms-green-900)] md:text-4xl">
                Do documento ao painel em três etapas
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--ifms-text-soft)]">
                O PPC Digital conecta etapas antes dispersas numa experiência fluida para toda a equipe institucional.
              </p>
            </div>

            <div className="relative grid gap-6 md:grid-cols-3">
              {/* Connector line (desktop) */}
              <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-[var(--ifms-green-200)] to-transparent md:block" aria-hidden="true" />

              {modules.map(mod => (
                <div
                  key={mod.step}
                  className="relative rounded-3xl border border-[var(--ifms-green-100)] bg-white p-6 shadow-[var(--ifms-shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--ifms-shadow)]"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ifms-green-600)] text-sm font-bold text-white shadow-md">
                      {mod.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--ifms-green-50)] text-[var(--ifms-green-700)]">
                      <mod.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-[var(--ifms-green-900)]">{mod.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ifms-text-soft)]">{mod.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Modules / Features ── */}
        <section id="modulos" className="bg-[var(--ifms-green-50)] py-16 md:py-24">
          <div className="mx-auto max-w-[1260px] px-4">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="eyebrow">Módulos estratégicos</span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--ifms-green-900)] md:text-4xl">
                  Um ecossistema para o ciclo acadêmico completo
                </h2>
              </div>
              <a href={getLoginUrl()} className="shrink-0">
                <Button className="rounded-full bg-[var(--ifms-green-600)] px-6 text-white hover:bg-[var(--ifms-green-700)]">
                  Conhecer o sistema
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  icon: Upload,
                  title: "Upload e extração de PPC",
                  desc: "Envie o documento PDF e obtenha automaticamente disciplinas, semestres e cargas horárias estruturados.",
                  tag: "Automação",
                  tagColor: "bg-[var(--ifms-green-100)] text-[var(--ifms-green-800)]",
                },
                {
                  icon: ClipboardList,
                  title: "Gestão de aprovações",
                  desc: "Fluxo de solicitações com rastreabilidade entre gestores, coordenadores e áreas acadêmicas.",
                  tag: "Fluxo",
                  tagColor: "bg-[var(--ifms-green-100)] text-[var(--ifms-green-800)]",
                },
                {
                  icon: LayoutDashboard,
                  title: "Painel executivo",
                  desc: "Indicadores de cursos, campus, ofertas e pendências num painel único e responsivo.",
                  tag: "Visibilidade",
                  tagColor: "bg-[var(--ifms-green-100)] text-[var(--ifms-green-800)]",
                },
                {
                  icon: BookOpen,
                  title: "Catálogo de disciplinas",
                  desc: "Explore e gerencie todas as disciplinas por área, semestre e vinculação com PPCs.",
                  tag: "Dados",
                  tagColor: "bg-[var(--ifms-green-100)] text-[var(--ifms-green-800)]",
                },
                {
                  icon: Building2,
                  title: "Gestão de campus",
                  desc: "Acompanhe cursos, coordenadores e indicadores por unidade de forma centralizada.",
                  tag: "Institucional",
                  tagColor: "bg-[var(--ifms-green-100)] text-[var(--ifms-green-800)]",
                },
                {
                  icon: Users2,
                  title: "Controle de usuários",
                  desc: "Perfis diferenciados para gestores, coordenadores e equipe acadêmica com logs de auditoria.",
                  tag: "Segurança",
                  tagColor: "bg-[var(--ifms-red-100)] text-[var(--ifms-red-700)]",
                },
              ].map(feat => (
                <div
                  key={feat.title}
                  className="rounded-3xl border border-[var(--ifms-green-100)] bg-white p-6 shadow-[var(--ifms-shadow-soft)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ifms-green-600)] text-white">
                      <feat.icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${feat.tagColor}`}>
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[var(--ifms-green-900)]">{feat.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ifms-text-soft)]">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Benefits ── */}
        <section id="beneficios" className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-[1260px] px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="eyebrow">Por que usar</span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--ifms-green-900)] md:text-4xl">
                  Benefícios reais para a gestão acadêmica
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[var(--ifms-text-soft)]">
                  Desenvolvido para o contexto específico dos Institutos Federais, com foco em usabilidade e conformidade institucional.
                </p>
                <div className="mt-8">
                  <a href={getLoginUrl()}>
                    <Button
                      size="lg"
                      className="h-12 rounded-full bg-[var(--ifms-green-600)] px-8 text-base font-semibold text-white hover:bg-[var(--ifms-green-700)]"
                    >
                      Comecar agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {benefits.map(b => (
                  <div
                    key={b.title}
                    className="rounded-3xl border border-[var(--ifms-green-100)] bg-[var(--ifms-green-50)] p-5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ifms-green-600)] text-white">
                      <b.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-[var(--ifms-green-900)]">{b.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--ifms-text-soft)]">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, var(--ifms-green-900) 0%, var(--ifms-green-700) 60%, var(--ifms-green-600) 100%)",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute -left-24 top-0 h-72 w-72 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, var(--ifms-green-300) 0%, transparent 70%)" }}
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-[1260px] px-4 py-16 text-center md:py-24">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Pronto para transformar a gestão de PPC?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/80">
              Acesse com sua conta institucional IFMS e comece a organizar cursos, disciplinas e projetos pedagógicos hoje mesmo.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a href={getLoginUrl()}>
                <Button
                  size="lg"
                  className="h-12 rounded-full bg-white px-8 text-base font-semibold text-[var(--ifms-green-900)] shadow-lg hover:bg-[var(--ifms-green-50)]"
                >
                  Entrar com conta institucional
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href="#como-funciona">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/30 px-8 text-base font-semibold text-white hover:border-white/50 hover:bg-white/10"
                >
                  Saiba mais
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--ifms-green-100)] bg-white">
        <div className="mx-auto max-w-[1260px] px-4 py-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3 max-w-xs">
              <BrandMark variant="horizontal" imgClassName="h-10 w-auto" />
              <p className="text-sm leading-relaxed text-[var(--ifms-text-soft)]">
                Sistema de gestão de Projetos Pedagógicos de Curso do Instituto Federal de Mato Grosso do Sul.
              </p>
              <p className="text-xs text-[var(--ifms-text-soft)]">Pro-reitoria de Desenvolvimento Institucional</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ifms-green-800)]">Sistema</p>
                <ul className="space-y-2">
                  {["Painel", "Cursos", "Disciplinas", "Relatórios"].map(item => (
                    <li key={item}>
                      <a href={getLoginUrl()} className="text-sm text-[var(--ifms-text-soft)] hover:text-[var(--ifms-green-800)]">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ifms-green-800)]">Institucional</p>
                <ul className="space-y-2">
                  {[
                    { label: "Site do IFMS", href: "https://www.ifms.edu.br" },
                    { label: "Transparência", href: "https://www.ifms.edu.br" },
                  ].map(link => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--ifms-text-soft)] hover:text-[var(--ifms-green-800)]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--ifms-green-100)] pt-8 text-xs text-[var(--ifms-text-soft)] md:flex-row">
            <p>© {new Date().getFullYear()} Instituto Federal de Mato Grosso do Sul – IFMS. PPC Digital.</p>
            <div className="ifms-bar h-[3px] w-24 rounded-full" />
          </div>
        </div>
      </footer>
    </div>
  );
}
