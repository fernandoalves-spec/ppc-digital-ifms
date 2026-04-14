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

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pendente", bg: "rgba(212,160,23,0.15)", color: "#f0c040", icon: Clock },
  responded: { label: "Respondido", bg: "rgba(41,182,212,0.15)", color: "#29b6d4", icon: MessageSquare },
  approved: { label: "Aprovado", bg: "rgba(41,182,100,0.15)", color: "#4ade80", icon: CheckCircle },
  rejected: { label: "Rejeitado", bg: "rgba(239,68,68,0.15)", color: "#f87171", icon: XCircle },
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
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.04em" }}>Solicitacoes de Indicacao</h1>
          <p className="mt-1 text-sm" style={{ color: "#9e9ab8" }}>
            {isCoordinator ? "Solicitacoes para voce indicar a area do docente." : "Fluxo de aprovacao de areas por disciplina."}
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge aria-live="polite" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>{pendingCount} pendente(s)</Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-56" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}><SelectValue placeholder="Todos os status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl" style={{ background: "rgba(26,26,53,0.8)" }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(107,95,160,0.25)] py-16 text-center">
          <ClipboardList className="mb-3 h-12 w-12" style={{ color: "#6b5fa0" }} />
          <p className="font-medium" style={{ color: "#9e9ab8" }}>Nenhuma solicitacao encontrada</p>
          <p className="mt-1 text-sm" style={{ color: "#6a6685" }}>
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
              <div key={req.id} className="rounded-xl p-4 shadow-sm" style={{ background: "linear-gradient(135deg, rgba(19,19,42,0.97), rgba(26,26,53,0.97))", border: "1px solid rgba(107,95,160,0.22)" }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: (statusCfg as any).bg }}>
                    <StatusIcon className="h-4 w-4" style={{ color: (statusCfg as any).color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "#e8e6f0" }}>{subject?.name ?? `Disciplina #${req.subjectId}`}</span>
                      <Badge className="px-2 py-0 text-[10px]" style={{ background: (statusCfg as any).bg, color: (statusCfg as any).color, border: `1px solid ${(statusCfg as any).color}40` }}>{statusCfg.label}</Badge>
                      {subject && <span className="text-[10px]" style={{ color: "#9e9ab8" }}>{subject.semester}o sem · {subject.weeklyClasses} aulas/sem</span>}
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: "#9e9ab8" }}>
                      {courseMap.get(req.courseId) ?? `#${req.courseId}`} · {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    {req.adminNotes && (
                      <p className="mt-1.5 rounded px-2 py-1 text-xs" style={{ background: "rgba(107,95,160,0.12)", color: "#c8c4e0" }}>
                        <strong>Nota admin:</strong> {req.adminNotes}
                      </p>
                    )}
                    {suggestedArea && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: suggestedArea.color ?? "#3B82F6" }}>
                        <Layers className="h-3 w-3" /><strong>Area indicada:</strong> {suggestedArea.name}
                      </p>
                    )}
                    {req.coordinatorNotes && (
                      <p className="mt-1 rounded px-2 py-1 text-xs" style={{ background: "rgba(41,182,212,0.1)", color: "#c8c4e0" }}>
                        <strong>Nota coordenador:</strong> {req.coordinatorNotes}
                      </p>
                    )}
                  </div>
                  {(isCoordinator || isAdmin) && req.status === "pending" && (
                    <Button size="sm" onClick={() => setRespondingId(req.id)} className="shrink-0" style={{ background: "linear-gradient(135deg, #4a3f7a, #6b5fa0)", color: "#e8e6f0" }}>
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
              <div className="rounded-lg p-3" style={{ background: "rgba(26,26,53,0.8)", border: "1px solid rgba(107,95,160,0.25)" }}>
                <p className="text-sm font-medium" style={{ color: "#e8e6f0" }}>{respondingSubject.name}</p>
                <p className="mt-0.5 text-xs" style={{ color: "#9e9ab8" }}>
                  {respondingSubject.semester}o semestre · {respondingSubject.weeklyClasses} aulas/semana
                  {respondingSubject.totalHours ? ` · ${respondingSubject.totalHours}h total` : ""}
                </p>
              </div>
            )}
            <p className="text-sm" style={{ color: "#c8c4e0" }}>Selecione a area de ensino do docente responsavel por esta disciplina.</p>
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
            <Button onClick={handleRespond} disabled={respondMutation.isPending || !responseForm.suggestedAreaId} style={{ background: "linear-gradient(135deg, #4a3f7a, #6b5fa0)", color: "#e8e6f0" }}>
              Confirmar indicacao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
