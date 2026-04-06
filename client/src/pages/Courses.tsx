import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { GraduationCap, Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const COURSE_TYPES = ["Técnico", "Subsequente", "Graduação", "FIC", "Pós-graduação"] as const;
const TYPE_COLORS: Record<string, string> = {
  "Técnico": "bg-blue-100 text-blue-700",
  "Subsequente": "bg-purple-100 text-purple-700",
  "Graduação": "bg-green-100 text-green-700",
  "FIC": "bg-amber-100 text-amber-700",
  "Pós-graduação": "bg-red-100 text-red-700",
};

type FormState = {
  name: string;
  type: typeof COURSE_TYPES[number];
  campusId: string;
  duration: string;
  classesFirstHalfYear: string;
  classesSecondHalfYear: string;
};

const EMPTY_FORM: FormState = {
  name: "", type: "Técnico", campusId: "", duration: "6",
  classesFirstHalfYear: "1", classesSecondHalfYear: "0",
};

export default function CoursesPage() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const { data: campuses = [] } = trpc.campus.list.useQuery();
  const { data: courses = [], isLoading } = trpc.courses.list.useQuery({});

  const createMutation = trpc.courses.create.useMutation({
    onSuccess: () => {
      utils.courses.list.invalidate();
      toast.success("Curso criado!");
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.courses.update.useMutation({
    onSuccess: () => {
      utils.courses.list.invalidate();
      toast.success("Curso atualizado!");
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.courses.delete.useMutation({
    onSuccess: () => { utils.courses.list.invalidate(); toast.success("Curso removido."); },
    onError: (e) => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterCampus, setFilterCampus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const campusMap = new Map(campuses.map((c) => [c.id, c.name]));

  const filtered = courses.filter((c) => {
    if (filterCampus !== "all" && c.campusId !== Number(filterCampus)) return false;
    if (filterType !== "all" && c.type !== filterType) return false;
    return true;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (course: typeof courses[number], e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(course.id);
    setForm({
      name: course.name,
      type: course.type as typeof COURSE_TYPES[number],
      campusId: String(course.campusId),
      duration: String(course.duration),
      classesFirstHalfYear: String(course.classesFirstHalfYear),
      classesSecondHalfYear: String(course.classesSecondHalfYear),
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Nome do curso é obrigatório.");
    if (!form.campusId) return toast.error("Selecione um campus.");
    const payload = {
      name: form.name,
      type: form.type,
      campusId: Number(form.campusId),
      duration: Number(form.duration),
      classesFirstHalfYear: Number(form.classesFirstHalfYear),
      classesSecondHalfYear: Number(form.classesSecondHalfYear),
    };
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cursos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie os cursos ofertados pelo IFMS</p>
        </div>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Curso
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterCampus} onValueChange={setFilterCampus}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="Todos os campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os campus</SelectItem>
            {campuses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44 bg-white">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {COURSE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-500 self-center">{filtered.length} curso(s)</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16 text-center">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhum curso encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((course) => (
            <Card
              key={course.id}
              className="border-slate-100 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setLocation(`/courses/${course.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 truncate">{course.name}</h3>
                      <Badge className={`text-[10px] px-2 py-0 ${TYPE_COLORS[course.type] ?? "bg-slate-100 text-slate-700"}`}>
                        {course.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {campusMap.get(course.campusId) ?? "Campus desconhecido"} • {course.duration} semestres
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400">Turmas/ano</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {course.classesFirstHalfYear + course.classesSecondHalfYear}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-600"
                      onClick={(e) => openEdit(course, e)}
                      title="Editar curso"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600"
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: course.id }); }}
                      title="Excluir curso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Criar / Editar */}
      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) { setEditingId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Editar Curso" : "Novo Curso"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome do Curso *</Label>
              <Input
                placeholder="Ex: Técnico Integrado em Informática"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COURSE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Campus *</Label>
                <Select value={form.campusId} onValueChange={(v) => setForm({ ...form, campusId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {campuses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Duração (sem.)</Label>
                <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Turmas 1º Sem</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.classesFirstHalfYear}
                  onChange={(e) => setForm({ ...form, classesFirstHalfYear: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Turmas 2º Sem</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.classesSecondHalfYear}
                  onChange={(e) => setForm({ ...form, classesSecondHalfYear: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? "Salvando..." : editingId !== null ? "Salvar Alterações" : "Criar Curso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
