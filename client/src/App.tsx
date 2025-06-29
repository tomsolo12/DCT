import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Catalog from "@/pages/catalog";
import QueryStudio from "@/pages/query-studio";
import DQMonitoring from "@/pages/dq-monitoring";
import Governance from "@/pages/governance";
import DataSources from "@/pages/data-sources";
import BiIntegration from "@/pages/bi-integration";
import Settings from "@/pages/settings";
import SystemDashboard from "@/pages/system-dashboard";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/catalog" component={Catalog} />
          <Route path="/query-studio" component={QueryStudio} />
          <Route path="/dq-monitoring" component={DQMonitoring} />
          <Route path="/governance" component={Governance} />
          <Route path="/data-sources" component={DataSources} />
          <Route path="/bi-integration" component={BiIntegration} />
          <Route path="/system-dashboard" component={SystemDashboard} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
