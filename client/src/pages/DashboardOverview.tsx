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
  "#9333ea",
  ifmsColorTokens.red.hex,
  "#0891b2",
  "#65a30d",
  "#c026d3",
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: byArea } = trpc.dashboard.classesByArea.useQuery({});
  const { data: bySemester } = trpc.dashboard.classesBySemester.useQuery({});
  const { data: offeringsByArea } = trpc.offerings.classesByArea.useQuery();
  const { data: offeringsBySemester } = trpc.offerings.classesBySemester.useQuery();

  const useOfferings = (offeringsByArea?.length ?? 0) > 0;
  const areaData = useOfferings ? offeringsByArea : byArea;
  const semesterData = useOfferings
    ? offeringsBySemester?.map(d => ({ ...d, totalClasses: d.totalClasses }))
    : bySemester;

  const kpis = [
    { label: "Campus", value: stats?.totalCampuses ?? 0, icon: Building2, color: "text-blue-600", bg: "bg-blue-50", path: "/campus" },
    { label: "Cursos Ativos", value: stats?.totalCourses ?? 0, icon: GraduationCap, color: "text-green-600", bg: "bg-green-50", path: "/courses" },
    { label: "Disciplinas", value: stats?.totalSubjects ?? 0, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50", path: "/subjects" },
    { label: "Areas de Ensino", value: stats?.totalAreas ?? 0, icon: Layers, color: "text-amber-600", bg: "bg-amber-50", path: "/areas" },
    { label: "Pendentes", value: stats?.pendingApprovals ?? 0, icon: ClipboardList, color: "text-red-600", bg: "bg-red-50", path: "/approvals", alert: (stats?.pendingApprovals ?? 0) > 0 },
    { label: "Sem Area", value: stats?.subjectsWithoutArea ?? 0, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", path: "/subjects", alert: (stats?.subjectsWithoutArea ?? 0) > 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Visao geral do PPC Digital IFMS</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(kpi => (
          <Card
            key={kpi.label}
            className={`cursor-pointer border transition-all hover:shadow-md ${kpi.alert ? "border-orange-200 bg-orange-50/50" : "border-slate-200 bg-white"}`}
            onClick={() => setLocation(kpi.path)}
          >
            <CardContent className="p-4">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className={`text-2xl font-bold ${kpi.alert ? "text-orange-700" : "text-slate-900"}`}>
                {statsLoading ? "—" : kpi.value}
              </p>
              <p className="mt-0.5 text-xs leading-tight text-slate-500">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerta de pendencias */}
      {(stats?.pendingApprovals ?? 0) > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {stats?.pendingApprovals} solicitacao(oes) aguardando resposta
              </p>
              <p className="text-xs text-amber-600">Coordenadores precisam indicar as areas dos docentes</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setLocation("/approvals")}>
            Ver solicitacoes <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Graficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <Layers className="h-4 w-4 text-green-600" />
              Aulas por Area {useOfferings ? "(Turmas Ativas)" : "(PPC)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {areaData && areaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={areaData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="areaName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: number) => [`${v} aulas/sem`, "Total"]} />
                  <Bar dataKey={useOfferings ? "totalWeeklyClasses" : "totalWeeklyClasses"} radius={[4, 4, 0, 0]}>
                    {areaData.map((entry, index) => (
                      <Cell key={(entry as any).areaId} fill={(entry as any).color || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">
                Nenhum dado disponivel
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Aulas por Semestre {useOfferings ? "(Turmas Ativas)" : "(PPC)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {semesterData && semesterData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={semesterData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="semester" tickFormatter={v => `${v}o`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: number) => [`${v} aulas/sem`, "Total"]} labelFormatter={l => `${l}o Semestre`} />
                  <Bar dataKey="totalClasses" fill={ifmsColorTokens.green.hex} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">
                Nenhum dado disponivel
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pizza */}
      {byArea && byArea.length > 0 && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <Layers className="h-4 w-4 text-purple-600" />
              Distribuicao de Disciplinas por Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byArea} dataKey="subjectCount" nameKey="areaName" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                  {byArea.map((entry, index) => (
                    <Cell key={entry.areaId} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: number) => [`${v} disciplinas`, ""]} />
                <Legend formatter={value => <span className="text-xs text-slate-600">{value}</span>} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
