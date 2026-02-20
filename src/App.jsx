import { Redirect, Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";

import LoginPage from "./pages/login";
import DashboardPage from "./pages/dashboard";
import BanksPage from "./pages/banks";
import AdminUsersPage from "./pages/AdminUsersPage";
import CreateUserPage from "./pages/create-user";
import GroupsPage from "./pages/GroupsPage";
import CreateGroupPage from "./pages/create-group";
import GroupDetailsPage from "./pages/GroupDetailsPage";
import EditGroupPage from "./pages/EditGroupPage";
import AddBillPage from "./pages/add-bill";
import ProcessingPaymentPage from "./pages/processing-payment";
import ClientAllBillsPage from "./pages/client-all-bills";
import AgentAllBillsPage from "./pages/AgentAllBillsPage";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/banks" component={BanksPage} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/users/new" component={CreateUserPage} />
      <Route path="/groups" component={GroupsPage} />
      <Route path="/groups/new" component={CreateGroupPage} />
      <Route path="/groups/edit/:id" component={EditGroupPage} />
      <Route path="/groups/:id" component={GroupDetailsPage} />
      <Route path="/add-bill" component={AddBillPage} />
      <Route path="/processing-payment" component={ProcessingPaymentPage} />
      <Route path="/client-all-bills" component={ClientAllBillsPage} />
      <Route path="/agent-bills" component={AgentAllBillsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
