import { useAuth } from "@/_core/hooks/useAuth";
import EmptyStateInstitutional from "@/components/layout/EmptyStateInstitutional";
import PageHeader from "@/components/layout/PageHeader";
import SectionCard from "@/components/layout/SectionCard";
import StatCard from "@/components/layout/StatCard";
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
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocation } from "wouter";

const COLORS = [
  ifmsColorTokens.green.hex,
  "#1d6d2c",
  ifmsColorTokens.red.hex,
  "#58b566",
  "#0f3d18",
  "#85cb8f",
  "#8f1216",
  "#1f2937",
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
    { label: "Campus", value: stats?.totalCampuses ?? 0, icon: Building2, path: "/campus" },
    { label: "Cursos ativos", value: stats?.totalCourses ?? 0, icon: GraduationCap, path: "/courses" },
    { label: "Disciplinas", value: stats?.totalSubjects ?? 0, icon: BookOpen, path: "/subjects" },
    { label: "Areas de ensino", value: stats?.totalAreas ?? 0, icon: Layers, path: "/areas" },
    {
      label: "Solicitacoes pendentes",
      value: stats?.pendingApprovals ?? 0,
      icon: ClipboardList,
      path: "/approvals",
      alert: (stats?.pendingApprovals ?? 0) > 0,
    },
    {
      label: "Disciplinas sem area",
      value: stats?.subjectsWithoutArea ?? 0,
      icon: AlertTriangle,
      path: "/subjects",
      alert: (stats?.subjectsWithoutArea ?? 0) > 0,
    },
  ];

  return (
    <div className="page-stack p-3 md:p-6">
      <PageHeader
        badge="Painel"
        title={user?.name ? `Visao executiva - ${user.name.split(" ")[0]}` : "Visao executiva"}
        description="Acompanhe indicadores de cursos, areas, ofertas e pendencias em uma leitura institucional unica."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-full bg-[var(--ifms-green-600)] text-white hover:bg-[var(--ifms-green-700)]" onClick={() => setLocation("/reports")}>
              Abrir relatorios
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setLocation("/offerings")}>
              Ver quadro de oferta
            </Button>
          </div>
        }
      />

      <div className="page-grid md:grid-cols-3">
        <StatCard label="Pendencias" value={stats?.pendingApprovals ?? 0} tone={(stats?.pendingApprovals ?? 0) > 0 ? "danger" : "default"} />
        <StatCard label="Sem area" value={stats?.subjectsWithoutArea ?? 0} tone={(stats?.subjectsWithoutArea ?? 0) > 0 ? "danger" : "default"} />
        <SectionCard className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ifms-green-700)]">Atualizacao</p>
            <p className="mt-1 text-sm font-semibold text-[var(--ifms-green-900)]">Leitura orientada por dados</p>
            <p className="mt-1 text-sm text-[var(--ifms-text-soft)]">Dados consolidados de PPC e turmas ativas.</p>
          </div>
          <Badge variant="outline" className="rounded-full border-[var(--ifms-green-200)] bg-[var(--ifms-green-50)] text-[var(--ifms-green-700)]">
            Atualizado agora
          </Badge>
        </SectionCard>
      </div>

      <SectionCard className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(kpi => (
          <button
            key={kpi.label}
            onClick={() => setLocation(kpi.path)}
            className={[
              "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg",
              kpi.alert ? "border-[var(--ifms-red-100)] bg-[var(--ifms-red-50)]" : "border-[var(--ifms-green-100)] bg-white",
            ].join(" ")}
          >
            <div
              className={[
                "flex h-11 w-11 items-center justify-center rounded-2xl",
                kpi.alert ? "bg-[var(--ifms-red-100)] text-[var(--ifms-red-700)]" : "bg-[var(--ifms-green-50)] text-[var(--ifms-green-700)]",
              ].join(" ")}
            >
              <kpi.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-[var(--ifms-green-900)]">{statsLoading ? "-" : kpi.value}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--ifms-text-soft)]">{kpi.label}</p>
          </button>
        ))}
      </SectionCard>

      {(stats?.pendingApprovals ?? 0) > 0 && (
        <SectionCard className="border-[var(--ifms-red-100)] bg-[var(--ifms-red-50)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                <AlertTriangle className="h-5 w-5 text-[var(--ifms-red-600)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ifms-red-700)]">
                  {stats?.pendingApprovals} solicitacao(oes) aguardando resposta
                </p>
                <p className="mt-1 text-sm text-[var(--ifms-text-soft)]">Priorize a atuacao dos coordenadores para manter o fluxo em dia.</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="rounded-full border-[var(--ifms-red-100)] bg-white text-[var(--ifms-red-700)] hover:bg-[var(--ifms-red-50)]"
              onClick={() => setLocation("/approvals")}
            >
              Ver solicitacoes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </SectionCard>
      )}

      {(offeringsByArea && offeringsByArea.length > 0) || (offeringsBySemester && offeringsBySemester.length > 0) ? (
        <SectionCard className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-[var(--ifms-green-700)]" />
            <h3 className="text-lg font-semibold tracking-tight text-[var(--ifms-green-900)]">Quadro de oferta (turmas ativas)</h3>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard
              title="Aulas semanais por area"
              icon={Layers}
              accent="text-[var(--ifms-green-700)]"
              body={
                offeringsByArea && offeringsByArea.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={offeringsByArea} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="areaName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(value: number) => [`${value} aulas/semana`, "Total"]} />
                      <Bar dataKey="totalWeeklyClasses" radius={[8, 8, 0, 0]}>
                        {offeringsByArea.map((entry, index) => (
                          <Cell key={entry.areaId} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Registre ofertas para liberar esta leitura." />
                )
              }
            />

            <ChartCard
              title="Aulas por semestre"
              icon={TrendingUp}
              accent="text-[var(--ifms-green-700)]"
              body={
                offeringsBySemester && offeringsBySemester.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={offeringsBySemester} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="semester" tickFormatter={value => `${value}o`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }}
                        formatter={(value: number) => [`${value} aulas/semana`, "Total"]}
                        labelFormatter={label => `${label}o semestre`}
                      />
                      <Bar dataKey="totalClasses" fill={ifmsColorTokens.green.hex} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Registre ofertas para liberar esta leitura." />
                )
              }
            />
          </div>
        </SectionCard>
      ) : null}

      <SectionCard className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[var(--ifms-green-700)]" />
          <h3 className="text-lg font-semibold tracking-tight text-[var(--ifms-green-900)]">Visao geral do PPC</h3>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard
            title="Aulas semanais por area"
            icon={Layers}
            accent="text-[var(--ifms-green-700)]"
            body={
              byArea && byArea.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byArea} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="areaName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(value: number) => [`${value} aulas/semana`, "Total"]} />
                    <Bar dataKey="totalWeeklyClasses" radius={[8, 8, 0, 0]}>
                      {byArea.map((entry, index) => (
                        <Cell key={entry.areaId} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Nenhum dado disponivel no momento." />
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
                    <XAxis dataKey="semester" tickFormatter={value => `${value}o`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(value: number) => [`${value} aulas/semana`, "Total"]}
                      labelFormatter={label => `${label}o semestre`}
                    />
                    <Bar dataKey="totalClasses" fill={ifmsColorTokens.red.hex} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Nenhum dado disponivel no momento." />
              )
            }
          />
        </div>

        {byArea && byArea.length > 0 ? (
          <ChartCard
            title="Distribuicao de disciplinas por area"
            icon={Layers}
            accent="text-[var(--ifms-green-800)]"
            body={
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={byArea} dataKey="subjectCount" nameKey="areaName" cx="50%" cy="50%" outerRadius={96} innerRadius={56} paddingAngle={3}>
                      {byArea.map((entry, index) => (
                        <Cell key={entry.areaId} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(value: number) => [`${value} disciplinas`, ""]} />
                    <Legend formatter={value => <span className="text-xs text-[var(--ifms-text-soft)]">{value}</span>} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            }
          />
        ) : (
          <EmptyStateInstitutional
            title="Sem distribuicao por area"
            description="Cadastre disciplinas e vincule areas para visualizar a distribuicao institucional."
          />
        )}
      </SectionCard>
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
