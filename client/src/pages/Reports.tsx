import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ifmsColorTokens } from "@shared/branding/ifmsTokens";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart2, Clock, Download, FileText, GraduationCap, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";

const COLORS = [
  ifmsColorTokens.green.hex, "#2563eb", "#d97706", "#9333ea",
  ifmsColorTokens.red.hex, "#0891b2", "#65a30d", "#c026d3",
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
      toast.success("Relatorio exportado.");
      setIsExporting(false);
    },
    onError: e => { toast.error(e.message); setIsExporting(false); },
  });

  const handleExport = () => {
    setIsExporting(true);
    exportPdf.mutate({ type: reportType, courseId: filterCourse !== "all" ? Number(filterCourse) : undefined });
  };

  const currentType = REPORT_TYPES.find(r => r.value === reportType)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.04em" }}>Relatorios</h1>
          <p className="mt-1 text-sm" style={{ color: "#9e9ab8" }}>Visualize e exporte relatorios analiticos do PPC.</p>
        </div>
        <Button onClick={handleExport} disabled={isExporting} style={{ background: "linear-gradient(135deg, #4a3f7a, #6b5fa0)", color: "#e8e6f0" }}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Exportar PDF
        </Button>
      </div>

      {/* Tipo de relatorio */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {REPORT_TYPES.map(rt => (
          <button
            key={rt.value}
            onClick={() => setReportType(rt.value)}
            className="rounded-xl border-2 p-4 text-left transition"
            style={reportType === rt.value
              ? { background: "rgba(74,63,122,0.25)", border: "2px solid rgba(139,126,192,0.7)", boxShadow: "0 0 12px rgba(107,95,160,0.3)" }
              : { background: "rgba(19,19,42,0.6)", border: "1px solid rgba(107,95,160,0.22)" }
            }
          >
            <rt.icon className="mb-2 h-5 w-5" style={{ color: reportType === rt.value ? "#8b7ec0" : "#6a6685" }} />
            <p className="text-sm font-semibold" style={{ color: "#e8e6f0" }}>{rt.label}</p>
            <p className="mt-0.5 text-xs" style={{ color: "#9e9ab8" }}>{rt.description}</p>
          </button>
        ))}
      </div>

      {/* Filtro de curso (semestre) */}
      {reportType === "by_semester" && (
        <div className="flex items-center gap-3 rounded-xl border border-[rgba(107,95,160,0.25)] p-4" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}>
          <span className="text-sm font-medium" style={{ color: "#c8c4e0" }}>Curso:</span>
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-72" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}><SelectValue placeholder="Todos os cursos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cursos</SelectItem>
              {courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Conteudo do relatorio */}
      <div className="rounded-xl p-6 shadow-sm" style={{ background: "linear-gradient(135deg, rgba(19,19,42,0.97), rgba(26,26,53,0.97))", border: "1px solid rgba(107,95,160,0.22)" }}>
        <div className="mb-4 flex items-center gap-2">
          <currentType.icon className="h-4 w-4" style={{ color: "#8b7ec0" }} />
          <h2 className="text-lg font-semibold" style={{ fontFamily: "\'Rajdhani\', sans-serif", color: "#e8e6f0", letterSpacing: "0.03em" }}>{currentType.label}</h2>
        </div>

        {reportType === "by_area" && byArea && byArea.length > 0 && (
          <ReportTableChart
            headers={["Area", "Disciplinas", "Aulas/sem"]}
            chart={
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byArea} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,95,160,0.15)" />
                  <XAxis dataKey="areaName" tick={{ fontSize: 11, fill: "#9e9ab8" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9e9ab8" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, background: "#13132a", border: "1px solid rgba(107,95,160,0.4)", color: "#e8e6f0", fontSize: 12 }} formatter={(v: number) => [`${v}`, ""]} />
                  <Bar dataKey="totalWeeklyClasses" radius={[4, 4, 0, 0]}>
                    {byArea.map((entry, index) => <Cell key={entry.areaId} fill={entry.color || COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            }
            rows={byArea.map((row, index) => ({
              key: row.areaId,
              cells: [
                <div className="flex items-center gap-2" key={`a-${row.areaId}`}>
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color || COLORS[index % COLORS.length] }} />
                  {row.areaName}
                </div>,
                <span key={`s-${row.areaId}`}>{(row as any).subjectCount ?? 0}</span>,
                <strong key={`w-${row.areaId}`}>{row.totalWeeklyClasses}</strong>,
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,95,160,0.15)" />
                  <XAxis dataKey="semester" tickFormatter={v => `${v}o`} tick={{ fontSize: 11, fill: "#9e9ab8" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9e9ab8" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, background: "#13132a", border: "1px solid rgba(107,95,160,0.4)", color: "#e8e6f0", fontSize: 12 }} labelFormatter={l => `${l}o semestre`} formatter={(v: number) => [`${v} aulas/sem`, ""]} />
                  <Bar dataKey="totalClasses" fill="#6b5fa0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            }
            rows={bySemester.map(row => ({
              key: row.semester,
              cells: [
                `${row.semester}o semestre`,
                <span key={`s-${row.semester}`}>{(row as any).subjectCount ?? 0}</span>,
                <strong key={`c-${row.semester}`}>{row.totalClasses}</strong>,
              ],
            }))}
          />
        )}

        {reportType === "by_course" && byCourse && byCourse.length > 0 && (
          <DataTable
            headers={["Curso", "Tipo", "Disciplinas", "Aulas/sem", "Sem area"]}
            rows={(byCourse as any[]).map((row: any) => ({
              key: row.courseId,
              cells: [
                <span key={`n-${row.courseId}`} className="font-medium" style={{ color: "#e8e6f0" }}>{row.courseName}</span>,
                row.courseType,
                <span key={`s-${row.courseId}`}>{row.subjectCount ?? 0}</span>,
                <strong key={`w-${row.courseId}`}>{row.totalWeeklyClasses}</strong>,
                <Badge key={`wa-${row.courseId}`} style={row.withoutArea > 0 ? { background: "rgba(212,160,23,0.15)", color: "#f0c040", border: "1px solid rgba(212,160,23,0.3)" } : { background: "rgba(41,182,100,0.15)", color: "#4ade80", border: "1px solid rgba(41,182,100,0.3)" }}>{row.withoutArea ?? 0}</Badge>,
              ],
            }))}
          />
        )}

        {reportType === "by_campus" && byCampus && byCampus.length > 0 && (
          <DataTable
            headers={["Campus", "Cursos", "Disciplinas", "Aulas/sem"]}
            rows={(byCampus as any[]).map((row: any) => ({
              key: row.campusId,
              cells: [
                <span key={`n-${row.campusId}`} className="font-medium" style={{ color: "#e8e6f0" }}>{row.campusName}</span>,
                row.courseCount,
                row.subjectCount ?? 0,
                <strong key={`c-${row.campusId}`}>{row.totalWeeklyClasses}</strong>,
              ],
            }))}
          />
        )}

        {((reportType === "by_area" && (!byArea || byArea.length === 0)) ||
          (reportType === "by_semester" && (!bySemester || bySemester.length === 0)) ||
          (reportType === "by_course" && (!byCourse || byCourse.length === 0)) ||
          (reportType === "by_campus" && (!byCampus || byCampus.length === 0))) && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10" style={{ color: "#6b5fa0" }} />
            <p className="font-medium" style={{ color: "#9e9ab8" }}>Sem dados para este relatorio</p>
            <p className="mt-1 text-sm" style={{ color: "#6a6685" }}>Registre dados de PPC e oferta para liberar as analises.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportTableChart({ chart, headers, rows }: { chart: React.ReactNode; headers: string[]; rows: { key: string | number; cells: React.ReactNode[] }[] }) {
  return (
    <div className="space-y-6">
      {chart}
      <DataTable headers={headers} rows={rows} />
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: { key: string | number; cells: React.ReactNode[] }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[rgba(107,95,160,0.18)]">
            {headers.map((h, i) => <th key={h} className={`px-3 py-2 text-xs font-semibold ${i === 0 ? "text-left" : "text-right"}`} style={{ color: "#8b7ec0" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.key} className="border-b transition-colors" style={{ borderColor: "rgba(107,95,160,0.12)" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(107,95,160,0.07)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              {row.cells.map((cell, i) => <td key={`${row.key}-${i}`} className={`px-3 py-2 ${i === 0 ? "text-left" : "text-right"}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
