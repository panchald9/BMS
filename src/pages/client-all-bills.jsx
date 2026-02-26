import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Download } from "lucide-react";
import AppSidebar from "../components/app-sidebar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/Select";
import { exportClientAllBillsExcel, getClientAllBills, getClientUsers } from "../lib/api";
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

const BILL_TYPES = ["Claim Bills", "Depo Bills", "Other Bills", "Processing Bills", "Payment Bills"];
const ALL_CLIENTS_VALUE = "all";

const emptySections = {
  claimBills: [],
  depoBills: [],
  otherBills: [],
  processingBills: [],
  paymentBills: [],
};

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

function mapRows(data) {
  const claimRows = (data.claimBills || []).map((x) => ({
    type: "Claim Bills",
    dateISO: asISO(x.bill_date),
    group: x.group_name || "-",
    client: x.client_name || "-",
    bank: x.bank_name || "-",
    amountUsd: num(x.amount),
    rate: num(x.rate),
    totalInr: num(x.total),
  }));

  const depoRows = (data.depoBills || []).map((x) => ({
    type: "Depo Bills",
    dateISO: asISO(x.bill_date),
    group: x.group_name || "-",
    client: x.client_name || "-",
    bank: x.bank_name || "-",
    amountUsd: num(x.amount),
    rate: num(x.rate),
    totalInr: num(x.total),
  }));

  const otherRows = (data.otherBills || []).map((x) => ({
    type: "Other Bills",
    dateISO: asISO(x.bill_date),
    group: x.group_name || "-",
    client: x.client_name || "-",
    amountUsd: num(x.amount),
    rate: 0,
    totalInr: num(x.total),
  }));

  const processingRows = (data.processingBills || []).map((x) => ({
    type: "Processing Bills",
    dateISO: asISO(x.bill_date),
    group: x.group_name || "-",
    client: x.client_name || "-",
    paymentType: x.payment_method_name || "-",
    amountUsd: num(x.amount),
    pct: num(x.processing_percent),
    rate: num(x.dollar_rate),
    totalInr: num(x.total),
  }));

  const paymentRows = (data.paymentBills || []).map((x) => ({
    type: "Payment Bills",
    dateISO: asISO(x.bill_date),
    group: x.group_name || "-",
    client: x.client_name || "-",
    paymentType: x.payment_method_name || "-",
    amountUsd: num(x.amount),
    pct: num(x.processing_percent),
    rate: num(x.dollar_rate),
    totalInr: num(x.total),
  }));

  return [...claimRows, ...depoRows, ...otherRows, ...processingRows, ...paymentRows].sort((a, b) =>
    a.dateISO < b.dateISO ? 1 : -1
  );
}

