import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, Loader2, Sparkles, BookOpen, Clock, Pencil, Check, X, ChevronDown, ChevronUp, Building2, GraduationCap, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "Pendente", bg: "rgba(107,95,160,0.15)", fg: "#9e9ab8" },
  processing: { label: "Processando", bg: "rgba(41,182,212,0.15)", fg: "#29b6d4" },
  extracted: { label: "Extraido", bg: "rgba(212,160,23,0.15)", fg: "#f0c040" },
  approved: { label: "Aplicado", bg: "rgba(41,182,100,0.15)", fg: "#4ade80" },
  rejected: { label: "Erro", bg: "rgba(239,68,68,0.15)", fg: "#f87171" },
};

type ExtractedSubject = {
  name: string; semester: number; weeklyClasses: number;
  totalHours: number | null; isElective: boolean; isRemote: boolean;
  suggestedArea: string; syllabus: string | null; bibliography: string | null;
};

type ExtractedData = {
  courseName: string; courseType: string; campusName: string;
  duration: number; subjects: ExtractedSubject[];
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
    onSuccess: () => { utils.ppc.list.invalidate(); toast.success("PDF enviado!"); setFile(null); },
    onError: e => toast.error(e.message),
  });

  const extractMutation = trpc.ppc.extract.useMutation({
    onSuccess: data => {
      utils.ppc.list.invalidate();
      const d = data.data as ExtractedData;
      const selectedCampus = (campuses as any[]).find((c: any) => c.id === selectedCampusId);
      if (selectedCampus) d.campusName = selectedCampus.name;
      toast.success(`Extracao concluida! ${d.subjects?.length ?? 0} disciplinas encontradas.`);
      setEditedData(JSON.parse(JSON.stringify(d)));
      const selected = new Set<number>();
      d.subjects.forEach((_, i) => selected.add(i));
      setSelectedSubjects(selected);
      setShowReview(true);
    },
    onError: e => toast.error(`Erro na extracao: ${e.message}`),
  });

  const applyMutation = trpc.ppc.applyExtraction.useMutation({
    onSuccess: () => {
      utils.ppc.list.invalidate();
      toast.success("Importacao concluida!");
      setShowReview(false); setEditedData(null); setApplyDocId(null); setSelectedSubjects(new Set());
    },
    onError: e => toast.error(e.message),
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

  const handleDropZoneKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileRef.current?.click(); }
  };

  const handleFileSelect = (f: File) => {
    if (f.type !== "application/pdf") return toast.error("Apenas arquivos PDF sao aceitos.");
    if (f.size > 20 * 1024 * 1024) return toast.error("Arquivo muito grande. Maximo 20MB.");
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadMutation.mutate({ fileName: file.name, fileBase64: base64, mimeType: "application/pdf" });
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = (doc: any) => {
    if (!selectedCampusId) return toast.error("Selecione o campus antes de extrair.");
    setApplyDocId(doc.id);
    extractMutation.mutate({ documentId: doc.id, fileUrl: doc.fileUrl, campusId: selectedCampusId });
  };

  const handleOpenReview = (doc: any) => {
    const d = (doc as any).extractedData as ExtractedData;
    if (!d) return toast.error("Dados de extracao nao encontrados.");
    setEditedData(JSON.parse(JSON.stringify(d)));
    setApplyDocId(doc.id);
    const selected = new Set<number>();
    d.subjects.forEach((_, i) => selected.add(i));
    setSelectedSubjects(selected);
    setShowReview(true);
  };

  const handleApply = () => {
    if (!applyDocId || !editedData) return;
    if (!selectedCampusId) return toast.error("Campus nao selecionado.");
    const filteredSubjects = editedData.subjects.filter((_, i) => selectedSubjects.has(i));
    if (filteredSubjects.length === 0) return toast.error("Selecione ao menos uma disciplina.");
    applyMutation.mutate({ documentId: applyDocId, campusId: selectedCampusId, courseName: editedData.courseName, courseType: editedData.courseType, duration: editedData.duration, subjects: filteredSubjects });
  };

  const toggleSubject = (idx: number) => { const next = new Set(selectedSubjects); if (next.has(idx)) next.delete(idx); else next.add(idx); setSelectedSubjects(next); };

  const toggleAll = () => {
    if (!editedData) return;
    if (selectedSubjects.size === editedData.subjects.length) { setSelectedSubjects(new Set()); }
    else { const all = new Set<number>(); editedData.subjects.forEach((_, i) => all.add(i)); setSelectedSubjects(all); }
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
    const newSelected = new Set<number>();
    let offset = 0;
    for (let i = 0; i < editedData.subjects.length; i++) {
      if (i === idx) { offset = 1; continue; }
      if (selectedSubjects.has(i)) newSelected.add(i - offset);
    }
    setSelectedSubjects(newSelected);
    setExpandedSubject(null); setEditingIdx(null);
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
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.04em" }}>Upload de PPC</h1>
        <p className="mt-1 text-sm" style={{ color: "#9e9ab8" }}>Envie um PDF de PPC para extrair curso, campus, disciplinas e areas com IA.</p>
      </div>

      {/* Campus */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[rgba(107,95,160,0.25)] p-4 shadow-sm" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}>
        <Building2 className="h-5 w-5 shrink-0" style={{ color: "#8b7ec0" }} />
        <div className="flex-1">
          <Label className="mb-1.5 block text-sm font-semibold" style={{ color: "#c8c4e0" }}>Campus do PPC *</Label>
          <Select value={selectedCampusId ? String(selectedCampusId) : ""} onValueChange={v => setSelectedCampusId(Number(v))}>
            <SelectTrigger className="max-w-sm"><SelectValue placeholder="Selecione o campus..." /></SelectTrigger>
            <SelectContent>{(campuses as any[]).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {selectedCampusId && (
          <Badge variant="outline" className={campusAreas.length > 0 ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
            {campusAreas.length > 0 ? `${campusAreas.length} areas vinculadas` : "Nenhuma area vinculada"}
          </Badge>
        )}
      </div>

      {/* Upload */}
      <div className="rounded-xl p-5 shadow-sm" style={{ background: "linear-gradient(135deg, rgba(19,19,42,0.97), rgba(26,26,53,0.97))", border: "1px solid rgba(107,95,160,0.22)" }}>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold" style={{ color: "#e8e6f0", fontFamily: "'Rajdhani', sans-serif" }}>
          <Upload className="h-4 w-4" style={{ color: "#4ade80" }} /> Enviar Documento
        </h2>
        <div
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${isDragging ? "border-green-400 bg-green-50" : "border-[rgba(107,95,160,0.25)] hover:border-green-300 hover:bg-green-50/50"}`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
          onClick={() => fileRef.current?.click()}
          onKeyDown={handleDropZoneKeyDown}
          role="button" tabIndex={0} aria-label="Selecionar arquivo PDF"
        >
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-10 w-10 text-green-600" />
              <p className="text-sm font-medium" style={{ color: "#e8e6f0" }}>{file.name}</p>
              <p className="text-xs" style={{ color: "#9e9ab8" }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10" style={{ color: "#6b5fa0" }} />
              <p className="text-sm font-medium" style={{ color: "#c8c4e0" }}>Arraste o PDF aqui ou clique para selecionar</p>
              <p className="text-xs" style={{ color: "#6a6685" }}>Maximo 20MB · Apenas PDF</p>
            </div>
          )}
        </div>
        {file && (
          <Button className="mt-4 w-full bg-green-600 hover:bg-green-700" onClick={handleUpload} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : <><Upload className="mr-2 h-4 w-4" />Enviar PDF</>}
          </Button>
        )}
      </div>

      {/* Lista de documentos */}
      <div className="rounded-xl p-5 shadow-sm" style={{ background: "linear-gradient(135deg, rgba(19,19,42,0.97), rgba(26,26,53,0.97))", border: "1px solid rgba(107,95,160,0.22)" }}>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold" style={{ color: "#e8e6f0", fontFamily: "'Rajdhani', sans-serif" }}>
          <FileText className="h-4 w-4" style={{ color: "#8b7ec0" }} /> Documentos Enviados
        </h2>
        {isLoading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="animate-pulse rounded-lg" style={{ background: "rgba(26,26,53,0.8)", height: "inherit" }} />)}</div>
        ) : documents.length === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: "#6a6685" }}>Nenhum documento enviado ainda</p>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => {
              const status = STATUS_LABELS[doc.status] ?? STATUS_LABELS.pending;
              const isExtracting = extractMutation.isPending && applyDocId === doc.id;
              return (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg p-3" style={{ background: "rgba(26,26,53,0.8)", border: "1px solid rgba(107,95,160,0.18)" }}>
                  <FileText className="h-8 w-8 shrink-0" style={{ color: "#8b7ec0" }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: "#e8e6f0" }}>{doc.fileName}</p>
                    <p className="text-xs" style={{ color: "#9e9ab8" }}>{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Badge className="shrink-0 text-xs" style={{ background: status.bg, color: status.fg, border: `1px solid ${status.fg}40` }}>{status.label}</Badge>
                  {doc.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => handleExtract(doc)} disabled={extractMutation.isPending} className="shrink-0">
                      {isExtracting ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Sparkles className="mr-1 h-3 w-3" />Extrair com IA</>}
                    </Button>
                  )}
                  {doc.status === "extracted" && (
                    <Button size="sm" onClick={() => handleOpenReview(doc)} className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white">
                      <Pencil className="mr-1 h-3 w-3" />Revisar
                    </Button>
                  )}
                  {doc.status === "approved" && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Revisao */}
      {showReview && editedData && (
        <div className="rounded-xl border border-green-200 bg-green-50/30 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-green-800">
              <Sparkles className="h-5 w-5" /> Revisao dos Dados Extraidos
            </h2>
            <Button variant="ghost" size="sm" onClick={() => { setShowReview(false); setEditedData(null); }}>
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
          </div>
          <p className="mb-4 text-sm" style={{ color: "#c8c4e0" }}>Revise as informacoes extraidas pela IA. Marque/desmarque disciplinas e edite os campos antes de importar.</p>

          <div className="space-y-4">
            {/* Dados do curso */}
            <div className="rounded-lg border border-[rgba(107,95,160,0.25)] p-4 space-y-3" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}>
              <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: "#e8e6f0" }}><GraduationCap className="h-4 w-4" style={{ color: "#4ade80" }} />Informacoes do Curso</h3>
              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p className="text-xs text-blue-800">O <strong>campus foi definido por voce</strong> e nao pode ser alterado. Se o curso nao existir, sera <strong>criado automaticamente</strong>.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: "#9e9ab8" }}>Campus</Label>
                  <Input value={(campuses as any[]).find((c: any) => c.id === selectedCampusId)?.name ?? editedData.campusName} readOnly className="h-9 cursor-not-allowed border-green-200 bg-green-50 font-medium text-green-800" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: "#9e9ab8" }}>Curso</Label>
                  <Input value={editedData.courseName} onChange={e => setEditedData({ ...editedData, courseName: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: "#9e9ab8" }}>Tipo</Label>
                  <Select value={editedData.courseType} onValueChange={v => setEditedData({ ...editedData, courseType: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Tecnico", "Subsequente", "Graduacao", "FIC", "Pos-graduacao"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: "#9e9ab8" }}>Duracao (sem.)</Label>
                  <Input type="number" min={1} max={12} value={editedData.duration} onChange={e => setEditedData({ ...editedData, duration: Number(e.target.value) })} className="h-9" />
                </div>
              </div>
            </div>

            {/* Disciplinas */}
            <div className="rounded-lg border border-[rgba(107,95,160,0.25)] p-4 space-y-3" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: "#e8e6f0" }}><BookOpen className="h-4 w-4" style={{ color: "#4ade80" }} />Disciplinas Extraidas</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "#9e9ab8" }}>{selectedSubjects.size} de {editedData.subjects.length} selecionadas</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={toggleAll}>
                    {selectedSubjects.size === editedData.subjects.length ? "Desmarcar Todas" : "Selecionar Todas"}
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[400px] pr-2">
                <div className="space-y-4">
                  {Object.entries(semesterGroups).sort(([a], [b]) => Number(a) - Number(b)).map(([sem, subs]) => (
                    <div key={sem}>
                      <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 py-1" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}>
                        <div className="h-px flex-1" style={{ background: "rgba(107,95,160,0.2)" }} />
                        <span className="bg-white px-2 text-xs font-bold text-slate-500">{sem}o SEMESTRE</span>
                        <div className="h-px flex-1" style={{ background: "rgba(107,95,160,0.2)" }} />
                      </div>
                      <div className="space-y-1">
                        {subs.map(s => {
                          const isSelected = selectedSubjects.has(s._idx);
                          const isEditing = editingIdx === s._idx;
                          const isExpanded = expandedSubject === s._idx;
                          return (
                            <div key={s._idx} className={`overflow-hidden rounded-lg border transition-all ${isSelected ? "border-green-200 bg-green-50/50" : "border-[rgba(107,95,160,0.18)] bg-slate-50/50 opacity-60"}`}>
                              <div className="flex items-center gap-3 px-3 py-2.5">
                                <Checkbox checked={isSelected} onCheckedChange={() => toggleSubject(s._idx)} className="shrink-0" />
                                <div className="min-w-0 flex-1 cursor-pointer" role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedSubject(isExpanded ? null : s._idx); } }} onClick={() => setExpandedSubject(isExpanded ? null : s._idx)}>
                                  <p className={`text-sm font-medium ${isSelected ? "text-slate-800" : "text-slate-500 line-through"}`}>{s.name}</p>
                                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                    <span className="flex items-center gap-0.5 text-[11px] text-slate-500"><Clock className="h-3 w-3" />{s.weeklyClasses} aulas/sem</span>
                                    {s.totalHours && <span className="text-[11px] text-slate-500">{s.totalHours}h</span>}
                                    {s.suggestedArea && s.suggestedArea !== "Nao identificada" ? (
                                      <Badge variant="outline" className="border-green-200 bg-green-50 px-1.5 py-0 text-[10px] text-green-700">{s.suggestedArea}</Badge>
                                    ) : (
                                      <Badge variant="outline" className="border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-600">Sem area</Badge>
                                    )}
                                    {s.isElective && <Badge variant="outline" className="border-purple-200 px-1.5 py-0 text-[10px] text-purple-600">Optativa</Badge>}
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" style={{ color: "#6a6685" }} onClick={() => setEditingIdx(isEditing ? null : s._idx)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" style={{ color: "#6a6685" }} onClick={() => removeSubject(s._idx)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <button onClick={() => setExpandedSubject(isExpanded ? null : s._idx)} className="p-1 text-slate-400 hover:text-slate-700">
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                              {isEditing && (
                                <div className="space-y-3 border-t border-[rgba(107,95,160,0.18)] px-3 pb-3 pt-2" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}>
                                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    <div className="space-y-1"><Label className="text-[11px] text-slate-500">Nome</Label><Input value={s.name} onChange={e => updateSubjectField(s._idx, "name", e.target.value)} className="h-8 text-sm" /></div>
                                    <div className="space-y-1"><Label className="text-[11px] text-slate-500">Semestre</Label><Input type="number" min={1} max={12} value={s.semester} onChange={e => updateSubjectField(s._idx, "semester", Number(e.target.value))} className="h-8 text-sm" /></div>
                                    <div className="space-y-1"><Label className="text-[11px] text-slate-500">Aulas/sem</Label><Input type="number" min={1} value={s.weeklyClasses} onChange={e => updateSubjectField(s._idx, "weeklyClasses", Number(e.target.value))} className="h-8 text-sm" /></div>
                                    <div className="space-y-1"><Label className="text-[11px] text-slate-500">Carga (h)</Label><Input type="number" min={0} value={s.totalHours ?? ""} onChange={e => updateSubjectField(s._idx, "totalHours", e.target.value ? Number(e.target.value) : null)} className="h-8 text-sm" placeholder="h" /></div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[11px] text-slate-500">Area de Ensino</Label>
                                    {campusAreas.length > 0 ? (
                                      <Select value={s.suggestedArea || "__none__"} onValueChange={v => updateSubjectField(s._idx, "suggestedArea", v === "__none__" ? "" : v)}>
                                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="__none__">Sem area definida</SelectItem>
                                          {(campusAreas as any[]).map((a: any) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input value={s.suggestedArea} onChange={e => updateSubjectField(s._idx, "suggestedArea", e.target.value)} className="h-8 text-sm" placeholder="Sem areas vinculadas ao campus" />
                                    )}
                                  </div>
                                  <div className="flex gap-3">
                                    <label className="flex cursor-pointer items-center gap-1.5 text-xs"><input type="checkbox" checked={s.isElective} onChange={e => updateSubjectField(s._idx, "isElective", e.target.checked)} className="rounded" />Optativa</label>
                                    <label className="flex cursor-pointer items-center gap-1.5 text-xs"><input type="checkbox" checked={s.isRemote} onChange={e => updateSubjectField(s._idx, "isRemote", e.target.checked)} className="rounded" />EaD</label>
                                  </div>
                                  <div className="space-y-1"><Label className="text-[11px] text-slate-500">Ementa</Label><Textarea value={s.syllabus ?? ""} onChange={e => updateSubjectField(s._idx, "syllabus", e.target.value || null)} rows={3} className="resize-none text-xs" /></div>
                                  <div className="space-y-1"><Label className="text-[11px] text-slate-500">Referencias</Label><Textarea value={s.bibliography ?? ""} onChange={e => updateSubjectField(s._idx, "bibliography", e.target.value || null)} rows={3} className="resize-none text-xs" /></div>
                                  <div className="flex justify-end">
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingIdx(null)}><Check className="mr-1 h-3 w-3" />Fechar</Button>
                                  </div>
                                </div>
                              )}
                              {isExpanded && !isEditing && (
                                <div className="space-y-2 border-t border-[rgba(107,95,160,0.18)] bg-slate-50/50 px-3 pb-3 pt-2">
                                  {s.syllabus ? <div><p className="mb-0.5 text-[11px] font-semibold text-slate-500">Ementa</p><p className="whitespace-pre-wrap rounded border border-[rgba(107,95,160,0.18)] p-2 text-xs text-slate-700" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}>{s.syllabus}</p></div> : <p className="text-xs italic text-slate-400">Ementa nao extraida</p>}
                                  {s.bibliography ? <div><p className="mb-0.5 text-[11px] font-semibold text-slate-500">Referencias</p><p className="whitespace-pre-wrap rounded border border-[rgba(107,95,160,0.18)] p-2 text-xs text-slate-700" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}>{s.bibliography}</p></div> : <p className="text-xs italic text-slate-400">Referencias nao extraidas</p>}
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

            {/* Botao aplicar */}
            <div className="flex items-center justify-between rounded-lg border border-green-200 p-4 shadow-lg" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}>
              <div className="text-sm" style={{ color: "#9e9ab8" }}>
                <strong className="text-green-700">{selectedSubjects.size}</strong> disciplinas selecionadas para importacao
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setShowReview(false); setEditedData(null); }}>Cancelar</Button>
                <Button onClick={handleApply} disabled={applyMutation.isPending || selectedSubjects.size === 0} className="bg-green-600 hover:bg-green-700">
                  {applyMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importando...</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Importar {selectedSubjects.size} Disciplinas</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
