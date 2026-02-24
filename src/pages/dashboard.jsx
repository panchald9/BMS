import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { BadgeDollarSign, Users, Wallet } from "lucide-react";

import AppSidebar from "../components/AppSidebar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { getAgentBills, getAgentUsers, getBills, getClientUsers, getOtherBills } from "../lib/api";
import { formatDateDDMMYYYY, startOfMonthISO, todayISO } from "../lib/date";
import { useToast } from "../hooks/use-toast";

function StatCard({ icon, title, value, subtitle, testId }) {
  return (
    <Card className="rounded-xl border-none bg-white p-6 shadow-sm transition-shadow hover:shadow-md" data-testid={testId}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-muted-foreground" data-testid={`${testId}-title`}>
            {title}
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-foreground" data-testid={`${testId}-value`}>
            {value}
          </div>
          <div className="mt-1 text-xs font-medium text-muted-foreground/80" data-testid={`${testId}-subtitle`}>
            {subtitle}
          </div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/5 text-primary" data-testid={`${testId}-icon`}>
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

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [clientRows, agentRows, billRows, clientOtherRows, agentBillRows] = await Promise.all([
          getClientUsers(),
          getAgentUsers(),
          getBills(),
          getOtherBills("client"),
          getAgentBills(),
        ]);
        if (!mounted) return;
        setClients(Array.isArray(clientRows) ? clientRows : []);
        setAgents(Array.isArray(agentRows) ? agentRows : []);
        setBills(Array.isArray(billRows) ? billRows : []);
        setClientOtherBills(Array.isArray(clientOtherRows) ? clientOtherRows : []);
        setAgentBills(Array.isArray(agentBillRows) ? agentBillRows : []);
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
    const map = new Map(
      clients.map((c) => [
        String(c.id),
        {
          id: String(c.id),
          name: c.name || "-",
          total: 0,
          lastDateISO: "",
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

    return [...map.values()].sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return (b.lastDateISO || "").localeCompare(a.lastDateISO || "");
    });
  }, [bills, clientOtherBills, clients]);

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
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground" data-testid="text-dashboard-title">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground" data-testid="text-dashboard-subtitle">
                Overview of your billing system performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setLocation("/admin/users")} className="rounded-full px-6" data-testid="button-manage-users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

          <div className="mt-8 grid grid-cols-1">
            <Card className="rounded-xl border-none shadow-sm" data-testid="card-top-clients">
              <div className="flex items-center justify-between p-6 pb-0">
                <div>
                  <h3 className="text-lg font-semibold" data-testid="text-top-clients-title">
                    Top Clients
                  </h3>
                  <p className="text-sm text-muted-foreground">Highest revenue generating clients</p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3" data-testid="badge-top-clients-count">
                  {clients.length} Total
                </Badge>
              </div>

              <div className="p-6 pt-4">
                <div className="overflow-hidden rounded-lg border border-border/50">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="w-12 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground" data-testid="th-rank">#</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground" data-testid="th-client">Client</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground" data-testid="th-last-date">Last Entry Date</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground" data-testid="th-total">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topClients.slice(0, 5).map((c, idx) => (
                        <TableRow key={c.id} className="border-border/50" data-testid={`row-top-client-${c.id}`}>
                          <TableCell className="text-center font-medium text-muted-foreground" data-testid={`cell-rank-${c.id}`}>
                            {idx + 1}
                          </TableCell>
                          <TableCell data-testid={`cell-client-${c.id}`}>
                            <div className="flex items-center gap-3">
                              <div
                                className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                                data-testid={`img-client-avatar-${c.id}`}
                              >
                                {(c.name || "?").slice(0, 1).toUpperCase()}
                              </div>
                              <span className="font-medium text-foreground">{c.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground" data-testid={`cell-date-${c.id}`}>
                            {c.lastDateISO ? formatDateDDMMYYYY(c.lastDateISO) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground" data-testid={`cell-total-${c.id}`}>
                            {toNumber(c.total).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {topClients.length === 0 ? (
                        <TableRow className="border-border/50">
                          <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                            No clients available
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
