import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  BookOpen, Building2, CalendarRange, GraduationCap, Layers, AlertTriangle, ClipboardList,
  TrendingUp, ArrowRight, Zap
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// JJK Cursed Energy color palette for charts
const JJK_COLORS = ["#6b5fa0", "#29b6d4", "#4a3f7a", "#4ecde8", "#8b7ec0", "#0e6b80", "#a99ed8", "#7ddff0"];

// Custom tooltip for charts
const CursedTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(19,19,42,0.97)",
        border: "1px solid rgba(107,95,160,0.5)",
        borderRadius: "0.5rem",
        padding: "0.5rem 0.75rem",
        boxShadow: "0 0 20px rgba(74,63,122,0.4)",
        fontSize: 12,
      }}>
        <p style={{ color: "#9e9ab8", marginBottom: 2 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: "#29b6d4", fontWeight: 600 }}>{p.value} {p.name}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: byArea } = trpc.dashboard.classesByArea.useQuery({});
  const { data: bySemester } = trpc.dashboard.classesBySemester.useQuery({});
  const { data: offeringsByArea } = trpc.offerings.classesByArea.useQuery();
  const { data: offeringsBySemester } = trpc.offerings.classesBySemester.useQuery();

  const kpis = [
    { label: "Campus",                value: stats?.totalCampuses ?? 0,     icon: Building2,     color: "#29b6d4", glow: "rgba(41,182,212,0.3)",   path: "/campus" },
    { label: "Cursos Ativos",         value: stats?.totalCourses ?? 0,      icon: GraduationCap, color: "#6b5fa0", glow: "rgba(107,95,160,0.3)",  path: "/courses" },
    { label: "Disciplinas",           value: stats?.totalSubjects ?? 0,     icon: BookOpen,      color: "#8b7ec0", glow: "rgba(139,126,192,0.3)", path: "/subjects" },
    { label: "Áreas de Ensino",       value: stats?.totalAreas ?? 0,        icon: Layers,        color: "#4ecde8", glow: "rgba(78,205,232,0.3)",  path: "/areas" },
    { label: "Solicitações Pendentes",value: stats?.pendingApprovals ?? 0,  icon: ClipboardList, color: "#e53e3e", glow: "rgba(229,62,62,0.3)",   path: "/approvals", alert: (stats?.pendingApprovals ?? 0) > 0 },
    { label: "Disciplinas sem Área",  value: stats?.subjectsWithoutArea ?? 0,icon: AlertTriangle, color: "#d4a017", glow: "rgba(212,160,23,0.3)",  path: "/subjects", alert: (stats?.subjectsWithoutArea ?? 0) > 0 },
  ];

  return (
    <div className="space-y-5 p-3 md:p-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(135deg, #2d2560, #0e6b80)", boxShadow: "0 0 12px rgba(41,182,212,0.4)" }}
            >
              <Zap className="h-4 w-4 text-cyan-300" />
            </div>
            <h1
              className="text-xl md:text-2xl font-bold"
              style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.04em" }}
            >
              Dashboard
            </h1>
          </div>
          <p className="text-sm" style={{ color: "#9e9ab8", fontFamily: "'Rajdhani', sans-serif" }}>
            Visão geral do sistema PPC Digital IFMS
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-xs shrink-0"
          style={{ borderColor: "rgba(41,182,212,0.4)", color: "#29b6d4", background: "rgba(41,182,212,0.08)" }}
        >
          ⚡ Atualizado agora
        </Badge>
      </div>

      {/* Cursed energy divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(107,95,160,0.5), rgba(41,182,212,0.5), transparent)" }} />

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="cursor-pointer rounded-xl p-4 transition-all hover:scale-[1.02]"
            style={{
              background: kpi.alert
                ? "linear-gradient(135deg, rgba(229,62,62,0.12), rgba(155,28,28,0.08))"
                : "linear-gradient(135deg, rgba(19,19,42,0.95), rgba(26,26,53,0.95))",
              border: `1px solid ${kpi.alert ? "rgba(229,62,62,0.35)" : "rgba(107,95,160,0.25)"}`,
              boxShadow: kpi.alert ? `0 0 16px rgba(229,62,62,0.15)` : `0 4px 16px rgba(74,63,122,0.2)`,
            }}
            onClick={() => setLocation(kpi.path)}
          >
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `rgba(${kpi.alert ? "229,62,62" : "107,95,160"},0.15)`, boxShadow: `0 0 10px ${kpi.glow}` }}
            >
              <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: kpi.alert ? "#e53e3e" : "#e8e6f0", fontFamily: "'Rajdhani', sans-serif" }}>
              {statsLoading ? "—" : kpi.value}
            </p>
            <p className="mt-0.5 text-xs leading-tight" style={{ color: "#9e9ab8" }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* ── Alert banner ── */}
      {(stats?.pendingApprovals ?? 0) > 0 && (
        <div
          className="flex flex-wrap items-start gap-3 rounded-xl p-4 sm:items-center sm:justify-between"
          style={{
            background: "linear-gradient(135deg, rgba(229,62,62,0.12), rgba(155,28,28,0.08))",
            border: "1px solid rgba(229,62,62,0.35)",
            boxShadow: "0 0 20px rgba(229,62,62,0.1)",
          }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: "#e53e3e" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#fca5a5" }}>
                {stats?.pendingApprovals} solicitação(ões) aguardando resposta
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "#9e9ab8" }}>Coordenadores precisam indicar as áreas dos docentes</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setLocation("/approvals")}
            className="shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(229,62,62,0.3), rgba(155,28,28,0.3))",
              border: "1px solid rgba(229,62,62,0.4)",
              color: "#fca5a5",
            }}
          >
            Ver solicitações <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      )}

      {/* ── Charts: Turmas Ativas ── */}
      {((offeringsByArea && offeringsByArea.length > 0) || (offeringsBySemester && offeringsBySemester.length > 0)) && (
        <>
          <div className="flex items-center gap-2 mt-2">
            <CalendarRange className="h-4 w-4" style={{ color: "#29b6d4" }} />
            <h2 className="text-base font-semibold" style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.04em" }}>
              Turmas Ativas — Quadro de Oferta
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <JJKChartCard title="Aulas Semanais por Área (Turmas Ativas)" icon={<Layers className="h-4 w-4" style={{ color: "#29b6d4" }} />}>
              {offeringsByArea && offeringsByArea.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={offeringsByArea} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,95,160,0.15)" />
                    <XAxis dataKey="areaName" tick={{ fontSize: 11, fill: "#9e9ab8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9e9ab8" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CursedTooltip />} />
                    <Bar dataKey="totalWeeklyClasses" radius={[4, 4, 0, 0]}>
                      {offeringsByArea.map((entry, index) => (
                        <Cell key={entry.areaId} fill={entry.color || JJK_COLORS[index % JJK_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </JJKChartCard>

            <JJKChartCard title="Aulas por Semestre (Turmas Ativas)" icon={<TrendingUp className="h-4 w-4" style={{ color: "#29b6d4" }} />}>
              {offeringsBySemester && offeringsBySemester.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={offeringsBySemester} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,95,160,0.15)" />
                    <XAxis dataKey="semester" tickFormatter={(v) => `${v}º`} tick={{ fontSize: 11, fill: "#9e9ab8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9e9ab8" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CursedTooltip />} />
                    <Bar dataKey="totalClasses" fill="#29b6d4" radius={[4, 4, 0, 0]}
                      style={{ filter: "drop-shadow(0 0 4px rgba(41,182,212,0.4))" }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </JJKChartCard>
          </div>
        </>
      )}

      {/* ── Charts: Visão Geral PPC ── */}
      <div className="flex items-center gap-2 mt-2">
        <Layers className="h-4 w-4" style={{ color: "#6b5fa0" }} />
        <h2 className="text-base font-semibold" style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.04em" }}>
          Visão Geral do PPC
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <JJKChartCard title="Aulas Semanais por Área (PPC)" icon={<Layers className="h-4 w-4" style={{ color: "#6b5fa0" }} />}>
          {byArea && byArea.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byArea} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,95,160,0.15)" />
                <XAxis dataKey="areaName" tick={{ fontSize: 11, fill: "#9e9ab8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9e9ab8" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CursedTooltip />} />
                <Bar dataKey="totalWeeklyClasses" radius={[4, 4, 0, 0]}>
                  {byArea.map((entry, index) => (
                    <Cell key={entry.areaId} fill={entry.color || JJK_COLORS[index % JJK_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </JJKChartCard>

        <JJKChartCard title="Aulas Semanais por Semestre (PPC)" icon={<TrendingUp className="h-4 w-4" style={{ color: "#6b5fa0" }} />}>
          {bySemester && bySemester.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={bySemester} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,95,160,0.15)" />
                <XAxis dataKey="semester" tickFormatter={(v) => `${v}º`} tick={{ fontSize: 11, fill: "#9e9ab8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9e9ab8" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CursedTooltip />} />
                <Bar dataKey="totalClasses" fill="#6b5fa0" radius={[4, 4, 0, 0]}
                  style={{ filter: "drop-shadow(0 0 4px rgba(107,95,160,0.4))" }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </JJKChartCard>
      </div>

      {/* ── Pie Chart ── */}
      {byArea && byArea.length > 0 && (
        <JJKChartCard title="Distribuição de Disciplinas por Área" icon={<Layers className="h-4 w-4" style={{ color: "#8b7ec0" }} />}>
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byArea}
                  dataKey="subjectCount"
                  nameKey="areaName"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                  style={{ filter: "drop-shadow(0 0 8px rgba(107,95,160,0.3))" }}
                >
                  {byArea.map((entry, index) => (
                    <Cell key={entry.areaId} fill={entry.color || JJK_COLORS[index % JJK_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CursedTooltip />} />
                <Legend
                  formatter={(value) => <span style={{ fontSize: 11, color: "#9e9ab8" }}>{value}</span>}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </JJKChartCard>
      )}
    </div>
  );
}

/* ── Sub-components ── */
function JJKChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl"
      style={{
        background: "linear-gradient(135deg, rgba(19,19,42,0.95) 0%, rgba(26,26,53,0.95) 100%)",
        border: "1px solid rgba(107,95,160,0.25)",
        boxShadow: "0 4px 20px rgba(74,63,122,0.2)",
      }}
    >
      <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "rgba(107,95,160,0.2)" }}>
        {icon}
        <span className="text-sm font-semibold" style={{ color: "#e8e6f0", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.03em" }}>
          {title}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[240px] items-center justify-center">
      <p className="text-sm" style={{ color: "#6a6685" }}>Nenhum dado disponível</p>
    </div>
  );
}
