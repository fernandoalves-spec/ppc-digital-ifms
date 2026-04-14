import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Plus, Trash2, BookOpen, Clock, Layers, ClipboardList, Pencil, ChevronDown, ChevronUp, FileText, Library, Tag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

type SubjectForm = {
  name: string; semester: string; weeklyClasses: string; totalHours: string;
  areaId: string; isElective: boolean; isRemote: boolean; syllabus: string; bibliography: string;
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
  const { data: campuses = [] } = trpc.campus.list.useQuery();
  const { data: areas = [] } = trpc.campus.getAreas.useQuery(
    { campusId: course?.campusId ?? 0 },
    { enabled: !!course?.campusId }
  );

  const createSubjectMutation = trpc.subjects.create.useMutation({
    onSuccess: () => { utils.subjects.listByCourse.invalidate({ courseId }); toast.success("Disciplina adicionada!"); setShowForm(false); setForm(emptyForm); },
    onError: e => toast.error(e.message),
  });

  const updateSubjectMutation = trpc.subjects.update.useMutation({
    onSuccess: () => { utils.subjects.listByCourse.invalidate({ courseId }); toast.success("Disciplina atualizada!"); setEditingSubject(null); },
    onError: e => toast.error(e.message),
  });

  const deleteSubjectMutation = trpc.subjects.delete.useMutation({
    onSuccess: () => { utils.subjects.listByCourse.invalidate({ courseId }); toast.success("Disciplina removida."); },
    onError: e => toast.error(e.message),
  });

  const createBulkApprovalMutation = trpc.approval.createBulk.useMutation({
    onSuccess: data => { toast.success(`${data.count} solicitacao(oes) criadas!`); },
    onError: e => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editForm, setEditForm] = useState<SubjectForm>(emptyForm);
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);

  const isAdmin = user?.role === "admin";
  const areaMap = new Map(areas.map(a => [a.id, a]));
  const campusName = campuses.find(c => c.id === course?.campusId)?.name ?? "";

  const semesterGroups: Record<number, typeof subjects> = {};
  for (const s of subjects) {
    if (!semesterGroups[s.semester]) semesterGroups[s.semester] = [];
    semesterGroups[s.semester].push(s);
  }

  const subjectsWithoutArea = subjects.filter(s => !s.areaId);

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Nome da disciplina e obrigatorio.");
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
      name: subject.name, semester: String(subject.semester), weeklyClasses: String(subject.weeklyClasses),
      totalHours: subject.totalHours ? String(subject.totalHours) : "",
      areaId: subject.areaId ? String(subject.areaId) : "",
      isElective: subject.isElective ?? false, isRemote: subject.isRemote ?? false,
      syllabus: subject.syllabus ?? "", bibliography: subject.bibliography ?? "",
    });
  };

  const handleUpdate = () => {
    if (!editingSubject || !editForm.name.trim()) return toast.error("Nome da disciplina e obrigatorio.");
    updateSubjectMutation.mutate({
      id: editingSubject.id, name: editForm.name, semester: Number(editForm.semester),
      weeklyClasses: Number(editForm.weeklyClasses),
      totalHours: editForm.totalHours ? Number(editForm.totalHours) : null,
      areaId: editForm.areaId && editForm.areaId !== "none" ? Number(editForm.areaId) : null,
      isElective: editForm.isElective, isRemote: editForm.isRemote,
      syllabus: editForm.syllabus || null, bibliography: editForm.bibliography || null,
    });
  };

  if (!course) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
    </div>
  );

  const SubjectFormFields = ({ f, setF }: { f: SubjectForm; setF: (v: SubjectForm) => void }) => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nome da Disciplina *</Label>
        <Input placeholder="Ex: Calculo I" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Semestre *</Label>
          <Select value={f.semester} onValueChange={v => setF({ ...f, semester: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from({ length: course.duration }, (_, i) => i + 1).map(n => <SelectItem key={n} value={String(n)}>{n}o</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Aulas/sem *</Label>
          <Input type="number" min={1} value={f.weeklyClasses} onChange={e => setF({ ...f, weeklyClasses: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Carga (h)</Label>
          <Input type="number" min={0} placeholder="Ex: 60" value={f.totalHours} onChange={e => setF({ ...f, totalHours: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-slate-500" />Area de Ensino</Label>
        <Select value={f.areaId || "none"} onValueChange={v => setF({ ...f, areaId: v === "none" ? "" : v })}>
          <SelectTrigger><SelectValue placeholder="Selecionar area (opcional)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem area definida</SelectItem>
            {areas.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={f.isElective} onChange={e => setF({ ...f, isElective: e.target.checked })} className="rounded" />
          Optativa/Eletiva
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={f.isRemote} onChange={e => setF({ ...f, isRemote: e.target.checked })} className="rounded" />
          EaD/Remota
        </label>
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-slate-500" />Ementa</Label>
        <Textarea value={f.syllabus} onChange={e => setF({ ...f, syllabus: e.target.value })} placeholder="Descreva os conteudos programaticos..." rows={4} className="resize-none" />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5"><Library className="h-3.5 w-3.5 text-slate-500" />Referencias Bibliograficas</Label>
        <Textarea value={f.bibliography} onChange={e => setF({ ...f, bibliography: e.target.value })} placeholder="Liste as referencias basicas e complementares..." rows={4} className="resize-none" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/courses")} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-slate-900">{course.name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {campusName} · <Badge variant="outline" className="text-xs">{course.type}</Badge> · {course.duration} semestres
          </p>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 gap-2">
            {subjectsWithoutArea.length > 0 && (
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => createBulkApprovalMutation.mutate({ courseId })}>
                <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                Solicitar Areas ({subjectsWithoutArea.length})
              </Button>
            )}
            <Button size="sm" onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Disciplina
            </Button>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Disciplinas", value: subjects.length, color: "text-slate-900" },
          { label: "Aulas/sem total", value: subjects.reduce((s, d) => s + d.weeklyClasses, 0), color: "text-slate-900" },
          { label: "Sem area", value: subjectsWithoutArea.length, color: subjectsWithoutArea.length > 0 ? "text-orange-600" : "text-green-600" },
          { label: "Com ementa", value: subjects.filter(s => (s as any).syllabus).length, color: "text-slate-900" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl p-4 text-center shadow-sm" style={{ background: "linear-gradient(135deg, rgba(19,19,42,0.97), rgba(26,26,53,0.97))", border: "1px solid rgba(107,95,160,0.22)" }}>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Disciplinas por semestre */}
      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(107,95,160,0.25)] py-16 text-center">
          <BookOpen className="mb-3 h-12 w-12 text-slate-300" />
          <p className="font-medium text-slate-500">Nenhuma disciplina cadastrada</p>
          {isAdmin && <p className="mt-1 text-sm text-slate-400">Adicione disciplinas ou faca upload do PPC</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(semesterGroups).sort(([a], [b]) => Number(a) - Number(b)).map(([sem, subs]) => (
            <div key={sem} className="rounded-xl shadow-sm" style={{ background: "linear-gradient(135deg, rgba(19,19,42,0.97), rgba(26,26,53,0.97))", border: "1px solid rgba(107,95,160,0.22)" }}>
              <div className="flex items-center gap-3 border-b border-[rgba(107,95,160,0.18)] px-5 py-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">{sem}</span>
                <h3 className="text-sm font-semibold text-slate-700">{Number(sem)}o Semestre</h3>
                <span className="ml-auto text-xs font-normal text-slate-400">{subs.reduce((s, d) => s + d.weeklyClasses, 0)} aulas/sem</span>
              </div>
              <div className="space-y-1 p-3">
                {subs.map(subject => {
                  const area = subject.areaId ? areaMap.get(subject.areaId) : null;
                  const isExpanded = expandedSubject === subject.id;
                  const hasSyllabus = !!(subject as any).syllabus;
                  const hasBibliography = !!(subject as any).bibliography;
                  return (
                    <div key={subject.id} className="overflow-hidden rounded-lg border border-[rgba(107,95,160,0.18)]" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}>
                      <div className="flex cursor-pointer items-center gap-3 p-3 hover:bg-slate-50" onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">{subject.name}</span>
                            {subject.isElective && <Badge variant="outline" className="border-purple-200 px-1.5 py-0 text-[10px] text-purple-600">Optativa</Badge>}
                            {subject.isRemote && <Badge variant="outline" className="border-blue-200 px-1.5 py-0 text-[10px] text-blue-600">EaD</Badge>}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" />{subject.weeklyClasses} aulas/sem</span>
                            {(subject as any).totalHours && <span className="text-xs" style={{ color: "#9e9ab8" }}>{(subject as any).totalHours}h total</span>}
                            {area ? (
                              <span className="flex items-center gap-1 text-xs" style={{ color: area.color ?? "#3B82F6" }}>
                                <Layers className="h-3 w-3" />{area.name}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-orange-500"><Layers className="h-3 w-3" />Sem area</span>
                            )}
                            {hasSyllabus && <span className="flex items-center gap-0.5 text-xs text-slate-400"><FileText className="h-3 w-3" />Ementa</span>}
                            {hasBibliography && <span className="flex items-center gap-0.5 text-xs text-slate-400"><Library className="h-3 w-3" />Refs</span>}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-green-600" onClick={e => { e.stopPropagation(); openEdit(subject); }} title="Editar">
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={e => { e.stopPropagation(); deleteSubjectMutation.mutate({ id: subject.id }); }} title="Remover">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="space-y-3 border-t border-[rgba(107,95,160,0.18)] bg-slate-50 px-3 pb-3 pt-3">
                          {hasSyllabus ? (
                            <div>
                              <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><FileText className="h-3 w-3" />Ementa</p>
                              <p className="whitespace-pre-wrap rounded border border-[rgba(107,95,160,0.18)] p-2 text-xs leading-relaxed text-slate-700" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}>{(subject as any).syllabus}</p>
                            </div>
                          ) : (
                            <p className="flex items-center gap-1 text-xs italic text-slate-400"><FileText className="h-3 w-3" />Ementa nao cadastrada{isAdmin ? " — clique no icone de edicao para adicionar." : "."}</p>
                          )}
                          {hasBibliography ? (
                            <div>
                              <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><Library className="h-3 w-3" />Referencias Bibliograficas</p>
                              <p className="whitespace-pre-wrap rounded border border-[rgba(107,95,160,0.18)] p-2 text-xs leading-relaxed text-slate-700" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}>{(subject as any).bibliography}</p>
                            </div>
                          ) : (
                            <p className="flex items-center gap-1 text-xs italic text-slate-400"><Library className="h-3 w-3" />Referencias nao cadastradas{isAdmin ? " — clique no icone de edicao para adicionar." : "."}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Nova Disciplina */}
      <Dialog open={showForm} onOpenChange={o => { setShowForm(o); if (!o) setForm(emptyForm); }}>
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-green-600" />Nova Disciplina</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="py-2 pr-2"><SubjectFormFields f={form} setF={setForm} /></div>
          </ScrollArea>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createSubjectMutation.isPending} className="bg-green-600 hover:bg-green-700">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Disciplina */}
      <Dialog open={!!editingSubject} onOpenChange={o => { if (!o) setEditingSubject(null); }}>
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="h-4 w-4 text-green-600" />Editar Disciplina</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="py-2 pr-2"><SubjectFormFields f={editForm} setF={setEditForm} /></div>
          </ScrollArea>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setEditingSubject(null)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={updateSubjectMutation.isPending} className="bg-green-600 hover:bg-green-700">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
