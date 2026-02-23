import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CreditCard, Info } from "lucide-react";
import {
  createDollarRate,
  createPaymentMethod,
  createProcessingCalculation,
  createProcessingGroupCalculation,
  createTransactionDetail,
  deleteDollarRate,
  deletePaymentMethod,
  deleteProcessingCalculation,
  deleteProcessingGroupCalculation,
  deleteTransactionDetail,
  getDollarRateByDate,
  getDollarRates,
  getGroupClientOptionsByType,
  getPaymentMethods,
  getProcessingCalculations,
  getProcessingGroupCalculations,
  getTransactionDetails,
  updateProcessingCalculation,
  updateProcessingGroupCalculation,
  updateTransactionDetail,
  updateDollarRate,
} from "../lib/api";
import { formatDateDDMMYYYY, todayISO } from "../lib/date";
import AppSidebar from "../components/app-sidebar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/Card";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/Select";
import { useToast } from "../hooks/use-toast";

const STEPS = ["Add Payment", "Payment Type", "Dollar Rate", "Processing Details", "Client Details"];
const STEP_LABELS = {
  "Add Payment": "Add Payment",
  "Payment Type": "Payment Type",
  "Dollar Rate": "Dollar Rate",
  "Processing Details": "Processing Details",
  "Client Details": "Client Details",
};
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const clampPct = (v) => Math.max(0, Math.min(100, toNum(v)));
const toISODateOnly = (value) => {
  if (!value) return "";
  const raw = String(value);
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
};

