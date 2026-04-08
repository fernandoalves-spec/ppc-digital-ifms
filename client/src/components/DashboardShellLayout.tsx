import { useAuth } from "@/_core/hooks/useAuth";
import BrandMark from "@/components/BrandMark";
import PageContainer from "@/components/PageContainer";
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
import { CSSProperties, ReactNode, useMemo } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  roles?: string[];
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Painel",
    items: [{ icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" }],
  },
  {
    label: "Gestao academica",
    items: [
      { icon: Building2, label: "Campus", path: "/campus", roles: ["admin"] },
      { icon: BookOpen, label: "Cursos", path: "/courses" },
      { icon: BookOpen, label: "Disciplinas", path: "/subjects" },
      { icon: Shield, label: "Areas de ensino", path: "/areas", roles: ["admin", "coordinator"] },
    ],
  },
  {
    label: "Fluxo operacional",
    items: [
      { icon: Upload, label: "Upload de PPC", path: "/ppc-upload", roles: ["admin"] },
      { icon: ClipboardList, label: "Solicitacoes", path: "/approvals", roles: ["admin", "coordinator"] },
      { icon: CalendarRange, label: "Quadro de oferta", path: "/offerings", roles: ["admin", "coordinator"] },
    ],
  },
  {
    label: "Analises",
    items: [
      { icon: FileText, label: "Relatorios", path: "/reports" },
      { icon: Calculator, label: "Memoria de calculo", path: "/memory-calc" },
      { icon: SwatchBook, label: "Compositor de marca", path: "/brand-composer", roles: ["admin", "coordinator"] },
    ],
  },
  {
    label: "Governanca",
    items: [
      { icon: Users, label: "Usuarios", path: "/users", roles: ["admin"] },
      { icon: History, label: "Auditoria", path: "/audit", roles: ["admin"] },
    ],
  },
];

const pageMeta = [
  {
    match: (path: string) => path === "/" || path === "/dashboard",
    title: "Dashboard institucional",
    description: "Panorama operacional de cursos, pendencias e fluxo academico.",
    badge: "Painel",
  },
  {
    match: (path: string) => path.startsWith("/courses"),
    title: "Cursos",
    description: "Consulta e gestao dos PPCs e estruturas curriculares.",
    badge: "Gestao academica",
  },
  {
    match: (path: string) => path.startsWith("/subjects"),
    title: "Disciplinas",
    description: "Base curricular institucional e vinculacao por area.",
    badge: "Gestao academica",
  },
  {
    match: (path: string) => path.startsWith("/areas"),
    title: "Areas de ensino",
    description: "Distribuicao de responsabilidades academicas por area.",
    badge: "Gestao academica",
  },
  {
    match: (path: string) => path.startsWith("/campus"),
    title: "Campus",
    description: "Gestao das unidades institucionais do IFMS.",
    badge: "Gestao academica",
  },
  {
    match: (path: string) => path.startsWith("/ppc-upload"),
    title: "Upload de PPC",
    description: "Entrada de documentos com extracao estruturada.",
    badge: "Fluxo operacional",
  },
  {
    match: (path: string) => path.startsWith("/approvals"),
    title: "Solicitacoes",
    description: "Acompanhamento de pendencias e aprovacoes institucionais.",
    badge: "Fluxo operacional",
  },
  {
    match: (path: string) => path.startsWith("/offerings"),
    title: "Quadro de oferta",
    description: "Consolidacao de turmas, cargas e distribuicao por area.",
    badge: "Fluxo operacional",
  },
  {
    match: (path: string) => path.startsWith("/reports"),
    title: "Relatorios",
    description: "Leitura analitica para acompanhamento e decisao.",
    badge: "Analises",
  },
  {
    match: (path: string) => path.startsWith("/memory-calc"),
    title: "Memoria de calculo",
    description: "Parametros operacionais e memoria auxiliar.",
    badge: "Analises",
  },
  {
    match: (path: string) => path.startsWith("/users"),
    title: "Usuarios",
    description: "Perfis, permissoes e controles de acesso.",
    badge: "Governanca",
  },
  {
    match: (path: string) => path.startsWith("/audit"),
    title: "Auditoria",
    description: "Rastreabilidade completa de eventos do sistema.",
    badge: "Governanca",
  },
];

