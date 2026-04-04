import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Clock, User, FileText, Database } from "lucide-react";

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
  teaching_area: "Área de Ensino",
  ppc_document: "Documento PPC",
  approval_request: "Solicitação",
  user: "Usuário",
  user_course_role: "Vínculo Docente",
};

export default function AuditPage() {
  const [filterEntity, setFilterEntity] = useState<string>("all");

  const { data: logs = [], isLoading } = trpc.audit.list.useQuery(
    filterEntity !== "all" ? { entity: filterEntity, limit: 200 } : { limit: 200 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Histórico de Auditoria</h1>
        <p className="text-sm text-slate-500 mt-0.5">Rastreamento completo de todas as alterações realizadas no sistema</p>
      </div>

      <Select value={filterEntity} onValueChange={setFilterEntity}>
        <SelectTrigger className="w-52 bg-white">
          <SelectValue placeholder="Todas as entidades" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as entidades</SelectItem>
          {Object.entries(ENTITY_LABELS).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : logs.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum registro de auditoria encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const actionColor = ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-600";
            const entityLabel = ENTITY_LABELS[log.entity] ?? log.entity;
            return (
              <Card key={log.id} className="border-slate-100">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-[10px] px-2 py-0.5 shrink-0 ${actionColor}`}>{log.action}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-700">{entityLabel}</span>
                        {log.entityId && <span className="text-xs text-slate-400">#{log.entityId}</span>}
                        {log.newValue != null && (
                          <span className="text-xs text-slate-500 truncate max-w-xs">
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
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.userName ?? log.userEmail ?? "Sistema"}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.createdAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
