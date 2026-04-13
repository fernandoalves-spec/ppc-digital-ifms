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
  Zap,
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
  { icon: LayoutDashboard, label: "Dashboard",          path: "/dashboard" },
  { icon: Building2,       label: "Campus",             path: "/campus",         roles: ["admin"] },
  { icon: BookOpen,        label: "Cursos",             path: "/courses" },
  { icon: BookOpen,        label: "Disciplinas",        path: "/subjects" },
  { icon: Shield,          label: "Areas de ensino",    path: "/areas",          roles: ["admin", "coordinator"] },
  { icon: Upload,          label: "Upload de PPC",      path: "/ppc-upload",     roles: ["admin"] },
  { icon: ClipboardList,   label: "Solicitacoes",       path: "/approvals",      roles: ["admin", "coordinator"] },
  { icon: CalendarRange,   label: "Quadro de oferta",   path: "/offerings",      roles: ["admin", "coordinator"] },
  { icon: FileText,        label: "Relatorios",         path: "/reports" },
  { icon: Calculator,      label: "Memoria de calculo", path: "/memory-calc" },
  { icon: SwatchBook,      label: "Compositor de marca",path: "/brand-composer", roles: ["admin", "coordinator"] },
  { icon: Users,           label: "Usuarios",           path: "/users",          roles: ["admin"] },
  { icon: History,         label: "Auditoria",          path: "/audit",          roles: ["admin"] },
];

