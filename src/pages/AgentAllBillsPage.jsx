import { useMemo, useState } from "react"
import { useLocation } from "wouter"
import { BadgeDollarSign, ChevronRight, ClipboardList, FileText, Wallet } from "lucide-react"
import AppSidebar from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateInput } from "@/components/ui/date-input"
import {
  dateToISO,
  endOfWeekISO,
  formatDateDDMMYYYY,
  isoToDate,
  parseDDMMYYYYToISO,
  startOfMonthISO,
  startOfWeekISO,
  todayISO,
} from "@/lib/date"

const DEMO_AGENTS = []
const agentBillsSeed = []
const agentOtherSeed = []

function TabButton({ active, label, onClick, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl bg-white px-3 py-2 text-sm font-semibold shadow-sm"
          : "rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-white/60"
      }
      data-testid={testId}
    >
      {label}
    </button>
  )
}

export default function AgentAllBillsPage() {
  const [, setLocation] = useLocation();

  const [selectedAgent, setSelectedAgent] = useState(DEMO_AGENTS[0]?.name ?? "")
  const [datePreset, setDatePreset] = useState("all")
  const [fromDDMMYYYY, setFromDDMMYYYY] = useState("01-01-2026")
  const [toDDMMYYYY, setToDDMMYYYY] = useState("31-01-2026")
  const [search, setSearch] = useState("")

  const { rangeFromISO, rangeToISO } = useMemo(() => {
    let fromISO = null
    let toISO = null
    const tISO = todayISO()

    if (datePreset === "this_week") {
      fromISO = startOfWeekISO(tISO)
      toISO = endOfWeekISO(tISO)
    } else if (datePreset === "last_week") {
      const startThisWeek = startOfWeekISO(tISO)
      const d = new Date(startThisWeek + "T00:00:00")
      d.setDate(d.getDate() - 7)
      const startLastWeek = d.toISOString().slice(0, 10)
      fromISO = startOfWeekISO(startLastWeek)
      toISO = endOfWeekISO(startLastWeek)
    } else if (datePreset === "this_month") {
      fromISO = startOfMonthISO(tISO)
      toISO = tISO
    } else if (datePreset === "custom") {
      fromISO = parseDDMMYYYYToISO(fromDDMMYYYY)
      toISO = parseDDMMYYYYToISO(toDDMMYYYY)
    }

    return { rangeFromISO: fromISO, rangeToISO: toISO }
  }, [datePreset, fromDDMMYYYY, toDDMMYYYY])

  const {
    filteredAgentBillRows,
    filteredAgentOtherRows,
    pendingBeforeRangeTotal,
    periodBillTotal,
    periodOtherTotal
  } = useMemo(() => {

    const agentBills = agentBillsSeed.filter(r =>
      selectedAgent ? r.agent.toLowerCase() === selectedAgent.toLowerCase() : true
    );

    const agentOthers = agentOtherSeed.filter(r =>
      selectedAgent ? r.agent.toLowerCase() === selectedAgent.toLowerCase() : true
    );

    const pendingBills = rangeFromISO
      ? agentBills.filter(r => r.dateISO < rangeFromISO)
          .reduce((acc, r) => acc + (r.totalInr || 0), 0)
      : 0;

    const pendingOther = rangeFromISO
      ? agentOthers.filter(r => r.dateISO < rangeFromISO)
          .reduce((acc, r) => acc + (r.totalInr || 0), 0)
      : 0;

    const inRangeBills = agentBills.filter(r => {
      if (!rangeFromISO && !rangeToISO) return true;
      if (rangeFromISO && r.dateISO < rangeFromISO) return false;
      if (rangeToISO && r.dateISO > rangeToISO) return false;
      return true;
    });

    const inRangeOthers = agentOthers.filter(r => {
      if (!rangeFromISO && !rangeToISO) return true;
      if (rangeFromISO && r.dateISO < rangeFromISO) return false;
      if (rangeToISO && r.dateISO > rangeToISO) return false;
      return true;
    });

    const periodBillTotal = inRangeBills.reduce((acc, r) => acc + (r.totalInr || 0), 0);
    const periodOtherTotal = inRangeOthers.reduce((acc, r) => acc + (r.totalInr || 0), 0);

    const q = search.trim().toLowerCase();

    const displayBills = inRangeBills
      .filter(r => !q || r.group.toLowerCase().includes(q) ||
        r.client.toLowerCase().includes(q) ||
        r.source.toLowerCase().includes(q) ||
        formatDateDDMMYYYY(r.dateISO).includes(q)
      )
      .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));

    const displayOthers = inRangeOthers
      .filter(r => !q || r.comment.toLowerCase().includes(q))
      .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));

    return {
      filteredAgentBillRows: displayBills,
      filteredAgentOtherRows: displayOthers,
      pendingBeforeRangeTotal: pendingBills + pendingOther,
      periodBillTotal,
      periodOtherTotal,
    };
  }, [selectedAgent, rangeFromISO, rangeToISO, search]);

  const pendingLabelDate = useMemo(() => {
    if (!rangeFromISO) return ""
    const d = isoToDate(rangeFromISO)
    if (!d) return ""
    d.setDate(d.getDate() - 1)
    return formatDateDDMMYYYY(dateToISO(d))
  }, [rangeFromISO])

  const totals = useMemo(() => {
    const grandTotal = periodBillTotal + periodOtherTotal + pendingBeforeRangeTotal
    const tableCount = filteredAgentBillRows.length + filteredAgentOtherRows.length
    
    return {
      count: tableCount,
      grandTotal: grandTotal,
      billTotal: periodBillTotal,
      otherTotal: periodOtherTotal,
    }
  }, [filteredAgentBillRows, filteredAgentOtherRows, periodBillTotal, periodOtherTotal, pendingBeforeRangeTotal])

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight" data-testid="text-agent-bills-title">
                Agent All Bills
              </h1>
              <p className="mt-1 text-sm text-muted-foreground" data-testid="text-agent-bills-subtitle">
                View agent bill and agent other bill entries.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" data-testid="badge-agent-bills-mode">
                Prototype
              </Badge>
              <Button variant="secondary" onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
                Back to Dashboard
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm" data-testid="card-agent-bills-filters-top">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-semibold" data-testid="text-filters-title">Filters</div>
                </div>

                <div
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4 lg:items-end"
                  data-testid="row-agent-all-bills-filters"
                >
                  <div data-testid="field-agent">
                    <Label className="text-xs font-medium text-muted-foreground" data-testid="label-agent">
                      Agent
                    </Label>
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                      <SelectTrigger className="mt-1 h-11" data-testid="select-agent">
                        <SelectValue placeholder="Select Agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEMO_AGENTS.map((a) => (
                          <SelectItem key={a.id} value={a.name} data-testid={`option-agent-${a.id}`}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div data-testid="field-date-preset">
                    <Label className="text-xs font-medium text-muted-foreground" data-testid="label-date-preset">
                      Date Range
                    </Label>
                    <Select value={datePreset} onValueChange={(v) => setDatePreset(v)}>
                      <SelectTrigger className="mt-1 h-11" data-testid="select-date-preset">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" data-testid="option-date-preset-all">All</SelectItem>
                        <SelectItem value="this_week" data-testid="option-date-preset-this-week">This Week</SelectItem>
                        <SelectItem value="last_week" data-testid="option-date-preset-last-week">Last Week</SelectItem>
                        <SelectItem value="this_month" data-testid="option-date-preset-this-month">This Month</SelectItem>
                        <SelectItem value="custom" data-testid="option-date-preset-custom">Custom Date Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {datePreset === "custom" ? (
                    <>
                      <div data-testid="field-from-date">
                        <Label className="text-xs font-medium text-muted-foreground" data-testid="label-from-date">
                          From (DD-MM-YYYY)
                        </Label>
                        <DateInput
                          valueISO={parseDDMMYYYYToISO(fromDDMMYYYY) ?? ""}
                          onChangeISO={(iso) => setFromDDMMYYYY(formatDateDDMMYYYY(iso))}
                          maxISO={todayISO()}
                          inputTestId="input-from-date"
                          buttonTestId="button-from-date-calendar"
                          popoverTestId="popover-from-date"
                          placeholder="01-01-2026"
                        />
                      </div>

                      <div data-testid="field-to-date">
                        <Label className="text-xs font-medium text-muted-foreground" data-testid="label-to-date">
                          To (DD-MM-YYYY)
                        </Label>
                        <DateInput
                          valueISO={parseDDMMYYYYToISO(toDDMMYYYY) ?? ""}
                          onChangeISO={(iso) => setToDDMMYYYY(formatDateDDMMYYYY(iso))}
                          maxISO={todayISO()}
                          inputTestId="input-to-date"
                          buttonTestId="button-to-date-calendar"
                          popoverTestId="popover-to-date"
                          placeholder="31-01-2026"
                        />
                      </div>
                    </>
                  ) : null}

                  <div data-testid="field-search">
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="agent-search" data-testid="label-agent-search">
                      Search
                    </Label>
                    <Input
                      id="agent-search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Group, client, date, comment..."
                      className="mt-1 h-11"
                      data-testid="input-agent-search"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="rounded-xl border bg-muted/20 px-4 py-3" data-testid="card-agent-all-bills-grand-total">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div className="text-sm font-semibold" data-testid="text-grand-total-title">
                  Grand Total
                </div>
                <div className="text-sm font-semibold" data-testid="text-grand-total-value">
                  {totals.grandTotal.toFixed(2)} ₹
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppSidebar>
  )
}
