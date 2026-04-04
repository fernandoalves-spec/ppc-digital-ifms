import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, CheckCircle, XCircle, Sparkles, BookOpen, Clock } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-slate-100 text-slate-600" },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-600" },
  extracted: { label: "Extraído", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Aplicado", color: "bg-green-100 text-green-700" },
  rejected: { label: "Erro", color: "bg-red-100 text-red-600" },
};

export default function PpcUploadPage() {
  const utils = trpc.useUtils();
  const { data: documents = [], isLoading } = trpc.ppc.list.useQuery();
  const { data: courses = [] } = trpc.courses.list.useQuery({});
  const uploadMutation = trpc.ppc.upload.useMutation({
    onSuccess: () => { utils.ppc.list.invalidate(); toast.success("PDF enviado com sucesso!"); setFile(null); },
    onError: (e) => toast.error(e.message),
  });
  const extractMutation = trpc.ppc.extract.useMutation({
    onSuccess: (data) => {
      utils.ppc.list.invalidate();
      toast.success(`Extração concluída! ${data.data.subjects?.length ?? 0} disciplinas encontradas.`);
      setExtractedData(data.data);
    },
    onError: (e) => toast.error(`Erro na extração: ${e.message}`),
  });
  const applyMutation = trpc.ppc.applyExtraction.useMutation({
    onSuccess: () => { utils.ppc.list.invalidate(); toast.success("Disciplinas importadas com sucesso!"); setExtractedData(null); setSelectedCourseId(""); },
    onError: (e) => toast.error(e.message),
  });

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [applyDocId, setApplyDocId] = useState<number | null>(null);
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

  const handleApply = () => {
    if (!selectedCourseId || !applyDocId || !extractedData) return toast.error("Selecione um curso.");
    applyMutation.mutate({
      documentId: applyDocId,
      courseId: Number(selectedCourseId),
      subjects: extractedData.subjects,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload de PPC</h1>
        <p className="text-sm text-slate-500 mt-0.5">Envie um PDF de PPC e a IA extrairá automaticamente as disciplinas</p>
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
                <p className="font-semibold text-slate-800">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-10 h-10 text-slate-300" />
                <p className="font-medium text-slate-600">Arraste o PDF aqui ou clique para selecionar</p>
                <p className="text-sm text-slate-400">Apenas arquivos PDF, máximo 20MB</p>
              </div>
            )}
          </div>
          {file && (
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setFile(null)} className="flex-1">Cancelar</Button>
              <Button onClick={handleUpload} disabled={uploadMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700">
                {uploadMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : <><Upload className="w-4 h-4 mr-2" />Enviar PDF</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultado da Extração */}
      {extractedData && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-green-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Dados Extraídos pela IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-slate-500">Curso</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{extractedData.courseName}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-slate-500">Tipo</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{extractedData.courseType}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-slate-500">Campus</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{extractedData.campusName}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-slate-500">Disciplinas</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{extractedData.subjects?.length ?? 0}</p>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {extractedData.subjects?.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-green-100">
                  <span className="text-xs font-bold text-green-700 w-8 shrink-0">{s.semester}º</span>
                  <span className="text-sm text-slate-800 flex-1">{s.name}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{s.weeklyClasses}/sem</span>
                  {s.isRemote && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-200">EaD</Badge>}
                </div>
              ))}
            </div>
            <div className="flex items-end gap-3 pt-2 border-t border-green-200">
              <div className="flex-1 space-y-1.5">
                <Label>Vincular ao Curso *</Label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione o curso correspondente..." /></SelectTrigger>
                  <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleApply} disabled={!selectedCourseId || applyMutation.isPending} className="bg-green-600 hover:bg-green-700 shrink-0">
                {applyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><BookOpen className="w-4 h-4 mr-2" />Importar Disciplinas</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Documentos */}
      <Card className="border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" /> Documentos Enviados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}</div>
          ) : documents.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">Nenhum documento enviado ainda</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const status = STATUS_LABELS[doc.status] ?? STATUS_LABELS.pending;
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
                        {extractMutation.isPending && applyDocId === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Sparkles className="w-3 h-3 mr-1" />Extrair</>}
                      </Button>
                    )}
                    {doc.status === "extracted" && (
                      <Button size="sm" variant="outline" onClick={() => { setExtractedData((doc as any).extractedData); setApplyDocId(doc.id); }} className="shrink-0 text-amber-700 border-amber-300">
                        Aplicar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
