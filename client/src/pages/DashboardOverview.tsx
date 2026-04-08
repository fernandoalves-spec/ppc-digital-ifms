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

// Paleta de gráficos derivada da identidade visual IFMS
// Prioriza o verde e o vermelho oficiais, com variações hierárquicas
const COLORS = [
  ifmsColorTokens.green.hex, // #32A041 — verde oficial
  "#1d6d2c", // verde escuro institucional
  ifmsColorTokens.red.hex, // #C8191E — vermelho oficial
  "#58b566", // verde claro derivado
  "#0f3d18", // verde 900
  "#85cb8f", // verde 300
  "#8f1216", // vermelho escuro derivado
  "#1f2937", // grafite neutro
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
      accent: "from-[rgba(50,160,65,0.18)] to-[var(--ifms-green-100)]",
      iconColor: "text-[var(--ifms-green-700)]",
      path: "/campus",
    },
    {
      label: "Cursos ativos",
      value: stats?.totalCourses ?? 0,
      icon: GraduationCap,
      accent: "from-[rgba(50,160,65,0.22)] to-[var(--ifms-green-100)]",
      iconColor: "text-[var(--ifms-green-700)]",
      path: "/courses",
    },
    {
      label: "Disciplinas",
      value: stats?.totalSubjects ?? 0,
      icon: BookOpen,
      accent: "from-[rgba(29,109,44,0.18)] to-[var(--ifms-green-100)]",
      iconColor: "text-[var(--ifms-green-900)]",
      path: "/subjects",
    },
    {
      label: "Áreas de ensino",
      value: stats?.totalAreas ?? 0,
      icon: Layers,
      accent: "from-[rgba(88,181,102,0.2)] to-[var(--ifms-green-50)]",
      iconColor: "text-[var(--ifms-green-700)]",
      path: "/areas",
    },
    {
      label: "Solicitações pendentes",
      value: stats?.pendingApprovals ?? 0,
      icon: ClipboardList,
      accent: "from-[rgba(200,25,30,0.18)] to-[var(--ifms-red-100)]",
      iconColor: "text-[var(--ifms-red-600)]",
      path: "/approvals",
      alert: (stats?.pendingApprovals ?? 0) > 0,
    },
    {
      label: "Disciplinas sem área",
      value: stats?.subjectsWithoutArea ?? 0,
      icon: AlertTriangle,
      accent: "from-[rgba(200,25,30,0.14)] to-[var(--ifms-red-50)]",
      iconColor: "text-[var(--ifms-red-700)]",
      path: "/subjects",
      alert: (stats?.subjectsWithoutArea ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="hero-strip relative overflow-hidden rounded-[1.75rem] p-6 text-white md:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-white/14 px-3 py-1 text-white hover:bg-white/14">Visão executiva</Badge>
            <Badge className="rounded-full bg-[var(--ifms-red)]/90 px-3 py-1 text-white hover:bg-[var(--ifms-red)]">
              IFMS
            </Badge>
            <Badge className="rounded-full bg-white/14 px-3 py-1 text-white hover:bg-white/14">
              {user?.name ? `Olá, ${user.name.split(" ")[0]}` : "Ambiente institucional"}
            </Badge>
          </div>

          <h2 className="mt-5 max-w-2xl text-2xl font-bold tracking-tight md:text-3xl">
            Acompanhe a saúde acadêmica do PPC Digital com leitura rápida e prioridade clara.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
            Veja dados consolidados de cursos, áreas, ofertas e pendências em um só painel, com foco em governança e
            tomada de decisão acadêmica.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              className="rounded-full bg-white text-[var(--ifms-green-900)] hover:bg-[var(--ifms-green-50)]"
              onClick={() => setLocation("/reports")}
            >
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

          <div className="ifms-bar absolute inset-x-0 bottom-0" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-[var(--ifms-green-100)] bg-gradient-to-br from-white to-[var(--ifms-green-50)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ifms-green-700)]">
              Status operacional
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--ifms-green-900)]">
              {stats?.pendingApprovals ?? 0}
            </p>
            <p className="mt-1 text-sm text-[var(--ifms-text-soft)]">solicitações aguardando resposta</p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--ifms-red-100)] bg-gradient-to-br from-white to-[var(--ifms-red-50)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ifms-red-600)]">
              Saneamento curricular
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--ifms-green-900)]">
              {stats?.subjectsWithoutArea ?? 0}
            </p>
            <p className="mt-1 text-sm text-[var(--ifms-text-soft)]">disciplinas ainda sem área vinculada</p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--ifms-green-100)] bg-gradient-to-br from-white to-[var(--ifms-green-50)] p-5 sm:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ifms-green-700)]">
                  Última leitura
                </p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-[var(--ifms-green-900)]">
                  Atualização orientada por dados
                </p>
                <p className="mt-1 max-w-md text-sm leading-6 text-[var(--ifms-text-soft)]">
                  Os indicadores combinam a visão do PPC com a leitura das turmas ativas para apoiar a análise
                  acadêmica institucional.
                </p>
              </div>
              <Badge
                variant="outline"
                className="rounded-full border-[var(--ifms-green-200)] bg-white/80 text-[var(--ifms-green-700)]"
              >
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
              kpi.alert
                ? "border-[var(--ifms-red-100)] bg-[var(--ifms-red-50)]"
                : "border-[var(--ifms-green-100)] bg-white/78"
            }`}
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${kpi.accent}`}>
              <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-[var(--ifms-green-900)]">
              {statsLoading ? "-" : kpi.value}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--ifms-text-soft)]">{kpi.label}</p>
          </button>
        ))}
      </section>

      {(stats?.pendingApprovals ?? 0) > 0 && (
        <section className="rounded-[1.5rem] border border-[var(--ifms-red-100)] bg-[var(--ifms-red-50)] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                <AlertTriangle className="h-5 w-5 text-[var(--ifms-red-600)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ifms-red-700)]">
                  {stats?.pendingApprovals} solicitação(ões) de indicação de área aguardando resposta
                </p>
                <p className="mt-1 text-sm text-[var(--ifms-text-soft)]">
                  Priorize a atuação dos coordenadores para manter o fluxo institucional em dia.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="rounded-full border-[var(--ifms-red-100)] bg-white/90 text-[var(--ifms-red-700)] hover:bg-[var(--ifms-red-50)]"
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
            <CalendarRange className="h-4 w-4 text-[var(--ifms-green-700)]" />
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ifms-green-900)]">
              Quadro de oferta com base nas turmas ativas
            </h3>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard
              title="Aulas semanais por área"
              icon={Layers}
              accent="text-[var(--ifms-green-700)]"
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
              accent="text-[var(--ifms-green-700)]"
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
          <Layers className="h-4 w-4 text-[var(--ifms-green-700)]" />
          <h3 className="text-lg font-semibold tracking-tight text-[var(--ifms-green-900)]">Visão geral do PPC</h3>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard
            title="Aulas semanais por área"
            icon={Layers}
            accent="text-[var(--ifms-green-700)]"
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
            accent="text-[var(--ifms-green-700)]"
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
                    <Bar dataKey="totalClasses" fill={ifmsColorTokens.red.hex} radius={[8, 8, 0, 0]} />
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
            accent="text-[var(--ifms-green-800)]"
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
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-[var(--ifms-text-soft)]">{value}</span>
                      )}
                      iconType="circle"
                      iconSize={8}
                    />
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
    <Card className="rounded-[1.5rem] border-[var(--ifms-green-100)] bg-white/85 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-[var(--ifms-green-900)]">
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
    <div className="flex h-[260px] items-center justify-center rounded-[1.25rem] border border-dashed border-[var(--ifms-green-200)] bg-[var(--ifms-green-50)] text-sm text-[var(--ifms-text-soft)]">
      {message}
    </div>
  );
}
