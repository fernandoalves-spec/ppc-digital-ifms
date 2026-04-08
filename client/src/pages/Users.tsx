import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { toast } from "sonner";

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin: { label: "Administrador", color: "bg-red-100 text-red-700" },
  coordinator: { label: "Coordenador", color: "bg-blue-100 text-blue-700" },
  teacher: { label: "Docente", color: "bg-green-100 text-green-700" },
  user: { label: "Usuario", color: "bg-slate-100 text-slate-600" },
};

export default function UsersPage() {
  const utils = trpc.useUtils();
  const { data: users = [], isLoading } = trpc.users.list.useQuery();
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success("Perfil atualizado!"); },
    onError: e => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="mt-1 text-sm text-slate-500">Gerencie os perfis e permissoes dos usuarios</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Users className="mb-3 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">Nenhum usuario cadastrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => {
            const roleCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.user;
            return (
              <div key={user.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Avatar className="h-9 w-9 shrink-0 border-2 border-slate-100">
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-xs font-bold text-white">
                    {user.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{user.name ?? "Sem nome"}</p>
                  <p className="truncate text-xs text-slate-500">{user.email ?? "Sem email"}</p>
                </div>
                <Badge className={`shrink-0 text-xs ${roleCfg.color}`}>{roleCfg.label}</Badge>
                <Select value={user.role} onValueChange={v => updateRoleMutation.mutate({ userId: user.id, role: v as any })}>
                  <SelectTrigger className="h-8 w-36 shrink-0 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="teacher">Docente</SelectItem>
                    <SelectItem value="coordinator">Coordenador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
