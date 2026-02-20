import Papa from "papaparse"
import { useEffect, useMemo, useState, useRef } from "react"
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
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/Card"
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
} from "../components/ui/Dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select"
import { Separator } from "../components/ui/Separator"
import { DateInput } from "../components/ui/date-input"
import { formatDateDDMMYYYY, parseDDMMYYYYToISO, todayISO } from "../lib/date"
import { MOCK_CLIENTS } from "../lib/mock-data"
import { getAgentUsers, getBillGroups } from "../lib/api"

const TABS = ["Claim Bills", "Depo Bills", "Client Other Bill", "Agent Bill", "Agent Other Bill"]

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

function hasSameRateValue(group) {
  if (!group) return false
  const v = group.sameRate
  if (v === null || v === undefined) return false
  const s = String(v).trim().toLowerCase()
  return s !== "" && s !== "null" && s !== "undefined"
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
  const [groups, setGroups] = useState([])
  const [agents, setAgents] = useState([])

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

  const agentUsers = useMemo(() => (agents.length ? agents : MOCK_AGENTS), [agents])

  const [agentOtherDate, setAgentOtherDate] = useState("")
  const [agentOtherAgentId, setAgentOtherAgentId] = useState("")
  const [agentOtherComment, setAgentOtherComment] = useState("")
  const [agentOtherAmount, setAgentOtherAmount] = useState("")

  const agentOtherTotal = useMemo(() => {
    const amt = Number(String(agentOtherAmount).trim())
    if (!Number.isFinite(amt)) return 0
    return amt
  }, [agentOtherAmount])

  const canSubmitAgentOther = useMemo(() => {
    if (!agentOtherDate.trim()) return false
    if (!agentOtherAgentId) return false
    if (!isNumberValue(agentOtherAmount)) return false
    return true
  }, [agentOtherDate, agentOtherAgentId, agentOtherAmount])

  function resetAgentOtherForm() {
    setAgentOtherDate("")
    setAgentOtherAgentId("")
    setAgentOtherComment("")
    setAgentOtherAmount("")
  }

  function closeAgentOtherForm() {
    setIsAgentOtherFormOpen(false)
    resetAgentOtherForm()
  }

  function submitAgentOtherBill(e) {
    e.preventDefault()
    if (!canSubmitAgentOther) return

    const amountNum = Number(String(agentOtherAmount).trim())
    const newRow = {
      id: `ao-${uid()}`,
      date: agentOtherDate.trim(),
      agent: agentUsers.find((a) => a.id === agentOtherAgentId)?.name ?? "-",
      comment: agentOtherComment.trim() || "-",
      amount: `${amountNum.toFixed(2)} ₹`,
      total: `${amountNum.toFixed(2)} ₹`,
    }

    setRows((prev) => [newRow, ...prev])
    closeAgentOtherForm()
  }

  const paymentGroups = useMemo(() => groups.filter((g) => g.groupType === "Payment"), [groups])

  const [clientOtherDate, setClientOtherDate] = useState("")
  const [clientOtherGroupId, setClientOtherGroupId] = useState("")
  const [clientOtherComment, setClientOtherComment] = useState("")
  const [clientOtherAmount, setClientOtherAmount] = useState("")

  const selectedPaymentGroup = useMemo(
    () => paymentGroups.find((g) => g.id === clientOtherGroupId),
    [paymentGroups, clientOtherGroupId]
  )
  const selectedClientOtherName = useMemo(() => {
    if (!selectedPaymentGroup) return ""
    return selectedPaymentGroup.ownerName || (MOCK_CLIENTS.find((c) => c.id === selectedPaymentGroup.ownerClientId)?.name ?? "")
  }, [selectedPaymentGroup])

  const clientOtherTotal = useMemo(() => {
    const amt = Number(String(clientOtherAmount).trim())
    if (!Number.isFinite(amt)) return 0
    return amt
  }, [clientOtherAmount])

  const canSubmitClientOther = useMemo(() => {
    if (!clientOtherDate.trim()) return false
    if (!clientOtherGroupId) return false
    if (!isNumberValue(clientOtherAmount)) return false
    return true
  }, [clientOtherDate, clientOtherGroupId, clientOtherAmount])

  function resetClientOtherForm() {
    setClientOtherDate("")
    setClientOtherGroupId("")
    setClientOtherComment("")
    setClientOtherAmount("")
  }

  function closeClientOtherForm() {
    setIsClientOtherFormOpen(false)
    resetClientOtherForm()
  }

  function submitClientOtherBill(e) {
    e.preventDefault()
    if (!canSubmitClientOther) return

    const amountNum = Number(String(clientOtherAmount).trim())
    const newRow = {
      id: `o-${uid()}`,
      date: clientOtherDate.trim(),
      group: selectedPaymentGroup?.name ?? "-",
      client: selectedClientOtherName || "-",
      comment: clientOtherComment.trim() || "-",
      amount: `${amountNum.toFixed(2)} ₹`,
      total: `${amountNum.toFixed(2)} ₹`,
    }

    setRows((prev) => [newRow, ...prev])
    closeClientOtherForm()
  }

  const depoGroups = useMemo(() => groups.filter((g) => g.groupType === "Depo"), [groups])
  const depositerAgents = useMemo(() => agentUsers.filter((a) => Array.isArray(a.workTypes) && a.workTypes.includes("Depositer")), [agentUsers])

  const [depoDate, setDepoDate] = useState("")
  const [depoGroupId, setDepoGroupId] = useState("")
  const [depoBankId, setDepoBankId] = useState("")
  const [depoAgentId, setDepoAgentId] = useState("")
  const [depoAmount, setDepoAmount] = useState("")

  const selectedDepoGroup = useMemo(() => depoGroups.find((g) => g.id === depoGroupId), [depoGroups, depoGroupId])
  const selectedDepoClientName = useMemo(() => {
    if (!selectedDepoGroup) return ""
    return selectedDepoGroup.ownerName || (MOCK_CLIENTS.find((c) => c.id === selectedDepoGroup.ownerClientId)?.name ?? "")
  }, [selectedDepoGroup])

  const depoNeedsBankSelect = useMemo(() => !!selectedDepoGroup && !hasSameRateValue(selectedDepoGroup), [selectedDepoGroup])

  const depoRate = useMemo(() => {
    if (!selectedDepoGroup) return 0
    if (selectedDepoGroup.groupType !== "Depo") return 0

    if (depoNeedsBankSelect) {
      if (!depoBankId) return 0
      const v = selectedDepoGroup.perBankRates?.[depoBankId] ?? ""
      const n = Number(String(v).trim())
      return Number.isFinite(n) ? n : 0
    }

    const v = selectedDepoGroup.sameRate ?? ""
    const n = Number(String(v).trim())
    return Number.isFinite(n) ? n : 0
  }, [selectedDepoGroup, depoBankId, depoNeedsBankSelect])

  const depoTotal = useMemo(() => {
    const amt = Number(String(depoAmount).trim())
    if (!Number.isFinite(amt) || amt < 0) return 0
    if (!Number.isFinite(depoRate) || depoRate < 0) return 0
    return amt * depoRate
  }, [depoAmount, depoRate])

  const canSubmitDepo = useMemo(() => {
    if (!depoDate.trim()) return false
    if (!depoGroupId) return false
    if (depoNeedsBankSelect && !depoBankId) return false
    if (!depoAgentId) return false
    if (!isNonNegativeNumber(depoAmount)) return false
    if (!depoRate || depoRate < 0) return false
    return true
  }, [depoDate, depoGroupId, depoNeedsBankSelect, depoBankId, depoAgentId, depoAmount, depoRate])

  function resetDepoForm() {
    setDepoDate("")
    setDepoGroupId("")
    setDepoBankId("")
    setDepoAgentId("")
    setDepoAmount("")
  }

  function closeDepoForm() {
    setIsDepoFormOpen(false)
    resetDepoForm()
  }

  function submitDepoBill(e) {
    e.preventDefault()
    if (!canSubmitDepo) return

    const amountNum = Number(String(depoAmount).trim())
    const rateNum = depoRate
    const totalNum = amountNum * rateNum

    const newRow = {
      id: `d-${uid()}`,
      date: depoDate.trim(),
      group: selectedDepoGroup?.name ?? "-",
      client: selectedDepoClientName || "-",
      claimer: depositerAgents.find((a) => a.id === depoAgentId)?.name ?? "-",
      bank: depoNeedsBankSelect ? (selectedDepoGroup?.banks || []).find((b) => b.bankId === depoBankId)?.bankName ?? "-" : "Other",
      amount: `${amountNum.toFixed(2)} $`,
      rate: `${rateNum.toFixed(2)} ₹`,
      total: `${totalNum.toFixed(2)} ₹`,
      source: "Depo",
    }

    setRows((prev) => [newRow, ...prev])

    const agent = depositerAgents.find((a) => a.id === depoAgentId)
    const agentRate = agent?.rates?.Depositer ?? 0
    const agentTotal = amountNum * agentRate

    if (agent && agentRate > 0) {
      const newAgentBill = {
        id: `ab-${uid()}`,
        date: depoDate.trim(),
        group: selectedDepoGroup?.name ?? "-",
        client: selectedDepoClientName || "-",
        agent: agent.name,
        source: "Depo",
        amount: formatMoney(amountNum, " $"),
        rate: formatMoney(agentRate, " ₹"),
        total: formatMoney(agentTotal, " ₹"),
      }
      setAgentBillRows((prev) => [newAgentBill, ...prev])
    }

    closeDepoForm()
  }

  const claimGroups = useMemo(() => groups.filter((g) => g.groupType === "Claim"), [groups])
  const claimerAgents = useMemo(() => agentUsers.filter((a) => Array.isArray(a.workTypes) && a.workTypes.includes("Claimer")), [agentUsers])

  const [claimDate, setClaimDate] = useState("")
  const [claimGroupId, setClaimGroupId] = useState("")
  const [claimBankId, setClaimBankId] = useState("")
  const [claimAgentId, setClaimAgentId] = useState("")
  const [claimAmount, setClaimAmount] = useState("")

  const selectedClaimGroup = useMemo(() => claimGroups.find((g) => g.id === claimGroupId), [claimGroups, claimGroupId])
  const selectedClientName = useMemo(() => {
    if (!selectedClaimGroup) return ""
    return selectedClaimGroup.ownerName || (MOCK_CLIENTS.find((c) => c.id === selectedClaimGroup.ownerClientId)?.name ?? "")
  }, [selectedClaimGroup])

  const needsBankSelect = useMemo(() => !!selectedClaimGroup && !hasSameRateValue(selectedClaimGroup), [selectedClaimGroup])

  const computedRate = useMemo(() => {
    if (!selectedClaimGroup) return 0
    if (selectedClaimGroup.groupType !== "Claim") return 0

    if (needsBankSelect) {
      if (!claimBankId) return 0
      const v = selectedClaimGroup.perBankRates?.[claimBankId] ?? ""
      const n = Number(String(v).trim())
      return Number.isFinite(n) ? n : 0
    }

    const v = selectedClaimGroup.sameRate ?? ""
    const n = Number(String(v).trim())
    return Number.isFinite(n) ? n : 0
  }, [selectedClaimGroup, claimBankId, needsBankSelect])

  const computedTotal = useMemo(() => {
    const amt = Number(String(claimAmount).trim())
    if (!Number.isFinite(amt) || amt < 0) return 0
    if (!Number.isFinite(computedRate) || computedRate < 0) return 0
    return amt * computedRate
  }, [claimAmount, computedRate])

  const canSubmitClaim = useMemo(() => {
    if (!claimDate.trim()) return false
    if (!claimGroupId) return false
    if (needsBankSelect && !claimBankId) return false
    if (!claimAgentId) return false
    if (!isNonNegativeNumber(claimAmount)) return false
    if (!computedRate || computedRate < 0) return false
    return true
  }, [claimDate, claimGroupId, needsBankSelect, claimBankId, claimAgentId, claimAmount, computedRate])

  function resetClaimForm() {
    setClaimDate("")
    setClaimGroupId("")
    setClaimBankId("")
    setClaimAgentId("")
    setClaimAmount("")
  }

  function closeClaimForm() {
    setIsClaimFormOpen(false)
    resetClaimForm()
  }

  function submitClaimBill(e) {
    e.preventDefault()
    if (!canSubmitClaim) return

    const amountNum = Number(String(claimAmount).trim())
    const rateNum = computedRate
    const totalNum = amountNum * rateNum

    const newRow = {
      id: `c-${uid()}`,
      date: claimDate.trim(),
      group: selectedClaimGroup?.name ?? "-",
      client: selectedClientName || "-",
      claimer: claimerAgents.find((a) => a.id === claimAgentId)?.name ?? "-",
      bank: needsBankSelect ? (selectedClaimGroup?.banks || []).find((b) => b.bankId === claimBankId)?.bankName ?? "-" : "Other",
      amount: `${amountNum.toFixed(2)} $`,
      rate: `${rateNum.toFixed(2)} ₹`,
      total: `${totalNum.toFixed(2)} ₹`,
      source: "Claim",
    }

    setRows((prev) => [newRow, ...prev])

    const agent = claimerAgents.find((a) => a.id === claimAgentId)
    const agentRate = agent?.rates?.Claimer ?? 0
    const agentTotal = amountNum * agentRate

    if (agent && agentRate > 0) {
      const newAgentBill = {
        id: `ab-${uid()}`,
        date: claimDate.trim(),
        group: selectedClaimGroup?.name ?? "-",
        client: selectedClientName || "-",
        agent: agent.name,
        source: "Claim",
        amount: formatMoney(amountNum, " $"),
        rate: formatMoney(agentRate, " ₹"),
        total: formatMoney(agentTotal, " ₹"),
      }
      setAgentBillRows((prev) => [newAgentBill, ...prev])
    }

    closeClaimForm()
  }

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

  useEffect(() => {
    let mounted = true

    Promise.all([
      getBillGroups("Claim"),
      getBillGroups("Depo"),
      getBillGroups("Payment"),
      getAgentUsers()
    ])
      .then(([claim, depo, payment, agentList]) => {
        if (!mounted) return
        const allGroups = [...(claim || []), ...(depo || []), ...(payment || [])]
        setGroups(allGroups)
        setAgents(Array.isArray(agentList) ? agentList : [])
      })
      .catch((error) => {
        console.error("Failed to load bill config:", error)
        if (!mounted) return
        setGroups([])
        setAgents([])
      })

    return () => {
      mounted = false
    }
  }, [])

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

                  {tab === "Claim Bills" ? (
                    <Button
                      onClick={() => {
                        setIsDepoFormOpen(false)
                        setIsClientOtherFormOpen(false)
                        setIsAgentOtherFormOpen(false)
                        setIsClaimFormOpen(true)
                      }}
                      data-testid="button-new-claim-bill"
                    >
                      <Plus className="h-4 w-4" /> New Claim Bill
                    </Button>
                  ) : tab === "Depo Bills" ? (
                    <Button
                      onClick={() => {
                        setIsClaimFormOpen(false)
                        setIsClientOtherFormOpen(false)
                        setIsAgentOtherFormOpen(false)
                        setIsDepoFormOpen(true)
                      }}
                      data-testid="button-new-depo-bill"
                    >
                      <Plus className="h-4 w-4" /> New Depo Bill
                    </Button>
                  ) : tab === "Client Other Bill" ? (
                    <Button
                      onClick={() => {
                        setIsClaimFormOpen(false)
                        setIsDepoFormOpen(false)
                        setIsAgentOtherFormOpen(false)
                        setIsClientOtherFormOpen(true)
                      }}
                      data-testid="button-new-client-other-bill"
                    >
                      <Plus className="h-4 w-4" /> New Client Other Bill
                    </Button>
                  ) : tab === "Agent Other Bill" ? (
                    <Button
                      onClick={() => {
                        setIsClaimFormOpen(false)
                        setIsDepoFormOpen(false)
                        setIsClientOtherFormOpen(false)
                        setIsAgentOtherFormOpen(true)
                      }}
                      data-testid="button-new-agent-other-bill"
                    >
                      <Plus className="h-4 w-4" /> New Agent Other Bill
                    </Button>
                  ) : null}
                </div>
              </div>

              <Separator className="my-4" />

              {isClaimFormOpen ? (
                <div className="rounded-2xl border bg-white/70 p-5 shadow-sm" data-testid="card-new-claim-bill">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">New Claim Bill</div>
                      <div className="mt-1 text-xs text-muted-foreground">Fill details below.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" onClick={closeClaimForm}><X className="h-4 w-4" /> Cancel</Button>
                      <Button type="submit" form="form-new-claim-bill" disabled={!canSubmitClaim}><Plus className="h-4 w-4" /> Save</Button>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <form id="form-new-claim-bill" onSubmit={submitClaimBill} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm">Date</Label>
                      <DateInput valueISO={claimDate} onChangeISO={setClaimDate} maxISO={todayISO()} inputTestId="input-claim-date" />
                    </div>
                    <div>
                      <Label className="text-sm">Claim Group Name</Label>
                      <Select value={claimGroupId} onValueChange={(v) => { setClaimGroupId(v); setClaimBankId("") }}>
                        <SelectTrigger className="soft-ring mt-1 h-11">
                          <SelectValue placeholder={claimGroups.length ? "Select claim group" : "No claim groups"} />
                        </SelectTrigger>
                        <SelectContent>
                          {claimGroups.length ? claimGroups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>) : <SelectItem value="__none__" disabled>No claim groups available</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    {needsBankSelect ? (
                      <div>
                        <Label className="text-sm">Bank</Label>
                        <Select value={claimBankId} onValueChange={setClaimBankId}>
                          <SelectTrigger className="soft-ring mt-1 h-11"><SelectValue placeholder="Select bank" /></SelectTrigger>
                          <SelectContent>
                            {(selectedClaimGroup?.banks || []).map((b) => (
                              <SelectItem key={b.bankId} value={b.bankId}>{b.bankName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="rounded-2xl border bg-muted/20 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Bank</div>
                        <div className="mt-1 text-sm">{selectedClaimGroup ? "Not required (same rate)" : "Select a group first"}</div>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm">Client</Label>
                      <Input value={selectedClientName} readOnly placeholder="Auto selected" className="mt-1 h-11 bg-muted/30" />
                    </div>
                    <div>
                      <Label className="text-sm">Agent</Label>
                      <Select value={claimAgentId} onValueChange={setClaimAgentId}>
                        <SelectTrigger className="soft-ring mt-1 h-11"><SelectValue placeholder="Select claimer agent" /></SelectTrigger>
                        <SelectContent>{claimerAgents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Claim Amount</Label>
                      <Input inputMode="decimal" value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} placeholder="0.00" className="soft-ring mt-1 h-11" />
                    </div>
                    <div>
                      <Label className="text-sm">Rate</Label>
                      <Input value={computedRate ? formatMoney(computedRate, " ₹") : ""} readOnly placeholder="Auto" className="mt-1 h-11 bg-muted/30" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="rounded-2xl border bg-emerald-50 p-4">
                        <div className="text-xs font-medium text-emerald-900/80">Total Amount</div>
                        <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-900">{formatMoney(computedTotal, " ₹")}</div>
                      </div>
                    </div>
                  </form>
                </div>
              ) : null}

              {isDepoFormOpen ? (
                <div className="rounded-2xl border bg-white/70 p-5 shadow-sm" data-testid="card-new-depo-bill">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">New Depo Bill</div>
                      <div className="mt-1 text-xs text-muted-foreground">Fill details below.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" onClick={closeDepoForm}><X className="h-4 w-4" /> Cancel</Button>
                      <Button type="submit" form="form-new-depo-bill" disabled={!canSubmitDepo}><Plus className="h-4 w-4" /> Save</Button>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <form id="form-new-depo-bill" onSubmit={submitDepoBill} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm">Date</Label>
                      <DateInput valueISO={depoDate} onChangeISO={setDepoDate} maxISO={todayISO()} inputTestId="input-depo-date" />
                    </div>
                    <div>
                      <Label className="text-sm">Depo Group Name</Label>
                      <Select value={depoGroupId} onValueChange={(v) => { setDepoGroupId(v); setDepoBankId("") }}>
                        <SelectTrigger className="soft-ring mt-1 h-11">
                          <SelectValue placeholder={depoGroups.length ? "Select depo group" : "No depo groups"} />
                        </SelectTrigger>
                        <SelectContent>
                          {depoGroups.length ? depoGroups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>) : <SelectItem value="__none__" disabled>No depo groups available</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    {depoNeedsBankSelect ? (
                      <div>
                        <Label className="text-sm">Bank</Label>
                        <Select value={depoBankId} onValueChange={setDepoBankId}>
                          <SelectTrigger className="soft-ring mt-1 h-11"><SelectValue placeholder="Select bank" /></SelectTrigger>
                          <SelectContent>
                            {(selectedDepoGroup?.banks || []).map((b) => (
                              <SelectItem key={b.bankId} value={b.bankId}>{b.bankName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="rounded-2xl border bg-muted/20 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Bank</div>
                        <div className="mt-1 text-sm">{selectedDepoGroup ? "Not required (same rate)" : "Select a group first"}</div>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm">Client</Label>
                      <Input value={selectedDepoClientName} readOnly placeholder="Auto selected" className="mt-1 h-11 bg-muted/30" />
                    </div>
                    <div>
                      <Label className="text-sm">Agent</Label>
                      <Select value={depoAgentId} onValueChange={setDepoAgentId}>
                        <SelectTrigger className="soft-ring mt-1 h-11"><SelectValue placeholder="Select depositer agent" /></SelectTrigger>
                        <SelectContent>{depositerAgents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Depo Amount</Label>
                      <Input inputMode="decimal" value={depoAmount} onChange={(e) => setDepoAmount(e.target.value)} placeholder="0.00" className="soft-ring mt-1 h-11" />
                    </div>
                    <div>
                      <Label className="text-sm">Rate</Label>
                      <Input value={depoRate ? formatMoney(depoRate, " ₹") : ""} readOnly placeholder="Auto" className="mt-1 h-11 bg-muted/30" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="rounded-2xl border bg-emerald-50 p-4">
                        <div className="text-xs font-medium text-emerald-900/80">Total Amount</div>
                        <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-900">{formatMoney(depoTotal, " ₹")}</div>
                      </div>
                    </div>
                  </form>
                </div>
              ) : null}

              {isClientOtherFormOpen ? (
                <div className="rounded-2xl border bg-white/70 p-5 shadow-sm" data-testid="card-new-client-other-bill">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">New Client Other Bill</div>
                      <div className="mt-1 text-xs text-muted-foreground">Select group and enter amount.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" onClick={closeClientOtherForm}><X className="h-4 w-4" /> Cancel</Button>
                      <Button type="submit" form="form-new-client-other-bill" disabled={!canSubmitClientOther}><Plus className="h-4 w-4" /> Save</Button>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <form id="form-new-client-other-bill" onSubmit={submitClientOtherBill} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm">Date</Label>
                      <DateInput valueISO={clientOtherDate} onChangeISO={setClientOtherDate} maxISO={todayISO()} inputTestId="input-client-other-date" />
                    </div>
                    <div>
                      <Label className="text-sm">Payment Group</Label>
                      <Select value={clientOtherGroupId} onValueChange={setClientOtherGroupId}>
                        <SelectTrigger className="soft-ring mt-1 h-11">
                          <SelectValue placeholder={paymentGroups.length ? "Select payment group" : "No payment groups"} />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentGroups.length ? paymentGroups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>) : <SelectItem value="__none__" disabled>No payment groups available</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Client</Label>
                      <Input value={selectedClientOtherName} readOnly placeholder="Auto selected" className="mt-1 h-11 bg-muted/30" />
                    </div>
                    <div>
                      <Label className="text-sm">Comment</Label>
                      <Input value={clientOtherComment} onChange={(e) => setClientOtherComment(e.target.value)} placeholder="Type comment" className="soft-ring mt-1 h-11" />
                    </div>
                    <div>
                      <Label className="text-sm">Amount</Label>
                      <Input inputMode="decimal" value={clientOtherAmount} onChange={(e) => setClientOtherAmount(e.target.value)} placeholder="0.00" className="soft-ring mt-1 h-11" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="rounded-2xl border bg-emerald-50 p-4">
                        <div className="text-xs font-medium text-emerald-900/80">Total Amount</div>
                        <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-900">{formatMoney(clientOtherTotal, " ₹")}</div>
                      </div>
                    </div>
                  </form>
                </div>
              ) : null}

              {isAgentOtherFormOpen ? (
                <div className="rounded-2xl border bg-white/70 p-5 shadow-sm" data-testid="card-new-agent-other-bill">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">New Agent Other Bill</div>
                      <div className="mt-1 text-xs text-muted-foreground">Select agent and enter amount.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" onClick={closeAgentOtherForm}><X className="h-4 w-4" /> Cancel</Button>
                      <Button type="submit" form="form-new-agent-other-bill" disabled={!canSubmitAgentOther}><Plus className="h-4 w-4" /> Save</Button>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <form id="form-new-agent-other-bill" onSubmit={submitAgentOtherBill} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm">Date</Label>
                      <DateInput valueISO={agentOtherDate} onChangeISO={setAgentOtherDate} maxISO={todayISO()} inputTestId="input-agent-other-date" />
                    </div>
                    <div>
                      <Label className="text-sm">Agent</Label>
                      <Select value={agentOtherAgentId} onValueChange={setAgentOtherAgentId}>
                        <SelectTrigger className="soft-ring mt-1 h-11">
                          <SelectValue placeholder={agentUsers.length ? "Select agent" : "No agents"} />
                        </SelectTrigger>
                        <SelectContent>
                          {agentUsers.length ? agentUsers.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>) : <SelectItem value="__none__" disabled>No agents available</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm">Comment</Label>
                      <Input value={agentOtherComment} onChange={(e) => setAgentOtherComment(e.target.value)} placeholder="Type comment" className="soft-ring mt-1 h-11" />
                    </div>
                    <div>
                      <Label className="text-sm">Amount</Label>
                      <Input inputMode="decimal" value={agentOtherAmount} onChange={(e) => setAgentOtherAmount(e.target.value)} placeholder="0.00" className="soft-ring mt-1 h-11" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="rounded-2xl border bg-emerald-50 p-4">
                        <div className="text-xs font-medium text-emerald-900/80">Total Amount</div>
                        <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-900">{formatMoney(agentOtherTotal, " ₹")}</div>
                      </div>
                    </div>
                  </form>
                </div>
              ) : null}

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
 
