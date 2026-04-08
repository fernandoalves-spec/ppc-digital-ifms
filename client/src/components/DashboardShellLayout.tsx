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
  Menu,
  Shield,
  Upload,
  Users,
} from "lucide-react";
import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 304;
const MIN_WIDTH = 244;
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
    label: "Painel executivo",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        path: "/dashboard",
        description: "Síntese executiva de indicadores, pendências e panorama da operação.",
      },
    ],
  },
  {
    label: "Gestão acadêmica",
    items: [
      {
        icon: Building2,
        label: "Campus",
        path: "/campus",
        roles: ["admin"],
        description: "Cadastros institucionais por unidade e organização territorial.",
      },
      {
        icon: BookOpen,
        label: "Cursos",
        path: "/courses",
        description: "Estrutura dos cursos, PPCs e organização curricular.",
      },
      {
        icon: Shield,
        label: "Áreas de ensino",
        path: "/areas",
        roles: ["admin", "coordinator"],
        description: "Responsabilidades acadêmicas e distribuição entre áreas.",
      },
    ],
  },
  {
    label: "Fluxo operacional",
    items: [
      {
        icon: Upload,
        label: "Upload de PPC",
        path: "/ppc-upload",
        roles: ["admin"],
        description: "Recebimento documental e extração estruturada dos PPCs.",
      },
      {
        icon: ClipboardList,
        label: "Solicitações",
        path: "/approvals",
        roles: ["admin", "coordinator"],
        description: "Aprovações pendentes e encaminhamentos entre áreas.",
      },
      {
        icon: CalendarRange,
        label: "Quadro de oferta",
        path: "/offerings",
        roles: ["admin", "coordinator"],
        description: "Monitoramento da distribuição de turmas e cargas.",
      },
    ],
  },
  {
    label: "Análises",
    items: [
      {
        icon: FileText,
        label: "Relatórios",
        path: "/reports",
        description: "Materiais consolidados para acompanhamento e tomada de decisão.",
      },
      {
        icon: Calculator,
        label: "Memória de cálculo",
        path: "/memory-calc",
        description: "Parâmetros auxiliares e cálculos operacionais do ambiente acadêmico.",
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
        description: "Perfis, permissões e gestão de acessos.",
      },
      {
        icon: History,
        label: "Auditoria",
        path: "/audit",
        roles: ["admin"],
        description: "Rastreabilidade de eventos e histórico do sistema.",
      },
    ],
  },
];

