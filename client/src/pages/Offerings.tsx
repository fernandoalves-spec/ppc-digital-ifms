import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Calendar, Pencil, Trash2, Building2, GraduationCap, FileText, Users, ChevronDown, ChevronUp } from "lucide-react";

function generateTerms(): string[] {
  const terms: string[] = [];
  const maxYear = new Date().getFullYear() + 2;
  for (let y = 2020; y <= maxYear; y++) {
    terms.push(`${y}/1`);
    terms.push(`${y}/2`);
  }
  return terms;
}

export default function Offerings() {
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingOffering, setEditingOffering] = useState<any>(null);
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());
  const [formTerm, setFormTerm] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [formEntries, setFormEntries] = useState(1);

  const campuses = trpc.campus.list.useQuery();
  const courses = trpc.courses.list.useQuery(selectedCampus ? { campusId: Number(selectedCampus) } : undefined);
  const offerings = trpc.offerings.list.useQuery(
    selectedCampus ? { campusId: Number(selectedCampus), ...(selectedCourse ? { courseId: Number(selectedCourse) } : {}) } : undefined,
    { enabled: !!selectedCampus }
  );

  const createMutation = trpc.offerings.create.useMutation({
    onSuccess: () => { toast.success("Oferta registrada!"); offerings.refetch(); setShowAddDialog(false); resetForm(); },
    onError: err => toast.error(err.message),
  });

  const updateMutation = trpc.offerings.update.useMutation({
    onSuccess: () => { toast.success("Oferta atualizada!"); offerings.refetch(); setEditingOffering(null); resetForm(); },
    onError: err => toast.error(err.message),
  });

  const deleteMutation = trpc.offerings.delete.useMutation({
    onSuccess: () => { toast.success("Oferta removida."); offerings.refetch(); },
    onError: err => toast.error(err.message),
  });

  const allTerms = useMemo(() => generateTerms(), []);

  const offeringsByTerm = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const term of allTerms) map.set(term, []);
    if (offerings.data) {
      for (const o of offerings.data) {
        const list = map.get(o.academicTerm) || [];
        list.push(o);
        map.set(o.academicTerm, list);
      }
    }
    return map;
  }, [offerings.data, allTerms]);

  const courseMap = useMemo(() => {
    const map = new Map<number, any>();
    if (courses.data) for (const c of courses.data) map.set(c.id, c);
    return map;
  }, [courses.data]);

  const resetForm = () => { setFormTerm(""); setFormNotice(""); setFormEntries(1); };

  const openAddDialog = (term?: string) => { resetForm(); if (term) setFormTerm(term); setShowAddDialog(true); };

  const openEditDialog = (offering: any) => {
    setFormTerm(offering.academicTerm);
    setFormNotice(offering.selectionNotice || "");
    setFormEntries(offering.numberOfEntries);
    setEditingOffering(offering);
  };

  const handleSubmit = () => {
    if (!selectedCourse) return toast.error("Selecione um curso primeiro");
    if (!formTerm) return toast.error("Selecione o semestre letivo");
    if (editingOffering) {
      updateMutation.mutate({ id: editingOffering.id, selectionNotice: formNotice || null, numberOfEntries: formEntries, academicTerm: formTerm });
    } else {
      createMutation.mutate({ courseId: Number(selectedCourse), campusId: Number(selectedCampus), academicTerm: formTerm, selectionNotice: formNotice || undefined, numberOfEntries: formEntries });
    }
  };

  const toggleTerm = (term: string) => {
    setExpandedTerms(prev => { const next = new Set(prev); if (next.has(term)) next.delete(term); else next.add(term); return next; });
  };

  const activeCount = offerings.data?.length ?? 0;
  const totalEntries = offerings.data?.reduce((s, o) => s + o.numberOfEntries, 0) ?? 0;
  const distinctNotices = new Set(offerings.data?.map(o => o.selectionNotice).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quadro de Oferta</h1>
          <p className="mt-1 text-sm text-slate-500">Registre as turmas ofertadas desde 2020 por campus e curso</p>
        </div>
        {selectedCourse && (
          <Button onClick={() => openAddDialog()} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" /> Nova Oferta
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-slate-500" />Campus</Label>
          <Select value={selectedCampus} onValueChange={v => { setSelectedCampus(v); setSelectedCourse(""); }}>
            <SelectTrigger><SelectValue placeholder="Selecione o campus..." /></SelectTrigger>
            <SelectContent>{campuses.data?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-sm"><GraduationCap className="h-4 w-4 text-slate-500" />Curso</Label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={!selectedCampus}>
            <SelectTrigger><SelectValue placeholder={!selectedCampus ? "Selecione o campus primeiro..." : "Selecione o curso..."} /></SelectTrigger>
            <SelectContent>{courses.data?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.type})</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      {selectedCourse && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Calendar, label: "Ofertas Registradas", value: activeCount, bg: "bg-green-50", color: "text-green-600" },
            { icon: Users, label: "Total de Entradas", value: totalEntries, bg: "bg-emerald-50", color: "text-emerald-600" },
            { icon: FileText, label: "Editais Distintos", value: distinctNotices, bg: "bg-amber-50", color: "text-amber-600" },
          ].map(kpi => (
            <div key={kpi.label} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={`rounded-lg p-3 ${kpi.bg}`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                <p className="text-sm text-slate-500">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      {selectedCourse && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Calendar className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Linha do Tempo de Ofertas</h2>
          </div>
          <div className="space-y-1 p-3">
            {[...allTerms].reverse().map(term => {
              const termOfferings = offeringsByTerm.get(term) || [];
              const hasOfferings = termOfferings.length > 0;
              const isExpanded = expandedTerms.has(term);
              return (
                <div key={term} className={`overflow-hidden rounded-lg border transition-colors ${hasOfferings ? "border-green-200 bg-green-50/50" : "border-slate-100 hover:border-slate-200"}`}>
                  <div
                    className="flex cursor-pointer items-center justify-between p-3"
                    onClick={() => hasOfferings ? toggleTerm(term) : openAddDialog(term)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={hasOfferings ? "default" : "outline"} className={hasOfferings ? "bg-green-600 text-white" : "text-slate-500"}>
                        {term}
                      </Badge>
                      {hasOfferings ? (
                        <span className="text-sm font-medium text-slate-700">
                          {termOfferings.length} oferta(s) — {termOfferings.reduce((s, o) => s + o.numberOfEntries, 0)} entrada(s)
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Nenhuma oferta — clique para adicionar</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!hasOfferings && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-green-600" onClick={e => { e.stopPropagation(); openAddDialog(term); }}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {hasOfferings && (isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />)}
                    </div>
                  </div>
                  {isExpanded && hasOfferings && (
                    <div className="border-t border-green-100 px-3 pb-3">
                      {termOfferings.map((offering: any) => {
                        const course = courseMap.get(offering.courseId);
                        return (
                          <div key={offering.id} className="mt-2 flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-800">{course?.name ?? `Curso #${offering.courseId}`}</p>
                              <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-500">
                                <span>{offering.numberOfEntries} entrada(s)</span>
                                {offering.selectionNotice && <span>Edital: {offering.selectionNotice}</span>}
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => openEditDialog(offering)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={() => deleteMutation.mutate({ id: offering.id })}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      <Button variant="ghost" size="sm" className="mt-2 text-xs text-green-600 hover:bg-green-50" onClick={() => openAddDialog(term)}>
                        <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar outra oferta neste semestre
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!selectedCampus && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Building2 className="mb-3 h-12 w-12 text-slate-300" />
          <p className="font-medium text-slate-500">Selecione um campus para visualizar as ofertas</p>
        </div>
      )}
      {selectedCampus && !selectedCourse && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <GraduationCap className="mb-3 h-12 w-12 text-slate-300" />
          <p className="font-medium text-slate-500">Selecione um curso para visualizar a linha do tempo</p>
        </div>
      )}

      {/* Dialog: Adicionar/Editar */}
      <Dialog open={showAddDialog || !!editingOffering} onOpenChange={open => { if (!open) { setShowAddDialog(false); setEditingOffering(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingOffering ? "Editar Oferta" : "Nova Oferta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Semestre Letivo *</Label>
              <Select value={formTerm} onValueChange={setFormTerm}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{[...allTerms].reverse().map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Numero de Entradas</Label>
              <Input type="number" min={1} value={formEntries} onChange={e => setFormEntries(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Numero do Edital (opcional)</Label>
              <Input placeholder="Ex: 001/2024" value={formNotice} onChange={e => setFormNotice(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingOffering(null); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-green-600 hover:bg-green-700">
              {editingOffering ? "Salvar" : "Registrar Oferta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
