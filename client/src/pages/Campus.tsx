import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Plus, Pencil, Trash2, MapPin, Tags, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function CampusPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const { data: campuses = [], isLoading } = trpc.campus.list.useQuery();
  const { data: allAreas = [] } = trpc.areas.list.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", city: "", state: "" });
  const [managingAreas, setManagingAreas] = useState<{ id: number; name: string } | null>(null);

  const { data: campusAreas = [] } = trpc.campus.getAreas.useQuery(
    { campusId: managingAreas?.id ?? 0 },
    { enabled: !!managingAreas }
  );

  const createMutation = trpc.campus.create.useMutation({
    onSuccess: () => {
      utils.campus.list.invalidate();
      toast.success("Campus criado com sucesso!");
      setShowForm(false);
      setForm({ name: "", city: "", state: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.campus.update.useMutation({
    onSuccess: () => {
      utils.campus.list.invalidate();
      toast.success("Campus atualizado!");
      setEditingId(null);
      setShowForm(false);
      setForm({ name: "", city: "", state: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.campus.delete.useMutation({
    onSuccess: () => { utils.campus.list.invalidate(); toast.success("Campus removido."); },
    onError: (e) => toast.error(e.message),
  });

  const addAreaMutation = trpc.campus.addArea.useMutation({
    onSuccess: () => {
      utils.campus.getAreas.invalidate({ campusId: managingAreas?.id });
      toast.success("Área vinculada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeAreaMutation = trpc.campus.removeArea.useMutation({
    onSuccess: () => {
      utils.campus.getAreas.invalidate({ campusId: managingAreas?.id });
      toast.success("Área desvinculada.");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Nome do campus é obrigatório.");
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (campus: any) => {
    setForm({ name: campus.name, city: campus.city ?? "", state: campus.state ?? "" });
    setEditingId(campus.id);
    setShowForm(true);
  };

  const campusAreaIds = new Set(campusAreas.map((a: any) => a.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus / Unidades</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie as unidades e vincule as áreas de ensino disponíveis em cada campus.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => { setForm({ name: "", city: "", state: "" }); setEditingId(null); setShowForm(true); }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Campus
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : campuses.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhum campus cadastrado</p>
            <p className="text-sm text-slate-400 mt-1">Clique em "Novo Campus" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campuses.map((campus: any) => (
            <Card key={campus.id} className="border-slate-100 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => handleEdit(campus)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteMutation.mutate({ id: campus.id })}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 leading-tight">{campus.name}</h3>
                {(campus.city || campus.state) && (
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[campus.city, campus.state].filter(Boolean).join(", ")}
                  </p>
                )}
                <Badge variant="outline" className="mt-2 text-xs text-green-700 border-green-200 bg-green-50">Ativo</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 text-xs"
                  onClick={() => setManagingAreas({ id: campus.id, name: campus.name })}
                >
                  <Tags className="w-3.5 h-3.5 mr-1.5" />
                  Gerenciar Áreas Vinculadas
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Criar/Editar Campus */}
      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) { setEditingId(null); setForm({ name: "", city: "", state: "" }); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Campus" : "Novo Campus"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome do Campus *</Label>
              <Input placeholder="Ex: Campus Campo Grande" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input placeholder="Ex: Campo Grande" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Estado (UF)</Label>
                <Input placeholder="MS" maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-green-600 hover:bg-green-700">
              {editingId ? "Salvar" : "Criar Campus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Gerenciar Áreas do Campus */}
      <Dialog open={!!managingAreas} onOpenChange={(v) => { if (!v) setManagingAreas(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="w-5 h-5 text-primary" />
              Áreas de Ensino — {managingAreas?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Vincule as áreas de ensino disponíveis neste campus. A IA usará <strong>apenas estas áreas</strong> ao importar PPCs deste campus.
            </p>
          </DialogHeader>

          <Tabs defaultValue="vinculadas">
            <TabsList className="w-full">
              <TabsTrigger value="vinculadas" className="flex-1">
                Vinculadas ({campusAreas.length})
              </TabsTrigger>
              <TabsTrigger value="disponiveis" className="flex-1">
                Todas as Áreas ({allAreas.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vinculadas" className="mt-4 min-h-[120px]">
              {campusAreas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Tags className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma área vinculada a este campus.</p>
                  <p className="text-xs mt-1">Vá para "Todas as Áreas" e clique para vincular.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
                  {campusAreas.map((area: any) => (
                    <Badge
                      key={area.id}
                      variant="secondary"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
                      style={{ borderLeft: `3px solid ${area.color ?? "#6366f1"}` }}
                    >
                      <span>{area.name}</span>
                      {isAdmin && (
                        <button
                          className="ml-1 hover:text-destructive transition-colors"
                          onClick={() => removeAreaMutation.mutate({ campusId: managingAreas!.id, areaId: area.id })}
                          title="Desvincular área"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="disponiveis" className="mt-4 min-h-[120px]">
              {allAreas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhuma área cadastrada no sistema.</p>
                  <p className="text-xs mt-1">Cadastre áreas em "Áreas de Ensino" primeiro.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
                    {(allAreas as any[]).map((area: any) => {
                      const isLinked = campusAreaIds.has(area.id);
                      return (
                        <Badge
                          key={area.id}
                          variant={isLinked ? "default" : "outline"}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer hover:opacity-80 transition-opacity select-none"
                          style={isLinked
                            ? { backgroundColor: area.color ?? "#6366f1", color: "#fff", border: "none" }
                            : { borderLeft: `3px solid ${area.color ?? "#6366f1"}` }
                          }
                          onClick={() => {
                            if (!isAdmin || !managingAreas) return;
                            if (isLinked) {
                              removeAreaMutation.mutate({ campusId: managingAreas.id, areaId: area.id });
                            } else {
                              addAreaMutation.mutate({ campusId: managingAreas.id, areaId: area.id });
                            }
                          }}
                          title={isAdmin ? (isLinked ? "Clique para desvincular" : "Clique para vincular") : ""}
                        >
                          {isLinked && <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{area.name}</span>
                        </Badge>
                      );
                    })}
                  </div>
                  {isAdmin && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Clique em uma área para vincular (verde) ou desvincular deste campus.
                    </p>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingAreas(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
