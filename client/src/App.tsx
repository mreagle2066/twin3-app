import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import Conversations from "@/pages/Conversations";
import Dashboard from "@/pages/Dashboard";
import Home from "@/pages/Home";
import Leads from "@/pages/Leads";
import Outreach from "@/pages/Outreach";
import ReplyContent from "@/pages/ReplyContent";
import SafetyControls from "@/pages/SafetyControls";
import SignIn from "@/pages/SignIn";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Protected({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/signin" component={SignIn} />
      <Route path="/app"><Protected><Dashboard /></Protected></Route>
      <Route path="/app/dashboard"><Protected><Dashboard /></Protected></Route>
      <Route path="/app/outreach"><Protected><Outreach /></Protected></Route>
      <Route path="/app/conversations"><Protected><Conversations /></Protected></Route>
      <Route path="/app/reply-content"><Protected><ReplyContent /></Protected></Route>
      <Route path="/app/leads"><Protected><Leads /></Protected></Route>
      <Route path="/app/safety"><Protected><SafetyControls /></Protected></Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider><Toaster theme="dark" richColors /><Router /></TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