export default function DashboardShellLayout({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{
          background: "radial-gradient(ellipse at 30% 30%, rgba(74,63,122,0.3) 0%, transparent 60%), #0d0d1a",
        }}
      >
        {/* Decorative cursed energy orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #6b5fa0, transparent)" }}
          />
          <div
            className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, #29b6d4, transparent)" }}
          />
        </div>

        <div
          className="relative w-full max-w-sm rounded-2xl p-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(19,19,42,0.98) 0%, rgba(26,26,53,0.98) 100%)",
            border: "1px solid rgba(107,95,160,0.4)",
            boxShadow: "0 0 40px rgba(74,63,122,0.4), 0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          {/* Glowing top line */}
          <div
            className="absolute left-0 right-0 top-0 h-0.5 rounded-t-2xl"
            style={{ background: "linear-gradient(90deg, transparent, #6b5fa0, #29b6d4, transparent)" }}
          />

          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "linear-gradient(135deg, #2d2560, #0e6b80)", boxShadow: "0 0 20px rgba(41,182,212,0.4)" }}
          >
            <Zap className="h-8 w-8 text-cyan-300" />
          </div>

          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.05em" }}
          >
            PPC Digital
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "#6b5fa0" }}>
            IFMS — Energia Cursed
          </p>
          <p className="mt-4 text-sm" style={{ color: "#9e9ab8" }}>
            Acesse com sua conta institucional para continuar.
          </p>

          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="mt-6 h-11 w-full rounded-xl font-semibold tracking-wide"
            style={{
              background: "linear-gradient(135deg, #4a3f7a, #29b6d4)",
              color: "#fff",
              boxShadow: "0 0 16px rgba(41,182,212,0.35)",
              border: "none",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.95rem",
              letterSpacing: "0.08em",
            }}
          >
            ⚡ Entrar com conta institucional
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:font-semibold"
        style={{ background: "#1a1535", color: "#29b6d4" }}>
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
      {/* ── Sidebar ── */}
      <Sidebar
        collapsible="icon"
        role="navigation"
        aria-label="Menu principal"
        style={{
          background: "linear-gradient(180deg, #070712 0%, #0a0a1e 40%, #080816 100%)",
          borderRight: "1px solid rgba(107,95,160,0.25)",
        }}
      >
        {/* Header */}
        <SidebarHeader
          className="px-3 py-4"
          style={{ borderBottom: "1px solid rgba(107,95,160,0.2)" }}
        >
          <div className="flex items-center gap-2">
            <SidebarTrigger
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: "rgba(107,95,160,0.2)",
                color: "#29b6d4",
                border: "1px solid rgba(107,95,160,0.3)",
              }}
              aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              <Menu className="h-4 w-4" />
            </SidebarTrigger>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: "linear-gradient(135deg, #2d2560, #0e6b80)", boxShadow: "0 0 10px rgba(41,182,212,0.3)" }}
                >
                  <Zap className="h-4 w-4 text-cyan-300" />
                </div>
                <div>
                  <p
                    className="text-sm font-bold leading-none"
                    style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.05em" }}
                  >
                    PPC Digital
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#6b5fa0" }}>
                    IFMS
                  </p>
                </div>
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="px-2 py-3">
          {/* Decorative top glow line */}
          {!isCollapsed && (
            <div
              className="mb-3 h-px w-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(107,95,160,0.5), transparent)" }}
            />
          )}

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
                    className="h-10 w-full gap-3 rounded-lg px-3 transition-all"
                    style={active ? {
                      background: "linear-gradient(90deg, rgba(107,95,160,0.3) 0%, rgba(41,182,212,0.12) 100%)",
                      color: "#29b6d4",
                      borderLeft: "2px solid #29b6d4",
                      boxShadow: "inset 0 0 16px rgba(41,182,212,0.06)",
                      fontWeight: 600,
                    } : {
                      color: "rgba(232,230,240,0.75)",
                      borderLeft: "2px solid transparent",
                    }}
                  >
                    <item.icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: active ? "#29b6d4" : "rgba(158,154,184,0.8)" }}
                    />
                    {!isCollapsed && (
                      <span
                        className="truncate text-sm"
                        style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: active ? 600 : 400, letterSpacing: "0.02em" }}
                      >
                        {item.label}
                      </span>
                    )}
                    {showBadge && !isCollapsed && (
                      <span
                        className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #e53e3e, #9b1c1c)", boxShadow: "0 0 8px rgba(229,62,62,0.5)" }}
                      >
                        {pendingCount > 9 ? "9+" : pendingCount}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-3" style={{ borderTop: "1px solid rgba(107,95,160,0.2)" }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(107,95,160,0.25)", background: "rgba(107,95,160,0.08)" }}
              >
                <Avatar className="h-8 w-8 shrink-0" style={{ border: "1px solid rgba(41,182,212,0.4)" }}>
                  <AvatarFallback
                    className="text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #2d2560, #0e6b80)", color: "#e8e6f0" }}
                  >
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "#e8e6f0" }}>{user?.name ?? "-"}</p>
                    <p className="truncate text-xs" style={{ color: "#6b5fa0" }}>{roleLabel}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 rounded-xl"
              style={{ background: "#13132a", border: "1px solid rgba(107,95,160,0.4)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
            >
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold" style={{ color: "#e8e6f0" }}>{user?.name}</p>
                <p className="truncate text-xs" style={{ color: "#6b5fa0" }}>{user?.email}</p>
              </div>
              <DropdownMenuSeparator style={{ background: "rgba(107,95,160,0.25)" }} />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer"
                style={{ color: "#e53e3e" }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      {/* ── Main content ── */}
      <SidebarInset style={{ background: "var(--jjk-bg)" }}>
        {isMobile && (
          <header
            className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
            style={{
              background: "rgba(13,13,26,0.95)",
              borderBottom: "1px solid rgba(107,95,160,0.25)",
              backdropFilter: "blur(12px)",
            }}
          >
            <SidebarTrigger
              className="h-8 w-8 rounded-lg"
              style={{ border: "1px solid rgba(107,95,160,0.3)", background: "rgba(107,95,160,0.15)", color: "#29b6d4" }}
            />
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-semibold"
                style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.04em" }}
              >
                {currentPage.title}
              </p>
            </div>
            {pendingCount > 0 && (
              <button
                onClick={() => setLocation("/approvals")}
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ border: "1px solid rgba(107,95,160,0.3)", background: "rgba(107,95,160,0.15)" }}
                aria-label="Pendencias"
              >
                <ClipboardList className="h-4 w-4" style={{ color: "#29b6d4" }} />
                <span
                  className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                  style={{ background: "#e53e3e", boxShadow: "0 0 6px rgba(229,62,62,0.5)" }}
                >
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