export default function DashboardShellLayout({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-3xl border border-[var(--ifms-green-100)] bg-white p-8 text-center shadow-[var(--ifms-shadow-soft)]">
          <div className="mx-auto w-fit">
            <BrandMark variant="vertical" imgClassName="h-20 w-auto" fallbackClassName="justify-center" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[var(--ifms-green-900)]">PPC Digital</h1>
          <p className="mt-2 text-sm leading-7 text-[var(--ifms-text-soft)]">
            Acesse com sua conta institucional para entrar no ambiente de gestao academica do IFMS.
          </p>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            className="mt-6 h-11 w-full rounded-full bg-[var(--ifms-green-600)] text-white hover:bg-[var(--ifms-green-700)]"
          >
            Entrar com conta institucional
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SidebarProvider style={{ "--sidebar-width": "18rem" } as CSSProperties}>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </SidebarProvider>
    </div>
  );
}

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();

  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { refetchInterval: 30000 });
  const pendingCount = stats?.pendingApprovals ?? 0;
  const subjectsWithoutArea = stats?.subjectsWithoutArea ?? 0;
  const totalCourses = stats?.totalCourses ?? 0;

  const userRole = user?.role ?? "user";

  const filteredGroups = useMemo(
    () =>
      menuGroups
        .map(group => ({
          ...group,
          items: group.items.filter(item => !item.roles || item.roles.includes(userRole)),
        }))
        .filter(group => group.items.length > 0),
    [userRole],
  );

  const roleLabel =
    { admin: "Administrador", coordinator: "Coordenador", teacher: "Docente", user: "Usuario" }[userRole] ??
    "Usuario";

  const currentPage = pageMeta.find(entry => entry.match(location)) ?? pageMeta[0];

  const quickActions = useMemo(
    () =>
      [
        pendingCount > 0 ? { label: `${pendingCount} pendencia(s)`, path: "/approvals" } : null,
        subjectsWithoutArea > 0 ? { label: `${subjectsWithoutArea} disciplina(s) sem area`, path: "/subjects" } : null,
        { label: "Abrir relatorios", path: "/reports" },
        { label: "Consultar cursos", path: "/courses" },
      ].filter(Boolean) as { label: string; path: string }[],
    [pendingCount, subjectsWithoutArea],
  );

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="border-r border-white/10 bg-[image:var(--ifms-sidebar)] text-[var(--ifms-sidebar-foreground)]"
      >
        <SidebarHeader className="border-b border-white/10 p-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
              >
                <Menu className="h-4 w-4" />
              </button>
              {!isCollapsed && <BrandMark variant="horizontal" imgClassName="h-9 w-auto" />}
            </div>
            {!isCollapsed && (
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/70">Gestao institucional IFMS</p>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          {filteredGroups.map(group => (
            <SidebarGroup key={group.label} className="px-0 py-1">
              <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/65">
                {group.label}
              </SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map(item => {
                  const isActive = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
                  const isDashboardRoot = item.path === "/dashboard" && location === "/";
                  const active = isActive || isDashboardRoot;
                  const showBadge = item.path === "/approvals" && pendingCount > 0;

                  return (
                    <SidebarMenuItem key={item.path}>
                      <button
                        onClick={() => setLocation(item.path)}
                        title={item.label}
                        className={[
                          "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                          active
                            ? "bg-white text-[var(--ifms-green-900)] shadow-sm"
                            : "text-white/90 hover:bg-white/10 hover:text-white",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                            active ? "bg-[var(--ifms-green-600)] text-white" : "bg-white/10 text-white",
                          ].join(" ")}
                        >
                          <item.icon className="h-4 w-4" />
                        </span>
                        {!isCollapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
                        {showBadge && (
                          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ifms-red)] px-1 text-[10px] font-bold text-white">
                            {pendingCount > 9 ? "9+" : pendingCount}
                          </span>
                        )}
                      </button>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-white/10 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10">
                <Avatar className="h-9 w-9 border border-white/10">
                  <AvatarFallback className="bg-white/10 text-sm font-semibold text-white">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{user?.name ?? "-"}</p>
                    <p className="truncate text-xs text-white/70">{roleLabel}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[var(--ifms-border)]">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold text-[var(--ifms-green-900)]">{user?.name}</p>
                <p className="truncate text-xs text-[var(--ifms-text-soft)]">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer rounded-xl text-[var(--ifms-red-600)] focus:bg-[var(--ifms-red-50)] focus:text-[var(--ifms-red-600)]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-transparent">
        <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-3 pb-4 pt-3 md:px-5 md:pb-6 md:pt-5">
          {isMobile ? (
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--ifms-green-100)] bg-white px-3 py-2.5 shadow-[var(--ifms-shadow-soft)]">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="h-9 w-9 rounded-xl border border-[var(--ifms-green-100)] bg-white" />
                <div>
                  <p className="text-sm font-semibold text-[var(--ifms-green-900)]">{currentPage.title}</p>
                  <p className="text-xs text-[var(--ifms-text-soft)]">{currentPage.badge}</p>
                </div>
              </div>
              {pendingCount > 0 && (
                <button
                  onClick={() => setLocation("/approvals")}
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ifms-green-100)] bg-white"
                >
                  <Bell className="h-4 w-4 text-[var(--ifms-green-900)]" />
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ifms-red)] px-1 text-[9px] font-bold text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <section className="mb-5 overflow-hidden rounded-3xl border border-[var(--ifms-green-100)] bg-white">
              <div className="hero-strip px-5 py-5 md:px-7 md:py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl text-white">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge className="rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/15">
                        {currentPage.badge}
                      </Badge>
                      <Badge className="rounded-full bg-[var(--ifms-red)]/95 px-3 py-1 text-white hover:bg-[var(--ifms-red)]/95">
                        IFMS
                      </Badge>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">{currentPage.title}</h1>
                    <p className="mt-2 text-sm leading-7 text-white/85 md:text-base">{currentPage.description}</p>
                  </div>

                  <div className="grid min-w-[280px] gap-3 sm:grid-cols-3">
                    <InfoStat label="Pendencias" value={pendingCount} />
                    <InfoStat label="Sem area" value={subjectsWithoutArea} />
                    <InfoStat label="Cursos" value={totalCourses} />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 border-t border-[var(--ifms-green-100)] bg-[var(--ifms-green-50)] px-5 py-4 md:grid-cols-2 md:px-7">
                <p className="text-sm text-[var(--ifms-green-900)]">
                  Fluxo orientado por prioridade institucional, com navegacao simplificada para equipe academica.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {quickActions.slice(0, 4).map(action => (
                    <button
                      key={action.path}
                      onClick={() => setLocation(action.path)}
                      className="flex items-center justify-between rounded-xl border border-[var(--ifms-green-100)] bg-white px-3 py-2 text-left text-sm font-medium text-[var(--ifms-green-900)] hover:bg-[var(--ifms-green-50)]"
                    >
                      <span className="truncate pr-2">{action.label}</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          <main className="flex-1">
            <PageContainer className="p-0">{children}</PageContainer>
          </main>
        </div>
      </SidebarInset>
    </>
  );
}

function InfoStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/25 bg-white/10 p-3 text-white backdrop-blur-sm">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/75">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
