import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload, FileText, Loader2, Sparkles, BookOpen, Clock,
  Pencil, Check, X, ChevronDown, ChevronUp, Building2, GraduationCap,
  AlertCircle, CheckCircle2, Tag, Trash2
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

export default function PpcUploadPage() {
  const utils = trpc.useUtils();
  const { data: documents = [], isLoading } = trpc.ppc.list.useQuery();
  const { data: campuses = [] } = trpc.campus.list.useQuery();
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(null);
  const { data: campusAreas = [] } = trpc.campus.getAreas.useQuery(
    { campusId: selectedCampusId ?? 0 },
    { enabled: !!selectedCampusId }
  );

  const uploadMutation = trpc.ppc.upload.useMutation({
    onSuccess: () => { utils.ppc.list.invalidate(); toast.success("PDF enviado com sucesso!"); setFile(null); },
    onError: (e) => toast.error(e.message),
  });

  const extractMutation = trpc.ppc.extract.useMutation({
    onSuccess: (data) => {
      utils.ppc.list.invalidate();
      const d = data.data as ExtractedData;
      // Campus selecionado pelo usuário é sempre preservado
      const selectedCampus = (campuses as any[]).find((c: any) => c.id === selectedCampusId);
      if (selectedCampus) {
        d.campusName = selectedCampus.name;
      }
      toast.success(`Extração concluída! ${d.subjects?.length ?? 0} disciplinas encontradas.`);
      setEditedData(JSON.parse(JSON.stringify(d)));
      // Marcar todas as disciplinas como selecionadas por padrão
      const selected = new Set<number>();
      d.subjects.forEach((_, i) => selected.add(i));
      setSelectedSubjects(selected);
      setShowReview(true);
    },
    onError: (e) => toast.error(`Erro na extração: ${e.message}`),
  });

  const applyMutation = trpc.ppc.applyExtraction.useMutation({
    onSuccess: () => {
      utils.ppc.list.invalidate();
      toast.success("Importação concluída! Campus, curso e disciplinas cadastrados.");
      setShowReview(false);
      setEditedData(null);
      setApplyDocId(null);
      setSelectedSubjects(new Set());
    },
    onError: (e) => toast.error(e.message),
  });

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);
  const [applyDocId, setApplyDocId] = useState<number | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<number>>(new Set());
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
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
    if (!selectedCampusId) {
      toast.error("Selecione o campus antes de extrair.");
      return;
    }
    setApplyDocId(doc.id);
    extractMutation.mutate({ documentId: doc.id, fileUrl: doc.fileUrl, campusId: selectedCampusId });
  };

  const handleOpenReview = (doc: any) => {
    const d = (doc as any).extractedData as ExtractedData;
    if (!d) return toast.error("Dados de extração não encontrados.");
    setEditedData(JSON.parse(JSON.stringify(d)));
    setApplyDocId(doc.id);
    const selected = new Set<number>();
    d.subjects.forEach((_, i) => selected.add(i));
    setSelectedSubjects(selected);
    setShowReview(true);
  };

  const handleApply = () => {
    if (!applyDocId || !editedData) return;
    if (!selectedCampusId) return toast.error("Campus não selecionado. Volte e selecione o campus.");
    // Filtrar apenas as disciplinas selecionadas
    const filteredSubjects = editedData.subjects.filter((_, i) => selectedSubjects.has(i));
    if (filteredSubjects.length === 0) return toast.error("Selecione ao menos uma disciplina para importar.");
    applyMutation.mutate({
      documentId: applyDocId,
      // Campus é imutável: usa sempre o campusId definido pelo usuário
      campusId: selectedCampusId,
      courseName: editedData.courseName,
      courseType: editedData.courseType,
      duration: editedData.duration,
      subjects: filteredSubjects,
    });
  };

  const toggleSubject = (idx: number) => {
    const next = new Set(selectedSubjects);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setSelectedSubjects(next);
  };

  const toggleAll = () => {
    if (!editedData) return;
    if (selectedSubjects.size === editedData.subjects.length) {
      setSelectedSubjects(new Set());
    } else {
      const all = new Set<number>();
      editedData.subjects.forEach((_, i) => all.add(i));
      setSelectedSubjects(all);
    }
  };

  const updateSubjectField = (idx: number, field: keyof ExtractedSubject, value: any) => {
    if (!editedData) return;
    const newSubjects = [...editedData.subjects];
    newSubjects[idx] = { ...newSubjects[idx], [field]: value };
    setEditedData({ ...editedData, subjects: newSubjects });
  };

  const removeSubject = (idx: number) => {
    if (!editedData) return;
    const newSubjects = editedData.subjects.filter((_, i) => i !== idx);
    setEditedData({ ...editedData, subjects: newSubjects });
    // Recalcular seleção
    const newSelected = new Set<number>();
    let offset = 0;
    for (let i = 0; i < editedData.subjects.length; i++) {
      if (i === idx) { offset = 1; continue; }
      if (selectedSubjects.has(i)) newSelected.add(i - offset);
    }
    setSelectedSubjects(newSelected);
    setExpandedSubject(null);
    setEditingIdx(null);
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
    <div className="space-y-4 p-3 md:p-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Upload de PPC</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Envie um PDF de PPC — a IA extrai automaticamente curso, campus, disciplinas, ementas, referências e áreas de ensino
        </p>
      </div>

      {/* Seleção de Campus */}
      <Card className="border-slate-100">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-slate-500 shrink-0" />
            <div className="flex-1">
              <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">Campus do PPC *</Label>
              <Select
                value={selectedCampusId ? String(selectedCampusId) : ""}
                onValueChange={(v) => setSelectedCampusId(Number(v))}
              >
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Selecione o campus..." />
                </SelectTrigger>
                <SelectContent>
                  {(campuses as any[]).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCampusId && campusAreas.length > 0 && (
              <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50 shrink-0">
                {campusAreas.length} áreas vinculadas
              </Badge>
            )}
            {selectedCampusId && campusAreas.length === 0 && (
              <Badge variant="outline" className="text-xs text-amber-700 border-amber-200 bg-amber-50 shrink-0">
                Nenhuma área vinculada
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

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
                        <Pencil className="w-3 h-3 mr-1" />Revisar
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

      {/* ===== REVISÃO INLINE (CHECKLIST) ===== */}
      {showReview && editedData && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-green-800">
                <Sparkles className="w-5 h-5" /> Revisão dos Dados Extraídos
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setShowReview(false); setEditedData(null); }}>
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Revise as informações extraídas pela IA. Marque/desmarque disciplinas e edite os campos necessários antes de importar.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Informações do Curso */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-green-600" /> Informações do Curso
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800">
                  O <strong>campus foi definido por você</strong> e não pode ser alterado. Se o curso não existir no sistema, será <strong>criado automaticamente</strong> ao aplicar.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Campus</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={(campuses as any[]).find((c: any) => c.id === selectedCampusId)?.name ?? editedData.campusName}
                      readOnly
                      className="h-9 bg-green-50 text-green-800 cursor-not-allowed font-medium border-green-200"
                    />
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-700 border-green-200 bg-green-50 shrink-0 whitespace-nowrap">Definido por você</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Curso</Label>
                  <Input value={editedData.courseName} onChange={(e) => setEditedData({ ...editedData, courseName: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Tipo</Label>
                  <Select value={editedData.courseType} onValueChange={(v) => setEditedData({ ...editedData, courseType: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Técnico", "Subsequente", "Graduação", "FIC", "Pós-graduação"].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Duração (sem.)</Label>
                  <Input type="number" min={1} max={12} value={editedData.duration} onChange={(e) => setEditedData({ ...editedData, duration: Number(e.target.value) })} className="h-9" />
                </div>
              </div>
            </div>

            {/* Checklist de Disciplinas */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-green-600" /> Disciplinas Extraídas
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {selectedSubjects.size} de {editedData.subjects.length} selecionadas
                  </span>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={toggleAll}>
                    {selectedSubjects.size === editedData.subjects.length ? "Desmarcar Todas" : "Selecionar Todas"}
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[420px] pr-2" style={{ height: "420px", overflowY: "auto" }}>
                <div className="space-y-4">
                  {Object.entries(semesterGroups)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([sem, subs]) => (
                      <div key={sem}>
                        <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white z-10 py-1">
                          <div className="h-px flex-1 bg-slate-200" />
                          <span className="text-xs font-bold text-slate-500 bg-white px-2">{sem}º SEMESTRE</span>
                          <div className="h-px flex-1 bg-slate-200" />
                        </div>
                        <div className="space-y-1">
                          {subs.map((s) => {
                            const isSelected = selectedSubjects.has(s._idx);
                            const isEditing = editingIdx === s._idx;
                            const isExpanded = expandedSubject === s._idx;
                            return (
                              <div key={s._idx} className={`rounded-lg border transition-all ${isSelected ? "border-green-200 bg-green-50/50" : "border-slate-100 bg-slate-50/50 opacity-60"}`}>
                                {/* Linha principal: checkbox + nome + badges + ações */}
                                <div className="flex items-center gap-3 px-3 py-2.5">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSubject(s._idx)}
                                    className="shrink-0"
                                  />
                                  <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => setExpandedSubject(isExpanded ? null : s._idx)}
                                  >
                                    <p className={`text-sm font-medium ${isSelected ? "text-slate-800" : "text-slate-500 line-through"}`}>
                                      {s.name}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                      <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                                        <Clock className="w-3 h-3" />{s.weeklyClasses} aulas/sem
                                      </span>
                                      {s.totalHours && <span className="text-[11px] text-slate-500">{s.totalHours}h</span>}
                                      {s.suggestedArea && s.suggestedArea !== "Não identificada" && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-700 border-green-200 bg-green-50">
                                          {s.suggestedArea}
                                        </Badge>
                                      )}
                                      {(!s.suggestedArea || s.suggestedArea === "Não identificada") && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-200 bg-amber-50">
                                          Sem área
                                        </Badge>
                                      )}
                                      {s.isElective && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-purple-600 border-purple-200">Optativa</Badge>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => setEditingIdx(isEditing ? null : s._idx)}>
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={() => removeSubject(s._idx)}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <button onClick={() => setExpandedSubject(isExpanded ? null : s._idx)} className="text-slate-400 hover:text-slate-600 p-1">
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </div>

                                {/* Edição inline */}
                                {isEditing && (
                                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-white space-y-3">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-[11px] text-slate-500">Nome</Label>
                                        <Input value={s.name} onChange={(e) => updateSubjectField(s._idx, "name", e.target.value)} className="h-8 text-sm" />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[11px] text-slate-500">Semestre</Label>
                                        <Input type="number" min={1} max={12} value={s.semester} onChange={(e) => updateSubjectField(s._idx, "semester", Number(e.target.value))} className="h-8 text-sm" />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[11px] text-slate-500">Aulas/sem</Label>
                                        <Input type="number" min={1} value={s.weeklyClasses} onChange={(e) => updateSubjectField(s._idx, "weeklyClasses", Number(e.target.value))} className="h-8 text-sm" />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[11px] text-slate-500">Carga Horária</Label>
                                        <Input type="number" min={0} value={s.totalHours ?? ""} onChange={(e) => updateSubjectField(s._idx, "totalHours", e.target.value ? Number(e.target.value) : null)} className="h-8 text-sm" placeholder="h" />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[11px] text-slate-500">Área de Ensino</Label>
                                      {campusAreas.length > 0 ? (
                                        <Select
                                          value={s.suggestedArea || "__none__"}
                                          onValueChange={(v) => updateSubjectField(s._idx, "suggestedArea", v === "__none__" ? "" : v)}
                                        >
                                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="__none__">Sem área definida</SelectItem>
                                            {(campusAreas as any[]).map((a: any) => (
                                              <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Input value={s.suggestedArea} onChange={(e) => updateSubjectField(s._idx, "suggestedArea", e.target.value)} className="h-8 text-sm" placeholder="Sem áreas vinculadas ao campus" />
                                      )}
                                    </div>
                                    <div className="flex gap-3">
                                      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                                        <input type="checkbox" checked={s.isElective} onChange={(e) => updateSubjectField(s._idx, "isElective", e.target.checked)} className="rounded" />
                                        Optativa
                                      </label>
                                      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                                        <input type="checkbox" checked={s.isRemote} onChange={(e) => updateSubjectField(s._idx, "isRemote", e.target.checked)} className="rounded" />
                                        EaD
                                      </label>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[11px] text-slate-500">Ementa</Label>
                                      <Textarea value={s.syllabus ?? ""} onChange={(e) => updateSubjectField(s._idx, "syllabus", e.target.value || null)} rows={3} className="text-xs resize-none" />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[11px] text-slate-500">Referências Bibliográficas</Label>
                                      <Textarea value={s.bibliography ?? ""} onChange={(e) => updateSubjectField(s._idx, "bibliography", e.target.value || null)} rows={3} className="text-xs resize-none" />
                                    </div>
                                    <div className="flex justify-end">
                                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingIdx(null)}>
                                        <Check className="w-3 h-3 mr-1" /> Fechar Edição
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Expandir ementa/referências (somente visualização) */}
                                {isExpanded && !isEditing && (
                                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-2">
                                    {s.syllabus ? (
                                      <div>
                                        <p className="text-[11px] font-semibold text-slate-500 mb-0.5">Ementa</p>
                                        <p className="text-xs text-slate-700 bg-white rounded p-2 border border-slate-100 whitespace-pre-wrap">{s.syllabus}</p>
                                      </div>
                                    ) : <p className="text-xs text-slate-400 italic">Ementa não extraída</p>}
                                    {s.bibliography ? (
                                      <div>
                                        <p className="text-[11px] font-semibold text-slate-500 mb-0.5">Referências</p>
                                        <p className="text-xs text-slate-700 bg-white rounded p-2 border border-slate-100 whitespace-pre-wrap">{s.bibliography}</p>
                                      </div>
                                    ) : <p className="text-xs text-slate-400 italic">Referências não extraídas</p>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>

            {/* Botão de Aplicar — sticky para não sobrepor */}
            <div className="sticky bottom-0 z-20 flex items-center justify-between bg-white rounded-lg border border-green-200 shadow-lg p-4 mt-4">
              <div className="text-sm text-slate-600">
                <strong className="text-green-700">{selectedSubjects.size}</strong> disciplinas selecionadas para importação
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setShowReview(false); setEditedData(null); }}>
                  Cancelar
                </Button>
                <Button onClick={handleApply} disabled={applyMutation.isPending || selectedSubjects.size === 0} className="bg-green-600 hover:bg-green-700">
                  {applyMutation.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importando...</>
                    : <><CheckCircle2 className="w-4 h-4 mr-2" />Importar {selectedSubjects.size} Disciplinas</>}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
