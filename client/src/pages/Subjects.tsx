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
    <div className="space-y-5 p-3 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold md:text-2xl" style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.04em" }}>
          Disciplinas
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#9e9ab8", fontFamily: "'Rajdhani', sans-serif" }}>
          Visualize e filtre disciplinas por curso e área
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger
            className="w-64"
            style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}
          >
            <SelectValue placeholder="Selecione um curso" />
          </SelectTrigger>
          <SelectContent style={{ background: "#13132a", border: "1px solid rgba(107,95,160,0.4)" }}>
            <SelectItem value="all">Selecione um curso</SelectItem>
            {courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {filterCourse !== "all" && (
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger
              className="w-48"
              style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}
            >
              <SelectValue placeholder="Todas as áreas" />
            </SelectTrigger>
            <SelectContent style={{ background: "#13132a", border: "1px solid rgba(107,95,160,0.4)" }}>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {areas.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {filterCourse === "all" ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl px-6 py-16 text-center"
          style={{ background: "rgba(19,19,42,0.5)", border: "1px dashed rgba(107,95,160,0.3)" }}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(107,95,160,0.12)", border: "1px solid rgba(107,95,160,0.25)" }}>
            <BookOpen className="h-7 w-7" style={{ color: "#6b5fa0" }} />
          </div>
          <p className="font-semibold" style={{ color: "#e8e6f0", fontFamily: "'Rajdhani', sans-serif" }}>Selecione um curso para ver as disciplinas</p>
          <Button
            variant="outline" className="mt-4"
            onClick={() => setLocation("/courses")}
            style={{ background: "rgba(107,95,160,0.12)", border: "1px solid rgba(107,95,160,0.35)", color: "#8b7ec0" }}
          >
            Ver Cursos
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 rounded-xl" style={{ background: "rgba(26,26,53,0.8)", animation: "pulse 2s infinite" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl px-6 py-16 text-center"
          style={{ background: "rgba(19,19,42,0.5)", border: "1px dashed rgba(107,95,160,0.3)" }}
        >
          <BookOpen className="mb-3 h-10 w-10" style={{ color: "#6b5fa0" }} />
          <p style={{ color: "#9e9ab8" }}>Nenhuma disciplina encontrada</p>
        </div>
      ) : (
        <>
          {withoutArea.length > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)" }}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#d4a017" }} />
              <p className="text-sm" style={{ color: "#f0c040" }}>{withoutArea.length} disciplina(s) sem área de ensino definida</p>
            </div>
          )}
          <div className="space-y-2">
            {filtered.map(subject => {
              const area = subject.areaId ? areaMap.get(subject.areaId) : null;
              return (
                <div
                  key={subject.id}
                  className="rounded-xl p-4 transition-all hover:scale-[1.005]"
                  style={{
                    background: "linear-gradient(135deg, rgba(19,19,42,0.97) 0%, rgba(26,26,53,0.97) 100%)",
                    border: "1px solid rgba(107,95,160,0.22)",
                    boxShadow: "0 2px 10px rgba(74,63,122,0.15)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold" style={{ color: "#e8e6f0", fontFamily: "'Rajdhani', sans-serif" }}>{subject.name}</span>
                        <span
                          className="inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-semibold"
                          style={{ background: "rgba(107,95,160,0.15)", color: "#8b7ec0", border: "1px solid rgba(107,95,160,0.3)" }}
                        >
                          {subject.semester}º sem
                        </span>
                        {subject.isElective && (
                          <span className="inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-semibold" style={{ background: "rgba(139,126,192,0.15)", color: "#a99ed8", border: "1px solid rgba(139,126,192,0.3)" }}>Optativa</span>
                        )}
                        {subject.isRemote && (
                          <span className="inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-semibold" style={{ background: "rgba(41,182,212,0.12)", color: "#29b6d4", border: "1px solid rgba(41,182,212,0.3)" }}>EaD</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs" style={{ color: "#9e9ab8" }}>
                          <Clock className="h-3 w-3" />{subject.weeklyClasses} aulas/sem
                        </span>
                        {area ? (
                          <span className="flex items-center gap-1 text-xs" style={{ color: area.color ?? "#29b6d4" }}>
                            <Layers className="h-3 w-3" />{area.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "#d4a017" }}>
                            <Layers className="h-3 w-3" />Sem área
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
