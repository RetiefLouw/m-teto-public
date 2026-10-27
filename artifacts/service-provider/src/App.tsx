import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { CaseDetail } from "@/pages/CaseDetail";
import { Inbox } from "@/pages/Inbox";
import { EmergencyLog } from "@/pages/EmergencyLog";
import { Accountability } from "@/pages/Accountability";
import { Whistleblower } from "@/pages/Whistleblower";
import { Shell } from "@/components/Shell";

const queryClient = new QueryClient();

const AUTH_KEY = "sp_auth_user";

export type SPUser = {
  pin: string;
  role: "sp" | "admin";
  name: string;
  organisation: string;
  department: string;
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SPUser | null>(() => {
    try {
      const s = sessionStorage.getItem(AUTH_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  function handleLogin(u: SPUser) {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
  }

  function handleLogout() {
    sessionStorage.removeItem(AUTH_KEY);
    setUser(null);
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Shell user={user} onLogout={handleLogout}>
      {children}
    </Shell>
  );
}

function Router() {
  return (
    <AuthGuard>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/cases/:id" component={CaseDetail} />
        <Route path="/cases" component={Dashboard} />
        <Route path="/inbox" component={Inbox} />
        <Route path="/emergency-log" component={EmergencyLog} />
        <Route path="/accountability" component={Accountability} />
        <Route path="/whistleblower" component={Whistleblower} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </Route>
      </Switch>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}
