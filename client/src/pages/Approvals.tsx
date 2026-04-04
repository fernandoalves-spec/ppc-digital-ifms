import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ClipboardList, CheckCircle, Clock, XCircle, MessageSquare, Layers } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pendente", color: "bg-amber-100 text-amber-700", icon: Clock },
  responded: { label: "Respondido", color: "bg-blue-100 text-blue-700", icon: MessageSquare },
  approved: { label: "Aprovado", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Rejeitado", color: "bg-red-100 text-red-600", icon: XCircle },
};

export default function ApprovalsPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseForm, setResponseForm] = useState({ suggestedAreaId: "", coordinatorNotes: "" });

  const { data: requests = [], isLoading } = trpc.approval.list.useQuery(
    filterStatus !== "all" ? { status: filterStatus } : {}
  );
  const { data: areas = [] } = trpc.areas.list.useQuery();
  const { data: courses = [] } = trpc.courses.list.useQuery({});
  // subjects not needed here

  const respondMutation = trpc.approval.respond.useMutation({
    onSuccess: () => {
      utils.approval.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Resposta enviada com sucesso!");
      setRespondingId(null);
      setResponseForm({ suggestedAreaId: "", coordinatorNotes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleRespond = () => {
    if (!respondingId || !responseForm.suggestedAreaId) return toast.error("Selecione uma área.");
    respondMutation.mutate({
      id: respondingId,
      suggestedAreaId: Number(responseForm.suggestedAreaId),
      coordinatorNotes: responseForm.coordinatorNotes,
      status: "responded",
    });
  };

  const courseMap = new Map(courses.map((c) => [c.id, c.name]));
  const areaMap = new Map(areas.map((a) => [a.id, a]));
  const isCoordinator = user?.role === "coordinator";
  const isAdmin = user?.role === "admin";

  const filtered = filterStatus === "all" ? requests : requests.filter((r) => r.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Solicitações de Indicação</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isCoordinator ? "Solicitações para você indicar a área do docente" : "Fluxo de aprovação de áreas por disciplina"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {requests.filter((r) => r.status === "pending").length > 0 && (
            <Badge className="bg-red-100 text-red-700 text-xs">
              {requests.filter((r) => r.status === "pending").length} pendente(s)
            </Badge>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-48 bg-white">
          <SelectValue placeholder="Todos os status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma solicitação encontrada</p>
            {isAdmin && <p className="text-sm text-slate-400 mt-1">Vá ao detalhe de um curso e clique em "Solicitar Áreas"</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusCfg.icon;
            const suggestedArea = req.suggestedAreaId ? areaMap.get(req.suggestedAreaId) : null;

            return (
              <Card key={req.id} className="border-slate-100">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${statusCfg.color}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">Disciplina #{req.subjectId}</span>
                        <Badge className={`text-[10px] px-2 py-0 ${statusCfg.color}`}>{statusCfg.label}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Curso: {courseMap.get(req.courseId) ?? `#${req.courseId}`} •
                        Criado em {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                      {req.adminNotes && (
                        <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 rounded px-2 py-1">
                          <strong>Nota do admin:</strong> {req.adminNotes}
                        </p>
                      )}
                      {suggestedArea && (
                        <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: suggestedArea.color ?? "#3B82F6" }}>
                          <Layers className="w-3 h-3" />
                          <strong>Área indicada:</strong> {suggestedArea.name}
                        </p>
                      )}
                      {req.coordinatorNotes && (
                        <p className="text-xs text-slate-600 mt-1 bg-blue-50 rounded px-2 py-1">
                          <strong>Nota do coordenador:</strong> {req.coordinatorNotes}
                        </p>
                      )}
                    </div>
                    {(isCoordinator || isAdmin) && req.status === "pending" && (
                      <Button size="sm" onClick={() => setRespondingId(req.id)} className="shrink-0 bg-blue-600 hover:bg-blue-700">
                        Indicar Área
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={respondingId !== null} onOpenChange={(o) => { if (!o) { setRespondingId(null); setResponseForm({ suggestedAreaId: "", coordinatorNotes: "" }); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Indicar Área do Docente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">Selecione a área de ensino do docente responsável por esta disciplina.</p>
            <div className="space-y-1.5">
              <Label>Área de Ensino *</Label>
              <Select value={responseForm.suggestedAreaId} onValueChange={(v) => setResponseForm({ ...responseForm, suggestedAreaId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a área..." /></SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: a.color ?? "#3B82F6" }} />
                        {a.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observações (opcional)</Label>
              <Textarea
                placeholder="Adicione observações sobre a indicação..."
                value={responseForm.coordinatorNotes}
                onChange={(e) => setResponseForm({ ...responseForm, coordinatorNotes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingId(null)}>Cancelar</Button>
            <Button onClick={handleRespond} disabled={respondMutation.isPending || !responseForm.suggestedAreaId} className="bg-blue-600 hover:bg-blue-700">
              Confirmar Indicação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
