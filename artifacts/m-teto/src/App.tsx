import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import { TetoOnboarding } from "@/components/TetoOnboarding";
import { TetoSignIn, getSession } from "@/components/TetoSignIn";
import PortalGateway from "@/pages/PortalGateway";

// Pages
import SearchHome from "./pages/SearchHome";
import SearchResults from "./pages/SearchResults";
import Directory from "./pages/Directory";
import ProviderDetail from "./pages/ProviderDetail";
import Tracker from "./pages/Tracker";
import CaseDetail from "./pages/CaseDetail";
import DemoCases from "./pages/DemoCases";
import DemoCaseDetail from "./pages/DemoCaseDetail";
import Learn from "./pages/Learn";
import University from "./pages/University";
import LegalDocs from "./pages/LegalDocs";
import TheSquare from "./pages/TheSquare";
import Emergency from "./pages/Emergency";
import JusticeRoadmap from "./pages/JusticeRoadmap";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/not-found";

// TETO companion
import { TetoChat } from "./components/Teto";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Routes that are ALWAYS accessible — never blocked by auth or onboarding
const ALWAYS_OPEN = ["/emergency", "/directory", "/learn", "/legal-docs"];

function AppRoutes() {
  const grade = localStorage.getItem("mteto_grade") || "grade_3_5";
  const userName = localStorage.getItem("mteto_name") || localStorage.getItem("mteto_username") || undefined;

  return (
    <>
      <Switch>
        <Route path="/explore" component={SearchHome} />
        <Route path="/" component={SearchHome} />
        <Route path="/search" component={SearchResults} />
        <Route path="/directory" component={Directory} />
        <Route path="/directory/:id" component={ProviderDetail} />
        <Route path="/tracker" component={Tracker} />
        <Route path="/tracker/:id" component={CaseDetail} />
        <Route path="/demo-cases" component={DemoCases} />
        <Route path="/demo-cases/:id" component={DemoCaseDetail} />
        <Route path="/learn" component={Learn} />
        <Route path="/university" component={University} />
        <Route path="/legal-docs" component={LegalDocs} />
        <Route path="/square" component={TheSquare} />
        <Route path="/emergency" component={Emergency} />
        <Route path="/justice" component={JusticeRoadmap} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>

      {/* TETO floating companion — always visible across all pages */}
      <TetoChat gradeLevel={grade} userName={userName} />

      {/* Accessibility Panel — always mounted, controlled by context */}
      <AccessibilityPanel />
    </>
  );
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = window.location.pathname;

  // Strip the base prefix to get the relative path
  const relativePath = base ? path.replace(base, "") || "/" : path;

  // Portal gateway is shown at root or /portals
  const isGateway =
    relativePath === "/" ||
    relativePath === "" ||
    relativePath === "/portals" ||
    relativePath === "/portals/";

  // Some pages are always accessible — no auth or onboarding required (child safety)
  const isAlwaysOpen = ALWAYS_OPEN.some(
    (p) => relativePath === p || relativePath.startsWith(p + "/")
  );

  // ── Custom auth — no Replit OAuth ──────────────────────────────────────
  const [session, setSession] = useState<string | null>(() => getSession());

  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem("mteto_onboarding_done") === "true"
  );

  const handleSignedIn = useCallback((alias: string, isNew: boolean) => {
    setSession(alias);
    if (!isNew) {
      // Returning user — check if they completed onboarding before
      const done = localStorage.getItem("mteto_onboarding_done") === "true";
      setOnboardingDone(done);
    } else {
      // Brand-new account — always run onboarding
      setOnboardingDone(false);
    }
  }, []);

  const handleOnboardingComplete = useCallback((grade: string, name: string) => {
    localStorage.setItem("mteto_grade", grade);
    localStorage.setItem("mteto_name", name);
    localStorage.setItem("mteto_onboarding_done", "true");
    setOnboardingDone(true);
    window.history.pushState({}, "", base + "/explore");
  }, [base]);

  // ── Routing logic (all hooks above this point) ─────────────────────────

  if (isGateway) {
    return <PortalGateway />;
  }

  // Emergency / Directory / Learn — always accessible without sign-in
  if (isAlwaysOpen) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AccessibilityProvider>
            <WouterRouter base={base}>
              <div className="min-h-screen bg-background">
                <AppRoutes />
              </div>
            </WouterRouter>
            <Toaster />
          </AccessibilityProvider>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // ── Sign-in gate — custom TETO auth, no Replit account needed ──────────
  if (!session) {
    return <TetoSignIn onSignedIn={handleSignedIn} />;
  }

  // ── Signed in — run onboarding for new accounts, then the full app ─────
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AccessibilityProvider>
          {!onboardingDone ? (
            <TetoOnboarding onComplete={handleOnboardingComplete} />
          ) : (
            <WouterRouter base={base}>
              <div className="min-h-screen bg-background">
                <AppRoutes />
              </div>
            </WouterRouter>
          )}
          <Toaster />
        </AccessibilityProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
