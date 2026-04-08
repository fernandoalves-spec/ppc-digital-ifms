import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  ArrowRight,
  Bell,
  Blend,
  BookOpen,
  Building2,
  Calculator,
  CalendarRange,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Shield,
  Upload,
  Users,
} from "lucide-react";
import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 288;
const MIN_WIDTH = 228;
const MAX_WIDTH = 400;

type MenuItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  roles?: string[];
  description: string;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Panorama",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        path: "/dashboard",
        description: "Visão executiva dos indicadores institucionais.",
      },
    ],
  },
  {
    label: "Estrutura acadêmica",
    items: [
      {
        icon: Building2,
        label: "Campus",
        path: "/campus",
        roles: ["admin"],
        description: "Organização das unidades e seus cadastros.",
      },
      {
        icon: GraduationCap,
        label: "Cursos",
        path: "/courses",
        description: "Consulta e gestão da estrutura dos cursos.",
      },
      {
        icon: BookOpen,
        label: "Disciplinas",
        path: "/subjects",
        description: "Base curricular, áreas e pendências de disciplinas.",
      },
      {
        icon: Shield,
        label: "Áreas de ensino",
        path: "/areas",
        roles: ["admin", "coordinator"],
        description: "Definição das áreas responsáveis pela oferta.",
      },
    ],
  },
  {
    label: "Fluxos operacionais",
    items: [
      {
        icon: Upload,
        label: "Upload de PPC",
        path: "/ppc-upload",
        roles: ["admin"],
        description: "Entrada documental com extração estruturada.",
      },
      {
        icon: ClipboardList,
        label: "Solicitações",
        path: "/approvals",
        roles: ["admin", "coordinator"],
        description: "Acompanhamento das aprovações pendentes.",
      },
      {
        icon: CalendarRange,
        label: "Quadro de oferta",
        path: "/offerings",
        roles: ["admin", "coordinator"],
        description: "Distribuição das turmas ativas e carga semanal.",
      },
    ],
  },
  {
    label: "Análise e apoio",
    items: [
      {
        icon: FileText,
        label: "Relatórios",
        path: "/reports",
        description: "Síntese operacional e emissão de relatórios.",
      },
      {
        icon: Calculator,
        label: "Memória de cálculo",
        path: "/memory-calc",
        description: "Conferência de cálculos e parâmetros auxiliares.",
      },
      {
        icon: Blend,
        label: "Compositor de marcas",
        path: "/brand-composer",
        roles: ["admin", "coordinator"],
        description: "Recursos visuais alinhados à identidade IFMS.",
      },
    ],
  },
  {
    label: "Governança",
    items: [
      {
        icon: Users,
        label: "Usuários",
        path: "/users",
        roles: ["admin"],
        description: "Perfis, acessos e administração do sistema.",
      },
      {
        icon: History,
        label: "Auditoria",
        path: "/audit",
        roles: ["admin"],
        description: "Rastreabilidade de eventos e alterações.",
      },
    ],
  },
];

