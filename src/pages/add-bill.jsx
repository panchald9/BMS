import Papa from "papaparse"
import { useMemo, useState, useRef } from "react"
import { useLocation } from "wouter"
import {
  BadgeDollarSign,
  Download,
  Plus,
  Receipt,
  Trash2,
  Pencil,
  X,
  Upload,
} from "lucide-react"

import AppSidebar from "../components/app-sidebar"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { Separator } from "../components/ui/separator"
import { DateInput } from "../components/ui/date-input"
import { formatDateDDMMYYYY, parseDDMMYYYYToISO, todayISO } from "../lib/date"
import { useGroupsStore } from "../lib/groups-store"

const TABS = ["Claim Bills", "Depo Bills", "Client Other Bill", "Agent Bill", "Agent Other Bill"]

const MOCK_BANKS = []
const MOCK_CLIENTS = []
const MOCK_AGENTS = []

function uid() {
  return Math.random().toString(16).slice(2, 10)
}

function isNonNegativeNumber(v) {
  const s = v.trim()
  if (!s) return false
  const n = Number(s)
  return Number.isFinite(n) && n >= 0
}

function isNumberValue(v) {
  const s = v.trim()
  if (!s) return false
  const n = Number(s)
  return Number.isFinite(n)
}

function formatMoney(n, suffix) {
  return `${n.toFixed(2)}${suffix}`
}

const demoClaimRows = []
const demoDepoRows = []
const demoClientOtherRows = []
const demoClaimerCalculatedRows = []
const demoClaimerOtherRows = []

function TabButton({ active, label, onClick, testId }) {
  return (
    <button
      className={
        "relative rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 " +
        (active
          ? "bg-white text-foreground shadow-sm ring-1 ring-border"
          : "bg-transparent text-muted-foreground hover:bg-white/60 hover:text-foreground")
      }
      onClick={onClick}
      data-testid={testId}
      type="button"
    >
      {label}
    </button>
  )
}

