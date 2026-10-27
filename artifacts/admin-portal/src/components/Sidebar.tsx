import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Users, AlertTriangle, BookOpen, Search,
  BadgeCheck, Building2, LogOut, Shield, ChevronRight,
  Route, Brain, ShieldAlert, FileText, TrendingUp, Scale,
} from "lucide-react";

const NAV_ANALYTICS = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/demographics", label: "Demographics", icon: Users },
  { path: "/risk", label: "Risk & Safety", icon: AlertTriangle },
  { path: "/knowledge", label: "Knowledge", icon: BookOpen },
  { path: "/searches", label: "Searches", icon: Search },
  { path: "/funnel", label: "Funnel & Engagement", icon: TrendingUp },
];

const NAV_INTELLIGENCE = [
  { path: "/journeys", label: "User Journeys", icon: Route },
  { path: "/ai-insights", label: "AI Insights", icon: Brain },
  { path: "/interventions", label: "Interventions", icon: ShieldAlert },
  { path: "/reports", label: "Reports", icon: FileText },
];

const NAV_ACCOUNTABILITY = [
  { path: "/officials", label: "Officials", icon: BadgeCheck },
  { path: "/providers", label: "Providers", icon: Building2 },
  { path: "/justice-timelines", label: "Justice Timelines", icon: Scale },
];

function NavItem({
  item,
  active,
  onClick,
}: {
  item: { path: string; label: string; icon: any };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
        active
          ? "bg-[#E8215D] text-white"
          : "text-slate-400 hover:bg-[#1E293B] hover:text-white"
      }`}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      {item.label}
      {active && (
        <ChevronRight className="w-3 h-3 ml-auto opacity-60" aria-hidden="true" />
      )}
    </button>
  );
}

export default function Sidebar({ onLogout }: { onLogout: () => void }) {
  const [location, navigate] = useLocation();
  const isActive = (path: string) =>
    location === path || (path !== "/" && location.startsWith(path));

  /* Stamp the app's <main> element with an id so the skip-nav link works */
  useEffect(() => {
    const main = document.querySelector("main");
    if (main && !main.id) {
      main.id = "main-content";
      main.setAttribute("tabIndex", "-1");
    }
  }, []);

  return (
    <>
      {/* Skip navigation — visible on keyboard focus */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      <aside
        className="w-64 flex-shrink-0 bg-[#0F172A] flex flex-col min-h-screen"
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <div className="p-6 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl bg-[#E8215D] flex items-center justify-center"
              aria-hidden="true"
            >
              <Shield className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-white font-black text-base leading-tight">
                M-TETO
              </p>
              <p className="text-slate-400 text-[11px] font-medium">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
          aria-label="Main navigation"
        >
          {/* Analytics section */}
          <div role="group" aria-labelledby="nav-analytics-heading">
            <p
              id="nav-analytics-heading"
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-2"
            >
              Analytics
            </p>
            {NAV_ANALYTICS.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                active={isActive(item.path)}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>

          {/* Intelligence section */}
          <div className="pt-4" role="group" aria-labelledby="nav-intelligence-heading">
            <p
              id="nav-intelligence-heading"
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-2"
            >
              Intelligence
            </p>
            {NAV_INTELLIGENCE.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                active={isActive(item.path)}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>

          {/* Accountability section */}
          <div className="pt-4" role="group" aria-labelledby="nav-accountability-heading">
            <p
              id="nav-accountability-heading"
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-2"
            >
              Accountability
            </p>
            {NAV_ACCOUNTABILITY.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                active={isActive(item.path)}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
        </nav>

        {/* User + logout */}
        <div className="p-4 border-t border-[#1E293B]">
          <div className="flex items-center gap-2 mb-3 px-1" aria-label="Logged in as Admin">
            <div
              className="w-7 h-7 rounded-full bg-[#E8215D] flex items-center justify-center"
              aria-hidden="true"
            >
              <Shield className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">Admin</p>
              <p className="text-slate-500 text-[10px]">Full access</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            aria-label="Sign out of Admin Portal"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-[#1E293B] hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign out
          </button>
          <p className="text-center text-[9px] text-slate-600 mt-3 leading-relaxed select-none">
            © {new Date().getFullYear()} Adv. Thando Gumede ZA
            <br />
            M-TETO™ · All rights reserved
          </p>
        </div>
      </aside>
    </>
  );
}
