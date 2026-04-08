import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Pencil, Trash2, MapPin, Tags, Search } from "lucide-react";
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
  const [areaSearch, setAreaSearch] = useState("");

  const { data: campusAreas = [] } = trpc.campus.getAreas.useQuery(
    { campusId: managingAreas?.id ?? 0 },
    { enabled: !!managingAreas }
  );

  const createMutation = trpc.campus.create.useMutation({
    onSuccess: () => { utils.campus.list.invalidate(); toast.success("Campus criado!"); setShowForm(false); setForm({ name: "", city: "", state: "" }); },
    onError: e => toast.error(e.message),
  });

  const updateMutation = trpc.campus.update.useMutation({
    onSuccess: () => { utils.campus.list.invalidate(); toast.success("Campus atualizado!"); setEditingId(null); setShowForm(false); setForm({ name: "", city: "", state: "" }); },
    onError: e => toast.error(e.message),
  });

  const deleteMutation = trpc.campus.delete.useMutation({
    onSuccess: () => { utils.campus.list.invalidate(); toast.success("Campus removido."); },
    onError: e => toast.error(e.message),
  });

  const addAreaMutation = trpc.campus.addArea.useMutation({
    onSuccess: () => { utils.campus.getAreas.invalidate({ campusId: managingAreas?.id }); toast.success("Area vinculada!"); },
    onError: e => toast.error(e.message),
  });

  const removeAreaMutation = trpc.campus.removeArea.useMutation({
    onSuccess: () => { utils.campus.getAreas.invalidate({ campusId: managingAreas?.id }); toast.success("Area desvinculada."); },
    onError: e => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Nome do campus e obrigatorio.");
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

  const handleToggleArea = (areaId: number) => {
    if (!isAdmin || !managingAreas) return;
    if (campusAreaIds.has(areaId)) {
      removeAreaMutation.mutate({ campusId: managingAreas.id, areaId });
    } else {
      addAreaMutation.mutate({ campusId: managingAreas.id, areaId });
    }
  };

  const filteredAreas = (allAreas as any[]).filter((a: any) =>
    a.name.toLowerCase().includes(areaSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus / Unidades</h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie as unidades e vincule areas de ensino a cada campus.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setForm({ name: "", city: "", state: "" }); setEditingId(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" /> Novo Campus
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : campuses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Building2 className="mb-3 h-12 w-12 text-slate-300" />
          <p className="font-medium text-slate-500">Nenhum campus cadastrado</p>
          {isAdmin && <p className="mt-1 text-sm text-slate-400">Clique em "Novo Campus" para comecar</p>}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campuses.map((campus: any) => (
            <div key={campus.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => handleEdit(campus)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteMutation.mutate({ id: campus.id })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold leading-tight text-slate-900">{campus.name}</h3>
              {(campus.city || campus.state) && (
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                  <MapPin className="h-3 w-3" />
                  {[campus.city, campus.state].filter(Boolean).join(", ")}
                </p>
              )}
              <Badge variant="outline" className="mt-2 border-green-200 bg-green-50 text-xs text-green-700">Ativo</Badge>
              <Button variant="outline" size="sm" className="mt-3 w-full text-xs" onClick={() => { setManagingAreas({ id: campus.id, name: campus.name }); setAreaSearch(""); }}>
                <Tags className="mr-1.5 h-3.5 w-3.5" /> Gerenciar Areas
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Criar/Editar */}
      <Dialog open={showForm} onOpenChange={o => { setShowForm(o); if (!o) { setEditingId(null); setForm({ name: "", city: "", state: "" }); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Campus" : "Novo Campus"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome do Campus *</Label>
              <Input placeholder="Ex: Campus Campo Grande" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input placeholder="Ex: Campo Grande" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Estado (UF)</Label>
                <Input placeholder="MS" maxLength={2} value={form.state} onChange={e => setForm({ ...form, state: e.target.value.toUpperCase() })} />
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

      {/* Modal: Gerenciar Areas */}
      <Dialog open={!!managingAreas} onOpenChange={v => { if (!v) setManagingAreas(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-green-600" />
              Areas — {managingAreas?.name}
            </DialogTitle>
            <p className="mt-1 text-sm text-slate-500">
              Marque as areas disponiveis neste campus. A IA usara apenas estas areas ao importar PPCs.
            </p>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Buscar area..." value={areaSearch} onChange={e => setAreaSearch(e.target.value)} className="pl-9" />
          </div>
          <p className="text-sm text-slate-600">
            <strong className="text-green-700">{campusAreaIds.size}</strong> de {allAreas.length} areas vinculadas
          </p>
          <ScrollArea className="h-[320px] rounded-lg border">
            <div className="p-1">
              {filteredAreas.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Nenhuma area encontrada</p>
              ) : (
                filteredAreas.map((area: any) => {
                  const isLinked = campusAreaIds.has(area.id);
                  return (
                    <label key={area.id} className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-slate-50 ${isLinked ? "bg-green-50/70" : ""}`}>
                      <Checkbox checked={isLinked} onCheckedChange={() => handleToggleArea(area.id)} disabled={!isAdmin} />
                      <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: area.color ?? "#6366f1" }} />
                      <span className={`text-sm ${isLinked ? "font-medium text-slate-800" : "text-slate-600"}`}>{area.name}</span>
                      {isLinked && <Badge variant="outline" className="ml-auto border-green-200 bg-green-50 text-[10px] text-green-700">Vinculada</Badge>}
                    </label>
                  );
                })
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingAreas(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
