import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload, FileText, Loader2, Sparkles, BookOpen, Clock,
  Pencil, Check, X, ChevronDown, ChevronUp, Building2, GraduationCap,
  AlertCircle, CheckCircle2, Tag
} from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-slate-100 text-slate-600" },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-600" },
  extracted: { label: "Extraído", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Aplicado", color: "bg-green-100 text-green-700" },
  rejected: { label: "Erro", color: "bg-red-100 text-red-600" },
};

type ExtractedSubject = {
  name: string;
  semester: number;
  weeklyClasses: number;
  totalHours: number | null;
  isElective: boolean;
  isRemote: boolean;
  suggestedArea: string;
  syllabus: string | null;
  bibliography: string | null;
};

type ExtractedData = {
  courseName: string;
  courseType: string;
  campusName: string;
  duration: number;
  subjects: ExtractedSubject[];
};

type EditingSubject = ExtractedSubject & { _idx: number };

export default function PpcUploadPage() {
  const utils = trpc.useUtils();
  const { data: documents = [], isLoading } = trpc.ppc.list.useQuery();

  const uploadMutation = trpc.ppc.upload.useMutation({
    onSuccess: () => { utils.ppc.list.invalidate(); toast.success("PDF enviado com sucesso!"); setFile(null); },
    onError: (e) => toast.error(e.message),
  });

  const extractMutation = trpc.ppc.extract.useMutation({
    onSuccess: (data) => {
      utils.ppc.list.invalidate();
      const d = data.data as ExtractedData;
      toast.success(`Extração concluída! ${d.subjects?.length ?? 0} disciplinas encontradas.`);
      setEditedData(JSON.parse(JSON.stringify(d)));
      setShowReview(true);
    },
    onError: (e) => toast.error(`Erro na extração: ${e.message}`),
  });

  const applyMutation = trpc.ppc.applyExtraction.useMutation({
    onSuccess: () => {
      utils.ppc.list.invalidate();
      toast.success("Importação concluída! Campus, curso e disciplinas cadastrados com sucesso.");
      setShowReview(false);
      setEditedData(null);
      setApplyDocId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);
  const [applyDocId, setApplyDocId] = useState<number | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [editingSubject, setEditingSubject] = useState<EditingSubject | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (f: File) => {
    if (f.type !== "application/pdf") return toast.error("Apenas arquivos PDF são aceitos.");
    if (f.size > 20 * 1024 * 1024) return toast.error("Arquivo muito grande. Máximo 20MB.");
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadMutation.mutate({ fileName: file.name, fileBase64: base64, mimeType: "application/pdf" });
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = (doc: any) => {
    setApplyDocId(doc.id);
    extractMutation.mutate({ documentId: doc.id, fileUrl: doc.fileUrl });
  };

  const handleOpenReview = (doc: any) => {
    const d = (doc as any).extractedData as ExtractedData;
    if (!d) return toast.error("Dados de extração não encontrados.");
    setEditedData(JSON.parse(JSON.stringify(d)));
    setApplyDocId(doc.id);
    setShowReview(true);
  };

  const handleApply = () => {
    if (!applyDocId || !editedData) return;
    applyMutation.mutate({
      documentId: applyDocId,
      campusName: editedData.campusName,
      courseName: editedData.courseName,
      courseType: editedData.courseType,
      duration: editedData.duration,
      subjects: editedData.subjects,
    });
  };

  const updateEditedField = (field: keyof ExtractedData, value: any) => {
    if (!editedData) return;
    setEditedData({ ...editedData, [field]: value });
  };

  const openSubjectEdit = (idx: number) => {
    if (!editedData) return;
    setEditingSubject({ ...editedData.subjects[idx], _idx: idx });
  };

  const saveSubjectEdit = () => {
    if (!editingSubject || !editedData) return;
    const newSubjects = [...editedData.subjects];
    const { _idx, ...subjectData } = editingSubject;
    newSubjects[_idx] = subjectData;
    setEditedData({ ...editedData, subjects: newSubjects });
    setEditingSubject(null);
  };

  const semesterGroups = editedData
    ? editedData.subjects.reduce((acc, s, idx) => {
        const sem = s.semester;
        if (!acc[sem]) acc[sem] = [];
        acc[sem].push({ ...s, _idx: idx });
        return acc;
      }, {} as Record<number, (ExtractedSubject & { _idx: number })[]>)
    : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload de PPC</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Envie um PDF de PPC — a IA extrai automaticamente curso, campus, disciplinas, ementas, referências e áreas de ensino
        </p>
      </div>

      {/* Upload Area */}
      <Card className="border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4 text-green-600" /> Enviar Documento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-green-300 hover:bg-green-50/50"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 text-green-600" />
                <p className="text-sm font-medium text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-10 h-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">Arraste o PDF aqui ou clique para selecionar</p>
                <p className="text-xs text-slate-400">Máximo 20MB · Apenas PDF</p>
              </div>
            )}
          </div>
          {file && (
            <Button className="mt-4 w-full bg-green-600 hover:bg-green-700" onClick={handleUpload} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : <><Upload className="w-4 h-4 mr-2" />Enviar PDF</>}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Como funciona */}
      <Card className="border-blue-100 bg-blue-50/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="w-full">
              <p className="text-sm font-semibold text-blue-900 mb-2">Como funciona a extração inteligente</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: <FileText className="w-4 h-4" />, title: "1. Upload do PDF", desc: "Envie o arquivo do PPC" },
                  { icon: <Sparkles className="w-4 h-4" />, title: "2. Extração por IA", desc: "A IA lê e extrai curso, campus, disciplinas, ementas, referências e sugere a área de ensino de cada disciplina automaticamente" },
                  { icon: <BookOpen className="w-4 h-4" />, title: "3. Revisão e Aplicação", desc: "Revise e edite tudo antes de importar. Campus e curso são criados automaticamente se não existirem" },
                ].map((step, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">{step.icon}<span className="text-xs font-semibold">{step.title}</span></div>
                    <p className="text-xs text-slate-600">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      <Card className="border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" /> Documentos Enviados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}</div>
          ) : documents.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">Nenhum documento enviado ainda</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const status = STATUS_LABELS[doc.status] ?? STATUS_LABELS.pending;
                const isExtracting = extractMutation.isPending && applyDocId === doc.id;
                return (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <FileText className="w-8 h-8 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{doc.fileName}</p>
                      <p className="text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <Badge className={`text-xs shrink-0 ${status.color}`}>{status.label}</Badge>
                    {doc.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => handleExtract(doc)} disabled={extractMutation.isPending} className="shrink-0">
                        {isExtracting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Sparkles className="w-3 h-3 mr-1" />Extrair com IA</>}
                      </Button>
                    )}
                    {doc.status === "extracted" && (
                      <Button size="sm" onClick={() => handleOpenReview(doc)} className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white">
                        <Pencil className="w-3 h-3 mr-1" />Revisar e Aplicar
                      </Button>
                    )}
                    {doc.status === "approved" && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Revisão Completa */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-green-600" />
              Revisar Dados Extraídos pela IA
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              Revise e edite todos os campos antes de importar. Campus e curso serão criados automaticamente se não existirem.
            </p>
          </DialogHeader>

          {editedData && (
            <ScrollArea className="flex-1 px-6 py-4">
              <Tabs defaultValue="info">
                <TabsList className="mb-4">
                  <TabsTrigger value="info" className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" />Informações do Curso
                  </TabsTrigger>
                  <TabsTrigger value="subjects" className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Disciplinas ({editedData.subjects.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">
                      Se o campus ou curso não existirem no sistema, serão <strong>criados automaticamente</strong> ao aplicar. Você poderá editar os dados depois.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-500" />Campus / Unidade</Label>
                      <Input value={editedData.campusName} onChange={(e) => updateEditedField("campusName", e.target.value)} placeholder="Nome do campus" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-slate-500" />Nome do Curso</Label>
                      <Input value={editedData.courseName} onChange={(e) => updateEditedField("courseName", e.target.value)} placeholder="Nome do curso" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tipo do Curso</Label>
                      <Select value={editedData.courseType} onValueChange={(v) => updateEditedField("courseType", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Técnico", "Subsequente", "Graduação", "FIC", "Pós-graduação"].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Duração (semestres)</Label>
                      <Input type="number" min={1} max={12} value={editedData.duration} onChange={(e) => updateEditedField("duration", Number(e.target.value))} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="subjects" className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                    <Tag className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-green-800">
                      A IA sugeriu automaticamente a <strong>área de ensino</strong> de cada disciplina. Clique em <strong>Editar</strong> para ajustar nome, ementa, referências ou área. Expanda para visualizar ementa e referências.
                    </p>
                  </div>
                  {Object.entries(semesterGroups)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([sem, subs]) => (
                      <div key={sem}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-px flex-1 bg-slate-200" />
                          <span className="text-xs font-bold text-slate-500 px-2">{sem}º SEMESTRE</span>
                          <div className="h-px flex-1 bg-slate-200" />
                        </div>
                        <div className="space-y-2">
                          {subs.map((s) => (
                            <div key={s._idx} className="border border-slate-100 rounded-lg bg-white overflow-hidden">
                              <div
                                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50"
                                onClick={() => setExpandedSubject(expandedSubject === s._idx ? null : s._idx)}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                    <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{s.weeklyClasses} aulas/sem</span>
                                    {s.totalHours && <span className="text-xs text-slate-500">{s.totalHours}h total</span>}
                                    {s.suggestedArea && s.suggestedArea !== "Não identificada" && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-700 border-green-200 bg-green-50">
                                        <Tag className="w-2.5 h-2.5 mr-1" />{s.suggestedArea}
                                      </Badge>
                                    )}
                                    {s.isElective && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-purple-600 border-purple-200">Optativa</Badge>}
                                    {s.isRemote && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-200">EaD</Badge>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); openSubjectEdit(s._idx); }}>
                                    <Pencil className="w-3 h-3 mr-1" />Editar
                                  </Button>
                                  {expandedSubject === s._idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                </div>
                              </div>
                              {expandedSubject === s._idx && (
                                <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-3 bg-slate-50">
                                  {s.syllabus ? (
                                    <div>
                                      <p className="text-xs font-semibold text-slate-600 mb-1">Ementa</p>
                                      <p className="text-xs text-slate-700 bg-white rounded p-2 border border-slate-100 whitespace-pre-wrap">{s.syllabus}</p>
                                    </div>
                                  ) : <p className="text-xs text-slate-400 italic">Ementa não extraída — clique em Editar para adicionar manualmente.</p>}
                                  {s.bibliography ? (
                                    <div>
                                      <p className="text-xs font-semibold text-slate-600 mb-1">Referências Bibliográficas</p>
                                      <p className="text-xs text-slate-700 bg-white rounded p-2 border border-slate-100 whitespace-pre-wrap">{s.bibliography}</p>
                                    </div>
                                  ) : <p className="text-xs text-slate-400 italic">Referências não extraídas — clique em Editar para adicionar manualmente.</p>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </TabsContent>
              </Tabs>
            </ScrollArea>
          )}

          <DialogFooter className="px-6 py-4 border-t bg-slate-50 rounded-b-lg">
            <Button variant="outline" onClick={() => setShowReview(false)}>Cancelar</Button>
            <Button onClick={handleApply} disabled={applyMutation.isPending} className="bg-green-600 hover:bg-green-700">
              {applyMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importando...</>
                : <><BookOpen className="w-4 h-4 mr-2" />Aplicar e Importar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Disciplina */}
      <Dialog open={!!editingSubject} onOpenChange={(open) => { if (!open) setEditingSubject(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-green-600" />Editar Disciplina
            </DialogTitle>
          </DialogHeader>
          {editingSubject && (
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-2">
                <div className="space-y-1.5">
                  <Label>Nome da Disciplina *</Label>
                  <Input value={editingSubject.name} onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Semestre</Label>
                    <Input type="number" min={1} max={12} value={editingSubject.semester} onChange={(e) => setEditingSubject({ ...editingSubject, semester: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Aulas/Semana</Label>
                    <Input type="number" min={1} value={editingSubject.weeklyClasses} onChange={(e) => setEditingSubject({ ...editingSubject, weeklyClasses: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Carga Horária (h)</Label>
                    <Input type="number" min={0} value={editingSubject.totalHours ?? ""} onChange={(e) => setEditingSubject({ ...editingSubject, totalHours: e.target.value ? Number(e.target.value) : null })} placeholder="Ex: 80" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-slate-500" />Área de Ensino</Label>
                  <Input value={editingSubject.suggestedArea} onChange={(e) => setEditingSubject({ ...editingSubject, suggestedArea: e.target.value })} placeholder="Ex: Matemática, Informática, Língua Portuguesa..." />
                  <p className="text-xs text-slate-400">Se a área não existir, será criada automaticamente ao aplicar.</p>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editingSubject.isElective} onChange={(e) => setEditingSubject({ ...editingSubject, isElective: e.target.checked })} className="rounded" />
                    <span className="text-sm text-slate-700">Disciplina Optativa/Eletiva</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editingSubject.isRemote} onChange={(e) => setEditingSubject({ ...editingSubject, isRemote: e.target.checked })} className="rounded" />
                    <span className="text-sm text-slate-700">Modalidade EaD/Remota</span>
                  </label>
                </div>
                <div className="space-y-1.5">
                  <Label>Ementa</Label>
                  <Textarea value={editingSubject.syllabus ?? ""} onChange={(e) => setEditingSubject({ ...editingSubject, syllabus: e.target.value || null })} placeholder="Descreva os conteúdos da disciplina..." rows={5} className="resize-none" />
                </div>
                <div className="space-y-1.5">
                  <Label>Referências Bibliográficas</Label>
                  <Textarea value={editingSubject.bibliography ?? ""} onChange={(e) => setEditingSubject({ ...editingSubject, bibliography: e.target.value || null })} placeholder="Liste as referências básicas e complementares..." rows={5} className="resize-none" />
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditingSubject(null)}><X className="w-4 h-4 mr-2" />Cancelar</Button>
            <Button onClick={saveSubjectEdit} className="bg-green-600 hover:bg-green-700"><Check className="w-4 h-4 mr-2" />Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
