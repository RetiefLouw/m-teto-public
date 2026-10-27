import { useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Users, AlertTriangle, BookOpen, Search,
  BadgeCheck, Building2, LogOut, Shield, Menu, X,
  Route, Brain, ShieldAlert, FileText, TrendingUp, Scale,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    title: "Analytics",
    items: [
      { path: "/", label: "Overview", icon: LayoutDashboard },
      { path: "/demographics", label: "Demographics", icon: Users },
      { path: "/risk", label: "Risk & Safety", icon: AlertTriangle },
      { path: "/knowledge", label: "Knowledge", icon: BookOpen },
      { path: "/searches", label: "Searches", icon: Search },
      { path: "/funnel", label: "Funnel & Engagement", icon: TrendingUp },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { path: "/journeys", label: "User Journeys", icon: Route },
      { path: "/ai-insights", label: "AI Insights", icon: Brain },
      { path: "/interventions", label: "Interventions", icon: ShieldAlert },
      { path: "/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    title: "Accountability",
    items: [
      { path: "/officials", label: "Officials", icon: BadgeCheck },
      { path: "/providers", label: "Providers", icon: Building2 },
      { path: "/justice-timelines", label: "Justice Timelines", icon: Scale },
    ],
  },
];

export default function MobileSidebar({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [location, navigate] = useLocation();

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const isActive = (path: string) => location === path || (path !== "/" && location.startsWith(path));

  return (
    <>
      <div className="lg:hidden sticky top-0 z-30 bg-[#0F172A] flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E8215D] flex items-center justify-center" aria-hidden="true">
            <Shield className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-white font-black text-base">M-TETO Admin</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
          className="text-white p-1"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside
            id="mobile-nav-drawer"
            role="navigation"
            aria-label="Admin navigation"
            className="relative w-64 bg-[#0F172A] flex flex-col min-h-screen z-10 overflow-y-auto"
          >
            <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E8215D] flex items-center justify-center" aria-hidden="true">
                  <Shield className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <span className="text-white font-black">M-TETO Admin</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4" aria-label="Main navigation">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title} className="mb-4" role="group" aria-label={section.title}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-1">{section.title}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => go(item.path)}
                        aria-current={isActive(item.path) ? "page" : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                          isActive(item.path) ? "bg-[#E8215D] text-white" : "text-slate-400 hover:bg-[#1E293B] hover:text-white"
                        }`}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="p-4 border-t border-[#1E293B]">
              <button
                onClick={onLogout}
                aria-label="Sign out of Admin Portal"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-[#1E293B] hover:text-white transition-all"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
