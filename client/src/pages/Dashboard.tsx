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
  TrendingUp, ArrowRight
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const COLORS = ["#16a34a", "#2563eb", "#d97706", "#9333ea", "#dc2626", "#0891b2", "#65a30d", "#c026d3"];

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: byArea } = trpc.dashboard.classesByArea.useQuery({});
  const { data: bySemester } = trpc.dashboard.classesBySemester.useQuery({});
  // Dados baseados nas ofertas reais (turmas ativas)
  const { data: offeringsByArea } = trpc.offerings.classesByArea.useQuery();
  const { data: offeringsBySemester } = trpc.offerings.classesBySemester.useQuery();

  const kpis = [
    { label: "Campus", value: stats?.totalCampuses ?? 0, icon: Building2, color: "text-blue-600", bg: "bg-blue-50", path: "/campus" },
    { label: "Cursos Ativos", value: stats?.totalCourses ?? 0, icon: GraduationCap, color: "text-green-600", bg: "bg-green-50", path: "/courses" },
    { label: "Disciplinas", value: stats?.totalSubjects ?? 0, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50", path: "/subjects" },
    { label: "Áreas de Ensino", value: stats?.totalAreas ?? 0, icon: Layers, color: "text-amber-600", bg: "bg-amber-50", path: "/areas" },
    { label: "Solicitações Pendentes", value: stats?.pendingApprovals ?? 0, icon: ClipboardList, color: "text-red-600", bg: "bg-red-50", path: "/approvals", alert: (stats?.pendingApprovals ?? 0) > 0 },
    { label: "Disciplinas sem Área", value: stats?.subjectsWithoutArea ?? 0, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", path: "/subjects", alert: (stats?.subjectsWithoutArea ?? 0) > 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visão geral do sistema PPC Digital IFMS</p>
        </div>
        <Badge variant="outline" className="text-xs text-slate-500">
          Atualizado agora
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className={`cursor-pointer hover:shadow-md transition-all border ${kpi.alert ? "border-orange-200 bg-orange-50/50" : "border-slate-100"}`}
            onClick={() => setLocation(kpi.path)}
          >
            <CardContent className="p-4">
              <div className={`w-9 h-9 ${kpi.bg} rounded-lg flex items-center justify-center mb-3`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className={`text-2xl font-bold ${kpi.alert ? "text-orange-700" : "text-slate-900"}`}>
                {statsLoading ? "—" : kpi.value}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-tight">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas */}
      {(stats?.pendingApprovals ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {stats?.pendingApprovals} solicitação(ões) de indicação de área aguardando resposta
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Coordenadores precisam indicar as áreas dos docentes</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setLocation("/approvals")}>
            Ver solicitações <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}

      {/* Gráficos baseados em Ofertas Reais */}
      {(offeringsByArea && offeringsByArea.length > 0) || (offeringsBySemester && offeringsBySemester.length > 0) ? (
        <>
          <div className="flex items-center gap-2 mt-2">
            <CalendarRange className="w-4 h-4 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-800">Aulas Baseadas nas Turmas Ativas (Quadro de Oferta)</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-green-200 bg-green-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-green-600" />
                  Aulas Semanais por Área (Turmas Ativas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {offeringsByArea && offeringsByArea.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={offeringsByArea} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="areaName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                        formatter={(v: number) => [`${v} aulas/sem`, "Total"]}
                      />
                      <Bar dataKey="totalWeeklyClasses" radius={[4, 4, 0, 0]}>
                        {offeringsByArea.map((entry, index) => (
                          <Cell key={entry.areaId} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">
                    Registre ofertas no Quadro de Oferta para ver os dados
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Aulas por Semestre do Curso (Turmas Ativas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {offeringsBySemester && offeringsBySemester.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={offeringsBySemester} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="semester" tickFormatter={(v) => `${v}º`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                        formatter={(v: number) => [`${v} aulas/sem`, "Total"]}
                        labelFormatter={(l) => `${l}º Semestre`}
                      />
                      <Bar dataKey="totalClasses" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">
                    Registre ofertas no Quadro de Oferta para ver os dados
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {/* Gráficos Estáticos (visão geral do PPC) */}
      <div className="flex items-center gap-2 mt-2">
        <Layers className="w-4 h-4 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-800">Visão Geral do PPC (Todas as Disciplinas)</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Aulas Semanais por Área (PPC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {byArea && byArea.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byArea} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="areaName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(v: number) => [`${v} aulas/sem`, "Total"]}
                  />
                  <Bar dataKey="totalWeeklyClasses" radius={[4, 4, 0, 0]}>
                    {byArea.map((entry, index) => (
                      <Cell key={entry.areaId} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Aulas Semanais por Semestre (PPC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bySemester && bySemester.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={bySemester} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="semester" tickFormatter={(v) => `${v}º`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(v: number) => [`${v} aulas/sem`, "Total"]}
                    labelFormatter={(l) => `${l}º Semestre`}
                  />
                  <Bar dataKey="totalClasses" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Área (Pie) */}
      {byArea && byArea.length > 0 && (
        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Distribuição de Disciplinas por Área
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
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
                  >
                    {byArea.map((entry, index) => (
                      <Cell key={entry.areaId} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(v: number) => [`${v} disciplinas`, ""]}
                  />
                  <Legend
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