const pageMeta = [
  {
    matcher: (path: string) => path === "/" || path === "/dashboard",
    title: "Dashboard institucional",
    description: "Resumo executivo da operação acadêmica, alertas e principais indicadores.",
    badge: "Panorama",
  },
  {
    matcher: (path: string) => path.startsWith("/courses"),
    title: "Cursos",
    description: "Estruture cursos, acompanhe componentes curriculares e navegue por detalhes do PPC.",
    badge: "Estrutura acadêmica",
  },
  {
    matcher: (path: string) => path.startsWith("/subjects"),
    title: "Disciplinas",
    description: "Visualize disciplinas, vínculos de área e situações que exigem saneamento.",
    badge: "Estrutura acadêmica",
  },
  {
    matcher: (path: string) => path.startsWith("/areas"),
    title: "Áreas de ensino",
    description: "Gerencie a distribuição de responsabilidade acadêmica entre áreas.",
    badge: "Estrutura acadêmica",
  },
  {
    matcher: (path: string) => path.startsWith("/campus"),
    title: "Campus",
    description: "Cadastros institucionais por unidade e organização territorial.",
    badge: "Estrutura acadêmica",
  },
  {
    matcher: (path: string) => path.startsWith("/ppc-upload"),
    title: "Upload de PPC",
    description: "Traga novos documentos para a plataforma e acompanhe a ingestão.",
    badge: "Fluxo operacional",
  },
  {
    matcher: (path: string) => path.startsWith("/approvals"),
    title: "Solicitações",
    description: "Monitore pendências e avance nos fluxos de aprovação institucional.",
    badge: "Fluxo operacional",
  },
  {
    matcher: (path: string) => path.startsWith("/offerings"),
    title: "Quadro de oferta",
    description: "Consolide turmas ativas e leitura semanal da oferta acadêmica.",
    badge: "Fluxo operacional",
  },
  {
    matcher: (path: string) => path.startsWith("/reports"),
    title: "Relatórios",
    description: "Transforme dados operacionais em material de acompanhamento e decisão.",
    badge: "Análise",
  },
  {
    matcher: (path: string) => path.startsWith("/memory-calc"),
    title: "Memória de cálculo",
    description: "Acompanhe parâmetros e cálculos auxiliares do processo acadêmico.",
    badge: "Análise",
  },
  {
    matcher: (path: string) => path.startsWith("/brand-composer"),
    title: "Compositor de marcas",
    description: "Apoie a construção visual dentro das diretrizes institucionais do IFMS.",
    badge: "Apoio",
  },
  {
    matcher: (path: string) => path.startsWith("/users"),
    title: "Usuários",
    description: "Administre permissões, perfis e acesso à plataforma.",
    badge: "Governança",
  },
  {
    matcher: (path: string) => path.startsWith("/audit"),
    title: "Auditoria",
    description: "Consulte o histórico de ações e a rastreabilidade do sistema.",
    badge: "Governança",
  },
];

