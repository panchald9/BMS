import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Layers, Plus, Save, X } from "lucide-react";
import AppSidebar from "../components/app-sidebar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import { Separator } from "../components/ui/Separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getGroupFullData,
  getClientUsers,
  getBanks,
  updateGroup as updateGroupApi,
  createGroupBankRate,
  updateGroupBankRate,
  deleteGroupBankRate,
  createGroupAdminNumber,
  updateGroupAdminNumber,
  deleteGroupAdminNumber,
  createGroupEmployeeNumber,
  updateGroupEmployeeNumber,
  deleteGroupEmployeeNumber,
  createGroupPastMember,
  updateGroupPastMember,
  deleteGroupPastMember
} from "../lib/api";
import { useToast } from "../hooks/use-toast";

const GROUP_TYPES = ["Claim", "Depo", "Processing", "Payment"];
const MEMBER_TYPES = ["admin", "employee"];
const PHONE_MAX_LENGTH = 12;

function cleanPhone(v) {
  return v.replace(/\s+/g, " ").trim();
}

function emptyPhoneRow() {
  return { rowId: null, name: "", number: "" };
}

function emptyPastMemberDraft() {
  return { member_type: "employee", name: "", number: "" };
}

function normalizeDigits(v) {
  return String(v || "").replace(/\D/g, "");
}

function isValidPhone(v) {
  const n = normalizeDigits(v);
  return n.length >= 10 && n.length <= 12;
}

function isClaimOrDepo(t) {
  return t === "Claim" || t === "Depo";
}

function isValidRate(v) {
  const s = v.trim();
  if (!s) return false;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0;
}

