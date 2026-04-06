import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Calendar, Edit2, Trash2, Building2, GraduationCap, FileText, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function generateTerms(): string[] {
  const terms: string[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  // Inclui 2 anos futuros para planejamento antecipado de semestres
  const maxYear = currentYear + 2;
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

  // Form state
  const [formTerm, setFormTerm] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [formEntries, setFormEntries] = useState(1);

  const campuses = trpc.campus.list.useQuery();
  const courses = trpc.courses.list.useQuery(
    selectedCampus ? { campusId: Number(selectedCampus) } : undefined
  );
  const offerings = trpc.offerings.list.useQuery(
    selectedCampus
      ? {
          campusId: Number(selectedCampus),
          ...(selectedCourse ? { courseId: Number(selectedCourse) } : {}),
        }
      : undefined,
    { enabled: !!selectedCampus }
  );

  const createMutation = trpc.offerings.create.useMutation({
    onSuccess: () => {
      toast.success("Oferta registrada com sucesso!");
      offerings.refetch();
      setShowAddDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.offerings.update.useMutation({
    onSuccess: () => {
      toast.success("Oferta atualizada com sucesso!");
      offerings.refetch();
      setEditingOffering(null);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.offerings.delete.useMutation({
    onSuccess: () => {
      toast.success("Oferta removida com sucesso!");
      offerings.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const allTerms = useMemo(() => generateTerms(), []);

  // Agrupar ofertas por semestre acadêmico
  const offeringsByTerm = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const term of allTerms) {
      map.set(term, []);
    }
    if (offerings.data) {
      for (const o of offerings.data) {
        const list = map.get(o.academicTerm) || [];
        list.push(o);
        map.set(o.academicTerm, list);
      }
    }
    return map;
  }, [offerings.data, allTerms]);

  // Mapa de cursos por ID
  const courseMap = useMemo(() => {
    const map = new Map<number, any>();
    if (courses.data) {
      for (const c of courses.data) map.set(c.id, c);
    }
    return map;
  }, [courses.data]);

  function resetForm() {
    setFormTerm("");
    setFormNotice("");
    setFormEntries(1);
  }

  function openAddDialog(term?: string) {
    resetForm();
    if (term) setFormTerm(term);
    setShowAddDialog(true);
  }

  function openEditDialog(offering: any) {
    setFormTerm(offering.academicTerm);
    setFormNotice(offering.selectionNotice || "");
    setFormEntries(offering.numberOfEntries);
    setEditingOffering(offering);
  }

  function handleSubmit() {
    if (!selectedCourse) {
      toast.error("Selecione um curso primeiro");
      return;
    }
    if (!formTerm) {
      toast.error("Selecione o semestre letivo");
      return;
    }

    if (editingOffering) {
      updateMutation.mutate({
        id: editingOffering.id,
        selectionNotice: formNotice || null,
        numberOfEntries: formEntries,
        academicTerm: formTerm,
      });
    } else {
      createMutation.mutate({
        courseId: Number(selectedCourse),
        campusId: Number(selectedCampus),
        academicTerm: formTerm,
        selectionNotice: formNotice || undefined,
        numberOfEntries: formEntries,
      });
    }
  }

  function toggleTerm(term: string) {
    setExpandedTerms((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  }

  // Contar ofertas ativas por semestre
  const activeOfferingsCount = useMemo(() => {
    let count = 0;
    if (offerings.data) count = offerings.data.length;
    return count;
  }, [offerings.data]);

  return (
    <>
    <div className="space-y-4 p-3 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Quadro de Oferta</h1>
            <p className="text-muted-foreground text-sm">
              Registre as turmas ofertadas desde 2020 por campus e curso
            </p>
          </div>
          {selectedCourse && (
            <Button onClick={() => openAddDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Oferta
            </Button>
          )}
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Campus
                </Label>
                <Select
                  value={selectedCampus}
                  onValueChange={(v) => {
                    setSelectedCampus(v);
                    setSelectedCourse("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o campus..." />
                  </SelectTrigger>
                  <SelectContent>
                    {campuses.data?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  Curso (PPC)
                </Label>
                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                  disabled={!selectedCampus}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedCampus
                          ? "Selecione o campus primeiro..."
                          : "Selecione o curso..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.data?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        {selectedCourse && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeOfferingsCount}</p>
                  <p className="text-sm text-muted-foreground">Ofertas Registradas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {offerings.data?.reduce((s, o) => s + o.numberOfEntries, 0) ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total de Entradas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-500/10">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(offerings.data?.map((o) => o.selectionNotice).filter(Boolean)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Editais Distintos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Timeline de Ofertas */}
        {selectedCourse && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Linha do Tempo de Ofertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...allTerms].reverse().map((term) => {
                  const termOfferings = offeringsByTerm.get(term) || [];
                  const hasOfferings = termOfferings.length > 0;
                  const isExpanded = expandedTerms.has(term);

                  return (
                    <div
                      key={term}
                      className={`border rounded-lg transition-colors ${
                        hasOfferings
                          ? "border-primary/30 bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      {/* Cabeçalho do semestre */}
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => hasOfferings ? toggleTerm(term) : openAddDialog(term)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={hasOfferings ? "default" : "outline"}
                            className="font-mono text-sm"
                          >
                            {term}
                          </Badge>
                          {hasOfferings ? (
                            <span className="text-sm font-medium">
                              {termOfferings.length} oferta{termOfferings.length > 1 ? "s" : ""} —{" "}
                              {termOfferings.reduce((s, o) => s + o.numberOfEntries, 0)} entrada{termOfferings.reduce((s, o) => s + o.numberOfEntries, 0) > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Sem oferta registrada
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {hasOfferings && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAddDialog(term);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Adicionar oferta neste semestre</TooltipContent>
                            </Tooltip>
                          )}
                          {!hasOfferings && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAddDialog(term);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                              Registrar
                            </Button>
                          )}
                          {hasOfferings && (
                            isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )
                          )}
                        </div>
                      </div>

                      {/* Detalhes expandidos */}
                      {hasOfferings && isExpanded && (
                        <div className="border-t px-3 pb-3 pt-2 space-y-2">
                          {termOfferings.map((offering) => (
                            <div
                              key={offering.id}
                              className="flex items-center justify-between p-2 bg-background rounded-md border"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {courseMap.get(offering.courseId)?.name ?? `Curso #${offering.courseId}`}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    {offering.numberOfEntries} entrada{offering.numberOfEntries > 1 ? "s" : ""}
                                  </Badge>
                                </div>
                                {offering.selectionNotice && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {offering.selectionNotice}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => openEditDialog(offering)}
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => {
                                        if (confirm("Remover esta oferta?")) {
                                          deleteMutation.mutate({ id: offering.id });
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Remover</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado vazio */}
        {!selectedCampus && (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecione um Campus</h3>
              <p className="text-muted-foreground">
                Escolha o campus e o curso para visualizar e registrar as ofertas de turmas.
              </p>
            </CardContent>
          </Card>
        )}

        {selectedCampus && !selectedCourse && (
          <Card>
            <CardContent className="py-16 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecione um Curso</h3>
              <p className="text-muted-foreground">
                Escolha o curso (PPC) para visualizar e registrar as ofertas de turmas por semestre.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Adicionar/Editar */}
      <Dialog
        open={showAddDialog || !!editingOffering}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingOffering(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOffering ? "Editar Oferta" : "Registrar Nova Oferta"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Semestre Letivo</Label>
              <Select value={formTerm} onValueChange={setFormTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o semestre..." />
                </SelectTrigger>
                <SelectContent>
                  {allTerms.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Edital de Seleção</Label>
              <Input
                value={formNotice}
                onChange={(e) => setFormNotice(e.target.value)}
                placeholder="Ex: Edital nº 001/2024 - IFMS"
              />
            </div>

            <div className="space-y-2">
              <Label>Número de Entradas (Turmas)</Label>
              <Input
                type="number"
                min={1}
                value={formEntries}
                onChange={(e) => setFormEntries(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <p className="text-xs text-muted-foreground">
                Quantidade de turmas ingressantes neste semestre (padrão: 1)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditingOffering(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingOffering ? "Salvar Alterações" : "Registrar Oferta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
