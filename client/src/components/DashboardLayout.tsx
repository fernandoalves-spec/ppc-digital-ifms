import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  BookOpen,
  Building2,
  CalendarRange,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Settings,
  Shield,
  Upload,
  Users,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

type MenuItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  roles?: string[];
  badge?: string;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Visão Geral",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    ],
  },
  {
    label: "Gestão Acadêmica",
    items: [
      { icon: Building2, label: "Campus", path: "/campus", roles: ["admin"] },
      { icon: GraduationCap, label: "Cursos", path: "/courses" },
      { icon: BookOpen, label: "Disciplinas", path: "/subjects" },
      { icon: Shield, label: "Áreas de Ensino", path: "/areas", roles: ["admin", "coordinator"] },
    ],
  },
  {
    label: "PPC & Aprovações",
    items: [
      { icon: Upload, label: "Upload de PPC", path: "/ppc-upload", roles: ["admin"] },
      { icon: ClipboardList, label: "Solicitações", path: "/approvals", roles: ["admin", "coordinator"] },
    ],
  },
  {
    label: "Quadro de Oferta",
    items: [
      { icon: CalendarRange, label: "Quadro de Oferta", path: "/offerings", roles: ["admin", "coordinator"] },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { icon: FileText, label: "Relatórios", path: "/reports" },
    ],
  },
  {
    label: "Administração",
    items: [
      { icon: Users, label: "Usuários", path: "/users", roles: ["admin"] },
      { icon: History, label: "Auditoria", path: "/audit", roles: ["admin"] },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">PPC Digital IFMS</h1>
              <p className="text-sm text-slate-500 mt-1">Sistema de Gestão de Projetos Pedagógicos</p>
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-600">Faça login com sua conta institucional para acessar o sistema.</p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg"
          >
            Entrar com Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { refetchInterval: 30000 });
  const pendingCount = stats?.pendingApprovals ?? 0;

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const userRole = user?.role ?? "user";

  const filteredGroups = menuGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.includes(userRole)),
  })).filter((group) => group.items.length > 0);

  const roleLabel = { admin: "Administrador", coordinator: "Coordenador", teacher: "Docente", user: "Usuário" }[userRole] ?? "Usuário";
  const roleBadgeColor = { admin: "bg-red-100 text-red-700", coordinator: "bg-blue-100 text-blue-700", teacher: "bg-green-100 text-green-700", user: "bg-slate-100 text-slate-700" }[userRole] ?? "bg-slate-100 text-slate-700";

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center border-b border-slate-100">
            <div className="flex items-center gap-3 px-2 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              >
                <PanelLeft className="h-4 w-4 text-slate-500" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate leading-none">PPC Digital</p>
                    <p className="text-[10px] text-slate-400 truncate">IFMS</p>
                  </div>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            {filteredGroups.map((group) => (
              <SidebarGroup key={group.label} className="px-2 py-1">
                <SidebarGroupLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                    const showBadge = item.path === "/approvals" && pendingCount > 0;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={`h-9 transition-all font-normal text-sm ${isActive ? "bg-green-50 text-green-700 font-medium" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                        >
                          <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-green-600" : ""}`} />
                          <span className="flex-1">{item.label}</span>
                          {showBadge && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                              {pendingCount > 9 ? "9+" : pendingCount}
                            </span>
                          )}
                          {isActive && !isCollapsed && <ChevronRight className="h-3 w-3 text-green-500 shrink-0" />}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-slate-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-8 w-8 border-2 border-slate-200 shrink-0">
                    <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-green-500 to-blue-500 text-white">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate leading-none text-slate-900">{user?.name || "-"}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-1">{roleLabel}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadgeColor}`}>{roleLabel}</span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-green-400/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-slate-50">
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-white px-4 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-green-600 to-blue-600 rounded-md flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-slate-900 text-sm">PPC Digital IFMS</span>
              </div>
            </div>
            {pendingCount > 0 && (
              <button onClick={() => setLocation("/approvals")} className="relative">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingCount}
                </span>
              </button>
            )}
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
