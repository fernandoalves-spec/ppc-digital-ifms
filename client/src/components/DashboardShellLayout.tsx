import { useAuth } from "@/_core/hooks/useAuth";
import BrandMark from "@/components/BrandMark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getPageMeta } from "@/config/pageMeta";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  Building2,
  Calculator,
  CalendarRange,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  SwatchBook,
  Upload,
  Users,
} from "lucide-react";
import { CSSProperties, ElementType, ReactNode, useMemo } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

type MenuItem = {
  icon: ElementType;
  label: string;
  path: string;
  roles?: string[];
};

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Building2, label: "Campus", path: "/campus", roles: ["admin"] },
  { icon: BookOpen, label: "Cursos", path: "/courses" },
  { icon: BookOpen, label: "Disciplinas", path: "/subjects" },
  { icon: Shield, label: "Areas de ensino", path: "/areas", roles: ["admin", "coordinator"] },
  { icon: Upload, label: "Upload de PPC", path: "/ppc-upload", roles: ["admin"] },
  { icon: ClipboardList, label: "Solicitacoes", path: "/approvals", roles: ["admin", "coordinator"] },
  { icon: CalendarRange, label: "Quadro de oferta", path: "/offerings", roles: ["admin", "coordinator"] },
  { icon: FileText, label: "Relatorios", path: "/reports" },
  { icon: Calculator, label: "Memoria de calculo", path: "/memory-calc" },
  { icon: SwatchBook, label: "Compositor de marca", path: "/brand-composer", roles: ["admin", "coordinator"] },
  { icon: Users, label: "Usuarios", path: "/users", roles: ["admin"] },
  { icon: History, label: "Auditoria", path: "/audit", roles: ["admin"] },
];

export default function DashboardShellLayout({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 w-fit">
            <BrandMark variant="vertical" imgClassName="h-16 w-auto" fallbackClassName="justify-center" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">PPC Digital IFMS</h1>
          <p className="mt-2 text-sm text-slate-500">Acesse com sua conta institucional para continuar.</p>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="mt-6 h-10 w-full rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Entrar com conta institucional
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-green-900">
        Ir para o conteudo principal
      </a>
      <SidebarProvider style={{ "--sidebar-width": "16rem" } as CSSProperties}>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </SidebarProvider>
    </div>
  );
}

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();

  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { refetchInterval: 30000 });
  const pendingCount = stats?.pendingApprovals ?? 0;
  const userRole = user?.role ?? "user";

  const visibleItems = useMemo(
    () => menuItems.filter(item => !item.roles || item.roles.includes(userRole)),
    [userRole],
  );

  const roleLabel =
    { admin: "Administrador", coordinator: "Coordenador", teacher: "Docente", user: "Usuario" }[userRole] ?? "Usuario";

  const currentPage = getPageMeta(location);

  return (
    <>
      <Sidebar
        collapsible="icon"
        role="navigation"
        aria-label="Menu principal"
        className="border-r border-white/10 bg-[image:var(--ifms-sidebar)] text-white"
      >
        <SidebarHeader className="border-b border-white/10 px-3 py-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              <Menu className="h-4 w-4" />
            </SidebarTrigger>
            {!isCollapsed && <BrandMark variant="horizontal" imgClassName="h-8 w-auto" />}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          <SidebarMenu>
            {visibleItems.map(item => {
              const isActive =
                location === item.path ||
                (item.path !== "/dashboard" && location.startsWith(item.path));
              const isDashboardRoot = item.path === "/dashboard" && location === "/";
              const active = isActive || isDashboardRoot;
              const showBadge = item.path === "/approvals" && pendingCount > 0;

              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    isActive={active}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "h-10 w-full gap-3 rounded-lg px-3",
                      active
                        ? "bg-white text-green-900 font-semibold"
                        : "text-white/85 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="truncate text-sm">{item.label}</span>}
                    {showBadge && !isCollapsed && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {pendingCount > 9 ? "9+" : pendingCount}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-white/10 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10">
                <Avatar className="h-8 w-8 shrink-0 border border-white/10">
                  <AvatarFallback className="bg-white/10 text-xs font-semibold text-white">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{user?.name ?? "-"}</p>
                    <p className="truncate text-xs text-white/60">{roleLabel}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-200">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-slate-50">
        {isMobile && (
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg border border-slate-200 bg-white" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{currentPage.title}</p>
            </div>
            {pendingCount > 0 && (
              <button
                onClick={() => setLocation("/approvals")}
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white"
                aria-label="Pendencias"
              >
                <ClipboardList className="h-4 w-4 text-slate-600" />
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              </button>
            )}
          </header>
        )}

        <main id="main-content" className="flex-1 p-4 md:p-6" role="main">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
