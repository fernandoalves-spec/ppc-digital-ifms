import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle, ClipboardList, Clock, Layers, MessageSquare, XCircle } from "lucide-react";
import { toast } from "sonner";

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
    filterStatus !== "all" ? { status: filterStatus } : {},
  );
  const { data: areas = [] } = trpc.areas.list.useQuery();
  const { data: courses = [] } = trpc.courses.list.useQuery({});

  const subjectIds = useMemo(() => Array.from(new Set(requests.map(r => r.subjectId))), [requests]);
  const { data: subjectsList = [] } = trpc.subjects.getByIds.useQuery({ ids: subjectIds }, { enabled: subjectIds.length > 0 });
  const subjectMap = useMemo(() => new Map(subjectsList.map(s => [s.id, s])), [subjectsList]);

  const respondMutation = trpc.approval.respond.useMutation({
    onSuccess: () => {
      utils.approval.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Resposta enviada.");
      setRespondingId(null);
      setResponseForm({ suggestedAreaId: "", coordinatorNotes: "" });
    },
    onError: e => toast.error(e.message),
  });

  const handleRespond = () => {
    if (!respondingId || !responseForm.suggestedAreaId) return toast.error("Selecione uma area.");
    respondMutation.mutate({
      id: respondingId,
      suggestedAreaId: Number(responseForm.suggestedAreaId),
      coordinatorNotes: responseForm.coordinatorNotes,
      status: "responded",
    });
  };

  const courseMap = new Map(courses.map(c => [c.id, c.name]));
  const areaMap = new Map(areas.map(a => [a.id, a]));
  const isCoordinator = user?.role === "coordinator";
  const isAdmin = user?.role === "admin";
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const filtered = filterStatus === "all" ? requests : requests.filter(r => r.status === filterStatus);
  const respondingRequest = respondingId ? requests.find(r => r.id === respondingId) : null;
  const respondingSubject = respondingRequest ? subjectMap.get(respondingRequest.subjectId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Solicitacoes de Indicacao</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isCoordinator ? "Solicitacoes para voce indicar a area do docente." : "Fluxo de aprovacao de areas por disciplina."}
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-red-50 text-red-700" aria-live="polite">{pendingCount} pendente(s)</Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-56 bg-white"><SelectValue placeholder="Todos os status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <ClipboardList className="mb-3 h-12 w-12 text-slate-300" />
          <p className="font-medium text-slate-500">Nenhuma solicitacao encontrada</p>
          <p className="mt-1 text-sm text-slate-400">
            {isAdmin ? 'Va ao detalhe de um curso e clique em "Solicitar Areas".' : "Sem pendencias para o filtro atual."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusCfg.icon;
            const suggestedArea = req.suggestedAreaId ? areaMap.get(req.suggestedAreaId) : null;
            const subject = subjectMap.get(req.subjectId);

            return (
              <div key={req.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${statusCfg.color}`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{subject?.name ?? `Disciplina #${req.subjectId}`}</span>
                      <Badge className={`px-2 py-0 text-[10px] ${statusCfg.color}`}>{statusCfg.label}</Badge>
                      {subject && <span className="text-[10px] text-slate-500">{subject.semester}o sem · {subject.weeklyClasses} aulas/sem</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {courseMap.get(req.courseId) ?? `#${req.courseId}`} · {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    {req.adminNotes && (
                      <p className="mt-1.5 rounded bg-slate-50 px-2 py-1 text-xs text-slate-700">
                        <strong>Nota admin:</strong> {req.adminNotes}
                      </p>
                    )}
                    {suggestedArea && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: suggestedArea.color ?? "#3B82F6" }}>
                        <Layers className="h-3 w-3" /><strong>Area indicada:</strong> {suggestedArea.name}
                      </p>
                    )}
                    {req.coordinatorNotes && (
                      <p className="mt-1 rounded bg-blue-50 px-2 py-1 text-xs text-slate-700">
                        <strong>Nota coordenador:</strong> {req.coordinatorNotes}
                      </p>
                    )}
                  </div>
                  {(isCoordinator || isAdmin) && req.status === "pending" && (
                    <Button size="sm" onClick={() => setRespondingId(req.id)} className="shrink-0 bg-blue-600 hover:bg-blue-700">
                      Indicar area
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={respondingId !== null} onOpenChange={open => { if (!open) { setRespondingId(null); setResponseForm({ suggestedAreaId: "", coordinatorNotes: "" }); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Indicar area do docente</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {respondingSubject && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-800">{respondingSubject.name}</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {respondingSubject.semester}o semestre · {respondingSubject.weeklyClasses} aulas/semana
                  {respondingSubject.totalHours ? ` · ${respondingSubject.totalHours}h total` : ""}
                </p>
              </div>
            )}
            <p className="text-sm text-slate-700">Selecione a area de ensino do docente responsavel por esta disciplina.</p>
            <div className="space-y-1.5">
              <Label>Area de ensino *</Label>
              <Select value={responseForm.suggestedAreaId} onValueChange={value => setResponseForm({ ...responseForm, suggestedAreaId: value })}>
                <SelectTrigger><SelectValue placeholder="Selecione a area..." /></SelectTrigger>
                <SelectContent>
                  {areas.map(area => (
                    <SelectItem key={area.id} value={String(area.id)}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: area.color ?? "#3B82F6" }} />
                        {area.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observacoes (opcional)</Label>
              <Textarea placeholder="Adicione observacoes..." value={responseForm.coordinatorNotes} onChange={e => setResponseForm({ ...responseForm, coordinatorNotes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingId(null)}>Cancelar</Button>
            <Button onClick={handleRespond} disabled={respondMutation.isPending || !responseForm.suggestedAreaId} className="bg-blue-600 hover:bg-blue-700">
              Confirmar indicacao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