export default function DashboardShellLayout({ children }: { children: ReactNode }) {
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
      <div className="app-shell flex min-h-screen items-center justify-center p-4">
        <div className="glass-panel w-full max-w-lg rounded-[2rem] p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[var(--color-hero)] text-white shadow-xl shadow-emerald-950/20">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950">PPC Digital IFMS</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Faça login com sua conta institucional para acessar a nova experiência do ambiente acadêmico.
          </p>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="mt-8 h-12 w-full rounded-full bg-[var(--color-primary)] text-white hover:brightness-110"
          >
            Entrar com conta institucional
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
        <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
      </SidebarProvider>
    </div>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: ReactNode;
  setSidebarWidth: (width: number) => void;
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
  const subjectsWithoutArea = stats?.subjectsWithoutArea ?? 0;

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = event.clientX - sidebarLeft;
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

  const filteredGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(userRole)),
    }))
    .filter((group) => group.items.length > 0);

  const roleLabel =
    { admin: "Administrador", coordinator: "Coordenador", teacher: "Docente", user: "Usuário" }[userRole] ??
    "Usuário";
  const roleBadgeColor =
    {
      admin: "bg-rose-100 text-rose-700",
      coordinator: "bg-sky-100 text-sky-700",
      teacher: "bg-emerald-100 text-emerald-700",
      user: "bg-slate-100 text-slate-700",
    }[userRole] ?? "bg-slate-100 text-slate-700";

  const currentPage = pageMeta.find((entry) => entry.matcher(location)) ?? pageMeta[0];

  const quickActions = useMemo(() => {
    const actions = [
      pendingCount > 0
        ? { label: `${pendingCount} pendência${pendingCount > 1 ? "s" : ""}`, path: "/approvals" }
        : null,
      subjectsWithoutArea > 0
        ? { label: `${subjectsWithoutArea} disciplina${subjectsWithoutArea > 1 ? "s" : ""} sem área`, path: "/subjects" }
        : null,
      { label: "Abrir relatórios", path: "/reports" },
    ];

    return actions.filter(Boolean) as { label: string; path: string }[];
  }, [pendingCount, subjectsWithoutArea]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          disableTransition={isResizing}
          className="border-r border-[color:var(--sidebar-border)] bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)]"
        >
          <SidebarHeader className="border-b border-white/8 p-3">
            <div className="glass-panel flex items-center gap-3 rounded-[1.5rem] border-white/10 bg-white/6 px-3 py-3 text-white shadow-none">
              <button
                onClick={toggleSidebar}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8 transition hover:bg-white/14"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed && (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold tracking-tight">PPC Digital</p>
                    <p className="truncate text-[11px] uppercase tracking-[0.22em] text-emerald-50/65">IFMS</p>
                  </div>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 px-2 py-4">
            {!isCollapsed && (
              <div className="mb-4 rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-50/60">Ambiente</p>
                <p className="mt-2 text-base font-semibold tracking-tight">Gestão acadêmica integrada</p>
                <p className="mt-2 text-sm leading-6 text-emerald-50/70">
                  Navegue pelos fluxos principais com mais contexto e menos ruído operacional.
                </p>
              </div>
            )}

            {filteredGroups.map((group) => (
              <SidebarGroup key={group.label} className="px-1 py-1.5">
                <SidebarGroupLabel className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-50/45">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
                    const showBadge = item.path === "/approvals" && pendingCount > 0;

                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={[
                            "h-10 rounded-xl px-3 py-2 text-left transition-colors",
                            isActive
                              ? "bg-white text-slate-900 shadow-lg shadow-black/10"
                              : "text-emerald-50/85 hover:bg-white/8 hover:text-white",
                          ].join(" ")}
                        >
                          <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-700" : ""}`} />
                          {!isCollapsed && <span className="flex-1 truncate text-sm font-medium">{item.label}</span>}
                          {showBadge && (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                              {pendingCount > 9 ? "9+" : pendingCount}
                            </span>
                          )}
                          {!isCollapsed && isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-white/8 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/6 px-3 py-3 text-left transition hover:bg-white/10">
                  <Avatar className="h-10 w-10 shrink-0 border border-white/10">
                    <AvatarFallback className="bg-white/12 text-sm font-semibold text-white">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{user?.name || "-"}</p>
                      <p className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-emerald-50/60">
                        {roleLabel}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-2xl border-[color:var(--color-border)]">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-semibold text-slate-950">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${roleBadgeColor}`}>
                    {roleLabel}
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer rounded-xl text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div
          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-emerald-400/25 ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => {
            if (!isCollapsed) setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-transparent">
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-3 pb-4 pt-3 md:px-4 md:pb-5 md:pt-4">
          {isMobile ? (
            <div className="glass-panel sticky top-3 z-40 mb-4 flex items-center justify-between rounded-[1.5rem] px-4 py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="h-9 w-9 rounded-xl border border-white/70 bg-white/60" />
                <div>
                  <p className="text-sm font-semibold tracking-tight text-slate-950">{currentPage.title}</p>
                  <p className="text-xs text-slate-500">{currentPage.badge}</p>
                </div>
              </div>

              {pendingCount > 0 && (
                <button onClick={() => setLocation("/approvals")} className="relative rounded-full bg-white/80 p-2">
                  <Bell className="h-5 w-5 text-slate-700" />
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="glass-panel mb-4 rounded-[1.75rem] px-5 py-5 md:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10">
                      {currentPage.badge}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-white/70 bg-white/70 px-3 py-1 text-slate-600">
                      {roleLabel}
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">{currentPage.title}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">{currentPage.description}</p>
                </div>

                <div className="grid min-w-[260px] gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.35rem] border border-white/70 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Pendências</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{pendingCount}</p>
                    <p className="mt-1 text-sm text-slate-500">solicitações aguardando encaminhamento</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/70 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Ações rápidas</p>
                    <div className="mt-3 space-y-2">
                      {quickActions.slice(0, 2).map((action) => (
                        <button
                          key={action.path}
                          onClick={() => setLocation(action.path)}
                          className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          <span className="truncate">{action.label}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <main className="page-shell flex-1 overflow-x-hidden">{children}</main>
        </div>
      </SidebarInset>
    </>
  );
}
