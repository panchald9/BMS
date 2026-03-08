import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { BadgeDollarSign, Users, Wallet } from "lucide-react";

import AppSidebar from "../components/AppSidebar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { getAgentBills, getAgentUsers, getBills, getClientUsers, getGroups, getOtherBills } from "../lib/api";
import { formatDateDDMMYYYY, startOfMonthISO, todayISO } from "../lib/date";
import { useToast } from "../hooks/use-toast";

function StatCard({ icon, title, value, subtitle, testId }) {
  return (
    <Card className="rounded-xl border-none bg-white p-4 sm:p-5 lg:p-6 shadow-sm transition-shadow hover:shadow-md" data-testid={testId}>
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm font-medium text-muted-foreground" data-testid={`${testId}-title`}>
            {title}
          </div>
          <div className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground break-words" data-testid={`${testId}-value`}>
            {value}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium text-muted-foreground/80" data-testid={`${testId}-subtitle`}>
            {subtitle}
          </div>
        </div>
        <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-2xl bg-primary/5 text-primary flex-shrink-0" data-testid={`${testId}-icon`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function asISO(value) {
  if (!value) return "";
  const s = String(value);
  const dmy = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : "";
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function money(value) {
  return `$${toNumber(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [bills, setBills] = useState([]);
  const [clientOtherBills, setClientOtherBills] = useState([]);
  const [agentBills, setAgentBills] = useState([]);
  const [groups, setGroups] = useState([]);
  const [topClientsSearch, setTopClientsSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [clientRows, agentRows, billRows, clientOtherRows, agentBillRows, groupRows] = await Promise.all([
          getClientUsers(),
          getAgentUsers(),
          getBills(),
          getOtherBills("client"),
          getAgentBills(),
          getGroups(),
        ]);
        if (!mounted) return;
        setClients(Array.isArray(clientRows) ? clientRows : []);
        setAgents(Array.isArray(agentRows) ? agentRows : []);
        setBills(Array.isArray(billRows) ? billRows : []);
        setClientOtherBills(Array.isArray(clientOtherRows) ? clientOtherRows : []);
        setAgentBills(Array.isArray(agentBillRows) ? agentBillRows : []);
        setGroups(Array.isArray(groupRows) ? groupRows : []);
      } catch (error) {
        if (!mounted) return;
        toast({
          title: "Load failed",
          description: error?.message || "Unable to load dashboard data",
          variant: "destructive",
        });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const topClients = useMemo(() => {
    const groupsByClientId = new Map();
    for (const g of groups) {
      const groupType = String(g.type || "").trim().toLowerCase();
      if (groupType !== "payment") continue;
      const key = String(g.owner ?? "");
      if (!key) continue;
      if (!groupsByClientId.has(key)) groupsByClientId.set(key, []);
      const name = String(g.name || "").trim();
      if (name) groupsByClientId.get(key).push(name);
    }

    const map = new Map(
      clients.map((c) => [
        String(c.id),
        {
          id: String(c.id),
          name: c.name || "-",
          total: 0,
          lastDateISO: "",
          groups: groupsByClientId.get(String(c.id)) || [],
        },
      ])
    );

    for (const row of bills) {
      const key = String(row.client_id ?? "");
      const current = map.get(key);
      if (!current) continue;
      const total = toNumber(row.total || toNumber(row.amount) * toNumber(row.rate));
      const dateISO = asISO(row.bill_date);
      current.total += total;
      if (dateISO && (!current.lastDateISO || dateISO > current.lastDateISO)) {
        current.lastDateISO = dateISO;
      }
    }

    for (const row of clientOtherBills) {
      const key = String(row.client_id ?? "");
      const current = map.get(key);
      if (!current) continue;
      const total = toNumber(row.total || row.amount);
      const dateISO = asISO(row.bill_date);
      current.total += total;
      if (dateISO && (!current.lastDateISO || dateISO > current.lastDateISO)) {
        current.lastDateISO = dateISO;
      }
    }

    return [...map.values()];
  }, [bills, clientOtherBills, clients, groups]);

  const visibleTopClients = useMemo(() => {
    const q = topClientsSearch.trim().toLowerCase();
    const filtered = !q
      ? topClients
      : topClients.filter((c) => {
        const haystack = [
          c.name,
          (c.groups || []).join(", "),
          c.lastDateISO ? formatDateDDMMYYYY(c.lastDateISO) : "",
          String(toNumber(c.total).toFixed(2)),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });

    return [...filtered].sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return (b.lastDateISO || "").localeCompare(a.lastDateISO || "");
    });
  }, [topClients, topClientsSearch]);

  const stats = useMemo(() => {
    const monthStartISO = startOfMonthISO(todayISO());

    let totalBillsAmount = 0;
    for (const row of bills) {
      const dateISO = asISO(row.bill_date);
      if (dateISO && dateISO >= monthStartISO) {
        totalBillsAmount += toNumber(row.total || toNumber(row.amount) * toNumber(row.rate));
      }
    }
    for (const row of clientOtherBills) {
      const dateISO = asISO(row.bill_date);
      if (dateISO && dateISO >= monthStartISO) {
        totalBillsAmount += toNumber(row.total || row.amount);
      }
    }

    let totalClaimerPayments = 0;
    for (const row of agentBills) {
      const dateISO = asISO(row.bill_date);
      if (dateISO && dateISO >= monthStartISO) {
        totalClaimerPayments += toNumber(row.total || toNumber(row.amount) * toNumber(row.rate));
      }
    }

    return {
      totalBillsAmount,
      totalClaimerPayments,
      totalUsers: clients.length + agents.length,
    };
  }, [agentBills, agents.length, bills, clientOtherBills, clients.length]);

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-muted/30">
        <div className="container-responsive py-4 sm:py-6 lg:py-8">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground" data-testid="text-dashboard-title">
                Dashboard
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground" data-testid="text-dashboard-subtitle">
                Overview of your billing system performance
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button onClick={() => setLocation("/admin/users")} className="rounded-full px-4 sm:px-6 flex-1 sm:flex-none btn-touch" data-testid="button-manage-users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            <StatCard
              icon={<BadgeDollarSign className="h-6 w-6" />}
              title="Total Bills Amount"
              value={money(stats.totalBillsAmount)}
              subtitle="Bills generated this month"
              testId="card-stat-bills"
            />
            <StatCard
              icon={<Wallet className="h-6 w-6" />}
              title="Total Claimer Payments"
              value={money(stats.totalClaimerPayments)}
              subtitle="Owed to claimers"
              testId="card-stat-payments"
            />
            <StatCard
              icon={<Users className="h-6 w-6" />}
              title="Total Users"
              value={`${stats.totalUsers}`}
              subtitle="Active clients & agents"
              testId="card-stat-users"
            />
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-1">
            <Card className="rounded-xl border-none shadow-sm" data-testid="card-top-clients">
              <div className="flex flex-col gap-3 p-4 sm:p-6 pb-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold" data-testid="text-top-clients-title">
                      Top Clients
                      <Badge variant="secondary" className="rounded-full ml-3" data-testid="badge-top-clients-count">
                        {clients.length} Total
                      </Badge>
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Highest revenue generating clients</p>
                  </div>
                  <Input
                    value={topClientsSearch}
                    onChange={(e) => setTopClientsSearch(e.target.value)}
                    placeholder="Search clients, groups, date, total..."
                    className="h-10 w-full max-w-[450px]"
                    data-testid="input-top-clients-search"
                  />
                </div>
              </div>

              <div className="p-4 sm:p-6 pt-4">
                <div className="table-responsive">
                  <div className="overflow-hidden rounded-lg border border-border/50 min-w-[600px]">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead className="w-12 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground" data-testid="th-rank">#</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground" data-testid="th-client">Client</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell" data-testid="th-groups">Groups</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell" data-testid="th-last-date">Last Entry Date</TableHead>
                          <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground" data-testid="th-total">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleTopClients.map((c, idx) => (
                          <TableRow key={c.id} className="border-border/50" data-testid={`row-top-client-${c.id}`}>
                            <TableCell className="text-center font-medium text-muted-foreground" data-testid={`cell-rank-${c.id}`}>
                              {idx + 1}
                            </TableCell>
                            <TableCell data-testid={`cell-client-${c.id}`}>
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div
                                  className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                                  data-testid={`img-client-avatar-${c.id}`}
                                >
                                  {(c.name || "?").slice(0, 1).toUpperCase()}
                                </div>
                                <span className="font-medium text-foreground text-sm sm:text-base">{c.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm text-muted-foreground hidden sm:table-cell" data-testid={`cell-groups-${c.id}`}>
                              {c.groups.length ? c.groups.join(", ") : "-"}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm text-muted-foreground hidden md:table-cell" data-testid={`cell-date-${c.id}`}>
                              {c.lastDateISO ? formatDateDDMMYYYY(c.lastDateISO) : "-"}
                            </TableCell>
                            <TableCell className="text-right font-bold text-foreground text-sm sm:text-base" data-testid={`cell-total-${c.id}`}>
                              {toNumber(c.total).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {visibleTopClients.length === 0 ? (
                          <TableRow className="border-border/50">
                            <TableCell colSpan={5} className="py-6 text-center text-xs sm:text-sm text-muted-foreground">
                              {topClientsSearch.trim() ? "No clients match your search." : "No clients available"}
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
