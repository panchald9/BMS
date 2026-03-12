import { useEffect, useMemo, useState, useRef } from "react"
import { useLocation } from "wouter"
import {
  BadgeDollarSign,
  Check,
  ChevronDown,
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
import {
  createBill,
  createOtherBill,
  deleteBill,
  deleteOtherBill,
  getAgentBills,
  getAgentUsers,
  getBillGroups,
  getBills,
  getOtherBills,
  bulkUploadBills,
  updateBill,
  updateOtherBill
} from "../lib/api"

const TABS = ["Claim Bills", "Depo Bills", "Client Other Bill", "Agent Bill", "Agent Other Bill"]

const MOCK_AGENTS = []
const ROWS_PER_PAGE = 7

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

function amountTone(n) {
  return Number(n || 0) < 0 ? "text-red-600" : "text-emerald-700"
}

function toNumber(value) {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value).replace(/[^\d.-]/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

function hasSameRateValue(group) {
  if (!group) return false
  const v = group.sameRate
  if (v === null || v === undefined) return false
  const s = String(v).trim().toLowerCase()
  return s !== "" && s !== "null" && s !== "undefined"
}

function normalizeDateValue(value) {
  if (!value) return ""
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, "0")
    const d = String(value.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
  const s = String(value).trim()
  if (!s) return ""
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return parseDDMMYYYYToISO(s) || s
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

function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  disabled = false,
}) {
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const selectedOption = options.find((option) => String(option.value) === String(value))
  const hasOptions = options.length > 0
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return options
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
  }, [options, query])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
        setQuery("")
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false)
        setQuery("")
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn("relative mt-1", className)}>
      <div className="flex h-11 w-full items-center rounded-xl border border-violet-400/70 bg-white px-3 shadow-sm">
        <Input
          ref={inputRef}
          value={open ? query : selectedOption?.label || ""}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)
            setQuery("")
          }}
          placeholder={placeholder}
          className="h-full w-full border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          disabled={disabled || !hasOptions}
        />
        <button
          type="button"
          onClick={() => {
            if (disabled || !hasOptions) return
            setOpen((prev) => {
              const nextOpen = !prev
              if (nextOpen) {
                setQuery("")
                setTimeout(() => inputRef.current?.focus(), 0)
              } else {
                setQuery("")
              }
              return nextOpen
            })
          }}
          className="ml-2"
          disabled={disabled || !hasOptions}
        >
          <ChevronDown className="h-4 w-4 opacity-60" />
        </button>
      </div>
      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded-xl border bg-white p-1 shadow-md">
          <div className="max-h-56 overflow-y-auto rounded-lg bg-violet-100/40 py-1">
          {filteredOptions.length ? (
            filteredOptions.map((option) => {
              const optionValue = String(option.value)
              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => {
                    onValueChange(optionValue)
                    setOpen(false)
                    setQuery("")
                  }}
                  className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-violet-200/40"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      String(value) === optionValue ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </button>
              )
            })
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</div>
          )}
        </div>
        </div>
      ) : null}
    </div>
  )
}

