import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  FileText,
  CalendarDays,
} from "lucide-react";

export default function MemoryCalc() {
  const currentYear = new Date().getFullYear();
  const [selectedCampusId, setSelectedCampusId] = useState<number | undefined>();
  const [selectedAreaId, setSelectedAreaId] = useState<number | undefined>();
  const [targetYear, setTargetYear] = useState<number>(currentYear);
  const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set());
  const [expandedCampuses, setExpandedCampuses] = useState<Set<string>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const { data: campuses = [] } = trpc.campus.list.useQuery();
  const { data: areas = [] } = trpc.areas.list.useQuery();

  const { data: memoryData = [], isLoading } = trpc.reports.memoryByArea.useQuery(
    { campusId: selectedCampusId, areaId: selectedAreaId, targetYear },
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
      if (next.has(areaId)) next.delete(areaId); else next.add(areaId);
      return next;
    });
  };

  const toggleCampus = (key: string) => {
    setExpandedCampuses(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleCourse = (key: string) => {
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedAreas(new Set(memoryData.map(a => a.areaId)));
    const campusKeys = new Set<string>();
    const courseKeys = new Set<string>();
    memoryData.forEach(area => {
      area.campuses.forEach(campus => {
        campusKeys.add(`${area.areaId}-${campus.campusId}`);
        campus.courses.forEach(course => {
          courseKeys.add(`${area.areaId}-${campus.campusId}-${course.courseId}`);
        });
      });
    });
    setExpandedCampuses(campusKeys);
    setExpandedCourses(courseKeys);
  };

  const collapseAll = () => {
    setExpandedAreas(new Set());
    setExpandedCampuses(new Set());
    setExpandedCourses(new Set());
  };

  // KPIs gerais
  const totals = useMemo(() => {
    let totalAreas = 0, totalCourses = 0, totalFirst = 0, totalSecond = 0;
    for (const area of memoryData) {
      totalAreas++;
      for (const campus of area.campuses) {
        for (const course of campus.courses) {
          totalCourses++;
          totalFirst += course.firstHalfTotal;
          totalSecond += course.secondHalfTotal;
        }
      }
    }
    return { totalAreas, totalCourses, totalFirst, totalSecond };
  }, [memoryData]);

  // Anos disponíveis no seletor (3 anos atrás até 3 anos à frente)
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  return (
    <div className="space-y-4 p-3 md:p-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 md:w-6 md:h-6 text-green-600 shrink-0" />
            Memória de Cálculo
          </h1>
          <p className="text-slate-500 mt-1 text-xs md:text-sm">
            Projeção de aulas semanais por área — baseada nos editais ativos e no ano alvo
          </p>
        </div>
        <Button
          onClick={() => exportMutation.mutate({ campusId: selectedCampusId, areaId: selectedAreaId, targetYear })}
          disabled={exportMutation.isPending || memoryData.length === 0}
          className="bg-green-600 hover:bg-green-700 gap-2 text-sm h-9"
        >
          {exportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span className="hidden sm:inline">Exportar PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-3 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Ano Alvo</label>
              <Select
                value={String(targetYear)}
                onValueChange={(v) => setTargetYear(Number(v))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => (
                    <SelectItem key={y} value={String(y)}>
                      {y} {y === currentYear ? "(atual)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
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
            <div className="space-y-1">
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll} className="text-xs h-9 flex-1">
                Expandir
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll} className="text-xs h-9 flex-1">
                Recolher
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-green-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-slate-900">{totals.totalAreas}</p>
              <p className="text-[11px] text-slate-500 leading-tight">Áreas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-blue-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-slate-900">{totals.totalCourses}</p>
              <p className="text-[11px] text-slate-500 leading-tight">Cursos ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-blue-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-slate-900">{totals.totalFirst}</p>
              <p className="text-[11px] text-slate-500 leading-tight">Aulas 1º Sem/{targetYear}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-slate-900">{totals.totalSecond}</p>
              <p className="text-[11px] text-slate-500 leading-tight">Aulas 2º Sem/{targetYear}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo principal */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-green-600" />
          <span className="ml-3 text-slate-500 text-sm">Calculando projeção de aulas...</span>
        </div>
      ) : memoryData.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhum dado encontrado para {targetYear}</p>
            <p className="text-slate-400 text-sm mt-1">
              Cadastre editais na Linha do Tempo e vincule áreas às disciplinas para visualizar a memória de cálculo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {memoryData.map(area => {
            const isAreaExpanded = expandedAreas.has(area.areaId);
            const areaFirst = area.campuses.reduce((s, c) => s + c.courses.reduce((cs, cr) => cs + cr.firstHalfTotal, 0), 0);
            const areaSecond = area.campuses.reduce((s, c) => s + c.courses.reduce((cs, cr) => cs + cr.secondHalfTotal, 0), 0);

            return (
              <Card key={area.areaId} className="overflow-hidden border-l-4" style={{ borderLeftColor: area.areaColor ?? "#16a34a" }}>
                {/* Cabeçalho da Área */}
                <button className="w-full text-left" onClick={() => toggleArea(area.areaId)}>
                  <CardHeader className="py-3 px-3 md:px-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {isAreaExpanded
                          ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: area.areaColor ?? "#16a34a" }} />
                        <CardTitle className="text-sm md:text-base font-bold text-slate-900">
                          {area.areaName}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <Badge className="text-[10px] px-2 py-0.5 bg-blue-600 hover:bg-blue-600">
                          1º sem: {areaFirst} aulas/sem
                        </Badge>
                        <Badge className="text-[10px] px-2 py-0.5 bg-purple-600 hover:bg-purple-600">
                          2º sem: {areaSecond} aulas/sem
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {/* Conteúdo expandido da Área */}
                {isAreaExpanded && (
                  <CardContent className="pt-0 pb-3 px-3 md:px-4 space-y-3">
                    {area.campuses.map(campus => {
                      const campusKey = `${area.areaId}-${campus.campusId}`;
                      const isCampusExpanded = expandedCampuses.has(campusKey);

                      return (
                        <div key={campus.campusId} className="border border-slate-200 rounded-lg overflow-hidden">
                          {/* Cabeçalho do Campus */}
                          <button
                            className="w-full text-left bg-slate-800 text-white px-3 md:px-4 py-2.5 flex items-center justify-between gap-2"
                            onClick={() => toggleCampus(campusKey)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isCampusExpanded
                                ? <ChevronDown className="w-4 h-4 text-slate-300 shrink-0" />
                                : <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
                              <Building2 className="w-4 h-4 text-slate-300 shrink-0" />
                              <span className="font-semibold text-sm truncate">{campus.campusName}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                              {campus.semesterSummary.map(s => (
                                <Badge
                                  key={s.calendarSemester}
                                  className={`text-[10px] px-2 py-0.5 ${
                                    s.calendarSemester === 1
                                      ? "bg-blue-600 hover:bg-blue-600"
                                      : "bg-purple-600 hover:bg-purple-600"
                                  }`}
                                >
                                  {s.calendarSemester === 1 ? "1º" : "2º"} sem: {s.weeklyClasses} aulas/sem
                                </Badge>
                              ))}
                            </div>
                          </button>

                          {/* Cursos do Campus */}
                          {isCampusExpanded && (
                            <div className="divide-y divide-slate-100">
                              {campus.courses.map(course => {
                                const courseKey = `${area.areaId}-${campus.campusId}-${course.courseId}`;
                                const isCourseExpanded = expandedCourses.has(courseKey);

                                return (
                                  <div key={course.courseId}>
                                    {/* Cabeçalho do Curso */}
                                    <button
                                      className="w-full text-left bg-slate-50 hover:bg-slate-100 transition-colors px-3 md:px-4 py-2.5 flex items-start justify-between gap-2"
                                      onClick={() => toggleCourse(courseKey)}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        {isCourseExpanded
                                          ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                          : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                                        <GraduationCap className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span className="font-medium text-sm text-slate-800 text-left">{course.courseName}</span>
                                        {course.courseType && (
                                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 hidden sm:flex">{course.courseType}</Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                                        <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-800 hover:bg-blue-100">
                                          1º: {course.firstHalfTotal}
                                        </Badge>
                                        <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-800 hover:bg-purple-100">
                                          2º: {course.secondHalfTotal}
                                        </Badge>
                                      </div>
                                    </button>

                                    {/* Detalhamento por Edital */}
                                    {isCourseExpanded && (
                                      <div className="px-3 md:px-4 pb-3 pt-2 space-y-3 bg-white">
                                        {course.offerings.length === 0 ? (
                                          <p className="text-xs text-slate-400 italic py-2">Nenhum edital ativo para este curso no ano {targetYear}.</p>
                                        ) : (
                                          course.offerings.map(off => (
                                            <div key={off.offeringId} className="border border-slate-200 rounded-lg overflow-hidden">
                                              {/* Cabeçalho do Edital */}
                                              <div
                                                className="px-3 py-2 flex items-center gap-2 flex-wrap"
                                                style={{ backgroundColor: area.areaColor ? area.areaColor + "22" : "#f0fdf4", borderLeft: `3px solid ${area.areaColor ?? "#16a34a"}` }}
                                              >
                                                <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: area.areaColor ?? "#16a34a" }} />
                                                <span className="font-semibold text-xs text-slate-800">
                                                  Edital {off.academicTerm}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                  {off.numberOfEntries} turma{off.numberOfEntries > 1 ? "s" : ""}
                                                </Badge>
                                                <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
                                                  {off.firstHalfClasses > 0 && (
                                                    <Badge className="text-[10px] px-1.5 py-0 bg-blue-600 hover:bg-blue-600">
                                                      1º sem: {off.firstHalfClasses} aulas/sem
                                                    </Badge>
                                                  )}
                                                  {off.secondHalfClasses > 0 && (
                                                    <Badge className="text-[10px] px-1.5 py-0 bg-purple-600 hover:bg-purple-600">
                                                      2º sem: {off.secondHalfClasses} aulas/sem
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>

                                              {/* 1º Semestre do Ano */}
                                              {off.subjects1st.length > 0 && (
                                                <div>
                                                  <div className="bg-blue-600 px-3 py-1.5 flex items-center gap-2">
                                                    <CalendarDays className="w-3.5 h-3.5 text-white shrink-0" />
                                                    <span className="text-white text-xs font-semibold">
                                                      1º Semestre do Ano — {off.courseSemester1st}º Sem. do Curso — {off.firstHalfClasses} aulas/sem
                                                    </span>
                                                  </div>
                                                  <div className="overflow-x-auto">
                                                    <table className="w-full text-xs min-w-[320px]">
                                                      <thead>
                                                        <tr className="bg-blue-50">
                                                          <th className="text-left px-3 py-1.5 font-semibold text-slate-600">Unidade Curricular</th>
                                                          <th className="text-center px-2 py-1.5 font-semibold text-slate-600 whitespace-nowrap">Aulas/sem</th>
                                                          <th className="text-center px-2 py-1.5 font-semibold text-slate-600 whitespace-nowrap hidden sm:table-cell">Tipo</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody className="divide-y divide-slate-100">
                                                        {off.subjects1st.map((sub, idx) => (
                                                          <tr key={sub.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                                            <td className="px-3 py-1.5 text-slate-800">{sub.name}</td>
                                                            <td className="px-2 py-1.5 text-center font-medium text-slate-700">{sub.weeklyClasses}</td>
                                                            <td className="px-2 py-1.5 text-center hidden sm:table-cell">
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
                                                    </table>
                                                  </div>
                                                </div>
                                              )}

                                              {/* 2º Semestre do Ano */}
                                              {off.subjects2nd.length > 0 && (
                                                <div>
                                                  <div className="bg-purple-600 px-3 py-1.5 flex items-center gap-2">
                                                    <CalendarDays className="w-3.5 h-3.5 text-white shrink-0" />
                                                    <span className="text-white text-xs font-semibold">
                                                      2º Semestre do Ano — {off.courseSemester2nd}º Sem. do Curso — {off.secondHalfClasses} aulas/sem
                                                    </span>
                                                  </div>
                                                  <div className="overflow-x-auto">
                                                    <table className="w-full text-xs min-w-[320px]">
                                                      <thead>
                                                        <tr className="bg-purple-50">
                                                          <th className="text-left px-3 py-1.5 font-semibold text-slate-600">Unidade Curricular</th>
                                                          <th className="text-center px-2 py-1.5 font-semibold text-slate-600 whitespace-nowrap">Aulas/sem</th>
                                                          <th className="text-center px-2 py-1.5 font-semibold text-slate-600 whitespace-nowrap hidden sm:table-cell">Tipo</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody className="divide-y divide-slate-100">
                                                        {off.subjects2nd.map((sub, idx) => (
                                                          <tr key={sub.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                                            <td className="px-3 py-1.5 text-slate-800">{sub.name}</td>
                                                            <td className="px-2 py-1.5 text-center font-medium text-slate-700">{sub.weeklyClasses}</td>
                                                            <td className="px-2 py-1.5 text-center hidden sm:table-cell">
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
                                                    </table>
                                                  </div>
                                                </div>
                                              )}

                                              {/* Turma sem aulas nesta área neste ano */}
                                              {off.subjects1st.length === 0 && off.subjects2nd.length === 0 && (
                                                <p className="text-xs text-slate-400 italic px-3 py-2">
                                                  Esta turma não tem disciplinas desta área em {targetYear}.
                                                </p>
                                              )}
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
