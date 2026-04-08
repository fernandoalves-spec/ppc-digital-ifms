import { useState } from "react";
import EmptyStateInstitutional from "@/components/layout/EmptyStateInstitutional";
import PageHeader from "@/components/layout/PageHeader";
import SectionCard from "@/components/layout/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ifmsColorTokens } from "@shared/branding/ifmsTokens";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart2, Clock, Download, FileText, GraduationCap, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

type ReportType = "by_area" | "by_semester" | "by_course" | "by_campus";

const REPORT_TYPES: { value: ReportType; label: string; icon: React.ElementType; description: string }[] = [
  { value: "by_area", label: "Por area de ensino", icon: Layers, description: "Total de aulas e disciplinas por area." },
  { value: "by_semester", label: "Por semestre", icon: Clock, description: "Distribuicao de aulas por semestre." },
  { value: "by_course", label: "Por curso", icon: GraduationCap, description: "Carga horaria e disciplinas por curso." },
  { value: "by_campus", label: "Por campus", icon: BarChart2, description: "Visao consolidada por unidade." },
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
    onSuccess: data => {
      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.fileName;
      link.click();
      toast.success("Relatorio exportado com sucesso.");
      setIsExporting(false);
    },
    onError: e => {
      toast.error(e.message);
      setIsExporting(false);
    },
  });

  const handleExport = () => {
    setIsExporting(true);
    exportPdf.mutate({
      type: reportType,
      courseId: filterCourse !== "all" ? Number(filterCourse) : undefined,
    });
  };

  const currentReportType = REPORT_TYPES.find(report => report.value === reportType)!;

  return (
    <div className="page-stack p-3 md:p-6">
      <PageHeader
        badge="Analises"
        title="Relatorios"
        description="Visualize e exporte relatorios analiticos do PPC."
        actions={
          <Button onClick={handleExport} disabled={isExporting} className="bg-[var(--ifms-green-600)] hover:bg-[var(--ifms-green-700)]">
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Exportar PDF
          </Button>
        }
      />

      <SectionCard>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {REPORT_TYPES.map(rt => (
            <button
              key={rt.value}
              onClick={() => setReportType(rt.value)}
              aria-pressed={reportType === rt.value}
              aria-label={`Selecionar relatorio ${rt.label}`}
              className={[
                "rounded-2xl border-2 p-4 text-left transition",
                reportType === rt.value
                  ? "border-[var(--ifms-green-500)] bg-[var(--ifms-green-50)]"
                  : "border-[var(--ifms-green-100)] bg-white hover:border-[var(--ifms-green-300)]",
              ].join(" ")}
            >
              <rt.icon className={`mb-2 h-5 w-5 ${reportType === rt.value ? "text-[var(--ifms-green-700)]" : "text-slate-400"}`} />
              <p className="text-sm font-semibold text-[var(--ifms-green-900)]">{rt.label}</p>
              <p className="mt-0.5 text-xs text-[var(--ifms-text-soft)]">{rt.description}</p>
            </button>
          ))}
        </div>
      </SectionCard>

      {reportType === "by_semester" && (
        <SectionCard>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ifms-green-700)]">Filtro</span>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-72 bg-white">
                <SelectValue placeholder="Todos os cursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cursos</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={String(course.id)}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SectionCard>
      )}

      <SectionCard>
        <div className="mb-4 flex items-center gap-2">
          <currentReportType.icon className="h-4 w-4 text-[var(--ifms-green-700)]" />
          <h2 className="text-lg font-semibold tracking-tight text-[var(--ifms-green-900)]">{currentReportType.label}</h2>
        </div>

        {reportType === "by_area" && byArea && byArea.length > 0 && (
          <ReportTableChart
            headers={["Area", "Disciplinas", "Aulas/sem"]}
            chart={
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byArea} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="areaName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: number) => [`${v}`, ""]} />
                  <Bar dataKey="totalWeeklyClasses" name="Aulas/sem" radius={[4, 4, 0, 0]}>
                    {byArea.map((entry, index) => (
                      <Cell key={entry.areaId} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            }
            rows={byArea.map((row, index) => ({
              key: row.areaId,
              cells: [
                <div className="flex items-center gap-2" key={`area-${row.areaId}`}>
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color || COLORS[index % COLORS.length] }} />
                  {row.areaName}
                </div>,
                <span key={`subjects-${row.areaId}`}>{(row as any).subjectCount ?? 0}</span>,
                <strong key={`weekly-${row.areaId}`}>{row.totalWeeklyClasses}</strong>,
              ],
            }))}
          />
        )}

        {reportType === "by_semester" && bySemester && bySemester.length > 0 && (
          <ReportTableChart
            headers={["Semestre", "Disciplinas", "Aulas/sem"]}
            chart={
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bySemester} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="semester" tickFormatter={(value) => `${value}o`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    labelFormatter={label => `${label}o semestre`}
                    formatter={(value: number) => [`${value} aulas/sem`, ""]}
                  />
                  <Bar dataKey="totalClasses" name="Aulas/sem" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            }
            rows={bySemester.map(row => ({
              key: row.semester,
              cells: [
                `${row.semester}o semestre`,
                <span key={`subjects-${row.semester}`}>{(row as any).subjectCount ?? 0}</span>,
                <strong key={`classes-${row.semester}`}>{row.totalClasses}</strong>,
              ],
            }))}
          />
        )}

        {reportType === "by_course" && byCourse && byCourse.length > 0 && (
          <DataTable
            headers={["Curso", "Tipo", "Disciplinas", "Aulas/sem", "Sem area"]}
            rows={byCourse.map((row: any) => ({
              key: row.courseId,
              cells: [
                <span key={`name-${row.courseId}`} className="font-medium text-slate-800">{row.courseName}</span>,
                row.courseType,
                <span key={`subject-${row.courseId}`}>{row.subjectCount ?? 0}</span>,
                <strong key={`weekly-${row.courseId}`}>{row.totalWeeklyClasses}</strong>,
                <Badge key={`without-${row.courseId}`} className={row.withoutArea > 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}>
                  {row.withoutArea ?? 0}
                </Badge>,
              ],
            }))}
          />
        )}

        {reportType === "by_campus" && byCampus && byCampus.length > 0 && (
          <DataTable
            headers={["Campus", "Cursos", "Disciplinas", "Aulas/sem"]}
            rows={byCampus.map((row: any) => ({
              key: row.campusId,
              cells: [
                <span key={`campus-${row.campusId}`} className="font-medium text-slate-800">{row.campusName}</span>,
                row.courseCount,
                row.subjectCount ?? 0,
                <strong key={`classes-${row.campusId}`}>{row.totalWeeklyClasses}</strong>,
              ],
            }))}
          />
        )}

        {((reportType === "by_area" && (!byArea || byArea.length === 0)) ||
          (reportType === "by_semester" && (!bySemester || bySemester.length === 0)) ||
          (reportType === "by_course" && (!byCourse || byCourse.length === 0)) ||
          (reportType === "by_campus" && (!byCampus || byCampus.length === 0))) && (
          <EmptyStateInstitutional
            title="Sem dados para este relatorio"
            description="Registre dados de PPC e oferta para liberar as analises desta visao."
            icon={<FileText className="h-5 w-5" />}
          />
        )}
      </SectionCard>
    </div>
  );
}

function ReportTableChart({
  chart,
  headers,
  rows,
}: {
  chart: React.ReactNode;
  headers: string[];
  rows: { key: string | number; cells: React.ReactNode[] }[];
}) {
  return (
    <div className="space-y-6">
      {chart}
      <DataTable headers={headers} rows={rows} />
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: { key: string | number; cells: React.ReactNode[] }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label={`Tabela de relatorio: ${headers.join(", ")}`}>
        <caption className="sr-only">Dados consolidados do relatorio selecionado.</caption>
        <thead>
          <tr className="border-b border-slate-100">
            {headers.map((header, index) => (
              <th
                key={header}
                scope="col"
                className={`px-3 py-2 text-xs font-semibold text-slate-500 ${index === 0 ? "text-left" : "text-right"}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.key} className="border-b border-slate-50 hover:bg-slate-50">
              {row.cells.map((cell, index) => (
                <td key={`${row.key}-${index}`} className={`px-3 py-2 ${index === 0 ? "text-left" : "text-right"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
