import { ReactNode, useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import {
  Home, Search, Shield, BookOpen, User, LayoutDashboard,
  Accessibility, ArrowLeft, Bell, Coins, AlertTriangle
} from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { useGetPoints, useGetProfile } from "@workspace/api-client-react";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useAccessibility } from "@/context/AccessibilityContext";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export function MobileLayout({ children, title, showBack }: MobileLayoutProps) {
  const { isAuthenticated, login, user } = useAuth();
  const { openPanel, prefs } = useAccessibility();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [location, navigate] = useLocation();

  const { data: pointsData } = useGetPoints({
    query: { enabled: isAuthenticated }
  });

  const { data: profileData } = useGetProfile({
    query: { enabled: isAuthenticated }
  });

  useEffect(() => {
    if (isAuthenticated && profileData?.profile && !profileData.profile.onboardingDone) {
      const timer = setTimeout(() => setShowOnboarding(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, profileData]);

  const totalPoints = pointsData?.totalPoints ?? profileData?.profile?.totalPoints ?? 0;
  const isHome = location === "/explore" || location === "/" || location === "";

  return (
    <div className="mx-auto max-w-[430px] w-full min-h-screen bg-background relative flex flex-col shadow-2xl overflow-hidden border-x border-border/50">
      {/* Skip Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-[999] bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel px-3 py-2.5 flex items-center justify-between" role="banner">
        {/* Left: back button + logo */}
        <div className="flex items-center gap-2 min-w-0">
          {(showBack || (!isHome && location !== "/dashboard")) && (
            <button
              onClick={() => window.history.back()}
              aria-label="Go back"
              title="Go back"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
          )}
          {title ? (
            <h1 className="text-lg font-display font-bold brand-gradient-text truncate">{title}</h1>
          ) : (
            <Link href="/explore">
              <div className="flex items-center gap-2 cursor-pointer">
                <img
                  src={`${import.meta.env.BASE_URL}images/mteto-logo.png`}
                  alt="M-TETO Logo"
                  className="w-9 h-9 object-contain"
                />
                <div className="flex flex-col leading-none">
                  <span className="font-display font-bold text-base tracking-wide brand-gradient-text">M-TETO</span>
                  <span className="text-[8px] text-muted-foreground font-sans font-semibold tracking-wide uppercase">Search Engine</span>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Right: accessibility + dashboard bell + coins + avatar/auth */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Accessibility Button */}
          <button
            onClick={openPanel}
            aria-label="Open accessibility settings"
            title="Accessibility Settings"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${prefs.profile !== "none" ? "bg-violet-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-violet-100 hover:text-violet-600"}`}
          >
            <Accessibility className="w-4 h-4" />
          </button>

          {/* Dashboard bell */}
          <Link href="/dashboard">
            <button
              aria-label="Open my dashboard"
              title="My Dashboard"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${location.startsWith("/dashboard") ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary"}`}
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
          </Link>

          {/* Coins */}
          {isAuthenticated && totalPoints > 0 && (
            <Link href="/square">
              <div className="flex items-center gap-1 brand-gradient px-2.5 py-1.5 rounded-full cursor-pointer shadow-sm">
                <Coins className="w-3 h-3 text-white" />
                <span className="text-xs font-bold text-white">{totalPoints}</span>
              </div>
            </Link>
          )}

          {/* Avatar → Profile page (NOT direct logout) */}
          {isAuthenticated ? (
            <Link href="/profile">
              <button
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/30 hover:border-primary/60 transition-colors shadow-sm"
                title="My Profile"
                aria-label="Go to my profile"
              >
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="My profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full brand-gradient flex items-center justify-center text-white text-xs font-bold">
                    {(user?.firstName?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </button>
            </Link>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={login}
                className="rounded-full font-bold px-3 h-7 text-[11px] border-primary/40 text-primary hover:bg-primary/5"
              >
                Log In
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={login}
                className="rounded-full font-bold px-3 brand-gradient text-white hover:opacity-90 shadow-md h-7 text-[11px] border-0"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 overflow-y-auto pb-24 scroll-smooth" role="main" aria-label="Main content" tabIndex={-1}>
        {children}
      </main>

      {/* Bottom Navigation — 5 items with Emergency as center CTA */}
      <nav
        className="fixed bottom-0 w-full max-w-[430px] z-50 bg-white/95 backdrop-blur-xl border-t border-border/60 px-1 pt-1.5 pb-2 rounded-t-3xl pb-safe shadow-lg"
        role="navigation"
        aria-label="Main navigation"
      >
        <p className="text-center text-[8px] text-muted-foreground/50 font-sans tracking-wide pb-1 select-none">
          © {new Date().getFullYear()} Adv. Thando Gumede ZA · M-TETO™
        </p>
        <ul className="flex items-end justify-around px-1">
          <NavItem href="/explore" icon={<Home className="w-5 h-5" />} label="Home" />
          <NavItem href="/directory" icon={<Search className="w-5 h-5" />} label="Directory" />

          {/* Centre Emergency button — raised, prominent */}
          <li className="flex flex-col items-center -mt-5">
            <Link href="/emergency">
              <button
                aria-label="Emergency help — opens emergency contacts and panic button"
                className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-xl flex items-center justify-center border-4 border-white hover:from-red-600 hover:to-orange-600 transition-all duration-200 active:scale-95"
              >
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              </button>
            </Link>
            <span className="text-[9px] font-bold text-red-500 mt-0.5">Emergency</span>
          </li>

          <NavItem href="/learn" icon={<BookOpen className="w-5 h-5" />} label="Learn" />
          <NavItem href="/profile" icon={<User className="w-5 h-5" />} label="Profile" />
        </ul>
      </nav>

      {/* Onboarding Modal */}
      <OnboardingModal open={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  requiresAuth,
  onAuthRequired,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  requiresAuth?: boolean;
  onAuthRequired?: () => void;
}) {
  const [location] = useLocation();
  const [isRouteActive] = useRoute(href === "/" ? "/" : `${href}/*?`);
  const isActive = href === "/" ? (location === "/" || location === "") : isRouteActive;

  const content = (
    <div className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${isActive ? 'scale-110' : 'text-muted-foreground hover:text-primary/70'}`}>
      <div className={`p-1.5 rounded-2xl transition-all duration-300 ${isActive ? 'brand-gradient shadow-md' : 'bg-transparent'}`}>
        <span className={isActive ? 'text-white' : ''}>{icon}</span>
      </div>
      <span className={`text-[9px] font-bold ${isActive ? 'brand-gradient-text' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  );

  if (requiresAuth) {
    return (
      <li>
        <button
          onClick={onAuthRequired}
          className="w-full h-full appearance-none outline-none"
          aria-label={label}
          aria-current={isActive ? "page" : undefined}
        >
          {content}
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        className="w-full h-full block"
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
      >
        {content}
      </Link>
    </li>
  );
}
