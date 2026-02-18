import { useMemo, useState } from "react"
import { useLocation } from "wouter"
import {
  BadgeDollarSign,
  Building2,
  CreditCard,
  Layers,
  Settings,
  Users,
  Wallet,
  Plus,
  Trash2,
  Phone,
} from "lucide-react"

import AppSidebar from "../components/AppSidebar"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"

const GROUP_TYPES = ["Claim", "Depo", "Processing", "Payment"]

function uid() {
  return Math.random().toString(16).slice(2, 10)
}

function cleanPhone(v) {
  return v.replace(/\s+/g, " ").trim()
}

function isClaimOrDepo(t) {
  return t === "Claim" || t === "Depo"
}

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
  )
}

export default function DashboardPage() {
  const [, setLocation] = useLocation()

  const [banks] = useState([])
  const [users] = useState([])

  const clients = useMemo(() => users.filter((u) => u.userType === "Client"), [users])

  const [bankName, setBankName] = useState("")

  const [groups, setGroups] = useState([])
  const [draft, setDraft] = useState({
    name: "",
    groupType: "Claim",
    ownerClientId: clients[0]?.id ?? "",
    rateMode: "same",
    sameRate: "",
    perBankRates: {},
    adminPhones: [""],
    employeePhones: [""],
  })

  const canAddBank = useMemo(() => bankName.trim().length > 0, [bankName])

  const canCreateGroup = useMemo(() => {
    if (!draft.name.trim()) return false
    if (!draft.ownerClientId) return false

    if (isClaimOrDepo(draft.groupType)) {
      if (draft.rateMode === "same") {
        if (!draft.sameRate.trim()) return false
      } else {
        if (banks.length === 0) return false
        const hasAnyRate = banks.some((b) => (draft.perBankRates[b.id] ?? "").trim().length > 0)
        if (!hasAnyRate) return false
      }
    }

    const anyAdminPhone = draft.adminPhones.some((p) => cleanPhone(p).length > 0)
    const anyEmpPhone = draft.employeePhones.some((p) => cleanPhone(p).length > 0)
    if (!anyAdminPhone && !anyEmpPhone) return false

    return true
  }, [draft, banks])

  function setGroupType(next) {
    setDraft((d) => {
      const nextDraft = { ...d, groupType: next }
      if (!isClaimOrDepo(next)) {
        nextDraft.rateMode = "same"
        nextDraft.sameRate = ""
        nextDraft.perBankRates = {}
      }
      return nextDraft
    })
  }

  function addPhone(list) {
    setDraft((d) => ({ ...d, [list]: [...d[list], ""] }))
  }

  function removePhone(list, index) {
    setDraft((d) => {
      const next = d[list].slice()
      next.splice(index, 1)
      return { ...d, [list]: next.length ? next : [""] }
    })
  }

  function updatePhone(list, index, value) {
    setDraft((d) => {
      const next = d[list].slice()
      next[index] = value
      return { ...d, [list]: next }
    })
  }

  function createGroup(e) {
    e.preventDefault()
    if (!canCreateGroup) return

    const g = {
      id: `g-${uid()}`,
      name: draft.name.trim(),
      groupType: draft.groupType,
      ownerClientId: draft.ownerClientId,
      adminPhones: draft.adminPhones.map(cleanPhone).filter(Boolean),
      employeePhones: draft.employeePhones.map(cleanPhone).filter(Boolean),
    }

    if (isClaimOrDepo(draft.groupType)) {
      g.rateMode = draft.rateMode
      if (draft.rateMode === "same") {
        g.sameRate = draft.sameRate.trim()
      } else {
        const filtered = {}
        for (const b of banks) {
          const v = (draft.perBankRates[b.id] ?? "").trim()
          if (v) filtered[b.id] = v
        }
        g.perBankRates = filtered
      }
    }

    setGroups((prev) => [g, ...prev])

    setDraft((d) => ({
      name: "",
      groupType: d.groupType,
      ownerClientId: d.ownerClientId,
      rateMode: "same",
      sameRate: "",
      perBankRates: {},
      adminPhones: [""],
      employeePhones: [""],
    }))
  }

  function clientNameById(id) {
    return clients.find((c) => c.id === id)?.name ?? "(Unknown client)"
  }

  const stats = useMemo(() => {
    const totalBillsAmount = 0
    const totalClaimerPayments = 0
    const totalUsers = clients.length + users.filter((u) => u.userType === "Agent").length

    return {
      totalBillsAmount,
      totalClaimerPayments,
      totalUsers,
    }
  }, [clients.length, users])

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <div className="flex items-start justify-between gap-4 mb-8">
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
              value={`$${stats.totalBillsAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subtitle="Bills generated this month"
              testId="card-stat-bills"
            />
            <StatCard
              icon={<Wallet className="h-6 w-6" />}
              title="Total Claimer Payments"
              value={`$${stats.totalClaimerPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
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
            <div className="space-y-8">
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
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground" data-testid="th-phone">Phone</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground" data-testid="th-last-date">Last Date</TableHead>
                          <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground" data-testid="th-total">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.slice(0, 5).map((c, idx) => (
                          <TableRow key={c.id} className="border-border/50" data-testid={`row-top-client-${c.id}`}>
                            <TableCell className="text-center text-muted-foreground font-medium" data-testid={`cell-rank-${c.id}`}>
                              {idx + 1}
                            </TableCell>
                            <TableCell data-testid={`cell-client-${c.id}`}>
                              <div className="flex items-center gap-3">
                                <div
                                  className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                                  data-testid={`img-client-avatar-${c.id}`}
                                >
                                  {c.name.slice(0, 1).toUpperCase()}
                                </div>
                                <span className="font-medium text-foreground">{c.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm" data-testid={`cell-phone-${c.id}`}>
                              {c.phone ?? "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm" data-testid={`cell-date-${c.id}`}>
                              {c.lastDate ?? "-"}
                            </TableCell>
                            <TableCell className="text-right font-bold text-foreground" data-testid={`cell-total-${c.id}`}>
                              {(c.total ?? 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppSidebar>
  )
}
