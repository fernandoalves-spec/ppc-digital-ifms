import { useAuth } from "@/_core/hooks/useAuth";
import BrandMark from "@/components/BrandMark";
import EmptyStateInstitutional from "@/components/layout/EmptyStateInstitutional";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/layout/StatCard";
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
import { CSSProperties, ElementType, ReactNode, useMemo } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

type MenuItem = {
  icon: ElementType;
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--ifms-green-900)]"
      >
        Ir para o conteudo principal
      </a>
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

  const currentPage = getPageMeta(location);

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
        role="navigation"
        aria-label="Menu principal do sistema"
        className="border-r border-white/10 bg-[image:var(--ifms-sidebar)] text-[var(--ifms-sidebar-foreground)]"
      >
        <SidebarHeader className="border-b border-white/10 p-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
                aria-expanded={!isCollapsed}
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
                      <SidebarMenuButton
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        isActive={active}
                        aria-current={active ? "page" : undefined}
                        aria-label={`Abrir ${item.label}`}
                        className={[
                          "h-auto min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left",
                          active
                            ? "bg-white text-[var(--ifms-green-900)]"
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
                      </SidebarMenuButton>
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
              <button
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10"
                aria-label="Abrir menu do perfil"
              >
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
            <header className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--ifms-green-100)] bg-white px-3 py-2.5 shadow-[var(--ifms-shadow-soft)]">
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
                  aria-label="Abrir pendencias"
                >
                  <Bell className="h-4 w-4 text-[var(--ifms-green-900)]" />
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ifms-red)] px-1 text-[9px] font-bold text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                </button>
              )}
            </header>
          ) : (
            <section className="mb-5 space-y-3">
              <PageHeader
                badge={currentPage.badge}
                title={currentPage.title}
                description={currentPage.description}
                className="hero-strip border-none text-white shadow-none"
                titleClassName="text-3xl font-extrabold tracking-tight text-white"
              />

              <div className="page-grid md:grid-cols-3">
                <StatCard label="Pendencias" value={pendingCount} tone={pendingCount > 0 ? "danger" : "default"} />
                <StatCard label="Sem area" value={subjectsWithoutArea} tone={subjectsWithoutArea > 0 ? "danger" : "default"} />
                <StatCard label="Cursos" value={totalCourses} />
              </div>

              <div className="grid gap-2 rounded-2xl border border-[var(--ifms-green-100)] bg-white px-4 py-3 md:grid-cols-4">
                {quickActions.map(action => (
                  <button
                    key={action.path}
                    onClick={() => setLocation(action.path)}
                    aria-label={action.label}
                    className="flex items-center justify-between rounded-xl border border-[var(--ifms-green-100)] bg-[var(--ifms-green-50)] px-3 py-2 text-left text-sm font-medium text-[var(--ifms-green-900)] hover:bg-white"
                  >
                    <span className="truncate pr-2">{action.label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <main id="main-content" className="flex-1" role="main">
            <PageContainer className="p-0">
              {children ?? (
                <EmptyStateInstitutional
                  title={currentPage.emptyStateTitle}
                  description={currentPage.emptyStateDescription}
                />
              )}
            </PageContainer>
          </main>
        </div>
      </SidebarInset>
    </>
  );
}
