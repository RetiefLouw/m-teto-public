import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Demographics from "./pages/Demographics";
import RiskSafety from "./pages/RiskSafety";
import Knowledge from "./pages/Knowledge";
import Searches from "./pages/Searches";
import Officials from "./pages/Officials";
import Providers from "./pages/Providers";
import UserJourneys from "./pages/UserJourneys";
import AIInsights from "./pages/AIInsights";
import Interventions from "./pages/Interventions";
import Reports from "./pages/Reports";
import Funnel from "./pages/Funnel";
import JusticeTimelines from "./pages/JusticeTimelines";
import Sidebar from "./components/Sidebar";
import MobileSidebar from "./components/MobileSidebar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function NotFound() {
  return (
    <div className="flex items-center justify-center p-12 text-gray-400 text-sm">
      Page not found.
    </div>
  );
}

function DashboardLayout({
  onLogout,
  children,
}: {
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <div className="hidden lg:flex">
        <Sidebar onLogout={onLogout} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <MobileSidebar onLogout={onLogout} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function AdminRoutes({ onLogout }: { onLogout: () => void }) {
  return (
    <DashboardLayout onLogout={onLogout}>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/demographics" component={Demographics} />
        <Route path="/risk" component={RiskSafety} />
        <Route path="/knowledge" component={Knowledge} />
        <Route path="/searches" component={Searches} />
        <Route path="/officials" component={Officials} />
        <Route path="/providers" component={Providers} />
        <Route path="/journeys" component={UserJourneys} />
        <Route path="/ai-insights" component={AIInsights} />
        <Route path="/interventions" component={Interventions} />
        <Route path="/reports" component={Reports} />
        <Route path="/funnel" component={Funnel} />
        <Route path="/justice-timelines" component={JusticeTimelines} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("mteto_admin_authed") === "1"
  );

  const handleLogout = () => {
    sessionStorage.removeItem("mteto_admin_authed");
    setAuthed(false);
  };

  if (!authed) {
    return (
      <QueryClientProvider client={queryClient}>
        <Login onLogin={() => setAuthed(true)} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AdminRoutes onLogout={handleLogout} />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
