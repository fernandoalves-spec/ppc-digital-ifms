import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Shield, GraduationCap, BookOpen } from "lucide-react";
import { toast } from "sonner";

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin: { label: "Administrador", color: "bg-red-100 text-red-700" },
  coordinator: { label: "Coordenador", color: "bg-blue-100 text-blue-700" },
  teacher: { label: "Docente", color: "bg-green-100 text-green-700" },
  user: { label: "Usuário", color: "bg-slate-100 text-slate-600" },
};

export default function UsersPage() {
  const utils = trpc.useUtils();
  const { data: users = [], isLoading } = trpc.users.list.useQuery();
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success("Perfil atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 p-3 md:p-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Usuários</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gerencie os perfis e permissões dos usuários</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : users.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum usuário cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((user) => {
            const roleCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.user;
            return (
              <Card key={user.id} className="border-slate-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-slate-100 shrink-0">
                      <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-green-500 to-blue-500 text-white">
                        {user.name?.charAt(0).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{user.name ?? "Sem nome"}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email ?? "Sem email"}</p>
                    </div>
                    <Badge className={`text-xs shrink-0 ${roleCfg.color}`}>{roleCfg.label}</Badge>
                    <Select
                      value={user.role}
                      onValueChange={(v) => updateRoleMutation.mutate({ userId: user.id, role: v as any })}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="teacher">Docente</SelectItem>
                        <SelectItem value="coordinator">Coordenador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
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