export default function EditGroupPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/groups/edit/:id");
  const groupId = params?.id ?? "";
  const { toast } = useToast();

  const [group, setGroup] = useState(null);
  const [clients, setClients] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState("Claim");
  const [ownerClientId, setOwnerClientId] = useState("");

  const [rateMode, setRateMode] = useState("same");
  const [sameRate, setSameRate] = useState("");
  const [perBankRates, setPerBankRates] = useState({});

  const [adminPhones, setAdminPhones] = useState([emptyPhoneRow()]);
  const [employeePhones, setEmployeePhones] = useState([emptyPhoneRow()]);
  const [pastMembers, setPastMembers] = useState([]);
  const [pastMemberDraft, setPastMemberDraft] = useState(emptyPastMemberDraft());

  const selectedClient = useMemo(
    () => clients.find((c) => String(c.id) === String(ownerClientId)) || null,
    [clients, ownerClientId]
  );

  useEffect(() => {
    Promise.all([
      getGroupFullData(groupId),
      getClientUsers(),
      getBanks()
    ])
      .then(([groupData, clientsData, banksData]) => {
        setGroup(groupData);
        setClients(clientsData);
        setBanks(banksData);

        if (groupData) {
          setGroupName(groupData.name ?? "");
          setGroupType(groupData.type);
          setOwnerClientId(String(groupData.owner));
          const hasSameRate = groupData.same_rate !== null && groupData.same_rate !== undefined;
          setRateMode(hasSameRate ? "same" : "per-bank");
          setSameRate(hasSameRate ? String(groupData.same_rate) : "");
          
          const rates = {};
          (groupData.bankRates || []).forEach(br => {
            rates[br.bank_id] = String(br.rate);
          });
          setPerBankRates(rates);

          setAdminPhones(
            groupData.adminNumbers?.length
              ? groupData.adminNumbers.map((n) => ({ rowId: Number(n.id), name: n.name || "", number: n.number || "" }))
              : [emptyPhoneRow()]
          );
          setEmployeePhones(
            groupData.employeeNumbers?.length
              ? groupData.employeeNumbers.map((n) => ({ rowId: Number(n.id), name: n.name || "", number: n.number || "" }))
              : [emptyPhoneRow()]
          );
          setPastMembers(
            groupData.pastMembers?.length
              ? groupData.pastMembers.map((m) => ({
                  id: m.id,
                  member_type: m.member_type || "employee",
                  name: m.name || "",
                  number: m.number || "",
                  source: m.source || "manual"
                }))
              : []
          );
        }
      })
      .catch((err) => console.error("Failed to load data:", err))
      .finally(() => setLoading(false));
  }, [groupId]);

  useEffect(() => {
    if (!selectedClient) return;
    const clientName = String(selectedClient.name || "").trim();
    const clientPhone = normalizeDigits(selectedClient.phone || selectedClient.alternate_phone || "");
    setAdminPhones((prev) => {
      if (!prev.length) return [{ rowId: null, name: clientName, number: clientPhone }];
      const next = prev.slice();
      const first = next[0] || emptyPhoneRow();
      const firstName = String(first.name || "").trim();
      const firstNumber = normalizeDigits(first.number || "");
      next[0] = {
        ...first,
        name: firstName || clientName,
        number: firstNumber || clientPhone
      };
      return next;
    });
  }, [selectedClient]);

  const rateErrors = useMemo(() => {
    if (!isClaimOrDepo(groupType)) return { same: false, byBank: {} };

    if (rateMode === "same") {
      return { same: !!sameRate.trim() && !isValidRate(sameRate), byBank: {} };
    }

    const err = {};
    for (const b of banks) {
      const v = perBankRates[b.id] ?? "";
      err[b.id] = !!v.trim() && !isValidRate(v);
    }
    return { same: false, byBank: err };
  }, [groupType, rateMode, sameRate, perBankRates, banks]);

  const canSave = useMemo(() => {
    if (!groupName.trim()) return false;
    if (!ownerClientId) return false;

    if (isClaimOrDepo(groupType)) {
      if (rateMode === "same") {
        if (!sameRate.trim()) return false;
        if (!isValidRate(sameRate)) return false;
      } else {
        const hasAnyRate = banks.some((b) => (perBankRates[b.id] ?? "").trim().length > 0);
        if (!hasAnyRate) return false;
        const allValid = banks.every((b) => {
          const v = (perBankRates[b.id] ?? "").trim();
          if (!v) return true;
          return isValidRate(v);
        });
        if (!allValid) return false;
      }
    }

    const anyAdminPhone = adminPhones.some((p) => cleanPhone(p.number).length > 0);
    const anyEmpPhone = employeePhones.some((p) => cleanPhone(p.number).length > 0);
    if (!anyAdminPhone && !anyEmpPhone) return false;

    return true;
  }, [groupName, ownerClientId, groupType, rateMode, sameRate, perBankRates, banks, adminPhones, employeePhones]);

  function addPhone(list) {
    if (list === "admin") setAdminPhones((prev) => [...prev, emptyPhoneRow()]);
    else setEmployeePhones((prev) => [...prev, emptyPhoneRow()]);
  }

  function removePhone(list, index) {
    if (list === "admin") {
      const removed = adminPhones[index];
      setAdminPhones((prev) => {
        const next = prev.slice();
        next.splice(index, 1);
        return next.length ? next : [emptyPhoneRow()];
      });
      addPastMemberFromRow("admin", removed, "removed");
      return;
    }

    const removed = employeePhones[index];
    setEmployeePhones((prev) => {
      const next = prev.slice();
      next.splice(index, 1);
      return next.length ? next : [emptyPhoneRow()];
    });
    addPastMemberFromRow("employee", removed, "removed");
  }

  function updatePhone(list, index, field, value) {
    const nextValue = field === "number" ? value.slice(0, PHONE_MAX_LENGTH) : value;
    if (list === "admin") {
      setAdminPhones((prev) => {
        const next = prev.slice();
        next[index] = { ...next[index], [field]: nextValue };
        return next;
      });
      return;
    }

    setEmployeePhones((prev) => {
      const next = prev.slice();
      next[index] = { ...next[index], [field]: nextValue };
      return next;
    });
  }

  async function persistPastMember(payload) {
    if (!group?.id) return;
    const number = normalizeDigits(payload?.number);
    if (!isValidPhone(number)) return;

    const exists = pastMembers.some(
      (m) => m.member_type === payload.member_type && normalizeDigits(m.number) === number
    );
    if (exists) return;

    try {
      const created = await createGroupPastMember({
        group_id: group.id,
        member_type: payload.member_type,
        name: String(payload.name || "").trim() || null,
        number,
        source: payload.source || "manual"
      });
      setPastMembers((prev) => [...prev, created]);
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to add past member",
        variant: "destructive",
      });
    }
  }

  function addPastMemberFromRow(memberType, row, source = "manual") {
    const normalizedType = String(memberType || "").trim().toLowerCase();
    if (!MEMBER_TYPES.includes(normalizedType)) return;
    persistPastMember({
      member_type: normalizedType,
      name: String(row?.name || "").trim(),
      number: row?.number || "",
      source
    });
  }

  function addPastMemberManually() {
    addPastMemberFromRow(pastMemberDraft.member_type, pastMemberDraft, "manual");
    setPastMemberDraft((prev) => ({ ...prev, name: "", number: "" }));
  }

  function updatePastMemberLocal(id, field, value) {
    setPastMembers((prev) =>
      prev.map((m) => {
        if (String(m.id) !== String(id)) return m;
        const nextValue =
          field === "number" ? normalizeDigits(value).slice(0, PHONE_MAX_LENGTH) : String(value || "");
        return { ...m, [field]: nextValue };
      })
    );
  }

  async function savePastMember(member) {
    if (!group?.id || !member?.id) return;
    const normalizedNumber = normalizeDigits(member.number);
    if (!isValidPhone(normalizedNumber)) {
      toast({
        title: "Error",
        description: "Past member number must be 10 to 12 digits",
        variant: "destructive",
      });
      return;
    }

    try {
      const updated = await updateGroupPastMember(member.id, {
        group_id: group.id,
        member_type: member.member_type,
        name: String(member.name || "").trim() || null,
        number: normalizedNumber,
        source: member.source || "manual"
      });
      setPastMembers((prev) => prev.map((m) => (String(m.id) === String(member.id) ? updated : m)));
      toast({
        title: "Past member updated",
        description: "Changes saved successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to update past member",
        variant: "destructive",
      });
    }
  }

  async function removePastMember(id) {
    if (!id) return;
    try {
      await deleteGroupPastMember(id);
      setPastMembers((prev) => prev.filter((m) => String(m.id) !== String(id)));
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete past member",
        variant: "destructive",
      });
    }
  }

  function normalizePhoneRows(rows) {
    return (Array.isArray(rows) ? rows : [])
      .map((row) => ({
        rowId: row?.rowId ? Number(row.rowId) : null,
        name: String(row?.name || "").trim(),
        number: normalizeDigits(row?.number || "")
      }))
      .filter((row) => isValidPhone(row.number));
  }

  async function syncPhoneNumbers(groupIdValue) {
    const existingAdmins = Array.isArray(group?.adminNumbers) ? group.adminNumbers : [];
    const existingEmployees = Array.isArray(group?.employeeNumbers) ? group.employeeNumbers : [];

    const adminRows = normalizePhoneRows(adminPhones);
    const employeeRows = normalizePhoneRows(employeePhones);

    const existingAdminIds = new Set(existingAdmins.map((row) => Number(row.id)).filter(Number.isFinite));
    const existingEmployeeIds = new Set(existingEmployees.map((row) => Number(row.id)).filter(Number.isFinite));
    const currentAdminIds = new Set(adminRows.map((row) => row.rowId).filter(Number.isFinite));
    const currentEmployeeIds = new Set(employeeRows.map((row) => row.rowId).filter(Number.isFinite));

    const requests = [];

    for (const row of adminRows) {
      const payload = { group_id: groupIdValue, name: row.name || null, number: row.number };
      if (Number.isFinite(row.rowId) && existingAdminIds.has(row.rowId)) {
        requests.push(updateGroupAdminNumber(row.rowId, payload));
      } else {
        requests.push(createGroupAdminNumber(payload));
      }
    }

    for (const row of employeeRows) {
      const payload = { group_id: groupIdValue, name: row.name || null, number: row.number };
      if (Number.isFinite(row.rowId) && existingEmployeeIds.has(row.rowId)) {
        requests.push(updateGroupEmployeeNumber(row.rowId, payload));
      } else {
        requests.push(createGroupEmployeeNumber(payload));
      }
    }

    for (const row of existingAdmins) {
      const id = Number(row.id);
      if (Number.isFinite(id) && !currentAdminIds.has(id)) {
        requests.push(deleteGroupAdminNumber(id));
      }
    }

    for (const row of existingEmployees) {
      const id = Number(row.id);
      if (Number.isFinite(id) && !currentEmployeeIds.has(id)) {
        requests.push(deleteGroupEmployeeNumber(id));
      }
    }

    if (requests.length) await Promise.all(requests);
  }

  async function syncBankRates(groupIdValue) {
    const existingRates = Array.isArray(group?.bankRates) ? group.bankRates : [];

    if (!isClaimOrDepo(groupType) || rateMode === "same") {
      if (!existingRates.length) return;
      await Promise.all(existingRates.map((row) => deleteGroupBankRate(row.id)));
      return;
    }

    const desiredEntries = banks
      .map((bank) => {
        const raw = (perBankRates[bank.id] ?? "").trim();
        if (!raw) return null;
        return { bankId: Number(bank.id), rate: Number(raw) };
      })
      .filter(Boolean);

    const existingByBankId = new Map(
      existingRates.map((row) => [Number(row.bank_id), row]).filter(([id]) => Number.isFinite(id))
    );
    const desiredBankIds = new Set(desiredEntries.map((entry) => entry.bankId));
    const requests = [];

    for (const entry of desiredEntries) {
      const existing = existingByBankId.get(entry.bankId);
      const payload = {
        group_id: groupIdValue,
        bank_id: entry.bankId,
        rate: entry.rate,
      };
      if (existing?.id) {
        requests.push(updateGroupBankRate(existing.id, payload));
      } else {
        requests.push(createGroupBankRate(payload));
      }
    }

    for (const row of existingRates) {
      const bankId = Number(row.bank_id);
      if (!desiredBankIds.has(bankId)) {
        requests.push(deleteGroupBankRate(row.id));
      }
    }

    if (requests.length) await Promise.all(requests);
  }

  async function onSave(e) {
    e.preventDefault();
    if (!group || !canSave) return;
    const draftNumber = normalizeDigits(pastMemberDraft.number);
    const hasDraftInput =
      String(pastMemberDraft.name || "").trim().length > 0 ||
      String(pastMemberDraft.number || "").trim().length > 0;
    if (hasDraftInput && !isValidPhone(draftNumber)) {
      toast({
        title: "Error",
        description: "Past member number must be 10 to 12 digits.",
        variant: "destructive",
      });
      return;
    }

    const groupPayload = {
      name: groupName.trim(),
      type: groupType,
      owner: Number(ownerClientId),
      same_rate: isClaimOrDepo(groupType) && rateMode === "same" ? Number(sameRate) : null
    };

    try {
      if (hasDraftInput && isValidPhone(draftNumber)) {
        const draftType = String(pastMemberDraft.member_type || "").toLowerCase();
        const exists = pastMembers.some(
          (m) => m.member_type === draftType && normalizeDigits(m.number) === draftNumber
        );
        if (!exists) {
          const created = await createGroupPastMember({
            group_id: group.id,
            member_type: draftType,
            name: String(pastMemberDraft.name || "").trim() || null,
            number: draftNumber,
            source: "manual"
          });
          setPastMembers((prev) => [...prev, created]);
        }
        setPastMemberDraft((prev) => ({ ...prev, name: "", number: "" }));
      }

      await updateGroupApi(group.id, groupPayload);
      await syncBankRates(group.id);
      await syncPhoneNumbers(group.id);
      toast({
        title: "Group updated",
        description: `${groupName} has been updated successfully.`,
      });
      setLocation(`/groups/${group.id}`);
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to update group",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <AppSidebar>
        <div className="min-h-svh w-full bg-background">
          <div className="mx-auto w-full max-w-6xl px-6 py-8">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </div>
      </AppSidebar>
    );
  }

  if (!group) {
    return (
      <AppSidebar>
        <div className="min-h-svh w-full bg-background">
          <div className="mx-auto w-full max-w-6xl px-6 py-8">
            <Card className="rounded-2xl border bg-white/70 p-6 shadow-sm" data-testid="card-edit-group-not-found">
              <div className="text-sm font-semibold" data-testid="text-edit-group-not-found-title">
                Group not found
              </div>
              <div className="mt-1 text-sm text-muted-foreground" data-testid="text-edit-group-not-found-hint">
                This group may have been deleted.
              </div>
              <Button className="mt-4" onClick={() => setLocation("/groups")} data-testid="button-back-groups-not-found">
                Back to Groups
              </Button>
            </Card>
          </div>
        </div>
      </AppSidebar>
    );
  }

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-4xl font-semibold tracking-tight" data-testid="text-edit-group-title">
                  Edit Group
                </h1>
                <Badge variant="secondary" data-testid="badge-edit-group-id">{group.id}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground" data-testid="text-edit-group-subtitle">
                Update group settings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => setLocation(`/groups/${group.id}`)} data-testid="button-cancel-edit">
                Cancel
              </Button>
              <Button onClick={onSave} disabled={!canSave} data-testid="button-save-group-top">
                <Save className="h-4 w-4" /> Save changes
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm lg:col-span-3" data-testid="card-edit-group-form">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold" data-testid="text-edit-group-heading">
                    Edit form
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid="text-edit-group-hint">
                    Pre-filled from group data.
                  </div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted" aria-hidden>
                  <Layers className="h-5 w-5 text-foreground" />
                </div>
              </div>

              <form onSubmit={onSave} className="space-y-4" data-testid="form-edit-group">
                <div>
                  <Label className="text-sm" htmlFor="group-name" data-testid="label-group-name">
                    Group Name
                  </Label>
                  <Input
                    id="group-name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group name"
                    className="soft-ring mt-1 h-11"
                    data-testid="input-group-name"
                  />
                </div>

                <div>
                  <Label className="text-sm" data-testid="label-group-type">
                    Group Type
                  </Label>
                  <Select value={groupType} onValueChange={(v) => setGroupType(v)}>
                    <SelectTrigger className="soft-ring mt-1 h-11" data-testid="select-group-type">
                      <SelectValue placeholder="Select group type" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_TYPES.map((t) => (
                        <SelectItem key={t} value={t} data-testid={`option-group-type-${t.toLowerCase()}`}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm" data-testid="label-group-owner">
                    Group Owner
                  </Label>
                  <Select value={ownerClientId} onValueChange={(v) => setOwnerClientId(v)}>
                    <SelectTrigger className="soft-ring mt-1 h-11" data-testid="select-group-owner">
                      <SelectValue placeholder={clients.length ? "Select client" : "No clients created"} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.length ? (
                        clients.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)} data-testid={`option-group-owner-${c.id}`}>
                            {c.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">No clients available</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {isClaimOrDepo(groupType) ? (
                  <div className="rounded-2xl border bg-white p-4" data-testid="section-rate-config">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold" data-testid="text-rate-config-title">
                        Rate Configuration
                      </div>
                      <Badge variant="secondary" data-testid="badge-rate-config">
                        {rateMode === "per-bank" ? "Per bank" : "Same"}
                      </Badge>
                    </div>

                    <RadioGroup
                      value={rateMode}
                      onValueChange={(v) => setRateMode(v)}
                      className="mt-3 grid gap-2"
                      data-testid="radio-rate-mode"
                    >
                      <label
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2"
                        data-testid="row-rate-same"
                      >
                        <span className="text-sm">Same rate for all banks</span>
                        <RadioGroupItem value="same" data-testid="radio-rate-same" />
                      </label>

                      <label
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2"
                        data-testid="row-rate-per-bank"
                      >
                        <span className="text-sm">Different rate for each bank</span>
                        <RadioGroupItem value="per-bank" data-testid="radio-rate-per-bank" />
                      </label>
                    </RadioGroup>

                    {rateMode === "same" ? (
                      <div className="mt-4" data-testid="section-rate-same">
                        <Label className="text-sm" htmlFor="rate" data-testid="label-rate-per-unit">
                          Rate (per unit)
                        </Label>
                        <Input
                          id="rate"
                          inputMode="decimal"
                          value={sameRate}
                          onChange={(e) => setSameRate(e.target.value)}
                          placeholder="e.g., 25"
                          className={`soft-ring mt-1 h-11 ${rateErrors.same ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                          data-testid="input-rate-per-unit"
                          onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
                        />
                        {rateErrors.same ? (
                          <div className="mt-1 text-xs text-red-600" data-testid="error-rate-same">
                            Enter a valid number (0 or more).
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2" data-testid="section-rate-per-bank">
                        {banks.map((b) => {
                          const hasError = !!rateErrors.byBank[b.id];
                          return (
                            <div key={b.id} className="rounded-xl border bg-muted/20 p-3" data-testid={`row-bank-rate-${b.id}`}>
                              <div className="text-sm font-medium" data-testid={`text-bank-rate-name-${b.id}`}>
                                {b.bank_name}
                              </div>
                              <Input
                                inputMode="decimal"
                                value={perBankRates[b.id] ?? ""}
                                onChange={(e) => setPerBankRates((prev) => ({ ...prev, [b.id]: e.target.value }))}
                                placeholder="Rate"
                                className={`soft-ring mt-2 h-11 ${hasError ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                                data-testid={`input-bank-rate-${b.id}`}
                                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
                              />
                              {hasError && (
                                <div className="mt-1 text-xs text-red-600" data-testid={`error-bank-rate-${b.id}`}>
                                  Invalid number
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border bg-white p-4" data-testid="section-rate-na">
                    <div className="text-sm font-semibold" data-testid="text-rate-na-title">Rate Configuration</div>
                    <div className="mt-1 text-sm text-muted-foreground" data-testid="text-rate-na-hint">
                      Rates are not required for Processing/Payment groups.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border bg-white p-4" data-testid="section-admin-phones">
                    <div className="text-sm font-semibold" data-testid="text-admin-phones-title">
                      Admin Phone Number
                    </div>
                    <div className="mt-3 space-y-3" data-testid="list-admin-phones">
                      {adminPhones.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2" data-testid={`row-admin-phone-${idx}`}>
                          <Input
                            value={p.name}
                            onChange={(e) => updatePhone("admin", idx, "name", e.target.value)}
                            placeholder="Name (optional)"
                            className="soft-ring h-11 flex-1"
                            data-testid={`input-admin-phone-name-${idx}`}
                          />
                          <Input
                            inputMode="tel"
                            value={p.number}
                            maxLength={PHONE_MAX_LENGTH}
                            onChange={(e) => updatePhone("admin", idx, "number", e.target.value)}
                            placeholder="10 to 12 digits"
                            pattern="[0-9]*"
                            className="soft-ring h-11 flex-1"
                            data-testid={`input-admin-phone-${idx}`}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={() => removePhone("admin", idx)}
                            className="h-11 w-11 shrink-0 rounded-xl bg-[#e7e3f1] text-[#5a2ca0] hover:bg-[#ddd7ec]"
                            data-testid={`button-remove-admin-phone-${idx}`}
                          >
                            <span className="sr-only">Remove</span>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-3 h-11 w-full bg-[#d9d3e8] text-[#3f178f] hover:bg-[#cfc8e0]"
                      onClick={() => addPhone("admin")}
                      data-testid="button-add-admin-phone"
                    >
                      Add admin phone
                    </Button>
                  </div>

                  <div className="rounded-2xl border bg-white p-4" data-testid="section-employee-phones">
                    <div className="text-sm font-semibold" data-testid="text-employee-phones-title">
                      Employee Phone Number
                    </div>
                    <div className="mt-3 space-y-3" data-testid="list-employee-phones">
                      {employeePhones.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2" data-testid={`row-employee-phone-${idx}`}>
                          <Input
                            value={p.name}
                            onChange={(e) => updatePhone("employee", idx, "name", e.target.value)}
                            placeholder="Name (optional)"
                            className="soft-ring h-11 flex-1"
                            data-testid={`input-employee-phone-name-${idx}`}
                          />
                          <Input
                            inputMode="tel"
                            value={p.number}
                            maxLength={PHONE_MAX_LENGTH}
                            onChange={(e) => updatePhone("employee", idx, "number", e.target.value)}
                            placeholder="10 to 12 digits"
                            pattern="[0-9]*"
                            className="soft-ring h-11 flex-1"
                            data-testid={`input-employee-phone-${idx}`}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={() => removePhone("employee", idx)}
                            className="h-11 w-11 shrink-0 rounded-xl bg-[#e7e3f1] text-[#5a2ca0] hover:bg-[#ddd7ec]"
                            data-testid={`button-remove-employee-phone-${idx}`}
                          >
                            <span className="sr-only">Remove</span>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-3 h-11 w-full bg-[#d9d3e8] text-[#3f178f] hover:bg-[#cfc8e0]"
                      onClick={() => addPhone("employee")}
                      data-testid="button-add-employee-phone"
                    >
                      Add employee phone
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-4" data-testid="section-past-members">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold" data-testid="text-past-members-title">
                      Past Members
                    </div>
                    <Badge variant="secondary" data-testid="badge-past-member-count">
                      {pastMembers.length}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                    <Select
                      value={pastMemberDraft.member_type}
                      onValueChange={(v) => setPastMemberDraft((prev) => ({ ...prev, member_type: v }))}
                    >
                      <SelectTrigger className="soft-ring h-11" data-testid="select-past-member-type">
                        <SelectValue placeholder="Member type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin" data-testid="option-past-member-type-admin">
                          Admin
                        </SelectItem>
                        <SelectItem value="employee" data-testid="option-past-member-type-employee">
                          Employee
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={pastMemberDraft.name}
                      onChange={(e) => setPastMemberDraft((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Name (optional)"
                      className="soft-ring h-11"
                      data-testid="input-past-member-name"
                    />
                    <Input
                      inputMode="tel"
                      value={pastMemberDraft.number}
                      onChange={(e) =>
                        setPastMemberDraft((prev) => ({
                          ...prev,
                          number: normalizeDigits(e.target.value).slice(0, PHONE_MAX_LENGTH)
                        }))
                      }
                      placeholder="10 to 12 digits"
                      pattern="[0-9]*"
                      className="soft-ring h-11"
                      data-testid="input-past-member-number"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11"
                      onClick={addPastMemberManually}
                      disabled={!isValidPhone(pastMemberDraft.number)}
                      data-testid="button-add-past-member"
                    >
                      <Plus className="h-4 w-4" /> Add past member
                    </Button>
                  </div>

                  {pastMembers.length ? (
                    <div className="mt-3 space-y-2" data-testid="list-past-members">
                      {pastMembers.map((member) => (
                        <div
                          key={member.id}
                          className="rounded-xl border bg-muted/20 px-3 py-2"
                          data-testid={`row-past-member-${member.id}`}
                        >
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                            <Select
                              value={member.member_type}
                              onValueChange={(v) => updatePastMemberLocal(member.id, "member_type", v)}
                            >
                              <SelectTrigger className="soft-ring h-10" data-testid={`select-past-member-type-${member.id}`}>
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="employee">Employee</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={member.name || ""}
                              onChange={(e) => updatePastMemberLocal(member.id, "name", e.target.value)}
                              placeholder="Name (optional)"
                              className="soft-ring h-10"
                              data-testid={`input-past-member-name-${member.id}`}
                            />
                            <Input
                              inputMode="tel"
                              value={member.number || ""}
                              onChange={(e) => updatePastMemberLocal(member.id, "number", e.target.value)}
                              placeholder="10 to 12 digits"
                              className="soft-ring h-10"
                              data-testid={`input-past-member-number-${member.id}`}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              className="h-10"
                              onClick={() => savePastMember(member)}
                              disabled={!isValidPhone(member.number || "")}
                              data-testid={`button-update-past-member-${member.id}`}
                            >
                              Update
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="h-10"
                              onClick={() => removePastMember(member.id)}
                              data-testid={`button-delete-past-member-${member.id}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-muted-foreground" data-testid="text-past-members-empty">
                      Remove a phone to auto-add it as past member, or add manually.
                    </div>
                  )}
                </div>

                <Button type="submit" className="h-11 w-full" disabled={!canSave} data-testid="button-save-group">
                  <Save className="h-4 w-4" /> Save changes
                </Button>
              </form>
            </Card>

            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm lg:col-span-2" data-testid="card-edit-group-summary">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold" data-testid="text-summary-title">
                  Summary
                </div>
                <Badge variant="secondary" data-testid="badge-summary-status">
                  Editing
                </Badge>
              </div>

              <Separator className="my-3" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between" data-testid="row-summary-name">
                  <span className="text-muted-foreground">Group name</span>
                  <span className="font-medium" data-testid="text-summary-name">
                    {groupName.trim() || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between" data-testid="row-summary-type">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium" data-testid="text-summary-type">
                    {groupType}
                  </span>
                </div>
                <div className="flex items-center justify-between" data-testid="row-summary-owner">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-medium" data-testid="text-summary-owner">
                    {clients.find((c) => String(c.id) === ownerClientId)?.name ?? "-"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