export default function AddBillPage() {
  const [, setLocation] = useLocation()
  const [groups, setGroups] = useState([])
  const [agents, setAgents] = useState([])
  const [isBillsLoading, setIsBillsLoading] = useState(false)

  const [tab, setTab] = useState("Claim Bills")

  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [bulkFile, setBulkFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [bulkUploadErrors, setBulkUploadErrors] = useState([])
  const [bulkUploadMessage, setBulkUploadMessage] = useState("")
  const fileInputRef = useRef(null)

  const handleBulkFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBulkFile(e.target.files[0])
      setBulkUploadErrors([])
      setBulkUploadMessage("")
    }
  }

  const handleBulkUpload = async () => {
    if (!bulkFile) return

    setIsUploading(true)
    setBulkUploadErrors([])
    setBulkUploadMessage("")

    try {
      const result = await bulkUploadBills(bulkFile)
      setBulkUploadMessage(result?.message || "Bulk upload successful")
      loadBillsForTab(tab)
      setIsBulkUploadOpen(false)
      setBulkFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (error) {
      console.error("Bulk upload failed:", error)
      const responseErrors = error?.payload?.errors
      if (Array.isArray(responseErrors) && responseErrors.length) {
        setBulkUploadErrors(responseErrors)
      } else {
        setBulkUploadMessage(error?.message || "Bulk upload failed")
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = () => {
    const csvContent = "Date,Group,Amount,Bank,Agent\n01-10-2026,Sample Group,100,Sample Bank,Sample Agent"
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

  function handleBulkDialogOpenChange(open) {
    setIsBulkUploadOpen(open)
    if (!open) {
      setBulkFile(null)
      setBulkUploadErrors([])
      setBulkUploadMessage("")
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const [rows, setRows] = useState(demoClaimRows)
  const [tableSearch, setTableSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const [agentBillRows, setAgentBillRows] = useState(() =>
    demoClaimerCalculatedRows.map(row => ({
      ...row,
      agent: row.claimer,
      claimer: row.claimer,
      bank: "Other",
      source: row.group.includes("Depo") ? "Depo" : "Claim"
    }))
  )

  function toBillRowFromApi(row) {
    const amountNum = Math.abs(Number(row.amount || 0))
    const rateNum = Math.abs(Number(row.rate || 0))
    const totalNum = Math.abs(Number(row.total ?? amountNum * rateNum))
    const source =
      String(row.source || "").trim() ||
      (String(row.group_type || "").toLowerCase() === "depo" ? "Depo" : "Claim")
    return {
      id: String(row.id),
      date: normalizeDateValue(row.bill_date),
      group: row.group_name || "-",
      client: row.client_name || "-",
      claimer: row.agent_name || "-",
      bank: row.bank_name || "Other",
      amount: `${amountNum.toFixed(2)} $`,
      rate: `${rateNum.toFixed(2)} ₹`,
      total: `${totalNum.toFixed(2)} ₹`,
      source,
      _dbId: Number(row.id),
      _billId: Number(row.bill_id || row.id),
      _groupId: row.group_id != null ? String(row.group_id) : "",
      _bankId: row.bank_id != null ? String(row.bank_id) : "",
      _clientId: row.client_id != null ? String(row.client_id) : "",
      _agentId: row.agent_id != null ? String(row.agent_id) : "",
      _amountNum: amountNum
    }
  }

  function toClientOtherRowFromApi(row) {
    const amountNum = Number(row.amount || 0)
    return {
      id: `co-${row.id}`,
      date: normalizeDateValue(row.bill_date),
      group: row.group_name || "-",
      client: row.client_name || "-",
      comment: row.comment || "-",
      amount: `${amountNum.toFixed(2)} ₹`,
      total: `${amountNum.toFixed(2)} ₹`,
      _otherDbId: Number(row.id),
      _otherKind: "client",
      _groupId: row.group_id != null ? String(row.group_id) : "",
      _clientId: row.client_id != null ? String(row.client_id) : "",
      _agentId: row.agent_id != null ? String(row.agent_id) : "",
      _amountNum: amountNum
    }
  }

  function toAgentOtherRowFromApi(row) {
    const amountNum = Number(row.amount || 0)
    const agentName = row.agent_name || "-"
    return {
      id: `ao-${row.id}`,
      date: normalizeDateValue(row.bill_date),
      group: "-",
      client: "-",
      claimer: agentName,
      agent: agentName,
      comment: row.comment || "-",
      bank: "-",
      source: "-",
      amount: `${amountNum.toFixed(2)} ₹`,
      rate: "-",
      total: `${amountNum.toFixed(2)} ₹`,
      _otherDbId: Number(row.id),
      _otherKind: "agent",
      _groupId: row.group_id != null ? String(row.group_id) : "",
      _clientId: row.client_id != null ? String(row.client_id) : "",
      _agentId: row.agent_id != null ? String(row.agent_id) : "",
      _amountNum: amountNum
    }
  }

  const [isClaimFormOpen, setIsClaimFormOpen] = useState(false)
  const [isDepoFormOpen, setIsDepoFormOpen] = useState(false)
  const [isClientOtherFormOpen, setIsClientOtherFormOpen] = useState(false)
  const [isAgentOtherFormOpen, setIsAgentOtherFormOpen] = useState(false)
  const [editingBillId, setEditingBillId] = useState(null)
  const [editingBillSource, setEditingBillSource] = useState("")
  const [editingOtherBillId, setEditingOtherBillId] = useState(null)
  const [editingOtherKind, setEditingOtherKind] = useState("")

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
    setEditingOtherBillId(null)
    setEditingOtherKind("")
    resetAgentOtherForm()
  }

  async function submitAgentOtherBill(e) {
    e.preventDefault()
    if (!canSubmitAgentOther) return

    const amountNum = Number(String(agentOtherAmount).trim())
    const payload = {
      kind: "agent",
      bill_date: agentOtherDate.trim(),
      agent_id: Number(agentOtherAgentId),
      comment: agentOtherComment.trim(),
      amount: amountNum
    }

    try {
      if (editingOtherBillId && editingOtherKind === "agent") {
        await updateOtherBill(editingOtherBillId, payload)
      } else {
        await createOtherBill(payload)
      }
      loadBillsForTab("Agent Other Bill")
    } catch (error) {
      console.error("Failed to save agent other bill:", error)
      return
    }

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
    setEditingOtherBillId(null)
    setEditingOtherKind("")
    resetClientOtherForm()
  }

  async function submitClientOtherBill(e) {
    e.preventDefault()
    if (!canSubmitClientOther) return

    const amountNum = Number(String(clientOtherAmount).trim())
    const payload = {
      kind: "client",
      bill_date: clientOtherDate.trim(),
      group_id: Number(clientOtherGroupId),
      client_id: Number(selectedPaymentGroup?.ownerClientId || 0),
      comment: clientOtherComment.trim(),
      amount: amountNum
    }

    try {
      if (editingOtherBillId && editingOtherKind === "client") {
        await updateOtherBill(editingOtherBillId, payload)
      } else {
        await createOtherBill(payload)
      }
      loadBillsForTab("Client Other Bill")
    } catch (error) {
      console.error("Failed to save client other bill:", error)
      return
    }

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
    setEditingBillId(null)
    setEditingBillSource("")
    resetDepoForm()
  }

  async function submitDepoBill(e) {
    e.preventDefault()
    if (!canSubmitDepo) return

    const amountNum = Number(String(depoAmount).trim())
    const rateNum = depoRate
    const clientId = Number(selectedDepoGroup?.ownerClientId || 0)

    const payload = {
      bill_date: depoDate.trim(),
      group_id: Number(depoGroupId),
      bank_id: depoNeedsBankSelect ? Number(depoBankId) : null,
      client_id: clientId,
      agent_id: Number(depoAgentId),
      amount: amountNum,
      rate: rateNum
    }

    try {
      if (editingBillId && editingBillSource === "Depo") {
        await updateBill(editingBillId, payload)
      } else {
        await createBill(payload)
      }
      loadBillsForTab(tab === "Agent Bill" ? "Agent Bill" : "Depo Bills")
    } catch (error) {
      console.error("Failed to save depo bill:", error)
      return
    }

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
        claimer: agent.name,
        bank: depoNeedsBankSelect ? (selectedDepoGroup?.banks || []).find((b) => b.bankId === depoBankId)?.bankName ?? "-" : "Other",
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
    setEditingBillId(null)
    setEditingBillSource("")
    resetClaimForm()
  }

  async function submitClaimBill(e) {
    e.preventDefault()
    if (!canSubmitClaim) return

    const amountNum = Number(String(claimAmount).trim())
    const rateNum = computedRate
    const clientId = Number(selectedClaimGroup?.ownerClientId || 0)

    const payload = {
      bill_date: claimDate.trim(),
      group_id: Number(claimGroupId),
      bank_id: needsBankSelect ? Number(claimBankId) : null,
      client_id: clientId,
      agent_id: Number(claimAgentId),
      amount: amountNum,
      rate: rateNum
    }

    try {
      if (editingBillId && editingBillSource === "Claim") {
        await updateBill(editingBillId, payload)
      } else {
        await createBill(payload)
      }
      loadBillsForTab(tab === "Agent Bill" ? "Agent Bill" : "Claim Bills")
    } catch (error) {
      console.error("Failed to save claim bill:", error)
      return
    }

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
        claimer: agent.name,
        bank: needsBankSelect ? (selectedClaimGroup?.banks || []).find((b) => b.bankId === claimBankId)?.bankName ?? "-" : "Other",
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
  const isAgentBillTab = tab === "Agent Bill"
  const billTableGridCols = isAgentBillTab
    ? "grid-cols-[90px_1.5fr_1fr_1fr_80px_80px_90px_60px_90px]"
    : "grid-cols-[90px_1.5fr_1fr_1fr_80px_80px_90px_70px_90px_70px]"
  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      [
        formatDateDDMMYYYY(normalizeDateValue(row.date)),
        row.group,
        row.client,
        row.agent,
        row.claimer,
        row.bank,
        row.source,
        row.comment,
        row.amount,
        row.rate,
        row.total,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [rows, tableSearch])
  const signedTotalForRow = useMemo(
    () => (row) => {
      const total = toNumber(row?.total)
      return isAgentBillTab ? -Math.abs(total) : total
    },
    [isAgentBillTab]
  )
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE))
  const pageStart = (currentPage - 1) * ROWS_PER_PAGE
  const paginatedRows = filteredRows.slice(pageStart, pageStart + ROWS_PER_PAGE)
  const currentTabTotal = useMemo(
    () => filteredRows.reduce((sum, row) => sum + signedTotalForRow(row), 0),
    [filteredRows, signedTotalForRow]
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [tab, tableSearch, rows.length])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  function rowsForTab(t) {
    if (t === "Depo Bills") return []
    if (t === "Client Other Bill") return []
    if (t === "Agent Bill") return []
    if (t === "Agent Other Bill") return []
    if (t === "Claim Bills") return []
    return demoClaimRows
  }

  function loadBillsForTab(currentTab) {
    if (currentTab === "Agent Bill") {
      setIsBillsLoading(true)
      getAgentBills()
        .then((data) => {
          setRows(Array.isArray(data) ? data.map(toBillRowFromApi) : [])
        })
        .catch((error) => {
          console.error("Failed to load agent bills:", error)
          setRows([])
        })
        .finally(() => setIsBillsLoading(false))
      return
    }

    setIsBillsLoading(true)

    if (currentTab === "Claim Bills" || currentTab === "Depo Bills") {
      const type = currentTab === "Depo Bills" ? "Depo" : "Claim"
      getBills(type)
        .then((data) => {
          setRows(Array.isArray(data) ? data.map(toBillRowFromApi) : [])
        })
        .catch((error) => {
          console.error("Failed to load bills:", error)
          setRows([])
        })
        .finally(() => setIsBillsLoading(false))
      return
    }

    if (currentTab === "Client Other Bill") {
      getOtherBills("client")
        .then((data) => {
          setRows(Array.isArray(data) ? data.map(toClientOtherRowFromApi) : [])
        })
        .catch((error) => {
          console.error("Failed to load client other bills:", error)
          setRows([])
        })
        .finally(() => setIsBillsLoading(false))
      return
    }

    if (currentTab === "Agent Other Bill") {
      getOtherBills("agent")
        .then((data) => {
          setRows(Array.isArray(data) ? data.map(toAgentOtherRowFromApi) : [])
        })
        .catch((error) => {
          console.error("Failed to load agent other bills:", error)
          setRows([])
        })
        .finally(() => setIsBillsLoading(false))
      return
    }

    setRows([])
    setIsBillsLoading(false)
  }

  async function handleDeleteRow(row) {
    const isDbTab = tab === "Claim Bills" || tab === "Depo Bills" || tab === "Agent Bill"
    if (isDbTab && row?._dbId) {
      try {
        const billId = row._billId || row._dbId
        await deleteBill(billId)
        if (editingBillId && Number(editingBillId) === Number(billId)) {
          setEditingBillId(null)
          setEditingBillSource("")
        }
        loadBillsForTab(tab)
      } catch (error) {
        console.error("Failed to delete bill:", error)
      }
      return
    }

    const isOtherDbTab = tab === "Client Other Bill" || tab === "Agent Other Bill"
    if (isOtherDbTab && row?._otherDbId) {
      try {
        await deleteOtherBill(row._otherDbId)
        if (editingOtherBillId && Number(editingOtherBillId) === Number(row._otherDbId)) {
          setEditingOtherBillId(null)
          setEditingOtherKind("")
        }
        loadBillsForTab(tab)
      } catch (error) {
        console.error("Failed to delete other bill:", error)
      }
      return
    }

    setRows((prev) => prev.filter((x) => x.id !== row.id))
  }

  function handleEditRow(row) {
    if (tab === "Client Other Bill") {
      if (!row?._otherDbId) return
      setEditingOtherBillId(Number(row._otherDbId))
      setEditingOtherKind("client")
      setIsClaimFormOpen(false)
      setIsDepoFormOpen(false)
      setIsAgentOtherFormOpen(false)
      setIsClientOtherFormOpen(true)
      setClientOtherDate(normalizeDateValue(row.date))
      setClientOtherGroupId(String(row._groupId || ""))
      setClientOtherComment(String(row.comment || ""))
      setClientOtherAmount(String(row._amountNum ?? ""))
      return
    }

    if (tab === "Agent Other Bill") {
      if (!row?._otherDbId) return
      setEditingOtherBillId(Number(row._otherDbId))
      setEditingOtherKind("agent")
      setIsClaimFormOpen(false)
      setIsDepoFormOpen(false)
      setIsClientOtherFormOpen(false)
      setIsAgentOtherFormOpen(true)
      setAgentOtherDate(normalizeDateValue(row.date))
      setAgentOtherAgentId(String(row._agentId || ""))
      setAgentOtherComment(String(row.comment || ""))
      setAgentOtherAmount(String(row._amountNum ?? ""))
      return
    }

    if (!(tab === "Claim Bills" || tab === "Depo Bills" || tab === "Agent Bill")) return
    if (!row?._dbId) return

    const source = row.source === "Depo" ? "Depo" : "Claim"
    setEditingBillId(Number(row._dbId))
    setEditingBillSource(source)

    if (source === "Depo") {
      setIsClaimFormOpen(false)
      setIsDepoFormOpen(true)
      setDepoDate(normalizeDateValue(row.date))
      setDepoGroupId(String(row._groupId || ""))
      setDepoBankId(String(row._bankId || ""))
      setDepoAgentId(String(row._agentId || ""))
      setDepoAmount(String(row._amountNum ?? ""))
      return
    }

    setIsDepoFormOpen(false)
    setIsClaimFormOpen(true)
    setClaimDate(normalizeDateValue(row.date))
    setClaimGroupId(String(row._groupId || ""))
    setClaimBankId(String(row._bankId || ""))
    setClaimAgentId(String(row._agentId || ""))
    setClaimAmount(String(row._amountNum ?? ""))
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

  useEffect(() => {
    loadBillsForTab(tab)
  }, [tab])

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
                    <div className="mt-0.5 text-sm text-muted-foreground" data-testid="text-bills-tabs-hint">
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
                          setIsAgentOtherFormOpen(false)
                          setEditingBillId(null)
                          setEditingBillSource("")
                          setEditingOtherBillId(null)
                          setEditingOtherKind("")
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
                    <Dialog open={isBulkUploadOpen} onOpenChange={handleBulkDialogOpenChange}>
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
                            Upload CSV/XLS/XLSX with columns: Date, Group, Amount, Bank, Agent.
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
                            <Label htmlFor="bulk-file">Bill Data (CSV/XLS/XLSX)</Label>
                            <Input id="bulk-file" type="file" accept=".csv,.xls,.xlsx" onChange={handleBulkFileChange} ref={fileInputRef} />
                          </div>

                          {bulkUploadMessage ? (
                            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                              {bulkUploadMessage}
                            </div>
                          ) : null}

                          {bulkUploadErrors.length ? (
                            <div className="max-h-56 overflow-auto rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                              <div className="mb-2 font-semibold">
                                Validation failed for {bulkUploadErrors.length} row(s). No data was inserted.
                              </div>
                              {bulkUploadErrors.slice(0, 20).map((entry, idx) => (
                                <div key={`${entry.rowNumber}-${idx}`} className="mb-2">
                                  <div className="font-medium">Row {entry.rowNumber}</div>
                                  <div>{Array.isArray(entry.errors) ? entry.errors.join(" | ") : "Invalid row"}</div>
                                </div>
                              ))}
                              {bulkUploadErrors.length > 20 ? (
                                <div className="font-medium">Showing first 20 rows only.</div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => handleBulkDialogOpenChange(false)}>Cancel</Button>
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
                        setEditingBillId(null)
                        setEditingBillSource("")
                        resetClaimForm()
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
                        setEditingBillId(null)
                        setEditingBillSource("")
                        resetDepoForm()
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
                        setEditingOtherBillId(null)
                        setEditingOtherKind("")
                        resetClientOtherForm()
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
                        setEditingOtherBillId(null)
                        setEditingOtherKind("")
                        resetAgentOtherForm()
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

              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  Search bills in the current tab.
                </div>
                <Input
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search date, group, client, agent, bank, amount..."
                  className="h-11 w-full md:max-w-md"
                  data-testid="input-bills-search"
                />
              </div>

              {isClaimFormOpen ? (
                <div className="rounded-2xl border bg-white/70 p-5 shadow-sm" data-testid="card-new-claim-bill">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">{editingBillSource === "Claim" ? "Edit Claim Bill" : "New Claim Bill"}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Fill details below.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" onClick={closeClaimForm}><X className="h-4 w-4" /> Cancel</Button>
                      <Button type="submit" form="form-new-claim-bill" disabled={!canSubmitClaim}><Plus className="h-4 w-4" /> {editingBillSource === "Claim" ? "Update" : "Save"}</Button>
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
                      <SearchableSelect
                        value={claimGroupId}
                        onValueChange={(v) => {
                          setClaimGroupId(v)
                          setClaimBankId("")
                        }}
                        options={claimGroups.map((g) => ({ value: g.id, label: g.name }))}
                        placeholder={claimGroups.length ? "Select claim group" : "No claim groups"}
                        searchPlaceholder="Search claim group..."
                        emptyText="No claim groups found."
                      />
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
                        <div className="text-sm font-medium text-muted-foreground">Bank</div>
                        <div className="mt-1 text-sm">{selectedClaimGroup ? "Not required (same rate)" : "Select a group first"}</div>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm">Client</Label>
                      <Input value={selectedClientName} readOnly placeholder="Auto selected" className="mt-1 h-11 bg-muted/30" />
                    </div>
                    <div>
                      <Label className="text-sm">Agent</Label>
                      <SearchableSelect
                        value={claimAgentId}
                        onValueChange={setClaimAgentId}
                        options={claimerAgents.map((a) => ({ value: a.id, label: a.name }))}
                        placeholder={claimerAgents.length ? "Select claimer agent" : "No agents"}
                        searchPlaceholder="Search agent..."
                        emptyText="No agent found."
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Claim Amount</Label>
                      <Input inputMode="decimal" type="number" value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} placeholder="0.00" className="soft-ring mt-1 h-11" onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }} />
                    </div>
                    <div>
                      <Label className="text-sm">Rate</Label>
                      <Input value={computedRate ? formatMoney(computedRate, " ₹") : ""} readOnly placeholder="Auto" className="mt-1 h-11 bg-muted/30" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="rounded-2xl border bg-emerald-50 p-4">
                        <div className="text-sm font-medium text-emerald-900/80">Total Amount</div>
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
                      <div className="text-sm font-semibold">{editingBillSource === "Depo" ? "Edit Depo Bill" : "New Depo Bill"}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Fill details below.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" onClick={closeDepoForm}><X className="h-4 w-4" /> Cancel</Button>
                      <Button type="submit" form="form-new-depo-bill" disabled={!canSubmitDepo}><Plus className="h-4 w-4" /> {editingBillSource === "Depo" ? "Update" : "Save"}</Button>
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
                      <SearchableSelect
                        value={depoGroupId}
                        onValueChange={(v) => {
                          setDepoGroupId(v)
                          setDepoBankId("")
                        }}
                        options={depoGroups.map((g) => ({ value: g.id, label: g.name }))}
                        placeholder={depoGroups.length ? "Select depo group" : "No depo groups"}
                        searchPlaceholder="Search depo group..."
                        emptyText="No depo groups found."
                      />
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
                        <div className="text-sm font-medium text-muted-foreground">Bank</div>
                        <div className="mt-1 text-sm">{selectedDepoGroup ? "Not required (same rate)" : "Select a group first"}</div>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm">Client</Label>
                      <Input value={selectedDepoClientName} readOnly placeholder="Auto selected" className="mt-1 h-11 bg-muted/30" />
                    </div>
                    <div>
                      <Label className="text-sm">Agent</Label>
                      <SearchableSelect
                        value={depoAgentId}
                        onValueChange={setDepoAgentId}
                        options={depositerAgents.map((a) => ({ value: a.id, label: a.name }))}
                        placeholder={depositerAgents.length ? "Select depositer agent" : "No agents"}
                        searchPlaceholder="Search agent..."
                        emptyText="No agent found."
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Depo Amount</Label>
                      <Input inputMode="decimal" value={depoAmount} type="number" onChange={(e) => setDepoAmount(e.target.value)} placeholder="0.00" className="soft-ring mt-1 h-11" onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }} />
                    </div>
                    <div>
                      <Label className="text-sm">Rate</Label>
                      <Input value={depoRate ? formatMoney(depoRate, " ₹") : ""} readOnly placeholder="Auto" className="mt-1 h-11 bg-muted/30" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="rounded-2xl border bg-emerald-50 p-4">
                        <div className="text-sm font-medium text-emerald-900/80">Total Amount</div>
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
                      <div className="text-sm font-semibold">{editingOtherKind === "client" ? "Edit Client Other Bill" : "New Client Other Bill"}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Select group and enter amount.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" onClick={closeClientOtherForm}><X className="h-4 w-4" /> Cancel</Button>
                      <Button type="submit" form="form-new-client-other-bill" disabled={!canSubmitClientOther}><Plus className="h-4 w-4" /> {editingOtherKind === "client" ? "Update" : "Save"}</Button>
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
                      <SearchableSelect
                        value={clientOtherGroupId}
                        onValueChange={setClientOtherGroupId}
                        options={paymentGroups.map((g) => ({ value: g.id, label: g.name }))}
                        placeholder={paymentGroups.length ? "Select payment group" : "No payment groups"}
                        searchPlaceholder="Search payment group..."
                        emptyText="No payment groups found."
                      />
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
                      <Input inputMode="decimal" type="number" value={clientOtherAmount} onChange={(e) => setClientOtherAmount(e.target.value)} placeholder="0.00" className="soft-ring mt-1 h-11" onKeyDown={(e) => { if (e.key === 'e' || e.key === 'E') e.preventDefault(); }} />
                    </div>
                    <div className="md:col-span-2">
                      <div className="rounded-2xl border bg-emerald-50 p-4">
                        <div className="text-sm font-medium text-emerald-900/80">Total Amount</div>
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
                      <div className="text-sm font-semibold">{editingOtherKind === "agent" ? "Edit Agent Other Bill" : "New Agent Other Bill"}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Select agent and enter amount.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" onClick={closeAgentOtherForm}><X className="h-4 w-4" /> Cancel</Button>
                      <Button type="submit" form="form-new-agent-other-bill" disabled={!canSubmitAgentOther}><Plus className="h-4 w-4" /> {editingOtherKind === "agent" ? "Update" : "Save"}</Button>
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
                      <SearchableSelect
                        value={agentOtherAgentId}
                        onValueChange={setAgentOtherAgentId}
                        options={agentUsers.map((a) => ({ value: a.id, label: a.name }))}
                        placeholder={agentUsers.length ? "Select agent" : "No agents"}
                        searchPlaceholder="Search agent..."
                        emptyText="No agents found."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm">Comment</Label>
                      <Input value={agentOtherComment} onChange={(e) => setAgentOtherComment(e.target.value)} placeholder="Type comment" className="soft-ring mt-1 h-11" />
                    </div>
                    <div>
                      <Label className="text-sm">Amount</Label>
                      <Input inputMode="decimal" type="number" value={agentOtherAmount} onChange={(e) => setAgentOtherAmount(e.target.value)} placeholder="0.00" className="soft-ring mt-1 h-11" onKeyDown={(e) => { if (e.key === 'e' || e.key === 'E') e.preventDefault(); }} />
                    </div>
                    <div className="md:col-span-2">
                      <div className="rounded-2xl border bg-emerald-50 p-4">
                        <div className="text-sm font-medium text-emerald-900/80">Total Amount</div>
                        <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-900">{formatMoney(agentOtherTotal, " ₹")}</div>
                      </div>
                    </div>
                  </form>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-xl shadow-sm bg-white" data-testid="table-bills">
                <div className="overflow-x-auto">
                  {tab === "Client Other Bill" ? (
                    <div className="min-w-full">
                      <div className="grid grid-cols-[90px_1fr_1fr_1.5fr_100px_100px_70px] gap-2 border-b bg-white px-3 py-3 text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                        <div className="text-center">Date</div>
                        <div className="text-left pl-4">Group</div>
                        <div className="text-left pl-4">Client</div>
                        <div className="text-left pl-4">Comment</div>
                        <div className="text-right pr-4">Amount</div>
                        <div className="text-right pr-4">Total</div>
                        <div className="text-center">Action</div>
                      </div>
                      {paginatedRows.map((r, idx) => (
                        <div
                          key={r.id}
                          className={
                            "grid grid-cols-[90px_1fr_1fr_1.5fr_100px_100px_70px] items-center gap-2 border-t bg-white px-3 py-3 text-sm " +
                            (idx % 2 === 0 ? "" : "bg-muted/5")
                          }
                        >
                          <div className="text-sm text-foreground text-center">{formatDateDDMMYYYY(normalizeDateValue(r.date))}</div>
                          <div className="truncate text-sm text-left pl-4">{r.group || "-"}</div>
                          <div className="truncate text-sm text-left pl-4">{r.client || "-"}</div>
                          <div className="truncate text-sm text-left pl-4">{r.comment || "-"}</div>
                          <div className="text-right text-sm tabular-nums pr-4">{r.amount}</div>
                          <div className={`text-right text-sm tabular-nums pr-4 ${amountTone(toNumber(r.total))}`}>{r.total}</div>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="grid h-8 w-8 place-items-center rounded-lg border bg-white text-muted-foreground transition hover:bg-muted/30 hover:text-foreground"
                              onClick={() => handleEditRow(r)}
                              type="button"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              className="grid h-8 w-8 place-items-center rounded-lg border bg-white text-red-600 transition hover:bg-red-50"
                              onClick={() => handleDeleteRow(r)}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : tab === "Agent Other Bill" ? (
                    <div className="min-w-full">
                      <div className="grid grid-cols-[90px_1.5fr_2fr_100px_100px_70px] gap-2 border-b bg-white px-3 py-3 text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                        <div className="text-center">Date</div>
                        <div className="text-left pl-4">Agent</div>
                        <div className="text-left pl-4">Comment</div>
                        <div className="text-right pr-4">Amount</div>
                        <div className="text-right pr-4">Total</div>
                        <div className="text-center">Action</div>
                      </div>
                      {paginatedRows.map((r, idx) => (
                        <div
                          key={r.id}
                          className={
                            "grid grid-cols-[90px_1.5fr_2fr_100px_100px_70px] items-center gap-2 border-t bg-white px-3 py-3 text-sm " +
                            (idx % 2 === 0 ? "" : "bg-muted/5")
                          }
                        >
                          <div className="text-sm text-foreground text-center">{formatDateDDMMYYYY(normalizeDateValue(r.date))}</div>
                          <div className="truncate text-sm text-left pl-4">{r.agent || r.claimer || "-"}</div>
                          <div className="truncate text-sm text-left pl-4">{r.comment || "-"}</div>
                          <div className="text-right text-sm tabular-nums pr-4">{r.amount}</div>
                          <div className={`text-right text-sm tabular-nums pr-4 ${amountTone(toNumber(r.total))}`}>{r.total}</div>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="grid h-8 w-8 place-items-center rounded-lg border bg-white text-muted-foreground transition hover:bg-muted/30 hover:text-foreground"
                              onClick={() => handleEditRow(r)}
                              type="button"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              className="grid h-8 w-8 place-items-center rounded-lg border bg-white text-red-600 transition hover:bg-red-50"
                              onClick={() => handleDeleteRow(r)}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="min-w-full">
                      <div className={`grid ${billTableGridCols} gap-2 border-b bg-white px-3 py-3 text-sm font-bold uppercase tracking-wider text-muted-foreground/80`}>
                        <div className="text-center" data-testid="th-date">Date</div>
                        <div className="text-left pl-4" data-testid="th-group">Group</div>
                        <div className="text-left pl-4" data-testid="th-client">Client</div>
                        <div className="text-left pl-4" data-testid="th-agent">Agent</div>
                        <div className="text-center" data-testid="th-source">Source</div>
                        <div className="text-center" data-testid="th-bank">Bank</div>
                        <div className="text-right pr-4" data-testid="th-amount">Amount</div>
                        <div className="text-right pr-4" data-testid="th-rate">Rate</div>
                        <div className="text-right pr-4" data-testid="th-total">Total</div>
                        {!isAgentBillTab ? <div className="text-center" data-testid="th-action">Action</div> : null}
                      </div>

                      {paginatedRows.map((r, idx) => (
                        <div
                          key={r.id}
                          className={
                            `grid ${billTableGridCols} items-center gap-2 border-t bg-white px-3 py-3 text-lg ` +
                            (idx % 2 === 0 ? "" : "bg-muted/5")
                          }
                          data-testid={`row-bill-${r.id}`}
                        >
                          <div className="text-sm text-foreground text-center" data-testid={`cell-date-${r.id}`}>
                            {formatDateDDMMYYYY(normalizeDateValue(r.date))}
                          </div>
                          <div className="truncate text-sm text-left pl-4" data-testid={`cell-group-${r.id}`}>
                            {r.group}
                          </div>
                          <div className="truncate text-sm text-left pl-4" data-testid={`cell-client-${r.id}`}>
                            {r.client}
                          </div>
                          <div className="truncate text-sm text-left pl-4" data-testid={`cell-claimer-${r.id}`}>
                            {r.claimer || r.agent || "-"}
                          </div>
                          <div className="truncate text-sm text-center" data-testid={`cell-source-${r.id}`}>
                            {r.source || "-"}
                          </div>
                          <div className="truncate text-sm text-center" data-testid={`cell-bank-${r.id}`}>
                            {r.bank || "-"}
                          </div>
                          <div className="text-right text-sm tabular-nums pr-4" data-testid={`cell-amount-${r.id}`}>
                            {r.amount}
                          </div>
                          <div className="text-right text-sm tabular-nums pr-4" data-testid={`cell-rate-${r.id}`}>
                            {r.rate}
                          </div>
                          <div
                            className={`text-right text-sm tabular-nums pr-4 ${amountTone(signedTotalForRow(r))}`}
                            data-testid={`cell-total-${r.id}`}
                          >
                            {isAgentBillTab ? `-${r.total}` : r.total}
                          </div>
                          {!isAgentBillTab ? (
                            <div className="flex items-center justify-center gap-2" data-testid={`cell-actions-${r.id}`}>
                              <button
                                className="grid h-8 w-8 place-items-center rounded-lg border bg-white text-muted-foreground transition hover:bg-muted/30 hover:text-foreground"
                                onClick={() => handleEditRow(r)}
                                data-testid={`button-edit-bill-${r.id}`}
                                type="button"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                className="grid h-8 w-8 place-items-center rounded-lg border bg-white text-red-600 transition hover:bg-red-50"
                                onClick={() => handleDeleteRow(r)}
                                data-testid={`button-delete-bill-${r.id}`}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!filteredRows.length && (
                  <div className="border-t bg-white px-3 py-10 text-center" data-testid="empty-bills">
                    <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-muted" aria-hidden>
                      <BadgeDollarSign className="h-5 w-5" />
                    </div>
                    <div className="mt-3 text-sm font-semibold" data-testid="text-empty-bills-title">
                      {rows.length ? "No matching bills" : "No bills yet"}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground" data-testid="text-empty-bills-hint">
                      {rows.length ? 'Try a different search term.' : 'Use "New Claim Bill" to add your first bill.'}
                    </div>
                  </div>
                )}
              </div>
              {filteredRows.length > ROWS_PER_PAGE ? (
                <div className="mt-3 flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
                  <div className="text-muted-foreground">
                    Showing {pageStart + 1}-{Math.min(pageStart + ROWS_PER_PAGE, filteredRows.length)} of {filteredRows.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="min-w-20 text-center text-muted-foreground">
                      Page {currentPage} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </div>
    </AppSidebar>
  )
}