function BillTable({ type, rows }) {
  const total = rows.reduce((acc, r) => acc + num(r.totalInr), 0);
  const isOther = type === "Other Bills";
  const isProcOrPay = type === "Processing Bills" || type === "Payment Bills";

  return (
    <div>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-semibold">{type}</div>
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
                  {!isOther ? <th className="px-3 py-2 text-left">{isProcOrPay ? "Payment Type" : "Bank"}</th> : null}
                  <th className="px-3 py-2 text-right">Amount ($)</th>
                  {isProcOrPay ? <th className="px-3 py-2 text-right">%</th> : null}
                  <th className="px-3 py-2 text-right">Dollar Rate</th>
                  <th className="px-3 py-2 text-right">Total (\u20B9)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {rows.map((r, idx) => (
                  <tr key={`${type}-${idx}`} className="border-t">
                    <td className="px-3 py-2">{r.dateISO ? formatDateDDMMYYYY(r.dateISO) : "-"}</td>
                    <td className="px-3 py-2">{r.group || "-"}</td>
                    <td className="px-3 py-2">{r.client || "-"}</td>
                    {!isOther ? <td className="px-3 py-2">{isProcOrPay ? r.paymentType || "-" : r.bank || "-"}</td> : null}
                    <td className="px-3 py-2 text-right">{num(r.amountUsd).toFixed(2)}</td>
                    {isProcOrPay ? <td className="px-3 py-2 text-right">{num(r.pct).toFixed(2)}</td> : null}
                    <td className="px-3 py-2 text-right">{r.rate ? num(r.rate).toFixed(2) : "-"}</td>
                    <td className={`px-3 py-2 text-right font-medium ${num(r.totalInr) < 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {num(r.totalInr).toFixed(2)}
                    </td>
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

export default function ClientAllBillsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(ALL_CLIENTS_VALUE);
  const [sections, setSections] = useState(emptySections);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [search, setSearch] = useState("");

  const [datePreset, setDatePreset] = useState("all");
  const [fromDDMMYYYY, setFromDDMMYYYY] = useState("");
  const [toDDMMYYYY, setToDDMMYYYY] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const rows = await getClientUsers();
        const mapped = (rows || []).map((x) => ({ id: String(x.id), name: x.name || "" }));
        setClients(mapped);
      } catch (e) {
        toast({ title: "Load failed", description: e.message || "Unable to load clients", variant: "destructive" });
      }
    })();
  }, [toast]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const clientIdArg = selectedClientId === ALL_CLIENTS_VALUE ? null : selectedClientId;
        const data = await getClientAllBills(clientIdArg);
        setSections({
          claimBills: data?.claimBills || [],
          depoBills: data?.depoBills || [],
          otherBills: data?.otherBills || [],
          processingBills: data?.processingBills || [],
          paymentBills: data?.paymentBills || [],
        });
      } catch (e) {
        toast({ title: "Load failed", description: e.message || "Unable to load bills", variant: "destructive" });
        setSections(emptySections);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClientId, toast]);

  const baseRows = useMemo(() => mapRows(sections), [sections]);

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

  const filteredRows = useMemo(() => {
    const { fromISO, toISO } = selectedRange;

    const searched = baseRows.filter((r) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (r.type || "").toLowerCase().includes(q) ||
        (r.group || "").toLowerCase().includes(q) ||
        (r.client || "").toLowerCase().includes(q) ||
        (r.bank || "").toLowerCase().includes(q) ||
        (r.paymentType || "").toLowerCase().includes(q) ||
        formatDateDDMMYYYY(r.dateISO || "").includes(q)
      );
    });

    const ranged = searched.filter((r) => {
      if (!fromISO && !toISO) return true;
      if (fromISO && r.dateISO < fromISO) return false;
      if (toISO && r.dateISO > toISO) return false;
      return true;
    });

    return ranged;
  }, [baseRows, search, selectedRange]);

  const sectioned = useMemo(() => {
    const map = new Map();
    BILL_TYPES.forEach((t) => map.set(t, []));
    filteredRows.forEach((r) => map.get(r.type)?.push(r));
    return map;
  }, [filteredRows]);

  const selectedRangeTotals = useMemo(
    () =>
      filteredRows.reduce(
        (acc, r) => {
          acc.count += 1;
          acc.total += num(r.totalInr);
          return acc;
        },
        { count: 0, total: 0 }
      ),
    [filteredRows]
  );

  const pendingDue = useMemo(() => {
    const { fromISO } = selectedRange;
    if (!fromISO) return 0;
    return baseRows.reduce((acc, r) => {
      if (r.dateISO && r.dateISO < fromISO) {
        return acc + num(r.totalInr);
      }
      return acc;
    }, 0);
  }, [baseRows, selectedRange]);

  const grandTotalAmount = selectedRangeTotals.total + pendingDue;

  const totalsByType = useMemo(() => {
    const sums = {
      claim: 0,
      depo: 0,
      processing: 0,
      payment: 0,
      other: 0,
    };
    filteredRows.forEach((r) => {
      if (r.type === "Claim Bills") sums.claim += num(r.totalInr);
      else if (r.type === "Depo Bills") sums.depo += num(r.totalInr);
      else if (r.type === "Processing Bills") sums.processing += num(r.totalInr);
      else if (r.type === "Payment Bills") sums.payment += num(r.totalInr);
      else if (r.type === "Other Bills") sums.other += num(r.totalInr);
    });
    return sums;
  }, [filteredRows]);

  const selectedRangeLabel =
    selectedRange.fromISO && selectedRange.toISO
      ? `${formatDateDDMMYYYY(selectedRange.fromISO)} - ${formatDateDDMMYYYY(selectedRange.toISO)}`
      : "All dates";

  const handleDownloadFilteredExcel = async () => {
    if (!filteredRows.length || isExporting) return;

    const clientLabel =
      selectedClientId === ALL_CLIENTS_VALUE
        ? "All Clients"
        : clients.find((c) => c.id === selectedClientId)?.name || "Selected Client";
    try {
      setIsExporting(true);
      const blob = await exportClientAllBillsExcel({
        clientLabel,
        dateRangeLabel: selectedRangeLabel,
        searchText: search.trim() || "N/A",
        rows: filteredRows,
        pendingDue,
        grandTotalAmount,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `client_bills_filtered_${todayISO()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({
        title: "Export failed",
        description: e?.message || "Unable to export Excel file",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Client All Bills</h1>
              <p className="mt-1 text-sm text-muted-foreground">View claim/depo/other/processing/payment bills for a client.</p>
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end lg:gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Client</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger className="mt-1 h-11">
                        <SelectValue placeholder="Select Client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_CLIENTS_VALUE}>All Clients</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
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
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type, group, client, date, note..." className="mt-1 h-11" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-sm font-semibold">All Bills (Client)</div>
                  <div className="mt-1 text-xs text-muted-foreground">Showing separate tables for each bill type.</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{loading ? "Loading..." : `${selectedRangeTotals.count} rows`}</Badge>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleDownloadFilteredExcel}
                    disabled={loading || !filteredRows.length || isExporting}
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? "Exporting..." : "Download Excel (Filtered)"}
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-6">
                {BILL_TYPES.map((type) => (
                  <BillTable key={type} type={type} rows={sectioned.get(type) || []} />
                ))}

                <div className="rounded-xl border bg-muted/20 px-4 py-3">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm font-semibold">Grand Total</div>
                    <div className="text-sm font-semibold">{money(grandTotalAmount)}</div>
                  </div>
                  <div className="mt-3 rounded-xl border bg-white/70 p-3">
                    <div className="text-xs text-muted-foreground">Bill type totals</div>
                    <div className="mt-1 text-sm font-semibold">
                      Claim Bills + Depo Bills + Processing Bills + Payment Bills + Other Bills + Pending/Due = Grand Total
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-6">
                      <div className="rounded-lg border bg-muted/10 px-3 py-2">
                        <div className="text-xs text-muted-foreground">Claim</div>
                        <div className="font-semibold">{money(totalsByType.claim)}</div>
                      </div>
                      <div className="rounded-lg border bg-muted/10 px-3 py-2">
                        <div className="text-xs text-muted-foreground">Depo</div>
                        <div className="font-semibold">{money(totalsByType.depo)}</div>
                      </div>
                      <div className="rounded-lg border bg-muted/10 px-3 py-2">
                        <div className="text-xs text-muted-foreground">Processing</div>
                        <div className="font-semibold">{money(totalsByType.processing)}</div>
                      </div>
                      <div className="rounded-lg border bg-muted/10 px-3 py-2">
                        <div className="text-xs text-muted-foreground">Payment</div>
                        <div className="font-semibold">{money(totalsByType.payment)}</div>
                      </div>
                      <div className="rounded-lg border bg-muted/10 px-3 py-2">
                        <div className="text-xs text-muted-foreground">Other</div>
                        <div className="font-semibold">{money(totalsByType.other)}</div>
                      </div>
                      <div className="rounded-lg border bg-muted/10 px-3 py-2">
                        <div className="text-xs text-muted-foreground">Pending/Due</div>
                        <div className="font-semibold">{money(pendingDue)}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Showing totals for all bills.</div>
                    {selectedRange.fromISO || selectedRange.toISO ? (
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                        <div className="rounded-lg border bg-muted/10 px-3 py-2">
                          <div className="text-xs text-muted-foreground">Selected range</div>
                          <div className="font-semibold">{selectedRangeLabel}</div>
                          <div className="text-xs text-muted-foreground">Range total: {money(selectedRangeTotals.total)}</div>
                        </div>
                        <div className="rounded-lg border bg-muted/10 px-3 py-2">
                          <div className="text-xs text-muted-foreground">
                            Pending / Due before {selectedRange.fromISO ? formatDateDDMMYYYY(selectedRange.fromISO) : "-"}
                          </div>
                          <div className="font-semibold">{money(pendingDue)}</div>
                        </div>
                      </div>
                    ) : null}
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
