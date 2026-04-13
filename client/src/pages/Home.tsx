import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { BookOpen, BarChart3, FileText, Shield, Zap, GraduationCap } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

const features = [
  {
    icon: GraduationCap,
    title: "Gestão de PPCs",
    description: "Importe e gerencie Projetos Pedagógicos de Curso com extração automática por IA.",
    color: "#29b6d4",
    glow: "rgba(41,182,212,0.3)",
    rgb: "41,182,212",
  },
  {
    icon: BarChart3,
    title: "Análise de Dados",
    description: "Visualize distribuição de aulas por área, semestre e curso em tempo real.",
    color: "#6b5fa0",
    glow: "rgba(107,95,160,0.3)",
    rgb: "107,95,160",
  },
  {
    icon: FileText,
    title: "Relatórios",
    description: "Gere relatórios institucionais em PDF com memória de cálculo detalhada.",
    color: "#8b7ec0",
    glow: "rgba(139,126,192,0.3)",
    rgb: "139,126,192",
  },
  {
    icon: Shield,
    title: "Controle de Acesso",
    description: "Perfis diferenciados para administradores, coordenadores e docentes.",
    color: "#4ecde8",
    glow: "rgba(78,205,232,0.3)",
    rgb: "78,205,232",
  },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) setLocation("/dashboard");
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#0d0d1a" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "#29b6d4",
              borderRightColor: "#6b5fa0",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ color: "#9e9ab8", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em" }}>CARREGANDO...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#0d0d1a",
        backgroundImage:
          "radial-gradient(ellipse at 20% 20%, rgba(74,63,122,0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(41,182,212,0.1) 0%, transparent 50%)",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(13,13,26,0.92)",
          borderBottom: "1px solid rgba(107,95,160,0.25)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #2d2560, #0e6b80)", boxShadow: "0 0 14px rgba(41,182,212,0.4)" }}
          >
            <Zap className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <p className="text-base font-bold leading-none" style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.06em" }}>
              PPC Digital
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#6b5fa0" }}>IFMS</p>
          </div>
        </div>
        <button
          onClick={() => { window.location.href = getLoginUrl(); }}
          className="rounded-xl px-5 py-2 text-sm font-semibold transition-all hover:scale-[1.03]"
          style={{
            background: "linear-gradient(135deg, #4a3f7a, #29b6d4)",
            color: "#fff",
            boxShadow: "0 0 16px rgba(41,182,212,0.3)",
            fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: "0.06em",
          }}
        >
          ⚡ Entrar
        </button>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-24 text-center md:py-36">
        <div
          className="pointer-events-none absolute left-1/4 top-1/4 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #6b5fa0, transparent)" }}
        />
        <div
          className="pointer-events-none absolute bottom-1/4 right-1/4 h-56 w-56 translate-x-1/2 translate-y-1/2 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #29b6d4, transparent)" }}
        />
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
          style={{
            background: "rgba(107,95,160,0.15)",
            border: "1px solid rgba(107,95,160,0.35)",
            color: "#8b7ec0",
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#29b6d4", boxShadow: "0 0 6px #29b6d4" }} />
          Instituto Federal de Mato Grosso do Sul
        </div>
        <h1
          className="mb-4 text-4xl font-black leading-tight md:text-6xl"
          style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.04em" }}
        >
          PPC{" "}
          <span style={{ background: "linear-gradient(135deg, #6b5fa0, #29b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Digital
          </span>
        </h1>
        <div
          className="mx-auto mb-6 h-0.5 w-32"
          style={{ background: "linear-gradient(90deg, transparent, #6b5fa0, #29b6d4, transparent)" }}
        />
        <p
          className="mb-10 max-w-xl text-base md:text-lg"
          style={{ color: "#9e9ab8", fontFamily: "'Rajdhani', sans-serif", lineHeight: 1.7 }}
        >
          Plataforma institucional para gestão de Projetos Pedagógicos de Curso.
          Extração automática por IA, análise de dados e relatórios em tempo real.
        </p>
        <button
          onClick={() => { window.location.href = getLoginUrl(); }}
          className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl px-8 py-4 text-base font-bold transition-all hover:scale-[1.04]"
          style={{
            background: "linear-gradient(135deg, #2d2560 0%, #4a3f7a 50%, #0e6b80 100%)",
            color: "#fff",
            boxShadow: "0 0 30px rgba(74,63,122,0.5), 0 0 60px rgba(41,182,212,0.2)",
            fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: "0.08em",
          }}
        >
          <Zap className="h-5 w-5 text-cyan-300" />
          ACESSAR O SISTEMA
        </button>
      </section>

      {/* Features */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#6b5fa0", fontFamily: "'Rajdhani', sans-serif" }}>
              Funcionalidades
            </p>
            <h2 className="mt-1 text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.04em" }}>
              Poder de uma Técnica Maldita
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-5 transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, rgba(19,19,42,0.97) 0%, rgba(26,26,53,0.97) 100%)",
                  border: "1px solid rgba(107,95,160,0.25)",
                  boxShadow: "0 4px 20px rgba(74,63,122,0.2)",
                }}
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: `rgba(${f.rgb},0.15)`, boxShadow: `0 0 12px ${f.glow}` }}
                >
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <h3 className="mb-2 text-sm font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", color: "#e8e6f0", letterSpacing: "0.04em" }}>
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "#9e9ab8" }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 text-center" style={{ borderTop: "1px solid rgba(107,95,160,0.2)" }}>
        <p className="text-xs" style={{ color: "#6a6685", fontFamily: "'Rajdhani', sans-serif" }}>
          © {new Date().getFullYear()} IFMS — Instituto Federal de Mato Grosso do Sul. Sistema interno de uso exclusivo.
        </p>
      </footer>
    </div>
  );
}
