import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Layers, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function SubjectsPage() {
  const [, setLocation] = useLocation();
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterArea, setFilterArea] = useState<string>("all");
  const { data: courses = [] } = trpc.courses.list.useQuery({});
  const { data: areas = [] } = trpc.areas.list.useQuery();

  const courseId = filterCourse !== "all" ? Number(filterCourse) : undefined;
  const { data: subjects = [], isLoading } = trpc.subjects.listByCourse.useQuery(
    { courseId: courseId! },
    { enabled: !!courseId }
  );

  const areaMap = new Map(areas.map(a => [a.id, a]));
  const filtered = subjects.filter(s => filterArea === "all" || s.areaId === Number(filterArea));
  const withoutArea = filtered.filter(s => !s.areaId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Disciplinas</h1>
        <p className="mt-1 text-sm text-slate-500">Visualize e filtre disciplinas por curso e area</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-64 bg-white"><SelectValue placeholder="Selecione um curso" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Selecione um curso</SelectItem>
            {courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {filterCourse !== "all" && (
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-48 bg-white"><SelectValue placeholder="Todas as areas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as areas</SelectItem>
              {areas.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {filterCourse === "all" ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <BookOpen className="mb-3 h-12 w-12 text-slate-300" />
          <p className="font-medium text-slate-500">Selecione um curso para ver as disciplinas</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/courses")}>Ver Cursos</Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <BookOpen className="mb-3 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">Nenhuma disciplina encontrada</p>
        </div>
      ) : (
        <>
          {withoutArea.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-700">{withoutArea.length} disciplina(s) sem area de ensino definida</p>
            </div>
          )}
          <div className="space-y-2">
            {filtered.map(subject => {
              const area = subject.areaId ? areaMap.get(subject.areaId) : null;
              return (
                <div key={subject.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800">{subject.name}</span>
                        <Badge variant="outline" className="border-slate-200 px-1.5 py-0 text-[10px] text-slate-500">{subject.semester}o sem</Badge>
                        {subject.isElective && <Badge variant="outline" className="border-purple-200 px-1.5 py-0 text-[10px] text-purple-600">Optativa</Badge>}
                        {subject.isRemote && <Badge variant="outline" className="border-blue-200 px-1.5 py-0 text-[10px] text-blue-600">EaD</Badge>}
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />{subject.weeklyClasses} aulas/sem
                        </span>
                        {area ? (
                          <span className="flex items-center gap-1 text-xs" style={{ color: area.color ?? "#3B82F6" }}>
                            <Layers className="h-3 w-3" />{area.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-orange-500">
                            <Layers className="h-3 w-3" />Sem area
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
