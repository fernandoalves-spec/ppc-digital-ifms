import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const PRESET_COLORS = ["#16a34a","#2563eb","#d97706","#9333ea","#dc2626","#0891b2","#65a30d","#c026d3","#ea580c","#0d9488"];

export default function AreasPage() {
  const utils = trpc.useUtils();
  const { data: areas = [], isLoading } = trpc.areas.list.useQuery();
  const createMutation = trpc.areas.create.useMutation({
    onSuccess: () => { utils.areas.list.invalidate(); toast.success("Área criada!"); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.areas.update.useMutation({
    onSuccess: () => { utils.areas.list.invalidate(); toast.success("Área atualizada!"); setEditingId(null); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.areas.delete.useMutation({
    onSuccess: () => { utils.areas.list.invalidate(); toast.success("Área removida."); },
    onError: (e) => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#16a34a" });

  const resetForm = () => setForm({ name: "", description: "", color: "#16a34a" });

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Nome da área é obrigatório.");
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (area: any) => {
    setForm({ name: area.name, description: area.description ?? "", color: area.color ?? "#16a34a" });
    setEditingId(area.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Áreas de Ensino</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Áreas de ensino são <strong>globais</strong> — cadastre aqui e depois vincule cada área aos campi desejados em <strong>Campus</strong>.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" /> Nova Área
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : areas.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16 text-center">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma área cadastrada</p>
            <p className="text-sm text-slate-400 mt-1">Clique em "Nova Área" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {areas.map((area) => (
            <Card key={area.id} className="border-slate-100 hover:shadow-md transition-all overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: area.color ?? "#3B82F6" }} />
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${area.color}20` }}>
                    <Layers className="w-4 h-4" style={{ color: area.color ?? "#3B82F6" }} />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => handleEdit(area)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={() => deleteMutation.mutate({ id: area.id })}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm leading-tight">{area.name}</h3>
                {area.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{area.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) { resetForm(); setEditingId(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Área" : "Nova Área de Ensino"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome da Área *</Label>
              <Input placeholder="Ex: Matemática, Informática..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea placeholder="Descrição opcional da área..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Cor de Identificação</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200" />
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${form.color === c ? "ring-2 ring-offset-1 ring-slate-400 scale-110" : ""}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-green-600 hover:bg-green-700">
              {editingId ? "Salvar" : "Criar Área"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
