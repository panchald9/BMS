import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import AppSidebar from "../components/app-sidebar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/Select";
import { DateInput } from "@/components/ui/date-input";
import { getAgentAllBills, getAgentUsers } from "../lib/api";
import {
  endOfMonthISO,
  endOfWeekISO,
  formatDateDDMMYYYY,
  parseDDMMYYYYToISO,
  startOfMonthISO,
  startOfWeekISO,
  todayISO,
} from "../lib/date";
import { useToast } from "../hooks/use-toast";

const money = (n) => `${Number(n || 0).toFixed(2)} \u20B9`;
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const asISO = (v) => {
  if (!v) return "";
  const s = String(v);
  const dmy = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return parseDDMMYYYYToISO(s) || "";
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
};

const emptyData = { agentBills: [], agentOtherBills: [] };

function BillsTable({ rows }) {
  const total = rows.reduce((acc, r) => acc + num(r.totalInr), 0);
  return (
    <div>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-semibold">Agent Bills</div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{rows.length} rows</Badge>
          <Badge variant="secondary">Total: {money(total)}</Badge>
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border bg-white">
        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">No bills found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-muted/30 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Group</th>
                  <th className="px-3 py-2 text-left">Client</th>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-left">Bank</th>
                  <th className="px-3 py-2 text-right">Amount ($)</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {rows.map((r, idx) => (
                  <tr key={`b-${idx}`} className="border-t">
                    <td className="px-3 py-2">{r.dateISO ? formatDateDDMMYYYY(r.dateISO) : "-"}</td>
                    <td className="px-3 py-2">{r.group || "-"}</td>
                    <td className="px-3 py-2">{r.client || "-"}</td>
                    <td className="px-3 py-2">{r.source || "-"}</td>
                    <td className="px-3 py-2">{r.bank || "-"}</td>
                    <td className="px-3 py-2 text-right">{num(r.amountUsd).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{num(r.rate).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-medium text-emerald-700">{num(r.totalInr).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function OtherTable({ rows }) {
  const total = rows.reduce((acc, r) => acc + num(r.totalInr), 0);
  return (
    <div>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-semibold">Agent Other Bills</div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{rows.length} rows</Badge>
          <Badge variant="secondary">Total: {money(total)}</Badge>
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border bg-white">
        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">No bills found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-muted/30 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Comment</th>
                  <th className="px-3 py-2 text-right">Amount (₹)</th>
                  <th className="px-3 py-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {rows.map((r, idx) => (
                  <tr key={`o-${idx}`} className="border-t">
                    <td className="px-3 py-2">{r.dateISO ? formatDateDDMMYYYY(r.dateISO) : "-"}</td>
                    <td className="px-3 py-2">{r.comment || "-"}</td>
                    <td className="px-3 py-2 text-right">{num(r.amountInr).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-medium text-red-600">{num(r.totalInr).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentAllBillsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(false);

  const [datePreset, setDatePreset] = useState("all");
  const [fromDDMMYYYY, setFromDDMMYYYY] = useState("");
  const [toDDMMYYYY, setToDDMMYYYY] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const rows = await getAgentUsers();
        const mapped = (rows || []).map((x) => ({ id: String(x.id), name: x.name || "" }));
        setAgents(mapped);
        if (mapped[0]?.id) setSelectedAgentId(mapped[0].id);
      } catch (e) {
        toast({ title: "Load failed", description: e.message || "Unable to load agents", variant: "destructive" });
      }
    })();
  }, [toast]);

  useEffect(() => {
    if (!selectedAgentId) {
      setData(emptyData);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const res = await getAgentAllBills(selectedAgentId);
        setData({
          agentBills: res?.agentBills || [],
          agentOtherBills: res?.agentOtherBills || [],
        });
      } catch (e) {
        toast({ title: "Load failed", description: e.message || "Unable to load agent bills", variant: "destructive" });
        setData(emptyData);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedAgentId, toast]);

  const allRows = useMemo(() => {
    const billRows = (data.agentBills || []).map((x) => ({
      section: "bill",
      dateISO: asISO(x.bill_date),
      group: x.group_name || "-",
      client: x.client_name || "-",
      source: x.source || "-",
      bank: x.bank_name || "-",
      amountUsd: num(x.amount),
      rate: num(x.rate),
      totalInr: num(x.total),
      comment: "",
      amountInr: 0,
    }));
    const otherRows = (data.agentOtherBills || []).map((x) => ({
      section: "other",
      dateISO: asISO(x.bill_date),
      group: "",
      client: "",
      source: "",
      bank: "",
      amountUsd: 0,
      rate: 0,
      totalInr: num(x.total),
      comment: x.comment || "-",
      amountInr: num(x.amount),
    }));
    return [...billRows, ...otherRows].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
  }, [data]);

  const selectedRange = useMemo(() => {
    const tISO = todayISO();
    let fromISO = null;
    let toISO = null;

    if (datePreset === "this_week") {
      fromISO = startOfWeekISO(tISO);
      toISO = endOfWeekISO(tISO);
    } else if (datePreset === "last_week") {
      const startThisWeek = startOfWeekISO(tISO);
      const d = new Date(startThisWeek + "T00:00:00");
      d.setDate(d.getDate() - 7);
      const startLastWeek = d.toISOString().slice(0, 10);
      fromISO = startOfWeekISO(startLastWeek);
      toISO = endOfWeekISO(startLastWeek);
    } else if (datePreset === "this_month") {
      fromISO = startOfMonthISO(tISO);
      toISO = endOfMonthISO(tISO);
    } else if (datePreset === "custom") {
      fromISO = parseDDMMYYYYToISO(fromDDMMYYYY);
      toISO = parseDDMMYYYYToISO(toDDMMYYYY);
    }

    return { fromISO, toISO };
  }, [datePreset, fromDDMMYYYY, toDDMMYYYY]);

  const filtered = useMemo(() => {
    const { fromISO, toISO } = selectedRange;
    const q = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (fromISO && r.dateISO < fromISO) return false;
      if (toISO && r.dateISO > toISO) return false;
      if (!q) return true;
      return (
        (r.group || "").toLowerCase().includes(q) ||
        (r.client || "").toLowerCase().includes(q) ||
        (r.source || "").toLowerCase().includes(q) ||
        (r.bank || "").toLowerCase().includes(q) ||
        (r.comment || "").toLowerCase().includes(q) ||
        formatDateDDMMYYYY(r.dateISO || "").includes(q)
      );
    });
  }, [allRows, search, selectedRange]);

  const filteredAgentBills = useMemo(() => filtered.filter((x) => x.section === "bill"), [filtered]);
  const filteredAgentOtherBills = useMemo(() => filtered.filter((x) => x.section === "other"), [filtered]);

  const totals = useMemo(() => {
    const billTotal = filteredAgentBills.reduce((acc, r) => acc + num(r.totalInr), 0);
    const otherTotal = filteredAgentOtherBills.reduce((acc, r) => acc + num(r.totalInr), 0);
    return {
      count: filtered.length,
      billTotal,
      otherTotal,
      grandTotal: billTotal + otherTotal,
    };
  }, [filtered, filteredAgentBills, filteredAgentOtherBills]);

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Agent All Bills</h1>
              <p className="mt-1 text-sm text-muted-foreground">View agent bill and agent other bill entries.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Prototype</Badge>
              <Button variant="secondary" onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="text-sm font-semibold">Filters</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4 lg:items-end">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Agent</Label>
                    <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                      <SelectTrigger className="mt-1 h-11">
                        <SelectValue placeholder="Select Agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Date Range</Label>
                    <Select value={datePreset} onValueChange={setDatePreset}>
                      <SelectTrigger className="mt-1 h-11">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="this_week">This Week</SelectItem>
                        <SelectItem value="last_week">Last Week</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="custom">Custom Date Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {datePreset === "custom" ? (
                    <>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">From (DD-MM-YYYY)</Label>
                        <DateInput valueISO={parseDDMMYYYYToISO(fromDDMMYYYY) ?? ""} onChangeISO={(iso) => setFromDDMMYYYY(formatDateDDMMYYYY(iso))} maxISO={todayISO()} />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">To (DD-MM-YYYY)</Label>
                        <DateInput valueISO={parseDDMMYYYYToISO(toDDMMYYYY) ?? ""} onChangeISO={(iso) => setToDDMMYYYY(formatDateDDMMYYYY(iso))} maxISO={todayISO()} />
                      </div>
                    </>
                  ) : null}

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Search</Label>
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Group, client, source, bank, comment..." className="mt-1 h-11" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-sm font-semibold">All Bills (Agent)</div>
                  <div className="mt-1 text-xs text-muted-foreground">Showing separate tables for each bill type.</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{loading ? "Loading..." : `${totals.count} rows`}</Badge>
                </div>
              </div>

              <div className="mt-4 space-y-6">
                <BillsTable rows={filteredAgentBills} />
                <OtherTable rows={filteredAgentOtherBills} />

                <div className="rounded-xl border bg-muted/20 px-4 py-3">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm font-semibold">Grand Total</div>
                    <div className="text-sm font-semibold">{money(totals.grandTotal)}</div>
                  </div>
                  <div className="mt-3 rounded-xl border bg-white/70 p-3">
                    <div className="text-xs text-muted-foreground">Bill type totals</div>
                    <div className="mt-1 text-sm font-semibold">Agent Bills + Agent Other Bills = Grand Total</div>
                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                      <div className="rounded-lg border bg-muted/10 px-3 py-2">
                        <div className="text-xs text-muted-foreground">Agent Bills</div>
                        <div className="font-semibold">{money(totals.billTotal)}</div>
                      </div>
                      <div className="rounded-lg border bg-muted/10 px-3 py-2">
                        <div className="text-xs text-muted-foreground">Agent Other</div>
                        <div className="font-semibold">{money(totals.otherTotal)}</div>
                      </div>
                    </div>
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
