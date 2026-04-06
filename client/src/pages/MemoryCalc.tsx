import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Calculator,
  Download,
  BookOpen,
  GraduationCap,
  Building2,
  ChevronDown,
  ChevronRight,
  Loader2,
  BarChart3,
  Clock,
  Hash,
} from "lucide-react";

export default function MemoryCalc() {
  const [selectedCampusId, setSelectedCampusId] = useState<number | undefined>();
  const [selectedAreaId, setSelectedAreaId] = useState<number | undefined>();
  const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const { data: campuses = [] } = trpc.campus.list.useQuery();
  const { data: areas = [] } = trpc.areas.list.useQuery();

  const { data: memoryData = [], isLoading } = trpc.reports.memoryByArea.useQuery(
    { campusId: selectedCampusId, areaId: selectedAreaId },
    { enabled: true }
  );

  const exportMutation = trpc.reports.exportMemoryPdf.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("PDF gerado com sucesso!");
    },
    onError: (e) => toast.error(`Erro ao gerar PDF: ${e.message}`),
  });

  const toggleArea = (areaId: number) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  };

  const toggleCourse = (key: string) => {
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const areaIds = new Set(memoryData.map(a => a.areaId));
    setExpandedAreas(areaIds);
    const courseKeys = new Set<string>();
    memoryData.forEach(area => {
      area.campuses.forEach(campus => {
        campus.courses.forEach(course => {
          courseKeys.add(`${area.areaId}-${campus.campusId}-${course.courseId}`);
        });
      });
    });
    setExpandedCourses(courseKeys);
  };

  const collapseAll = () => {
    setExpandedAreas(new Set());
    setExpandedCourses(new Set());
  };

  // Totais gerais
  const totals = useMemo(() => {
    let totalAreas = 0, totalSubjects = 0, totalWeekly = 0;
    for (const area of memoryData) {
      totalAreas++;
      for (const campus of area.campuses) {
        for (const course of campus.courses) {
          totalSubjects += course.totalSubjects;
          totalWeekly += course.totalWeeklyClasses;
        }
      }
    }
    return { totalAreas, totalSubjects, totalWeekly };
  }, [memoryData]);

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-green-600" />
            Memória de Cálculo
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Aulas semanais por área de ensino — disciplinas responsáveis por campus e curso
          </p>
        </div>
        <Button
          onClick={() => exportMutation.mutate({ campusId: selectedCampusId, areaId: selectedAreaId })}
          disabled={exportMutation.isPending || memoryData.length === 0}
          className="bg-green-600 hover:bg-green-700 gap-2"
        >
          {exportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exportar PDF
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-600">Campus</label>
              <Select
                value={selectedCampusId ? String(selectedCampusId) : "__all__"}
                onValueChange={(v) => setSelectedCampusId(v === "__all__" ? undefined : Number(v))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos os campus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os campus</SelectItem>
                  {(campuses as any[]).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-600">Área de Ensino</label>
              <Select
                value={selectedAreaId ? String(selectedAreaId) : "__all__"}
                onValueChange={(v) => setSelectedAreaId(v === "__all__" ? undefined : Number(v))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todas as áreas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas as áreas</SelectItem>
                  {(areas as any[]).map((a: any) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={expandAll} className="text-xs h-9">
                Expandir Tudo
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll} className="text-xs h-9">
                Recolher Tudo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totals.totalAreas}</p>
              <p className="text-xs text-slate-500">Áreas com disciplinas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totals.totalSubjects}</p>
              <p className="text-xs text-slate-500">Unidades curriculares</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totals.totalWeekly}</p>
              <p className="text-xs text-slate-500">Aulas semanais totais</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo principal */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-3 text-slate-500">Calculando aulas por área...</span>
        </div>
      ) : memoryData.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhum dado encontrado</p>
            <p className="text-slate-400 text-sm mt-1">
              Vincule áreas às disciplinas nos cursos para visualizar a memória de cálculo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {memoryData.map(area => {
            const isAreaExpanded = expandedAreas.has(area.areaId);
            const areaTotal = area.campuses.reduce((s, c) => s + c.courses.reduce((cs, cr) => cs + cr.totalWeeklyClasses, 0), 0);
            const areaSubjects = area.campuses.reduce((s, c) => s + c.courses.reduce((cs, cr) => cs + cr.totalSubjects, 0), 0);

            return (
              <Card key={area.areaId} className="overflow-hidden border-l-4" style={{ borderLeftColor: area.areaColor ?? "#16a34a" }}>
                {/* Cabeçalho da Área */}
                <button
                  className="w-full text-left"
                  onClick={() => toggleArea(area.areaId)}
                >
                  <CardHeader className="py-3 px-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {isAreaExpanded
                          ? <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                          : <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />}
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: area.areaColor ?? "#16a34a" }}
                        />
                        <CardTitle className="text-base font-bold text-slate-900">
                          {area.areaName}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="outline" className="text-xs gap-1">
                          <BookOpen className="w-3 h-3" />
                          {areaSubjects} disciplinas
                        </Badge>
                        <Badge className="text-xs gap-1 bg-green-600 hover:bg-green-600">
                          <Clock className="w-3 h-3" />
                          {areaTotal} aulas/sem
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {/* Conteúdo expandido da Área */}
                {isAreaExpanded && (
                  <CardContent className="pt-0 pb-4 px-4 space-y-4">
                    {area.campuses.map(campus => (
                      <div key={campus.campusId} className="border border-slate-200 rounded-lg overflow-hidden">
                        {/* Cabeçalho do Campus */}
                        <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-300" />
                            <span className="font-semibold text-sm">{campus.campusName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">Aulas por semestre do ano:</span>
                            {campus.semesterSummary.map(s => (
                              <div key={s.calendarSemester} className="flex items-center gap-1">
                                <Badge
                                  className={`text-[10px] px-2 py-0.5 ${
                                    s.calendarSemester === 1
                                      ? "bg-blue-600 hover:bg-blue-600"
                                      : "bg-purple-600 hover:bg-purple-600"
                                  }`}
                                >
                                  {s.label}: {s.weeklyClasses} aulas/sem
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cursos do Campus */}
                        <div className="divide-y divide-slate-100">
                          {campus.courses.map(course => {
                            const courseKey = `${area.areaId}-${campus.campusId}-${course.courseId}`;
                            const isCourseExpanded = expandedCourses.has(courseKey);

                            return (
                              <div key={course.courseId}>
                                {/* Cabeçalho do Curso */}
                                <button
                                  className="w-full text-left bg-slate-50 hover:bg-slate-100 transition-colors px-4 py-2.5 flex items-center justify-between"
                                  onClick={() => toggleCourse(courseKey)}
                                >
                                  <div className="flex items-center gap-2">
                                    {isCourseExpanded
                                      ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                      : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                    <GraduationCap className="w-4 h-4 text-slate-500" />
                                    <span className="font-medium text-sm text-slate-800">{course.courseName}</span>
                                    {course.courseType && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{course.courseType}</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-slate-500">{course.totalSubjects} disciplinas</span>
                                    {(course as any).classesFirstHalfYear > 0 && (
                                      <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-800 hover:bg-blue-100">
                                        1º sem: {(course as any).firstHalfTotal} aulas
                                      </Badge>
                                    )}
                                    {(course as any).classesSecondHalfYear > 0 && (
                                      <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-800 hover:bg-purple-100">
                                        2º sem: {(course as any).secondHalfTotal} aulas
                                      </Badge>
                                    )}
                                    <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                                      {course.totalWeeklyClasses} aulas/sem/turma
                                    </Badge>
                                  </div>
                                </button>

                                {/* Disciplinas por Semestre */}
                                {isCourseExpanded && (
                                  <div className="px-4 pb-3 pt-2 space-y-3">
                                    {course.semesters.map(sem => (
                                      <div key={sem.semester}>
                                        {/* Cabeçalho do Semestre */}
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <div
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: area.areaColor ?? "#16a34a" }}
                                          />
                                          <span className="text-xs font-bold text-slate-700">
                                            {sem.semester}º Semestre
                                          </span>
                                          <Badge className="text-[10px] px-1.5 py-0 bg-blue-600 hover:bg-blue-600">
                                            {sem.weeklyClasses} aulas/sem
                                          </Badge>
                                        </div>

                                        {/* Tabela de Disciplinas */}
                                        <div className="rounded-md border border-slate-200 overflow-hidden">
                                          <table className="w-full text-xs">
                                            <thead>
                                              <tr className="bg-slate-100">
                                                <th className="text-left px-3 py-1.5 font-semibold text-slate-600 w-full">Unidade Curricular</th>
                                                <th className="text-center px-3 py-1.5 font-semibold text-slate-600 whitespace-nowrap">Aulas/sem</th>
                                                <th className="text-center px-3 py-1.5 font-semibold text-slate-600 whitespace-nowrap">C.H. Total</th>
                                                <th className="text-center px-3 py-1.5 font-semibold text-slate-600 whitespace-nowrap">Tipo</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                              {sem.subjects.map((sub, idx) => (
                                                <tr key={sub.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                                  <td className="px-3 py-1.5 text-slate-800">{sub.name}</td>
                                                  <td className="px-3 py-1.5 text-center font-medium text-slate-700">{sub.weeklyClasses}</td>
                                                  <td className="px-3 py-1.5 text-center text-slate-600">{sub.totalHours ? `${sub.totalHours}h` : "—"}</td>
                                                  <td className="px-3 py-1.5 text-center">
                                                    <Badge
                                                      variant="outline"
                                                      className={`text-[10px] px-1.5 py-0 ${sub.isElective ? "border-blue-300 text-blue-700" : "border-green-300 text-green-700"}`}
                                                    >
                                                      {sub.isElective ? "Optativa" : "Obrigatória"}
                                                    </Badge>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                            <tfoot>
                                              <tr className="bg-slate-100 border-t border-slate-200">
                                                <td className="px-3 py-1.5 font-bold text-slate-700">Total do Semestre</td>
                                                <td className="px-3 py-1.5 text-center font-bold text-green-700">{sem.weeklyClasses}</td>
                                                <td className="px-3 py-1.5 text-center text-slate-500">
                                                  {sem.subjects.reduce((s, sub) => s + (sub.totalHours ?? 0), 0)}h
                                                </td>
                                                <td />
                                              </tr>
                                            </tfoot>
                                          </table>
                                        </div>
                                      </div>
                                    ))}

                                    {/* Total do Curso */}
                                    <div className="flex items-center flex-wrap justify-end gap-2 pt-1 border-t border-dashed border-slate-200">
                                      <span className="text-xs text-slate-500">Total do Curso nesta Área:</span>
                                      <Badge variant="outline" className="text-xs">
                                        {course.totalSubjects} disciplinas
                                      </Badge>
                                      <Badge className="bg-slate-600 hover:bg-slate-600 text-xs">
                                        <Hash className="w-3 h-3 mr-1" />
                                        {course.totalWeeklyClasses} aulas/sem por turma
                                      </Badge>
                                      {(course as any).classesFirstHalfYear > 0 && (
                                        <Badge className="bg-blue-600 hover:bg-blue-600 text-xs">
                                          1º sem. ano: {(course as any).firstHalfTotal} aulas
                                          {(course as any).classesFirstHalfYear > 1 && ` (${(course as any).classesFirstHalfYear} turmas)`}
                                        </Badge>
                                      )}
                                      {(course as any).classesSecondHalfYear > 0 && (
                                        <Badge className="bg-purple-600 hover:bg-purple-600 text-xs">
                                          2º sem. ano: {(course as any).secondHalfTotal} aulas
                                          {(course as any).classesSecondHalfYear > 1 && ` (${(course as any).classesSecondHalfYear} turmas)`}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
