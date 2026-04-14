import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Clock, User } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  UPLOAD: "bg-purple-100 text-purple-700",
  EXTRACT: "bg-amber-100 text-amber-700",
  APPLY_EXTRACTION: "bg-teal-100 text-teal-700",
  RESPOND: "bg-indigo-100 text-indigo-700",
  UPDATE_ROLE: "bg-orange-100 text-orange-700",
  ASSIGN_COURSE_ROLE: "bg-cyan-100 text-cyan-700",
};

const ENTITY_LABELS: Record<string, string> = {
  campus: "Campus",
  course: "Curso",
  subject: "Disciplina",
  teaching_area: "Area de Ensino",
  ppc_document: "Documento PPC",
  approval_request: "Solicitacao",
  user: "Usuario",
  user_course_role: "Vinculo Docente",
};

export default function AuditPage() {
  const [filterEntity, setFilterEntity] = useState<string>("all");

  const { data: logs = [], isLoading } = trpc.audit.list.useQuery(
    filterEntity !== "all" ? { entity: filterEntity, limit: 200 } : { limit: 200 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.04em" }}>Historico de Auditoria</h1>
        <p className="mt-1 text-sm" style={{ color: "#9e9ab8" }}>Rastreamento completo de todas as alteracoes realizadas no sistema</p>
      </div>

      <Select value={filterEntity} onValueChange={setFilterEntity}>
        <SelectTrigger className="w-52" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}><SelectValue placeholder="Todas as entidades" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as entidades</SelectItem>
          {Object.entries(ENTITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(107,95,160,0.25)] py-16 text-center">
          <Shield className="mb-3 h-12 w-12 text-slate-300" />
          <p className="" style={{ color: "#9e9ab8" }}>Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const actionColor = ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-600";
            const entityLabel = ENTITY_LABELS[log.entity] ?? log.entity;
            return (
              <div key={log.id} className="flex items-center gap-3 rounded-xl border border-[rgba(107,95,160,0.25)] p-3 shadow-sm" style={{ background: "rgba(19,19,42,0.97)", border: "1px solid rgba(107,95,160,0.35)", color: "#e8e6f0" }}>
                <Badge className={`shrink-0 text-[10px] ${actionColor}`}>{log.action}</Badge>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">{entityLabel}</span>
                    {log.entityId && <span className="text-xs text-slate-400">#{log.entityId}</span>}
                    {log.newValue != null && (
                      <span className="max-w-xs truncate text-xs text-slate-500">
                        {(() => {
                          const val = log.newValue;
                          if (typeof val === "object" && val !== null) {
                            return Object.entries(val as Record<string, unknown>).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(", ");
                          }
                          return String(val);
                        })()}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <User className="h-3 w-3" />
                      {log.userName ?? log.userEmail ?? "Sistema"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
