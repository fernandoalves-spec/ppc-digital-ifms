import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ifmsColorTokens } from "@shared/branding/ifmsTokens";

const PRESET_COLORS = [
  ifmsColorTokens.green.hex, "#2563eb", "#d97706", "#9333ea",
  ifmsColorTokens.red.hex, "#0891b2", "#65a30d", "#c026d3", "#ea580c", "#0d9488"
];
const DEFAULT_COLOR = ifmsColorTokens.green.hex;

type AreaForm = { name: string; description: string; color: string };

export default function AreasPage() {
  const utils = trpc.useUtils();
  const { data: areas = [], isLoading } = trpc.areas.list.useQuery();

  const createMutation = trpc.areas.create.useMutation({
    onSuccess: () => { utils.areas.list.invalidate(); toast.success("Area criada!"); setShowForm(false); resetForm(); },
    onError: e => toast.error(e.message),
  });
  const updateMutation = trpc.areas.update.useMutation({
    onSuccess: () => { utils.areas.list.invalidate(); toast.success("Area atualizada!"); setEditingId(null); setShowForm(false); resetForm(); },
    onError: e => toast.error(e.message),
  });
  const deleteMutation = trpc.areas.delete.useMutation({
    onSuccess: () => { utils.areas.list.invalidate(); toast.success("Area removida."); },
    onError: e => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AreaForm>({ name: "", description: "", color: DEFAULT_COLOR });

  const resetForm = () => setForm({ name: "", description: "", color: DEFAULT_COLOR });

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Nome da area e obrigatorio.");
    if (editingId) updateMutation.mutate({ id: editingId, ...form });
    else createMutation.mutate(form);
  };

  const handleEdit = (area: any) => {
    setForm({ name: area.name, description: area.description ?? "", color: area.color ?? DEFAULT_COLOR });
    setEditingId(area.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Areas de Ensino</h1>
          <p className="mt-1 text-sm text-slate-500">
            Areas sao globais — cadastre aqui e depois vincule cada area aos campi em <strong>Campus</strong>.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" /> Nova Area
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : areas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Layers className="mb-3 h-12 w-12 text-slate-300" />
          <p className="font-medium text-slate-500">Nenhuma area cadastrada</p>
          <p className="mt-1 text-sm text-slate-400">Clique em "Nova Area" para comecar</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {areas.map((area) => (
            <div key={area.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
              <div className="h-1.5" style={{ backgroundColor: area.color ?? DEFAULT_COLOR }} />
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${area.color ?? DEFAULT_COLOR}20` }}>
                    <Layers className="h-4 w-4" style={{ color: area.color ?? DEFAULT_COLOR }} />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => handleEdit(area)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={() => deleteMutation.mutate({ id: area.id })}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <h3 className="text-sm font-semibold leading-tight text-slate-900">{area.name}</h3>
                {area.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{area.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={o => { setShowForm(o); if (!o) { resetForm(); setEditingId(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Area" : "Nova Area de Ensino"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome da Area *</Label>
              <Input placeholder="Ex: Matematica, Informatica..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Descricao</Label>
              <Textarea placeholder="Descricao opcional..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Cor de Identificacao</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200" />
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${form.color === c ? "ring-2 ring-slate-400 ring-offset-1 scale-110" : ""}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-green-600 hover:bg-green-700">
              {editingId ? "Salvar" : "Criar Area"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
