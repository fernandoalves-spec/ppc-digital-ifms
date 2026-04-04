import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
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

  const areaMap = new Map(areas.map((a) => [a.id, a]));
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const filtered = subjects.filter((s) => filterArea === "all" || s.areaId === Number(filterArea));
  const withoutArea = filtered.filter((s) => !s.areaId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Disciplinas</h1>
        <p className="text-sm text-slate-500 mt-0.5">Visualize e filtre disciplinas por curso e área</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-64 bg-white">
            <SelectValue placeholder="Selecione um curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Selecione um curso</SelectItem>
            {courses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {filterCourse !== "all" && (
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Todas as áreas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {areas.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {filterCourse === "all" ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Selecione um curso para ver as disciplinas</p>
            <Button variant="outline" className="mt-4" onClick={() => setLocation("/courses")}>Ver Cursos</Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhuma disciplina encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {withoutArea.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">{withoutArea.length} disciplina(s) sem área de ensino definida</p>
            </div>
          )}
          <div className="space-y-2">
            {filtered.map((subject) => {
              const area = subject.areaId ? areaMap.get(subject.areaId) : null;
              const course = courseMap.get(subject.courseId);
              return (
                <Card key={subject.id} className="border-slate-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-800">{subject.name}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-slate-500">{subject.semester}º sem</Badge>
                          {subject.isElective && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-purple-600 border-purple-200">Optativa</Badge>}
                          {subject.isRemote && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-200">EaD</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{subject.weeklyClasses} aulas/sem</span>
                          {area ? (
                            <span className="text-xs flex items-center gap-1" style={{ color: area.color ?? "#3B82F6" }}>
                              <Layers className="w-3 h-3" />{area.name}
                            </span>
                          ) : (
                            <span className="text-xs text-orange-500 flex items-center gap-1"><Layers className="w-3 h-3" />Sem área</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
