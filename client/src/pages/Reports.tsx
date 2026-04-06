import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FileText, Download, BarChart2, Layers, GraduationCap, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#16a34a","#2563eb","#d97706","#9333ea","#dc2626","#0891b2","#65a30d","#c026d3"];

type ReportType = "by_area" | "by_semester" | "by_course" | "by_campus";

const REPORT_TYPES: { value: ReportType; label: string; icon: React.ElementType; description: string }[] = [
  { value: "by_area", label: "Por Área de Ensino", icon: Layers, description: "Total de aulas e disciplinas por área" },
  { value: "by_semester", label: "Por Semestre", icon: Clock, description: "Distribuição de aulas por semestre" },
  { value: "by_course", label: "Por Curso", icon: GraduationCap, description: "Carga horária e disciplinas por curso" },
  { value: "by_campus", label: "Por Campus", icon: BarChart2, description: "Visão consolidada por unidade" },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("by_area");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  const { data: courses = [] } = trpc.courses.list.useQuery({});
  const { data: byArea } = trpc.offerings.classesByArea.useQuery();
  const { data: bySemester } = trpc.offerings.classesBySemester.useQuery();
  const { data: byCourse } = trpc.reports.byCourse.useQuery();
  const { data: byCampus } = trpc.reports.byCampus.useQuery();

  const exportPdf = trpc.reports.exportPdf.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.fileName;
      link.click();
      toast.success("Relatório exportado com sucesso!");
      setIsExporting(false);
    },
    onError: (e) => { toast.error(e.message); setIsExporting(false); },
  });

  const handleExport = () => {
    setIsExporting(true);
    exportPdf.mutate({
      type: reportType,
      courseId: filterCourse !== "all" ? Number(filterCourse) : undefined,
    });
  };

  const currentReportType = REPORT_TYPES.find((r) => r.value === reportType)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visualize e exporte relatórios analíticos do PPC</p>
        </div>
        <Button onClick={handleExport} disabled={isExporting} className="bg-green-600 hover:bg-green-700">
          {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Exportar PDF
        </Button>
      </div>

      {/* Seleção de Tipo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.value}
            onClick={() => setReportType(rt.value)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${reportType === rt.value ? "border-green-500 bg-green-50" : "border-slate-200 bg-white hover:border-green-300"}`}
          >
            <rt.icon className={`w-5 h-5 mb-2 ${reportType === rt.value ? "text-green-600" : "text-slate-400"}`} />
            <p className={`text-sm font-semibold ${reportType === rt.value ? "text-green-800" : "text-slate-700"}`}>{rt.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{rt.description}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      {(reportType === "by_semester") && (
        <div className="flex gap-3">
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-64 bg-white">
              <SelectValue placeholder="Todos os cursos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cursos</SelectItem>
              {courses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Gráficos */}
      <Card className="border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <currentReportType.icon className="w-4 h-4 text-green-600" />
            {currentReportType.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportType === "by_area" && byArea && (
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byArea} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="areaName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: number) => [`${v}`, ""]} />
                  <Bar dataKey="totalWeeklyClasses" name="Aulas/sem" radius={[4,4,0,0]}>
                    {byArea.map((e, i) => <Cell key={e.areaId} fill={e.color || COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Área</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Disciplinas</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Aulas/sem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byArea.map((row, i) => (
                      <tr key={row.areaId} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color || COLORS[i % COLORS.length] }} />
                            {row.areaName}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">{(row as any).subjectCount ?? 0}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-800">{row.totalWeeklyClasses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === "by_semester" && bySemester && (
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bySemester} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="semester" tickFormatter={(v) => `${v}º`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} labelFormatter={(l) => `${l}º Semestre`} formatter={(v: number) => [`${v} aulas/sem`, ""]} />
                  <Bar dataKey="totalClasses" name="Aulas/sem" fill="#2563eb" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Semestre</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Disciplinas</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Aulas/sem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bySemester.map((row) => (
                      <tr key={row.semester} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2 px-3">{row.semester}º Semestre</td>
                        <td className="py-2 px-3 text-right text-slate-600">{(row as any).subjectCount ?? 0}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-800">{row.totalClasses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === "by_course" && byCourse && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Curso</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Tipo</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Disciplinas</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Aulas/sem</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Sem área</th>
                  </tr>
                </thead>
                <tbody>
                  {byCourse.map((row: any) => (
                    <tr key={row.courseId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-800">{row.courseName}</td>
                      <td className="py-2 px-3 text-slate-500">{row.courseType}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{(row as any).subjectCount ?? 0}</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800">{row.totalWeeklyClasses}</td>
                      <td className="py-2 px-3 text-right">
                        {row.withoutArea > 0 ? (
                          <Badge className="bg-orange-100 text-orange-700 text-[10px]">{row.withoutArea}</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 text-[10px]">0</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === "by_campus" && byCampus && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Campus</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Cursos</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Disciplinas</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500">Aulas/sem</th>
                  </tr>
                </thead>
                <tbody>
                  {byCampus.map((row: any) => (
                    <tr key={row.campusId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-800">{row.campusName}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{row.courseCount}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{(row as any).subjectCount ?? 0}</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800">{row.totalWeeklyClasses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
