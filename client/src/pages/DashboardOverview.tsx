import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ifmsColorTokens } from "@shared/branding/ifmsTokens";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  Layers,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocation } from "wouter";

const COLORS = [
  ifmsColorTokens.green.hex,
  "#2563eb",
  "#d97706",
  "#0f766e",
  ifmsColorTokens.red.hex,
  "#7c3aed",
  "#0891b2",
  "#65a30d",
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: byArea } = trpc.dashboard.classesByArea.useQuery({});
  const { data: bySemester } = trpc.dashboard.classesBySemester.useQuery({});
  const { data: offeringsByArea } = trpc.offerings.classesByArea.useQuery();
  const { data: offeringsBySemester } = trpc.offerings.classesBySemester.useQuery();

  const kpis = [
    {
      label: "Campus",
      value: stats?.totalCampuses ?? 0,
      icon: Building2,
      accent: "from-sky-500/15 to-sky-100",
      iconColor: "text-sky-700",
      path: "/campus",
    },
    {
      label: "Cursos ativos",
      value: stats?.totalCourses ?? 0,
      icon: GraduationCap,
      accent: "from-emerald-500/15 to-emerald-100",
      iconColor: "text-emerald-700",
      path: "/courses",
    },
    {
      label: "Disciplinas",
      value: stats?.totalSubjects ?? 0,
      icon: BookOpen,
      accent: "from-violet-500/15 to-violet-100",
      iconColor: "text-violet-700",
      path: "/subjects",
    },
    {
      label: "Áreas de ensino",
      value: stats?.totalAreas ?? 0,
      icon: Layers,
      accent: "from-amber-500/15 to-amber-100",
      iconColor: "text-amber-700",
      path: "/areas",
    },
    {
      label: "Solicitações pendentes",
      value: stats?.pendingApprovals ?? 0,
      icon: ClipboardList,
      accent: "from-rose-500/15 to-rose-100",
      iconColor: "text-rose-700",
      path: "/approvals",
      alert: (stats?.pendingApprovals ?? 0) > 0,
    },
    {
      label: "Disciplinas sem área",
      value: stats?.subjectsWithoutArea ?? 0,
      icon: AlertTriangle,
      accent: "from-orange-500/15 to-orange-100",
      iconColor: "text-orange-700",
      path: "/subjects",
      alert: (stats?.subjectsWithoutArea ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] bg-[var(--color-hero)] p-6 text-white md:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-white/12 px-3 py-1 text-white hover:bg-white/12">Visão executiva</Badge>
            <Badge className="rounded-full bg-white/12 px-3 py-1 text-white hover:bg-white/12">
              {user?.name ? `Olá, ${user.name.split(" ")[0]}` : "Ambiente institucional"}
            </Badge>
          </div>

          <h2 className="mt-5 max-w-2xl text-2xl font-bold tracking-tight md:text-3xl">
            Acompanhe a saúde acadêmica do PPC Digital com leitura rápida e prioridade clara.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/80 md:text-base">
            Veja dados consolidados de cursos, áreas, ofertas e pendências em um só painel, com foco em governança e
            tomada de decisão.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="rounded-full bg-white text-slate-950 hover:bg-emerald-50" onClick={() => setLocation("/reports")}>
              Abrir relatórios
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-white/20 bg-white/8 text-white hover:bg-white/14 hover:text-white"
              onClick={() => setLocation("/offerings")}
            >
              Ver quadro de oferta
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Status operacional</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{stats?.pendingApprovals ?? 0}</p>
            <p className="mt-1 text-sm text-slate-600">solicitações aguardando resposta</p>
          </div>
          <div className="rounded-[1.5rem] border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Saneamento curricular</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{stats?.subjectsWithoutArea ?? 0}</p>
            <p className="mt-1 text-sm text-slate-600">disciplinas ainda sem área vinculada</p>
          </div>
          <div className="rounded-[1.5rem] border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-5 sm:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Última leitura</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">Atualização orientada por dados</p>
                <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">
                  Os indicadores combinam visão do PPC e leitura das turmas ativas para apoiar análise acadêmica.
                </p>
              </div>
              <Badge variant="outline" className="rounded-full bg-white/80 text-slate-600">
                Atualizado agora
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            onClick={() => setLocation(kpi.path)}
            className={`rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
              kpi.alert ? "border-orange-200 bg-orange-50/60" : "border-white/70 bg-white/72"
            }`}
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${kpi.accent}`}>
              <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">{statsLoading ? "-" : kpi.value}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{kpi.label}</p>
          </button>
        ))}
      </section>

      {(stats?.pendingApprovals ?? 0) > 0 && (
        <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50/75 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {stats?.pendingApprovals} solicitação(ões) de indicação de área aguardando resposta
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Priorize a atuação dos coordenadores para manter o fluxo institucional em dia.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="rounded-full border-amber-300 bg-white/80 text-amber-900 hover:bg-amber-100"
              onClick={() => setLocation("/approvals")}
            >
              Ver solicitações
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {(offeringsByArea && offeringsByArea.length > 0) || (offeringsBySemester && offeringsBySemester.length > 0) ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-emerald-700" />
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">
              Quadro de oferta com base nas turmas ativas
            </h3>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard
              title="Aulas semanais por área"
              icon={Layers}
              accent="text-emerald-700"
              body={
                offeringsByArea && offeringsByArea.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={offeringsByArea} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="areaName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }}
                        formatter={(value: number) => [`${value} aulas/semana`, "Total"]}
                      />
                      <Bar dataKey="totalWeeklyClasses" radius={[8, 8, 0, 0]}>
                        {offeringsByArea.map((entry, index) => (
                          <Cell key={entry.areaId} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Registre ofertas no quadro para liberar esta leitura." />
                )
              }
            />

            <ChartCard
              title="Aulas por semestre do curso"
              icon={TrendingUp}
              accent="text-emerald-700"
              body={
                offeringsBySemester && offeringsBySemester.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={offeringsBySemester} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="semester" tickFormatter={(value) => `${value}º`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }}
                        formatter={(value: number) => [`${value} aulas/semana`, "Total"]}
                        labelFormatter={(label) => `${label}º semestre`}
                      />
                      <Bar dataKey="totalClasses" fill={ifmsColorTokens.green.hex} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Registre ofertas no quadro para liberar esta leitura." />
                )
              }
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-sky-700" />
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">Visão geral do PPC</h3>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard
            title="Aulas semanais por área"
            icon={Layers}
            accent="text-sky-700"
            body={
              byArea && byArea.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byArea} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="areaName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(value: number) => [`${value} aulas/semana`, "Total"]}
                    />
                    <Bar dataKey="totalWeeklyClasses" radius={[8, 8, 0, 0]}>
                      {byArea.map((entry, index) => (
                        <Cell key={entry.areaId} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Nenhum dado disponível no momento." />
              )
            }
          />

          <ChartCard
            title="Aulas semanais por semestre"
            icon={TrendingUp}
            accent="text-sky-700"
            body={
              bySemester && bySemester.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={bySemester} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="semester" tickFormatter={(value) => `${value}º`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(value: number) => [`${value} aulas/semana`, "Total"]}
                      labelFormatter={(label) => `${label}º semestre`}
                    />
                    <Bar dataKey="totalClasses" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Nenhum dado disponível no momento." />
              )
            }
          />
        </div>

        {byArea && byArea.length > 0 && (
          <ChartCard
            title="Distribuição de disciplinas por área"
            icon={Layers}
            accent="text-violet-700"
            body={
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={byArea}
                      dataKey="subjectCount"
                      nameKey="areaName"
                      cx="50%"
                      cy="50%"
                      outerRadius={96}
                      innerRadius={56}
                      paddingAngle={3}
                    >
                      {byArea.map((entry, index) => (
                        <Cell key={entry.areaId} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(value: number) => [`${value} disciplinas`, ""]}
                    />
                    <Legend formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            }
          />
        )}
      </section>
    </div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  accent,
  body,
}: {
  title: string;
  icon: React.ElementType;
  accent: string;
  body: React.ReactNode;
}) {
  return (
    <Card className="rounded-[1.5rem] border-white/70 bg-white/80 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-950">
          <Icon className={`h-4 w-4 ${accent}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
      {message}
    </div>
  );
}