const pageMeta = [
  {
    matcher: (path: string) => path === "/" || path === "/dashboard",
    title: "Dashboard institucional",
    description: "Acompanhe o panorama operacional do PPC Digital com foco em governança, pendências e decisão acadêmica.",
    badge: "Painel executivo",
  },
  {
    matcher: (path: string) => path.startsWith("/courses"),
    title: "Cursos",
    description: "Consulte estruturas curriculares, acompanhe detalhes dos PPCs e navegue pelo acervo institucional.",
    badge: "Gestão acadêmica",
  },
  {
    matcher: (path: string) => path.startsWith("/subjects"),
    title: "Disciplinas",
    description: "Visualize a base curricular, vínculos de área e itens que exigem saneamento acadêmico.",
    badge: "Gestão acadêmica",
  },
  {
    matcher: (path: string) => path.startsWith("/areas"),
    title: "Áreas de ensino",
    description: "Organize responsabilidades acadêmicas e a vinculação institucional das ofertas.",
    badge: "Gestão acadêmica",
  },
  {
    matcher: (path: string) => path.startsWith("/campus"),
    title: "Campus",
    description: "Gerencie as unidades institucionais e sua organização territorial na plataforma.",
    badge: "Gestão acadêmica",
  },
  {
    matcher: (path: string) => path.startsWith("/ppc-upload"),
    title: "Upload de PPC",
    description: "Traga novos documentos para a plataforma e acompanhe sua ingestão estruturada.",
    badge: "Fluxo operacional",
  },
  {
    matcher: (path: string) => path.startsWith("/approvals"),
    title: "Solicitações",
    description: "Monitore pendências e acompanhe os fluxos de aprovação institucional.",
    badge: "Fluxo operacional",
  },
  {
    matcher: (path: string) => path.startsWith("/offerings"),
    title: "Quadro de oferta",
    description: "Consolide a distribuição de turmas, cargas e componentes ofertados.",
    badge: "Fluxo operacional",
  },
  {
    matcher: (path: string) => path.startsWith("/reports"),
    title: "Relatórios",
    description: "Converta dados acadêmicos e operacionais em acompanhamento institucional acionável.",
    badge: "Análises",
  },
  {
    matcher: (path: string) => path.startsWith("/memory-calc"),
    title: "Memória de cálculo",
    description: "Acompanhe parâmetros, fórmulas e memórias auxiliares do processo acadêmico.",
    badge: "Análises",
  },
  {
    matcher: (path: string) => path.startsWith("/users"),
    title: "Usuários",
    description: "Administre perfis, permissões e acessos à plataforma institucional.",
    badge: "Governança",
  },
  {
    matcher: (path: string) => path.startsWith("/audit"),
    title: "Auditoria",
    description: "Consulte histórico, rastreabilidade e eventos relevantes do sistema.",
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
        <div className="institutional-panel w-full max-w-xl rounded-[2rem] p-10 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] hero-strip shadow-2xl shadow-emerald-950/20">
            <GraduationCap className="h-8 w-8" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700">Ambiente institucional</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--ifms-green-900)]">PPC Digital</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--ifms-text-soft)]">
            Acesse com sua conta institucional para entrar no ambiente de gestão acadêmica, análise documental e acompanhamento operacional.
          </p>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="mt-8 h-12 w-full rounded-full bg-[var(--ifms-green-700)] text-white hover:bg-[var(--ifms-green-800)]"
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
  const courseCount = stats?.totalCourses ?? 0;

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
      admin: "bg-rose-50 text-rose-700 border border-rose-100",
      coordinator: "bg-sky-50 text-sky-700 border border-sky-100",
      teacher: "bg-emerald-50 text-emerald-700 border border-emerald-100",
      user: "bg-slate-50 text-slate-700 border border-slate-100",
    }[userRole] ?? "bg-slate-50 text-slate-700 border border-slate-100";

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
      { label: "Consultar cursos", path: "/courses" },
    ];

    return actions.filter(Boolean) as { label: string; path: string }[];
  }, [pendingCount, subjectsWithoutArea]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          disableTransition={isResizing}
          className="border-r border-[color:var(--sidebar-border)] bg-[image:var(--ifms-sidebar)] text-[var(--ifms-sidebar-foreground)]"
        >
          <SidebarHeader className="border-b border-white/10 p-4">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-4 text-white backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSidebar}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 transition hover:bg-white/18"
                >
                  <Menu className="h-4 w-4" />
                </button>
                {!isCollapsed && (
                  <>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold tracking-tight">PPC Digital</p>
                      <p className="truncate text-[11px] uppercase tracking-[0.24em] text-[var(--ifms-sidebar-muted)]">
                        Gestão acadêmica institucional
                      </p>
                    </div>
                  </>
                )}
              </div>

              {!isCollapsed && (
                <div className="mt-4 rounded-[1.35rem] bg-white/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--ifms-sidebar-muted)]">
                    Ambiente
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white">
                    Plataforma para leitura, organização e acompanhamento do PPC institucional.
                  </p>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 px-3 py-4">
            {filteredGroups.map((group) => (
              <SidebarGroup key={group.label} className="px-0 py-2">
                <SidebarGroupLabel className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--ifms-sidebar-muted)]">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
                    const showBadge = item.path === "/approvals" && pendingCount > 0;

                    return (
                      <SidebarMenuItem key={item.path}>
                        <button
                          onClick={() => setLocation(item.path)}
                          title={item.label}
                          className={[
                            "flex min-h-[3.25rem] w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all",
                            isActive
                              ? "menu-active"
                              : "text-white/88 hover:bg-white/8 hover:text-white",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                              isActive ? "bg-emerald-100 text-[var(--ifms-green-800)]" : "bg-white/8 text-white",
                            ].join(" ")}
                          >
                            <item.icon className="h-4 w-4" />
                          </div>
                          {!isCollapsed && (
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{item.label}</p>
                              <p className={`truncate text-xs ${isActive ? "text-[var(--ifms-text-soft)]" : "text-white/58"}`}>
                                {item.description}
                              </p>
                            </div>
                          )}
                          {showBadge && (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ifms-red)] px-1.5 text-[10px] font-bold text-white">
                              {pendingCount > 9 ? "9+" : pendingCount}
                            </span>
                          )}
                          {!isCollapsed && isActive && <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ifms-green-700)]" />}
                        </button>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-white/10 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/8 px-3 py-3 text-left transition hover:bg-white/12">
                  <Avatar className="h-11 w-11 shrink-0 border border-white/10">
                    <AvatarFallback className="bg-white/12 text-sm font-semibold text-white">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{user?.name || "-"}</p>
                      <p className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-[var(--ifms-sidebar-muted)]">
                        {roleLabel}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-2xl border-[color:var(--ifms-border)]">
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
          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-emerald-400/30 ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => {
            if (!isCollapsed) setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-transparent">
        <div className="mx-auto flex min-h-screen w-full max-w-[1700px] flex-col px-3 pb-5 pt-3 md:px-5 md:pb-6 md:pt-5">
          {isMobile ? (
            <div className="institutional-panel sticky top-3 z-40 mb-4 flex items-center justify-between rounded-[1.6rem] px-4 py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="h-10 w-10 rounded-2xl border border-emerald-100 bg-white" />
                <div>
                  <p className="text-sm font-semibold tracking-tight text-[var(--ifms-green-900)]">{currentPage.title}</p>
                  <p className="text-xs text-[var(--ifms-text-soft)]">{currentPage.badge}</p>
                </div>
              </div>

              {pendingCount > 0 && (
                <button
                  onClick={() => setLocation("/approvals")}
                  className="relative rounded-2xl border border-emerald-100 bg-white p-2.5"
                >
                  <Bell className="h-5 w-5 text-[var(--ifms-green-800)]" />
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ifms-red)] px-1 text-[9px] font-bold text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="institutional-panel mb-5 overflow-hidden rounded-[2rem]">
              <div className="hero-strip px-6 py-6 md:px-8 md:py-8">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="max-w-3xl">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-white/12 px-3 py-1 text-white hover:bg-white/12">
                        {currentPage.badge}
                      </Badge>
                      <Badge className="rounded-full bg-emerald-100 px-3 py-1 text-[var(--ifms-green-900)] hover:bg-emerald-100">
                        {roleLabel}
                      </Badge>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{currentPage.title}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/88 md:text-base">
                      {currentPage.description}
                    </p>
                  </div>

                  <div className="grid min-w-[280px] gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-50/70">Pendências</p>
                      <p className="mt-3 text-3xl font-extrabold">{pendingCount}</p>
                      <p className="mt-1 text-sm text-emerald-50/72">solicitações aguardando encaminhamento</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-50/70">Disciplinas</p>
                      <p className="mt-3 text-3xl font-extrabold">{subjectsWithoutArea}</p>
                      <p className="mt-1 text-sm text-emerald-50/72">sem vinculação de área</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-50/70">Cursos</p>
                      <p className="mt-3 text-3xl font-extrabold">{courseCount}</p>
                      <p className="mt-1 text-sm text-emerald-50/72">registrados na plataforma</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 border-t border-[rgba(15,61,40,0.08)] bg-[rgba(255,255,255,0.92)] px-6 py-5 md:grid-cols-[1.5fr,1fr] md:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--ifms-green-700)]">Leitura operacional</p>
                  <p className="mt-2 text-lg font-bold tracking-tight text-[var(--ifms-green-900)]">
                    Estrutura orientada para gestão institucional, acompanhamento contínuo e navegação por prioridades.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {quickActions.slice(0, 4).map((action) => (
                    <button
                      key={action.path}
                      onClick={() => setLocation(action.path)}
                      className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-left text-sm font-semibold text-[var(--ifms-green-900)] transition hover:bg-emerald-100/70"
                    >
                      <span className="truncate pr-3">{action.label}</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <main className="page-shell flex-1 overflow-x-hidden">
            <div className="space-y-5">{children}</div>
          </main>
        </div>
      </SidebarInset>
    </>
  );
}