export default function AddBillPage() {
  const [, setLocation] = useLocation()
  const { groups } = useGroupsStore()

  const [tab, setTab] = useState("Claim Bills")

  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [bulkFile, setBulkFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleBulkFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBulkFile(e.target.files[0])
    }
  }

  const handleBulkUpload = () => {
    if (!bulkFile) return

    setIsUploading(true)
    Papa.parse(bulkFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newRows = results.data.map((row) => {
           return {
             id: `${tab === "Claim Bills" ? "c" : "d"}-${uid()}`,
             date: row.date || row.Date || todayISO(),
             group: row.group || row.Group || "Uploaded Group",
             client: row.client || row.Client || "Uploaded Client",
             claimer: row.claimer || row.agent || "Uploaded Agent",
             bank: row.bank || row.Bank || "Other",
             amount: row.amount || row.Amount || "0.00",
             rate: row.rate || row.Rate || "0.00",
             total: row.total || row.Total || "0.00",
             source: tab === "Claim Bills" ? "Claim" : "Depo"
           }
        })

        const validRows = newRows.filter(r => r.amount !== "0.00" || r.group !== "Uploaded Group")
        
        if (validRows.length > 0) {
           setRows(prev => [...validRows, ...prev])
        }

        setIsUploading(false)
        setIsBulkUploadOpen(false)
        setBulkFile(null)
      },
      error: (error) => {
        console.error("Error parsing CSV:", error)
        setIsUploading(false)
      }
    })
  }

  const handleDownloadTemplate = () => {
    const csvContent = "Date,Group,Client,Agent,Amount,Rate,Bank\n01-10-2026,Sample Group,Sample Client,Sample Agent,100,5.5,Other"
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${tab.toLowerCase().replace(" ", "_")}_template.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const [rows, setRows] = useState(demoClaimRows)

  const [agentBillRows, setAgentBillRows] = useState(() =>
    demoClaimerCalculatedRows.map(row => ({
      ...row,
      agent: row.claimer,
      source: row.group.includes("Depo") ? "Depo" : "Claim"
    }))
  )

  const [isClaimFormOpen, setIsClaimFormOpen] = useState(false)
  const [isDepoFormOpen, setIsDepoFormOpen] = useState(false)
  const [isClientOtherFormOpen, setIsClientOtherFormOpen] = useState(false)
  const [isAgentOtherFormOpen, setIsAgentOtherFormOpen] = useState(false)

  const agentUsers = useMemo(() => MOCK_AGENTS, [])

  const sectionTitle = useMemo(() => {
    if (tab === "Claim Bills") return "Client Claim Bills"
    if (tab === "Depo Bills") return "Client Depo Bills"
    if (tab === "Client Other Bill") return "Client Other Bill"
    if (tab === "Agent Bill") return "Agent Bill"
    if (tab === "Agent Other Bill") return "Agent Other Bill"
    return "Agent Other Bill"
  }, [tab])

  function rowsForTab(t) {
    if (t === "Depo Bills") return demoDepoRows
    if (t === "Client Other Bill") return demoClientOtherRows
    if (t === "Agent Bill") return agentBillRows
    if (t === "Agent Other Bill") return demoClaimerOtherRows
    return demoClaimRows
  }

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight" data-testid="text-add-bill-title">
                Manage Bills
              </h1>
              <p className="mt-1 text-sm text-muted-foreground" data-testid="text-add-bill-subtitle">
                Create, edit, and manage all bill types here.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" data-testid="badge-add-bill-status">
                Prototype
              </Badge>
              <Button variant="secondary" onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
                Back to Dashboard
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm" data-testid="card-bills-tabs">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted" aria-hidden>
                    <Receipt className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" data-testid="text-bills-tabs-title">
                      Bills
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground" data-testid="text-bills-tabs-hint">
                      Switch bill type to view the table.
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2" data-testid="tabs-bills">
                  <div className="flex flex-wrap items-center gap-1 rounded-full border bg-muted/30 p-1" data-testid="pill-tabs">
                    {TABS.map((t) => (
                      <TabButton
                        key={t}
                        active={tab === t}
                        label={t}
                        onClick={() => {
                          setTab(t)
                          setRows(rowsForTab(t))
                          setIsClaimFormOpen(false)
                          setIsDepoFormOpen(false)
                          setIsClientOtherFormOpen(false)
                        }}
                        testId={`tab-${t.toLowerCase().replace(/\s+/g, "-")}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-6">
            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm" data-testid="card-bills-table">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold" data-testid="text-bills-section-title">
                    {sectionTitle}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(tab === "Claim Bills" || tab === "Depo Bills") && (
                    <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2 rounded-full border-dashed" data-testid="button-bulk-upload-trigger">
                          <Upload className="h-4 w-4" />
                          Bulk Upload
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Upload {tab}</DialogTitle>
                          <DialogDescription>
                            Upload a CSV file containing bill data.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
                             <div className="text-sm text-muted-foreground">
                               Need a template? Download a sample CSV file to get started.
                             </div>
                             <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
                               <Download className="h-4 w-4" />
                               Download Template
                             </Button>
                          </div>
                          <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="bulk-file">Bill Data (CSV)</Label>
                            <Input id="bulk-file" type="file" accept=".csv" onChange={handleBulkFileChange} ref={fileInputRef} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>Cancel</Button>
                          <Button onClick={handleBulkUpload} disabled={!bulkFile || isUploading}>
                            {isUploading ? "Processing..." : "Upload & Process"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {tab === "Claim Bills" && (
                    <Button onClick={() => setIsClaimFormOpen(true)} data-testid="button-new-claim-bill">
                      <Plus className="h-4 w-4" /> New Claim Bill
                    </Button>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="overflow-hidden rounded-xl shadow-sm bg-white" data-testid="table-bills">
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    <div className="grid grid-cols-[90px_1.5fr_1fr_1fr_80px_80px_90px_60px_90px_70px] gap-2 border-b bg-white px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                      <div className="text-center" data-testid="th-date">Date</div>
                      <div className="text-left pl-4" data-testid="th-group">Group</div>
                      <div className="text-left pl-4" data-testid="th-client">Client</div>
                      <div className="text-left pl-4" data-testid="th-agent">Agent</div>
                      <div className="text-center" data-testid="th-source">Source</div>
                      <div className="text-center" data-testid="th-bank">Bank</div>
                      <div className="text-right pr-4" data-testid="th-amount">Amount</div>
                      <div className="text-right pr-4" data-testid="th-rate">Rate</div>
                      <div className="text-right pr-4" data-testid="th-total">Total</div>
                      <div className="text-center" data-testid="th-action">Action</div>
                    </div>

                    {rows.map((r, idx) => (
                      <div
                        key={r.id}
                        className={
                          "grid grid-cols-[90px_1.5fr_1fr_1fr_80px_80px_90px_60px_90px_70px] items-center gap-2 border-t bg-white px-3 py-3 text-sm " +
                          (idx % 2 === 0 ? "" : "bg-muted/5")
                        }
                        data-testid={`row-bill-${r.id}`}
                      >
                        <div className="text-xs text-foreground text-center" data-testid={`cell-date-${r.id}`}>
                          {formatDateDDMMYYYY(parseDDMMYYYYToISO(r.date) ?? r.date)}
                        </div>
                        <div className="truncate text-xs text-left pl-4" data-testid={`cell-group-${r.id}`}>
                          {r.group}
                        </div>
                        <div className="truncate text-xs text-left pl-4" data-testid={`cell-client-${r.id}`}>
                          {r.client}
                        </div>
                        <div className="truncate text-xs text-left pl-4" data-testid={`cell-claimer-${r.id}`}>
                          {r.claimer}
                        </div>
                        <div className="truncate text-xs text-center" data-testid={`cell-source-${r.id}`}>
                          {r.source || "-"}
                        </div>
                        <div className="truncate text-xs text-center" data-testid={`cell-bank-${r.id}`}>
                          {r.bank}
                        </div>
                        <div className="text-right text-xs tabular-nums pr-4" data-testid={`cell-amount-${r.id}`}>
                          {r.amount}
                        </div>
                        <div className="text-right text-xs tabular-nums pr-4" data-testid={`cell-rate-${r.id}`}>
                          {r.rate}
                        </div>
                        <div className="text-right text-xs tabular-nums pr-4" data-testid={`cell-total-${r.id}`}>
                          {r.total}
                        </div>
                        <div className="flex items-center justify-center gap-2" data-testid={`cell-actions-${r.id}`}>
                          <button
                            className="grid h-8 w-8 place-items-center rounded-lg border bg-white text-muted-foreground transition hover:bg-muted/30 hover:text-foreground"
                            data-testid={`button-edit-bill-${r.id}`}
                            type="button"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            className="grid h-8 w-8 place-items-center rounded-lg border bg-white text-red-600 transition hover:bg-red-50"
                            onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                            data-testid={`button-delete-bill-${r.id}`}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!rows.length && (
                  <div className="border-t bg-white px-3 py-10 text-center" data-testid="empty-bills">
                    <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-muted" aria-hidden>
                      <BadgeDollarSign className="h-5 w-5" />
                    </div>
                    <div className="mt-3 text-sm font-semibold" data-testid="text-empty-bills-title">
                      No bills yet
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground" data-testid="text-empty-bills-hint">
                      Use "New Claim Bill" to add your first bill.
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppSidebar>
  )
}
 