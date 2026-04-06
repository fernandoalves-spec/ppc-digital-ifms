import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Plus, Trash2, BookOpen, Clock, Layers, ClipboardList,
  Pencil, ChevronDown, ChevronUp, FileText, Library, Tag
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

type SubjectForm = {
  name: string;
  semester: string;
  weeklyClasses: string;
  totalHours: string;
  areaId: string;
  isElective: boolean;
  isRemote: boolean;
  syllabus: string;
  bibliography: string;
};

const emptyForm: SubjectForm = {
  name: "", semester: "1", weeklyClasses: "2", totalHours: "",
  areaId: "", isElective: false, isRemote: false, syllabus: "", bibliography: "",
};

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: course } = trpc.courses.get.useQuery({ id: courseId });
  const { data: subjects = [], isLoading } = trpc.subjects.listByCourse.useQuery({ courseId });
  const { data: areas = [] } = trpc.areas.list.useQuery();
  const { data: campuses = [] } = trpc.campus.list.useQuery();

  const createSubjectMutation = trpc.subjects.create.useMutation({
    onSuccess: () => { utils.subjects.listByCourse.invalidate({ courseId }); toast.success("Disciplina adicionada!"); setShowForm(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });

  const updateSubjectMutation = trpc.subjects.update.useMutation({
    onSuccess: () => { utils.subjects.listByCourse.invalidate({ courseId }); toast.success("Disciplina atualizada!"); setEditingSubject(null); },
    onError: (e) => toast.error(e.message),
  });

  const deleteSubjectMutation = trpc.subjects.delete.useMutation({
    onSuccess: () => { utils.subjects.listByCourse.invalidate({ courseId }); toast.success("Disciplina removida."); },
    onError: (e) => toast.error(e.message),
  });

  const createBulkApprovalMutation = trpc.approval.createBulk.useMutation({
    onSuccess: (data) => { toast.success(`${data.count} solicitação(ões) criadas para o coordenador!`); },
    onError: (e) => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editForm, setEditForm] = useState<SubjectForm>(emptyForm);
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);

  const isAdmin = user?.role === "admin";

  const areaMap = new Map(areas.map((a) => [a.id, a]));
  const campusName = campuses.find((c) => c.id === course?.campusId)?.name ?? "";

  const semesterGroups: Record<number, typeof subjects> = {};
  for (const s of subjects) {
    if (!semesterGroups[s.semester]) semesterGroups[s.semester] = [];
    semesterGroups[s.semester].push(s);
  }

  const subjectsWithoutArea = subjects.filter((s) => !s.areaId);

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Nome da disciplina é obrigatório.");
    createSubjectMutation.mutate({
      courseId, name: form.name, semester: Number(form.semester),
      weeklyClasses: Number(form.weeklyClasses),
      totalHours: form.totalHours ? Number(form.totalHours) : undefined,
      areaId: form.areaId && form.areaId !== "none" ? Number(form.areaId) : undefined,
      isElective: form.isElective, isRemote: form.isRemote,
      syllabus: form.syllabus || undefined,
      bibliography: form.bibliography || undefined,
    });
  };

  const openEdit = (subject: any) => {
    setEditingSubject(subject);
    setEditForm({
      name: subject.name,
      semester: String(subject.semester),
      weeklyClasses: String(subject.weeklyClasses),
      totalHours: subject.totalHours ? String(subject.totalHours) : "",
      areaId: subject.areaId ? String(subject.areaId) : "",
      isElective: subject.isElective ?? false,
      isRemote: subject.isRemote ?? false,
      syllabus: subject.syllabus ?? "",
      bibliography: subject.bibliography ?? "",
    });
  };

  const handleUpdate = () => {
    if (!editingSubject || !editForm.name.trim()) return toast.error("Nome da disciplina é obrigatório.");
    updateSubjectMutation.mutate({
      id: editingSubject.id,
      name: editForm.name,
      semester: Number(editForm.semester),
      weeklyClasses: Number(editForm.weeklyClasses),
      totalHours: editForm.totalHours ? Number(editForm.totalHours) : null,
      areaId: editForm.areaId && editForm.areaId !== "none" ? Number(editForm.areaId) : null,
      isElective: editForm.isElective,
      isRemote: editForm.isRemote,
      syllabus: editForm.syllabus || null,
      bibliography: editForm.bibliography || null,
    });
  };

  if (!course) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
    </div>
  );

  const SubjectFormFields = ({ f, setF }: { f: SubjectForm; setF: (v: SubjectForm) => void }) => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nome da Disciplina *</Label>
        <Input placeholder="Ex: Cálculo I" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Semestre *</Label>
          <Select value={f.semester} onValueChange={(v) => setF({ ...f, semester: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from({ length: course.duration }, (_, i) => i + 1).map((n) => <SelectItem key={n} value={String(n)}>{n}º</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Aulas/sem *</Label>
          <Input type="number" min={1} value={f.weeklyClasses} onChange={(e) => setF({ ...f, weeklyClasses: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Carga Horária (h)</Label>
          <Input type="number" min={0} placeholder="Ex: 60" value={f.totalHours} onChange={(e) => setF({ ...f, totalHours: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-slate-500" />Área de Ensino</Label>
        <Select value={f.areaId || "none"} onValueChange={(v) => setF({ ...f, areaId: v === "none" ? "" : v })}>
          <SelectTrigger><SelectValue placeholder="Selecionar área (opcional)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem área definida</SelectItem>
            {areas.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={f.isElective} onChange={(e) => setF({ ...f, isElective: e.target.checked })} className="rounded" />
          Optativa/Eletiva
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={f.isRemote} onChange={(e) => setF({ ...f, isRemote: e.target.checked })} className="rounded" />
          EaD/Remota
        </label>
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-500" />Ementa</Label>
        <Textarea
          value={f.syllabus}
          onChange={(e) => setF({ ...f, syllabus: e.target.value })}
          placeholder="Descreva os conteúdos programáticos da disciplina..."
          rows={5}
          className="resize-none"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5"><Library className="w-3.5 h-3.5 text-slate-500" />Referências Bibliográficas</Label>
        <Textarea
          value={f.bibliography}
          onChange={(e) => setF({ ...f, bibliography: e.target.value })}
          placeholder="Liste as referências básicas e complementares..."
          rows={5}
          className="resize-none"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/courses")} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{course.name}</h1>
          <p className="text-sm text-slate-500">{campusName} · {course.type} · {course.duration} semestres</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            {subjectsWithoutArea.length > 0 && (
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => createBulkApprovalMutation.mutate({ courseId })}>
                <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
                Solicitar Áreas ({subjectsWithoutArea.length})
              </Button>
            )}
            <Button size="sm" onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Disciplina
            </Button>
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{subjects.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Disciplinas</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{subjects.reduce((s, d) => s + d.weeklyClasses, 0)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Aulas/semana total</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${subjectsWithoutArea.length > 0 ? "text-orange-600" : "text-green-600"}`}>{subjectsWithoutArea.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Sem área definida</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{subjects.filter((s) => (s as any).syllabus).length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Com ementa</p>
          </CardContent>
        </Card>
      </div>

      {/* Disciplinas por semestre */}
      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : subjects.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma disciplina cadastrada</p>
            {isAdmin && <p className="text-sm text-slate-400 mt-1">Adicione disciplinas ou faça upload do PPC para importar automaticamente</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(semesterGroups).sort(([a], [b]) => Number(a) - Number(b)).map(([sem, subs]) => (
            <Card key={sem} className="border-slate-100">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">{sem}</span>
                  {Number(sem)}º Semestre
                  <span className="text-xs text-slate-400 font-normal ml-auto">{subs.reduce((s, d) => s + d.weeklyClasses, 0)} aulas/sem</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-2">
                {subs.map((subject) => {
                  const area = subject.areaId ? areaMap.get(subject.areaId) : null;
                  const isExpanded = expandedSubject === subject.id;
                  const hasSyllabus = !!(subject as any).syllabus;
                  const hasBibliography = !!(subject as any).bibliography;
                  return (
                    <div key={subject.id} className="border border-slate-100 rounded-lg bg-white overflow-hidden">
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-800">{subject.name}</span>
                            {subject.isElective && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-purple-600 border-purple-200">Optativa</Badge>}
                            {subject.isRemote && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-200">EaD</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{subject.weeklyClasses} aulas/sem</span>
                            {subject.totalHours && <span className="text-xs text-slate-500">{subject.totalHours}h total</span>}
                            {area ? (
                              <span className="text-xs flex items-center gap-1" style={{ color: area.color ?? "#3B82F6" }}>
                                <Layers className="w-3 h-3" />{area.name}
                              </span>
                            ) : (
                              <span className="text-xs text-orange-500 flex items-center gap-1"><Layers className="w-3 h-3" />Sem área</span>
                            )}
                            {hasSyllabus && <span className="text-xs text-slate-400 flex items-center gap-0.5"><FileText className="w-3 h-3" />Ementa</span>}
                            {hasBibliography && <span className="text-xs text-slate-400 flex items-center gap-0.5"><Library className="w-3 h-3" />Refs</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-green-600"
                                onClick={(e) => { e.stopPropagation(); openEdit(subject); }}
                                title="Editar disciplina"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600"
                                onClick={(e) => { e.stopPropagation(); deleteSubjectMutation.mutate({ id: subject.id }); }}
                                title="Remover disciplina"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-slate-100 pt-3 bg-slate-50 space-y-3">
                          {hasSyllabus ? (
                            <div>
                              <p className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1"><FileText className="w-3 h-3" />Ementa</p>
                              <p className="text-xs text-slate-700 bg-white rounded p-2 border border-slate-100 whitespace-pre-wrap leading-relaxed">{(subject as any).syllabus}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic flex items-center gap-1">
                              <FileText className="w-3 h-3" />Ementa não cadastrada{isAdmin ? " — clique no ícone de edição para adicionar." : "."}
                            </p>
                          )}
                          {hasBibliography ? (
                            <div>
                              <p className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1"><Library className="w-3 h-3" />Referências Bibliográficas</p>
                              <p className="text-xs text-slate-700 bg-white rounded p-2 border border-slate-100 whitespace-pre-wrap leading-relaxed">{(subject as any).bibliography}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic flex items-center gap-1">
                              <Library className="w-3 h-3" />Referências não cadastradas{isAdmin ? " — clique no ícone de edição para adicionar." : "."}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Nova Disciplina */}
      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) setForm(emptyForm); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="w-4 h-4 text-green-600" />Nova Disciplina</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="py-2 pr-2">
              <SubjectFormFields f={form} setF={setForm} />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createSubjectMutation.isPending} className="bg-green-600 hover:bg-green-700">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Disciplina */}
      <Dialog open={!!editingSubject} onOpenChange={(o) => { if (!o) setEditingSubject(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="w-4 h-4 text-green-600" />Editar Disciplina</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="py-2 pr-2">
              <SubjectFormFields f={editForm} setF={setEditForm} />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setEditingSubject(null)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={updateSubjectMutation.isPending} className="bg-green-600 hover:bg-green-700">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