function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm ${active ? "bg-white ring-1 ring-border" : "text-muted-foreground hover:bg-white/60"}`}
    >
      {label}
    </button>
  );
}

function LogTable({ title, rows, groupHeader, pctHeader, totalHeader, onEdit, onDelete, busy }) {
  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{title}</div>
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="grid grid-cols-8 gap-3 border-b bg-muted/30 px-4 py-3 text-xs font-semibold">
          <div>Date</div>
          <div>Amount ($)</div>
          <div>Rate (₹)</div>
          <div>{groupHeader}</div>
          <div>Client</div>
          <div>{pctHeader}</div>
          <div>{totalHeader}</div>
          <div>Action</div>
        </div>
        <div className="overflow-x-auto">
          {rows.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No records found.</div>
          ) : (
            <div className="divide-y">
              {rows.map((row, idx) => (
                <div key={`${row.tx?.id || "tx"}-${row.calc?.id || "calc"}-${idx}`} className="grid grid-cols-8 items-center gap-3 px-4 py-3 text-sm">
                  <div>{row.dateISO ? formatDateDDMMYYYY(row.dateISO) : "-"}</div>
                  <div>{Number(row.amountUsd || 0).toFixed(2)}</div>
                  <div>{Number(row.rate || 0).toFixed(2)}</div>
                  <div>{row.groupName || "-"}</div>
                  <div>{row.clientName || "-"}</div>
                  <div>{Number(row.percent || 0).toFixed(2)}</div>
                  <div>{Number(row.total || 0).toFixed(2)}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => onEdit(row)}>Edit</Button>
                    {onDelete ? (
                      <Button variant="ghost" disabled={busy} onClick={() => onDelete(row)}>Delete</Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProcessingPaymentPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState("Add Payment");
  const [busy, setBusy] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [dollarRateEntries, setDollarRateEntries] = useState([]);
  const [processingGroups, setProcessingGroups] = useState([]);
  const [paymentGroups, setPaymentGroups] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [processingCalcs, setProcessingCalcs] = useState([]);
  const [paymentCalcs, setPaymentCalcs] = useState([]);

  const [date, setDate] = useState("");
  const [paymentTypeId, setPaymentTypeId] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [dollarRate, setDollarRate] = useState("");
  const [dollarRateId, setDollarRateId] = useState("");
  const [processingPct, setProcessingPct] = useState("");
  const [processingGroupId, setProcessingGroupId] = useState("");
  const [paymentGroupPct, setPaymentGroupPct] = useState("");
  const [paymentGroupId, setPaymentGroupId] = useState("");
  const [newPaymentMethodName, setNewPaymentMethodName] = useState("");
  const [editingDollarRateId, setEditingDollarRateId] = useState("");
  const [dollarRateFormDate, setDollarRateFormDate] = useState("");
  const [dollarRateFormValue, setDollarRateFormValue] = useState("");
  const [editMode, setEditMode] = useState("");
  const [editingTxId, setEditingTxId] = useState("");
  const [editingCalcId, setEditingCalcId] = useState("");
  const [editingPaymentCalcId, setEditingPaymentCalcId] = useState("");

  const selectedProcessingGroup = useMemo(() => processingGroups.find((g) => g.id === processingGroupId), [processingGroupId, processingGroups]);
  const selectedPaymentGroup = useMemo(() => paymentGroups.find((g) => g.id === paymentGroupId), [paymentGroupId, paymentGroups]);
  const amountUsdNum = useMemo(() => Math.max(0, toNum(amountUsd)), [amountUsd]);
  const dollarRateNum = useMemo(() => Math.max(0, toNum(dollarRate)), [dollarRate]);
  const processingPctNum = useMemo(() => clampPct(processingPct), [processingPct]);
  const paymentPctNum = useMemo(() => clampPct(paymentGroupPct), [paymentGroupPct]);
  const isPaymentPctGreaterThanProcessing = paymentPctNum > processingPctNum;
  const processingTotal = useMemo(() => amountUsdNum * (processingPctNum / 100) * dollarRateNum, [amountUsdNum, processingPctNum, dollarRateNum]);
  const paymentTotal = useMemo(() => ((amountUsdNum * dollarRateNum * paymentPctNum) / 100) * -1, [amountUsdNum, dollarRateNum, paymentPctNum]);
  const canSave = useMemo(() => {
    if (!date || !paymentTypeId || !dollarRateId || amountUsdNum <= 0) return false;
    if (isPaymentPctGreaterThanProcessing) return false;
    if (editMode === "processing") return !!processingGroupId;
    if (editMode === "payment") return !!paymentGroupId;
    return !!processingGroupId && !!paymentGroupId;
  }, [date, paymentTypeId, dollarRateId, amountUsdNum, isPaymentPctGreaterThanProcessing, processingGroupId, paymentGroupId, editMode]);

  const processingRows = useMemo(() => {
    const n = Math.max(transactions.length, processingCalcs.length);
    return Array.from({ length: n }, (_, i) => {
      const tx = transactions[i] || null;
      const calc = processingCalcs[i] || null;
      const groupId = calc?.processing_group_id ? String(calc.processing_group_id) : tx?.processingGroupId || "";
      const group = processingGroups.find((g) => g.id === groupId);
      return {
        tx,
        calc,
        dateISO: tx?.dateISO || "",
        amountUsd: tx?.amountUsd ?? 0,
        rate: tx?.dollarRate ?? 0,
        groupName: group?.name || "",
        clientName: group?.clientName || "",
        percent: Number(calc?.processing_percent ?? tx?.processingPct ?? 0),
        total: Number(calc?.processing_total ?? tx?.processingTotalInr ?? 0)
      };
    }).filter((r) => r.tx || r.calc);
  }, [transactions, processingCalcs, processingGroups]);

  const paymentRows = useMemo(() => {
    const n = Math.max(transactions.length, paymentCalcs.length);
    return Array.from({ length: n }, (_, i) => {
      const tx = transactions[i] || null;
      const calc = paymentCalcs[i] || null;
      const groupId = calc?.processing_group_id ? String(calc.processing_group_id) : tx?.paymentGroupId || "";
      const group = paymentGroups.find((g) => g.id === groupId);
      return {
        tx,
        calc,
        dateISO: tx?.dateISO || "",
        amountUsd: tx?.amountUsd ?? 0,
        rate: tx?.dollarRate ?? 0,
        groupName: group?.name || "",
        clientName: group?.clientName || "",
        percent: Number(calc?.processing_percent ?? tx?.paymentPct ?? 0),
        total: Number(calc?.processing_total ?? tx?.paymentTotalInr ?? 0),
      };
    }).filter((r) => r.tx || r.calc);
  }, [transactions, paymentCalcs, paymentGroups]);

  async function loadAll() {
    try {
      const [pm, dr, tx, pg, payg, pc, pgc] = await Promise.all([
        getPaymentMethods(),
        getDollarRates(),
        getTransactionDetails(),
        getGroupClientOptionsByType("Processing"),
        getGroupClientOptionsByType("Payment"),
        getProcessingCalculations(),
        getProcessingGroupCalculations(),
      ]);
      setPaymentMethods((pm || []).map((x) => ({ id: String(x.id), name: x.name })));
      setDollarRateEntries((dr || []).map((x) => ({ id: String(x.id), date: toISODateOnly(x.rate_date), rate: Number(x.rate) })));
      setProcessingGroups(pg || []);
      setPaymentGroups(payg || []);
      setProcessingCalcs(pc || []);
      setPaymentCalcs(pgc || []);
      setTransactions((tx || []).map((x) => ({
        id: String(x.id),
        dateISO: toISODateOnly(x.transaction_date),
        paymentTypeId: String(x.payment_method_id),
        amountUsd: Number(x.amount),
        dollarRate: Number(x.dollar_rate || 0),
        dollarRateId: String(x.dollar_rate_id || ""),
        processingGroupId: "",
        paymentGroupId: "",
        processingPct: 0,
        paymentPct: 0,
        processingTotalInr: 0,
        paymentTotalInr: 0,
      })));
    } catch (e) {
      toast({ title: "Load failed", description: e.message || "Unable to load data", variant: "destructive" });
    }
  }

  useEffect(() => { loadAll(); }, []);

  function onStepClick(step) {
    setActiveStep(step);
    void loadAll();
  }

  async function onDateChange(next) {
    const safeDate = toISODateOnly(next);
    setDate(safeDate);
    if (!safeDate) { setDollarRate(""); setDollarRateId(""); return; }
    try {
      const cached = dollarRateEntries.find((entry) => entry.date === safeDate);
      if (cached) {
        setDollarRate(String(cached.rate));
        setDollarRateId(String(cached.id));
        return;
      }
      const row = await getDollarRateByDate(safeDate);
      if (!row) {
        setDollarRate("");
        setDollarRateId("");
        toast({ title: "Dollar rate not found", description: "Add a rate for the selected date in Dollar Rate tab.", variant: "destructive" });
        return;
      }
      setDollarRate(String(row.rate));
      setDollarRateId(String(row.id));
    } catch {
      setDollarRate("0");
      setDollarRateId("");
    }
  }

  async function onSavePayment(e) {
    e.preventDefault();
    if (!canSave || busy) return;
    if (isPaymentPctGreaterThanProcessing) {
      toast({ title: "Validation error", description: "Payment Group % cannot be greater than Processing %.", variant: "destructive" });
      return;
    }
    try {
      setBusy(true);
      const txPayload = {
        transaction_date: date,
        payment_method_id: Number(paymentTypeId),
        amount: amountUsdNum,
        dollar_rate_id: Number(dollarRateId),
      };

      if (editMode && editingTxId) {
        await updateTransactionDetail(editingTxId, txPayload);
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === editingTxId
              ? { ...t, dateISO: date, paymentTypeId, amountUsd: amountUsdNum, dollarRate: dollarRateNum, dollarRateId: String(dollarRateId) }
              : t
          )
        );

        // Update both processing and payment calculations
        if (editingCalcId) {
          const updated = await updateProcessingCalculation(editingCalcId, {
            processing_percent: processingPctNum,
            processing_group_id: Number(processingGroupId),
            client_id: Number(selectedProcessingGroup?.clientId || 0),
            processing_total: processingTotal,
          });
          setProcessingCalcs((prev) => prev.map((x) => (String(x.id) === String(editingCalcId) ? updated : x)));
        }

        if (editingPaymentCalcId) {
          const updated = await updateProcessingGroupCalculation(editingPaymentCalcId, {
            processing_percent: paymentPctNum,
            processing_group_id: Number(paymentGroupId),
            client_id: Number(selectedPaymentGroup?.clientId || 0),
            processing_total: paymentTotal,
          });
          setPaymentCalcs((prev) => prev.map((x) => (String(x.id) === String(editingPaymentCalcId) ? updated : x)));
        }
      } else {
        const tx = await createTransactionDetail(txPayload);
        const [pc, pgc] = await Promise.all([
          createProcessingCalculation({
            processing_percent: processingPctNum,
            processing_group_id: Number(processingGroupId),
            client_id: Number(selectedProcessingGroup?.clientId || 0),
            processing_total: processingTotal,
          }),
          createProcessingGroupCalculation({
            processing_percent: paymentPctNum,
            processing_group_id: Number(paymentGroupId),
            client_id: Number(selectedPaymentGroup?.clientId || 0),
            processing_total: paymentTotal,
          }),
        ]);
        setTransactions((prev) => [{
          id: String(tx.id),
          dateISO: date,
          paymentTypeId,
          amountUsd: amountUsdNum,
          dollarRate: dollarRateNum,
          dollarRateId: String(dollarRateId),
          processingGroupId,
          paymentGroupId,
          processingPct: processingPctNum,
          paymentPct: paymentPctNum,
          processingTotalInr: processingTotal,
          paymentTotalInr: paymentTotal,
        }, ...prev]);
        setProcessingCalcs((prev) => [pc, ...prev]);
        setPaymentCalcs((prev) => [pgc, ...prev]);
      }

      // Reset form fields
      setDate("");
      setPaymentTypeId("");
      setAmountUsd("");
      setDollarRate("");
      setDollarRateId("");
      setProcessingPct("");
      setProcessingGroupId("");
      setPaymentGroupPct("");
      setPaymentGroupId("");
      setEditMode("");
      setEditingTxId("");
      setEditingCalcId("");
      setEditingPaymentCalcId("");
      setActiveStep("Processing Details");
      toast({ title: "Saved", description: editMode ? "Transaction updated successfully." : "Transaction saved successfully." });
    } catch (e) {
      toast({ title: "Save failed", description: e.message || "Unable to save", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Payment Processing</h1>
              <p className="mt-1 text-sm text-muted-foreground">Capture payment inputs, then calculate processing and payment-group totals.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Prototype</Badge>
              <Button variant="secondary" onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border bg-muted/20 p-2">
            <div className="flex flex-wrap gap-2">
              {STEPS.map((s) => (
                <TabButton
                  key={s}
                  active={activeStep === s}
                  label={STEP_LABELS[s] || s}
                  onClick={() => onStepClick(s)}
                />
              ))}
            </div>
          </div>

          <Card className="mt-6 rounded-2xl border bg-white/70 p-5 shadow-sm">
            {activeStep === "Payment Type" ? (
              <div className="space-y-4">
                <div className="text-xl font-semibold">Manage Payment Methods</div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_110px]">
                  <Input value={newPaymentMethodName} onChange={(e) => setNewPaymentMethodName(e.target.value)} placeholder="Add Payment Method" className="h-11" />
                  <Button className="h-11" disabled={busy} onClick={async () => {
                    const name = newPaymentMethodName.trim();
                    if (!name) return;
                    try { setBusy(true); const r = await createPaymentMethod({ name }); setPaymentMethods((p) => [...p, { id: String(r.id), name: r.name }]); setNewPaymentMethodName(""); }
                    catch (e) { toast({ title: "Add failed", description: e.message, variant: "destructive" }); }
                    finally { setBusy(false); }
                  }}>Add</Button>
                </div>
                <div className="divide-y rounded-xl border">
                  {paymentMethods.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-4 py-3">
                      <div>{m.name}</div>
                      <Button variant="ghost" disabled={busy} onClick={async () => {
                        try { setBusy(true); await deletePaymentMethod(m.id); setPaymentMethods((p) => p.filter((x) => x.id !== m.id)); }
                        catch (e) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
                        finally { setBusy(false); }
                      }}>Delete</Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeStep === "Dollar Rate" ? (
              <div className="space-y-4">
                <div className="text-xl font-semibold">Set Daily Dollar Rate</div>
                <DateInput valueISO={dollarRateFormDate} onChangeISO={(iso) => setDollarRateFormDate(toISODateOnly(iso))} maxISO={todayISO()} />
                <Input inputMode="decimal" value={dollarRateFormValue} onChange={(e) => setDollarRateFormValue(e.target.value)} placeholder="Dollar Rate" onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }} />
                <div className="flex gap-3">
                  <Button className="w-full" disabled={busy} onClick={async () => {
                  const d = dollarRateFormDate.trim();
                  const rate = toNum(dollarRateFormValue);
                  if (!d || rate <= 0) return;
                  try {
                    setBusy(true);
                    if (editingDollarRateId) await updateDollarRate(editingDollarRateId, { rate_date: d, rate });
                    else await createDollarRate({ rate_date: d, rate });
                    const latest = await getDollarRates();
                    setDollarRateEntries((latest || []).map((x) => ({ id: String(x.id), date: toISODateOnly(x.rate_date), rate: Number(x.rate) })));
                    setEditingDollarRateId(""); setDollarRateFormDate(""); setDollarRateFormValue("");
                  } catch (e) {
                    toast({ title: "Save failed", description: e.message, variant: "destructive" });
                  } finally {
                    setBusy(false);
                  }
                  }}>{editingDollarRateId ? "Update Rate" : "Save Rate"}</Button>
                  {editingDollarRateId ? (
                    <Button variant="secondary" disabled={busy} onClick={() => {
                      setEditingDollarRateId("");
                      setDollarRateFormDate("");
                      setDollarRateFormValue("");
                    }}>Cancel Edit</Button>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Recent Rates</div>
                  <div className="overflow-hidden rounded-xl border bg-white">
                    <div className="grid grid-cols-[1fr_1fr_180px] gap-3 border-b bg-muted/30 px-4 py-3 text-xs font-semibold">
                      <div>Date</div><div>Rate (₹)</div><div>Action</div>
                    </div>
                    <div className="divide-y">
                      {dollarRateEntries.map((r) => (
                        <div key={r.id} className="grid grid-cols-[1fr_1fr_180px] items-center gap-3 px-4 py-3 text-sm">
                          <div>{formatDateDDMMYYYY(r.date)}</div>
                          <div>{r.rate.toFixed(2)}</div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={() => {
                              setEditingDollarRateId(r.id);
                              setDollarRateFormDate(toISODateOnly(r.date));
                              setDollarRateFormValue(String(r.rate));
                            }}>Edit</Button>
                            <Button variant="ghost" disabled={busy} onClick={async () => {
                              try { setBusy(true); await deleteDollarRate(r.id); setDollarRateEntries((p) => p.filter((x) => x.id !== r.id)); }
                              catch (e) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
                              finally { setBusy(false); }
                            }}>Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeStep === "Add Payment" ? (
              <form onSubmit={onSavePayment} className="space-y-6">
                <div className="flex items-center gap-2 text-sm font-semibold"><Info className="h-4 w-4 text-primary" /> Transaction Details</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} /></div>
                  <div><Label>Payment Type</Label><Select value={paymentTypeId} onValueChange={setPaymentTypeId}><SelectTrigger><SelectValue placeholder="Select Method..." /></SelectTrigger><SelectContent>{paymentMethods.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Amount ($)</Label><Input type="number" min={0} step="any" value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }} /></div>
                  <div><Label>Rate (₹)</Label><Input value={dollarRateNum > 0 ? dollarRateNum.toFixed(2) : ""} readOnly /></div>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center gap-2 text-sm font-semibold"><CreditCard className="h-4 w-4 text-primary" /> Processing Calculation</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div><Label>Processing %</Label><Input inputMode="decimal" type="number"  value={processingPct} onChange={(e) => setProcessingPct(e.target.value)} onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }} /></div>
                  <div><Label>Processing Group</Label><Select value={processingGroupId} onValueChange={setProcessingGroupId}><SelectTrigger><SelectValue placeholder="Select Group..." /></SelectTrigger><SelectContent>{processingGroups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Client</Label><Input readOnly value={selectedProcessingGroup?.clientName || ""} /></div>
                  <div><Label>Processing Total (₹)</Label><Input readOnly value={processingTotal.toFixed(2)} /></div>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center gap-2 text-sm font-semibold"><CreditCard className="h-4 w-4 text-primary" /> Payment Group Calculation</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label>Payment Group %</Label>
                    <Input inputMode="decimal" type="number" value={paymentGroupPct} onChange={(e) => setPaymentGroupPct(e.target.value)} onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }} />
                    {isPaymentPctGreaterThanProcessing ? (
                      <p className="mt-1 text-xs text-red-600">Payment Group % cannot be greater than Processing %.</p>
                    ) : null}
                  </div>
                  <div><Label>Payment Group</Label><Select value={paymentGroupId} onValueChange={setPaymentGroupId}><SelectTrigger><SelectValue placeholder="Select Group..." /></SelectTrigger><SelectContent>{paymentGroups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Client</Label><Input readOnly value={selectedPaymentGroup?.clientName || ""} /></div>
                  <div><Label>Payment Total (₹)</Label><Input readOnly value={paymentTotal.toFixed(2)} /></div>
                </div>
                <Button type="submit" disabled={!canSave || busy} className="w-full">{busy ? "Saving..." : "Save Transaction"}</Button>
              </form>
            ) : activeStep === "Processing Details" ? (
              <LogTable
                title="Processing Details Log"
                rows={processingRows}
                groupHeader="Processing Group"
                pctHeader="Proc. %"
                totalHeader="Processing Total (₹)"
                busy={busy}
                onEdit={async (row) => {
                  if (!row.tx || !row.calc) return;
                  try {
                    setBusy(true);
                    // Get the transaction index to find corresponding payment calc
                    const txIndex = transactions.findIndex((t) => t.id === row.tx.id);
                    const paymentCalc = txIndex >= 0 ? paymentCalcs[txIndex] : null;
                    
                    setEditMode("processing");
                    setEditingTxId(String(row.tx.id || ""));
                    setEditingCalcId(String(row.calc?.id || ""));
                    setEditingPaymentCalcId(String(paymentCalc?.id || ""));
                    setDate(toISODateOnly(row.tx.dateISO || ""));
                    setPaymentTypeId(row.tx.paymentTypeId || "");
                    setAmountUsd(String(row.tx.amountUsd || ""));
                    setDollarRate(String(row.tx.dollarRate || ""));
                    setDollarRateId(String(row.tx.dollarRateId || ""));
                    // Set processing calc data
                    setProcessingGroupId(row.calc?.processing_group_id ? String(row.calc.processing_group_id) : "");
                    setProcessingPct(String(row.percent || ""));
                    // Set payment calc data from the same index
                    setPaymentGroupId(paymentCalc?.processing_group_id ? String(paymentCalc.processing_group_id) : "");
                    setPaymentGroupPct(String(paymentCalc?.processing_percent || ""));
                    setActiveStep("Add Payment");
                  } finally {
                    setBusy(false);
                  }
                }}
                onDelete={async (row) => {
                  try {
                    setBusy(true);
                    const txId = row.tx?.id ? String(row.tx.id) : "";
                    const txIndex = txId ? transactions.findIndex((t) => String(t.id) === txId) : -1;
                    const paymentCalc = txIndex >= 0 ? paymentCalcs[txIndex] : null;
                    if (row.tx?.id) {
                      await deleteTransactionDetail(row.tx.id);
                      setTransactions((prev) => prev.filter((x) => String(x.id) !== txId));
                    }
                    if (row.calc?.id) {
                      await deleteProcessingCalculation(row.calc.id);
                      setProcessingCalcs((prev) => prev.filter((x) => String(x.id) !== String(row.calc.id)));
                    }
                    if (paymentCalc?.id) {
                      await deleteProcessingGroupCalculation(paymentCalc.id);
                      setPaymentCalcs((prev) => prev.filter((x) => String(x.id) !== String(paymentCalc.id)));
                    }
                  } catch (e) {
                    toast({ title: "Delete failed", description: e.message, variant: "destructive" });
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            ) : (
              <LogTable
                title="Payment Group Details Log"
                rows={paymentRows}
                groupHeader="Payment Group"
                pctHeader="Pay %"
                totalHeader="Payment Total (₹)"
                busy={busy}
                onEdit={async (row) => {
                  if (!row.tx || !row.calc) return;
                  try {
                    setBusy(true);
                    // Get the transaction index to find corresponding processing calc
                    const txIndex = transactions.findIndex((t) => t.id === row.tx.id);
                    const processingCalc = txIndex >= 0 ? processingCalcs[txIndex] : null;
                    
                    setEditMode("payment");
                    setEditingTxId(String(row.tx.id || ""));
                    setEditingCalcId(String(processingCalc?.id || ""));
                    setEditingPaymentCalcId(String(row.calc?.id || ""));
                    setDate(toISODateOnly(row.tx.dateISO || ""));
                    setPaymentTypeId(row.tx.paymentTypeId || "");
                    setAmountUsd(String(row.tx.amountUsd || ""));
                    setDollarRate(String(row.tx.dollarRate || ""));
                    setDollarRateId(String(row.tx.dollarRateId || ""));
                    // Set payment calc data
                    setPaymentGroupId(row.calc?.processing_group_id ? String(row.calc.processing_group_id) : "");
                    setPaymentGroupPct(String(row.percent || ""));
                    // Set processing calc data from the same index
                    setProcessingGroupId(processingCalc?.processing_group_id ? String(processingCalc.processing_group_id) : "");
                    setProcessingPct(String(processingCalc?.processing_percent || ""));
                    setActiveStep("Add Payment");
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            )}
          </Card>
        </div>
      </div>
    </AppSidebar>
  );
}
