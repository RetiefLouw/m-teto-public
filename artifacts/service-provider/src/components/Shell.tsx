import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import type { SPUser } from "@/App";
import {
  LayoutDashboard, Inbox, AlertOctagon, AlertTriangle, ShieldAlert,
  LogOut, Menu, X, ChevronRight, Bell, FolderOpen,
} from "lucide-react";
import { spApi } from "@/lib/api";

interface ShellProps {
  user: SPUser;
  onLogout: () => void;
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  cls?: string;
}

export function Shell({ user, onLogout, children }: ShellProps) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unresponded, setUnresponded] = useState(0);
  const [emergencyPending, setEmergencyPending] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function fetchBadges() {
      try {
        const r = await spApi.getInquiryStats();
        if (!mounted) return;
        setUnresponded(Number(r.unresponded_count ?? 0));
        setEmergencyPending(Number(r.emergency_count ?? 0));
      } catch { /* silent */ }
    }
    fetchBadges();
    const iv = setInterval(fetchBadges, 60000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  const NAV: NavItem[] = [
    { path: "/",              icon: LayoutDashboard, label: "Dashboard"        },
    { path: "/inbox",         icon: Inbox,           label: "Inbox",           badge: unresponded,     cls: unresponded > 0 ? "text-amber-400" : undefined },
    { path: "/cases",         icon: FolderOpen,      label: "Cases"            },
    { path: "/emergency-log", icon: AlertOctagon,    label: "Emergency Log",   badge: emergencyPending, cls: "text-red-400" },
    { path: "/accountability",icon: AlertTriangle,   label: "Accountability"   },
    { path: "/whistleblower", icon: ShieldAlert,     label: "Whistleblower"    },
  ];

  function go(path: string) {
    navigate(path);
    setSidebarOpen(false);
  }

  const currentPage = NAV.find(n => location === n.path || location.startsWith(n.path + "/"))?.label ?? "M-TETO SP Portal";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <a href="#sp-main-content" className="skip-nav">Skip to main content</a>

      {/* Sidebar */}
      <aside
        id="sp-sidebar"
        role="navigation"
        aria-label="Service provider navigation"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[hsl(218,30%,8%)] border-r border-border transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm" aria-hidden="true">SP</div>
          <div>
            <p className="font-bold text-sm text-foreground leading-tight">M-TETO</p>
            <p className="text-[10px] text-muted-foreground">Service Provider Portal</p>
          </div>
          <button className="ml-auto md:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        {/* User card */}
        <div className="mx-3 mt-4 mb-2 p-3 rounded-xl bg-blue-600/10 border border-blue-500/20">
          <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user.organisation}</p>
          <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400">
            {user.role === "admin" ? "System Admin" : user.department}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto" aria-label="Main menu">
          {NAV.map(({ path, icon: Icon, label, badge, cls }) => {
            const active = location === path || (path !== "/" && location.startsWith(path + "/"));
            return (
              <button
                key={path}
                onClick={() => go(path)}
                aria-current={active ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <div className="relative">
                  <Icon size={16} aria-hidden="true" className={!active && cls ? cls : undefined} />
                  {badge && badge > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-black px-0.5">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : null}
                </div>
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </button>
            );
          })}

          {/* Admin-only note */}
          <div className="pt-3 mt-2 border-t border-border">
            <p className="text-[9px] text-muted-foreground/50 px-3 uppercase tracking-wider">Admin only</p>
            <div className="mt-1 px-3 py-2 rounded-lg bg-white/3 border border-white/5">
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                Reports &amp; insights are only accessible via the Admin Portal.
                Service providers may track progress and hold others accountable, but cannot generate analytical reports.
              </p>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5 border-t border-border pt-3">
          <button
            onClick={onLogout}
            aria-label="Sign out"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <LogOut size={16} aria-hidden="true" />
            Sign Out
          </button>
          <p className="text-[9px] text-muted-foreground/50 text-center mt-3">© Adv. Thando Gumede ZA · M-TETO™</p>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 h-14 border-b border-border bg-[hsl(218,30%,10%)] flex-shrink-0" role="banner">
          <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <h1 className="text-sm font-semibold text-foreground">{currentPage}</h1>

          <div className="ml-auto flex items-center gap-2">
            {/* Bell with badge */}
            <button
              onClick={() => go("/inbox")}
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              aria-label={unresponded > 0 ? `${unresponded} unresponded inquiries` : "Inbox"}
            >
              <Bell size={16} />
              {unresponded > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-black px-0.5">
                  {unresponded > 99 ? "99+" : unresponded}
                </span>
              )}
            </button>

            <div
              className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold"
              role="img"
              aria-label={`Current user: ${user.name}`}
            >
              {user.name.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="sp-main-content" tabIndex={-1} className="flex-1 overflow-y-auto" aria-label={currentPage}>
          {children}
        </main>
      </div>
    </div>
  );
}
