import { lazy, Suspense } from "react";
import { Redirect, Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";

const LoginPage = lazy(() => import("./pages/login"));
const DashboardPage = lazy(() => import("./pages/dashboard"));
const BanksPage = lazy(() => import("./pages/banks"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const CreateUserPage = lazy(() => import("./pages/create-user"));
const GroupsPage = lazy(() => import("./pages/GroupsPage"));
const CreateGroupPage = lazy(() => import("./pages/create-group"));
const GroupDetailsPage = lazy(() => import("./pages/GroupDetailsPage"));
const EditGroupPage = lazy(() => import("./pages/EditGroupPage"));
const AddBillPage = lazy(() => import("./pages/add-bill"));
const FindContactPage = lazy(() => import("./pages/finde-contact"));
const ProcessingPaymentPage = lazy(() => import("./pages/processing-payment"));
const ClientAllBillsPage = lazy(() => import("./pages/client-all-bills"));
const AgentAllBillsPage = lazy(() => import("./pages/AgentAllBillsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Router() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <Switch>
        <Route path="/" component={() => <Redirect to="/login" />} />
        <Route path="/login" component={LoginPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/banks" component={BanksPage} />
        <Route path="/admin/users/:id/edit" component={CreateUserPage} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/users/new" component={CreateUserPage} />
        <Route path="/groups" component={GroupsPage} />
        <Route path="/groups/new" component={CreateGroupPage} />
        <Route path="/groups/edit/:id" component={EditGroupPage} />
        <Route path="/groups/:id" component={GroupDetailsPage} />
        <Route path="/add-bill" component={AddBillPage} />
        <Route path="/finde-contact" component={FindContactPage} />
        <Route path="/processing-payment" component={ProcessingPaymentPage} />
        <Route path="/client-all-bills" component={ClientAllBillsPage} />
        <Route path="/agent-bills" component={AgentAllBillsPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
