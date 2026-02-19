import { useMemo, useState } from "react"
import { useLocation } from "wouter"
import { ChevronRight } from "lucide-react"
import AppSidebar from "../components/app-sidebar"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/Card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { DateInput } from "@/components/ui/date-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select"
import {
  endOfMonthISO,
  endOfWeekISO,
  formatDateDDMMYYYY,
  parseDDMMYYYYToISO,
  startOfMonthISO,
  startOfWeekISO,
  todayISO,
} from "../lib/date"

const BILL_TYPES = ["Claim Bills", "Depo Bills", "Other Bills", "Processing Bills", "Payment Bills"]
const DEMO_CLIENTS = []

const claimBillsSeed = []
const depoBillsSeed = []
const otherBillsSeed = []
const processingBillsSeed = []
const paymentBillsSeed = []

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

export default function ClientAllBillsPage() {
  const [, setLocation] = useLocation()

  const [selectedClient, setSelectedClient] = useState(DEMO_CLIENTS[0]?.name ?? "")
  const [search, setSearch] = useState("")

  const [datePreset, setDatePreset] = useState("all")
  const [fromDDMMYYYY, setFromDDMMYYYY] = useState("")
  const [toDDMMYYYY, setToDDMMYYYY] = useState("")

  const baseRows = useMemo(() => {
    return [...claimBillsSeed, ...depoBillsSeed, ...otherBillsSeed, ...processingBillsSeed, ...paymentBillsSeed]
      .filter((r) => (selectedClient ? r.client.toLowerCase() === selectedClient.toLowerCase() : true))
      .filter((r) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return (
          r.type.toLowerCase().includes(q) ||
          r.group.toLowerCase().includes(q) ||
          r.client.toLowerCase().includes(q) ||
          formatDateDDMMYYYY(r.dateISO).includes(q) ||
          (r.note ?? "").toLowerCase().includes(q)
        )
      })
      .slice()
      .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1))
  }, [selectedClient, search])

  const { filteredRows, pendingBeforeRangeTotal, rangeFromISO, rangeToISO } = useMemo(() => {
    const tISO = todayISO()
    let fromISO = null
    let toISO = null

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
      toISO = endOfMonthISO(tISO)
    } else if (datePreset === "custom") {
      fromISO = parseDDMMYYYYToISO(fromDDMMYYYY)
      toISO = parseDDMMYYYYToISO(toDDMMYYYY)
    }

    const filtered = baseRows.filter((r) => {
      if (!fromISO && !toISO) return true
      if (fromISO && r.dateISO < fromISO) return false
      if (toISO && r.dateISO > toISO) return false
      return true
    })

    const pendingBefore = fromISO
      ? baseRows
          .filter((r) => r.dateISO < fromISO)
          .reduce((acc, r) => acc + r.totalInr, 0)
      : 0

    return {
      filteredRows: filtered,
      pendingBeforeRangeTotal: pendingBefore,
      rangeFromISO: fromISO,
      rangeToISO: toISO,
    }
  }, [baseRows, datePreset, fromDDMMYYYY, toDDMMYYYY])

  const allRows = filteredRows

  const sectioned = useMemo(() => {
    const map = new Map()
    BILL_TYPES.forEach((t) => map.set(t, []))
    allRows.forEach((r) => map.get(r.type)?.push(r))
    return map
  }, [allRows])

  const grandTotal = useMemo(() => {
    return allRows.reduce(
      (acc, r) => {
        acc.count += 1
        acc.total += r.totalInr
        return acc
      },
      { count: 0, total: 0 },
    )
  }, [allRows])

  const totalsByType = useMemo(() => {
    const base = {
      "Claim Bills": 0,
      "Depo Bills": 0,
      "Other Bills": 0,
      "Processing Bills": 0,
      "Payment Bills": 0,
    }

    allRows.forEach((r) => {
      base[r.type] += r.totalInr
    })

    return base
  }, [allRows])

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight" data-testid="text-client-all-bills-title">
                Client All Bills
              </h1>
              <p className="mt-1 text-sm text-muted-foreground" data-testid="text-client-all-bills-subtitle">
                View claim/depo/other/processing/payment bills for a client.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" data-testid="badge-client-all-bills-mode">
                Prototype
              </Badge>
              <Button variant="secondary" onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
                Back to Dashboard
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm" data-testid="card-client-all-bills-filters-top">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-semibold" data-testid="text-filters-title">Filters</div>
                </div>

                <div
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4 lg:items-end"
                  data-testid="row-client-all-bills-filters"
                >
                  <div data-testid="field-client">
                    <Label className="text-xs font-medium text-muted-foreground" data-testid="label-client">
                      Client
                    </Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger className="mt-1 h-11" data-testid="select-client">
                        <SelectValue placeholder="Select Client" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEMO_CLIENTS.map((c) => (
                          <SelectItem key={c.id} value={c.name} data-testid={`option-client-${c.id}`}>
                            {c.name}
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
                    <Label className="text-xs font-medium text-muted-foreground" htmlFor="search" data-testid="label-search">
                      Search
                    </Label>
                    <Input
                      id="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Type, group, client, date, note..."
                      className="mt-1 h-11"
                      data-testid="input-search"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm" data-testid="card-client-all-bills-table">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div data-testid="text-client-all-bills-table-heading">
                  <div className="text-sm font-semibold">All Bills (Client)</div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid="text-client-all-bills-table-subheading">
                    Showing separate tables for each bill type.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" data-testid="badge-client-all-bills-count">
                    {grandTotal.count} rows
                  </Badge>
                </div>
              </div>

              <div className="mt-4 space-y-6" data-testid="section-client-all-bills-tables">
                {BILL_TYPES.map((type) => {
                  const rows = sectioned.get(type) ?? []
                  const total = rows.reduce((acc, r) => acc + r.totalInr, 0)

                  return (
                    <div key={type} data-testid={`section-client-bills-${type.toLowerCase().replace(/\s+/g, "-")}`}>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm font-semibold" data-testid={`text-section-title-${type.toLowerCase().replace(/\s+/g, "-")}`}>
                          {type}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" data-testid={`badge-section-count-${type.toLowerCase().replace(/\s+/g, "-")}`}>
                            {rows.length} rows
                          </Badge>
                          <Badge variant="secondary" data-testid={`badge-section-total-${type.toLowerCase().replace(/\s+/g, "-")}`}>
                            Total: {total.toFixed(2)} ₹
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 overflow-hidden rounded-xl border bg-white" data-testid={`table-client-all-bills-${type.toLowerCase().replace(/\s+/g, "-")}`}>
                        {rows.length === 0 ? (
                          <div
                            className="px-4 py-10 text-center text-sm text-muted-foreground"
                            data-testid={`text-bills-empty-${type.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            No bills found.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}

                <div className="rounded-xl border bg-muted/20 px-4 py-3" data-testid="card-client-all-bills-grand-total">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm font-semibold" data-testid="text-grand-total-title">Grand Total</div>
                    <div className="text-sm font-semibold" data-testid="text-grand-total-value">
                      {(grandTotal.total + pendingBeforeRangeTotal).toFixed(2)} ₹
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppSidebar>
  )
}
