import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layers, Plus, X } from "lucide-react";
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
  getClientUsers,
  getBanks,
  createGroup,
  createGroupBankRate,
  createGroupAdminNumber,
  createGroupEmployeeNumber,
  createGroupPastMember
} from "../lib/api";
import { useToast } from "../hooks/use-toast";

const GROUP_TYPES = ["Claim", "Depo", "Processing", "Payment"];
const MEMBER_TYPES = ["admin", "employee"];
const PHONE_MIN_LENGTH = 10;
const PHONE_MAX_LENGTH = 12;
const MAX_ADMIN_PHONES = 5;

function uid() {
  return Math.random().toString(16).slice(2, 10);
}

function cleanPhone(v) {
  return String(v || "").replace(/\D/g, "").slice(0, PHONE_MAX_LENGTH);
}

function isValidPhone(v) {
  const cleaned = cleanPhone(v);
  return cleaned.length >= PHONE_MIN_LENGTH && cleaned.length <= PHONE_MAX_LENGTH;
}

function isClaimOrDepo(t) {
  return t === "Claim" || t === "Depo";
}

function emptyPhoneRow() {
  return { name: "", number: "" };
}

function emptyPastMemberDraft() {
  return { member_type: "employee", name: "", number: "" };
}

export default function CreateGroupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [ownerClientId, setOwnerClientId] = useState("");

  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState("Claim");

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
    getClientUsers()
      .then((data) => {
        setClients(data);
        if (data.length > 0) setOwnerClientId(String(data[0].id));
      })
      .catch((err) => console.error("Failed to load clients:", err))
      .finally(() => setLoadingClients(false));
  }, []);

  useEffect(() => {
    if (rateMode === "per-bank" && banks.length === 0) {
      setLoadingBanks(true);
      getBanks()
        .then((data) => setBanks(data))
        .catch((err) => console.error("Failed to load banks:", err))
        .finally(() => setLoadingBanks(false));
    }
  }, [rateMode, banks.length]);

  useEffect(() => {
    if (!selectedClient) return;
    const clientName = String(selectedClient.name || "").trim();
    const clientPhone = cleanPhone(selectedClient.phone || selectedClient.alternate_phone || "");
    setAdminPhones((prev) => {
      if (!prev.length) return [{ name: clientName, number: clientPhone }];
      const next = prev.slice();
      next[0] = { ...next[0], name: clientName, number: clientPhone };
      return next;
    });
  }, [selectedClient]);

  const canCreate = useMemo(() => {
    if (!groupName.trim()) return false;
    if (!ownerClientId) return false;

    if (isClaimOrDepo(groupType)) {
      if (rateMode === "same") {
        if (!sameRate.trim()) return false;
      } else {
        if (banks.length === 0) return false;
        const hasAnyRate = banks.some((b) => (perBankRates[b.id] ?? "").trim().length > 0);
        if (!hasAnyRate) return false;
      }
    }

    const anyAdminPhone = adminPhones.some((p) => isValidPhone(p.number));
    const anyEmpPhone = employeePhones.some((p) => isValidPhone(p.number));
    if (!anyAdminPhone && !anyEmpPhone) return false;

    const hasInvalidAdmin = adminPhones.some((p) => {
      const cleaned = cleanPhone(p.number);
      return cleaned.length > 0 && !isValidPhone(cleaned);
    });
    const hasInvalidEmployee = employeePhones.some((p) => {
      const cleaned = cleanPhone(p.number);
      return cleaned.length > 0 && !isValidPhone(cleaned);
    });
    if (hasInvalidAdmin || hasInvalidEmployee) return false;

    return true;
  }, [groupName, ownerClientId, groupType, rateMode, sameRate, perBankRates, banks, adminPhones, employeePhones]);

  function addPhone(list) {
    if (list === "admin") {
      setAdminPhones((prev) => {
        if (prev.length >= MAX_ADMIN_PHONES) return prev;
        return [...prev, emptyPhoneRow()];
      });
      return;
    }

    setEmployeePhones((prev) => {
      return [...prev, emptyPhoneRow()];
    });
  }

  function removePhone(list, index) {
    if (list === "admin") {
      setAdminPhones((prev) => {
        const next = prev.slice();
        const removed = next[index];
        next.splice(index, 1);
        addPastMember(list, removed, "removed");
        return next.length ? next : [emptyPhoneRow()];
      });
      return;
    }

    setEmployeePhones((prev) => {
      const next = prev.slice();
      const removed = next[index];
      next.splice(index, 1);
      addPastMember(list, removed, "removed");
      return next.length ? next : [emptyPhoneRow()];
    });
  }

  function updatePhone(list, index, field, value) {
    const nextValue = field === "number" ? cleanPhone(value) : String(value || "");
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

  function addPastMember(memberType, row, source = "manual") {
    const normalizedType = String(memberType || "").trim().toLowerCase();
    const normalizedNumber = cleanPhone(row?.number);
    const normalizedName = String(row?.name || "").trim();
    if (!MEMBER_TYPES.includes(normalizedType)) return;
    if (!isValidPhone(normalizedNumber)) return;

    setPastMembers((prev) => {
      const exists = prev.some(
        (p) => p.member_type === normalizedType && cleanPhone(p.number) === normalizedNumber
      );
      if (exists) return prev;

      return [
        ...prev,
        {
          id: uid(),
          member_type: normalizedType,
          name: normalizedName,
          number: normalizedNumber,
          source
        }
      ];
    });
  }

  function addPastMemberManually() {
    addPastMember(pastMemberDraft.member_type, pastMemberDraft, "manual");
    setPastMemberDraft((prev) => ({ ...prev, name: "", number: "" }));
  }

  function removePastMember(id) {
    setPastMembers((prev) => prev.filter((p) => p.id !== id));
  }

  function updatePastMemberLocal(id, field, value) {
    setPastMembers((prev) =>
      prev.map((m) => {
        if (String(m.id) !== String(id)) return m;
        const nextValue = field === "number" ? cleanPhone(value) : String(value || "");
        return { ...m, [field]: nextValue };
      })
    );
  }

  function reusePastMember(member) {
    if (!member) return;
    const targetList = member.member_type === "admin" ? "admin" : "employee";
    const entry = {
      name: String(member.name || "").trim(),
      number: cleanPhone(member.number)
    };
    if (!isValidPhone(entry.number)) return;
    let added = false;

    if (targetList === "admin") {
      setAdminPhones((prev) => {
        const exists = prev.some((p) => cleanPhone(p.number) === entry.number);
        if (exists) return prev;
        if (prev.length >= MAX_ADMIN_PHONES) return prev;
        added = true;
        return [...prev, entry];
      });
    } else {
      setEmployeePhones((prev) => {
        const exists = prev.some((p) => cleanPhone(p.number) === entry.number);
        if (exists) return prev;
        added = true;
        return [...prev, entry];
      });
    }

    if (added) removePastMember(member.id);
  }

  function handleCreateGroup(e) {
    e.preventDefault();
    if (!canCreate) return;
    const draftNumber = cleanPhone(pastMemberDraft.number);
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

    const pastMembersToSave = [...pastMembers];
    if (hasDraftInput && isValidPhone(draftNumber)) {
      const draftType = String(pastMemberDraft.member_type || "").toLowerCase();
      const exists = pastMembersToSave.some(
        (m) => m.member_type === draftType && cleanPhone(m.number) === draftNumber
      );
      if (!exists) {
        pastMembersToSave.push({
          id: uid(),
          member_type: draftType,
          name: String(pastMemberDraft.name || "").trim(),
          number: draftNumber,
          source: "manual",
        });
      }
    }

    const groupPayload = {
      name: groupName.trim(),
      type: groupType,
      owner: Number(ownerClientId),
      ...(rateMode === "same" && isClaimOrDepo(groupType) ? { same_rate: Number(sameRate) } : {})
    };

    createGroup(groupPayload)
      .then(async (group) => {
        const groupId = group.id;

        const promises = [];

        if (rateMode === "per-bank" && isClaimOrDepo(groupType)) {
          for (const bankId in perBankRates) {
            const rate = perBankRates[bankId]?.trim();
            if (rate) {
              promises.push(
                createGroupBankRate({
                  group_id: groupId,
                  bank_id: Number(bankId),
                  rate: Number(rate)
                })
              );
            }
          }
        }

        adminPhones.forEach((phone) => {
          const cleaned = cleanPhone(phone.number);
          if (isValidPhone(cleaned)) {
            promises.push(
              createGroupAdminNumber({
                group_id: groupId,
                number: cleaned,
                name: String(phone.name || "").trim() || null
              })
            );
          }
        });

        employeePhones.forEach((phone) => {
          const cleaned = cleanPhone(phone.number);
          if (isValidPhone(cleaned)) {
            promises.push(
              createGroupEmployeeNumber({
                group_id: groupId,
                number: cleaned,
                name: String(phone.name || "").trim() || null
              })
            );
          }
        });

        pastMembersToSave.forEach((member) => {
          const cleaned = cleanPhone(member.number);
          if (isValidPhone(cleaned)) {
            promises.push(
              createGroupPastMember({
                group_id: groupId,
                member_type: member.member_type,
                name: String(member.name || "").trim() || null,
                number: cleaned,
                source: member.source || "manual"
              })
            );
          }
        });

        await Promise.all(promises);

        toast({
          title: "Group created",
          description: `${group.name} has been created successfully.`,
        });

        setGroupName("");
        setGroupType("Claim");
        setOwnerClientId(clients[0]?.id ?? "");
        setRateMode("same");
        setSameRate("");
        setPerBankRates({});
        setAdminPhones([emptyPhoneRow()]);
        setEmployeePhones([emptyPhoneRow()]);
        setPastMembers([]);
        setPastMemberDraft(emptyPastMemberDraft());

        setLocation("/groups");
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err.message || "Failed to create group",
          variant: "destructive",
        });
      });
  }

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="mx-auto w-full max-w-8xl px-6 py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight" data-testid="text-create-group-title">
                Create Group
              </h1>
              <p className="mt-1 text-sm text-muted-foreground" data-testid="text-create-group-subtitle">
                Fill in the details to create a new group.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" data-testid="badge-group-types">
                {GROUP_TYPES.length} types
              </Badge>
              <Button variant="secondary" onClick={() => setLocation("/groups")} data-testid="button-back-groups">
                Back to Groups
              </Button>
            </div>
          </div>


{/* << */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm lg:col-span-3" data-testid="card-create-group-form">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold" data-testid="text-create-group-heading">
                    Create form
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid="text-create-group-hint">
                    This is prototype data (in-memory).
                  </div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted" aria-hidden>
                  <Layers className="h-5 w-5 text-foreground" />
                </div>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4" data-testid="form-create-group">
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
                  <Select value={ownerClientId} onValueChange={(v) => setOwnerClientId(v)} disabled={loadingClients}>
                    <SelectTrigger className="soft-ring mt-1 h-11" data-testid="select-group-owner">
                      <SelectValue placeholder={loadingClients ? "Loading..." : clients.length ? "Select client" : "No clients created"} />
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
                    <div className="text-sm font-semibold" data-testid="text-rate-config-title">
                      Rate Configuration
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
                          className="soft-ring mt-1 h-11"
                          data-testid="input-rate-per-unit"
                          onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2" data-testid="section-rate-per-bank">
                        {loadingBanks ? (
                          <div className="text-sm text-muted-foreground">Loading banks...</div>
                        ) : banks.length > 0 ? (
                          banks.map((b) => (
                            <div key={b.id} className="rounded-xl border bg-muted/20 p-3" data-testid={`row-bank-rate-${b.id}`}>
                              <div className="text-sm font-medium" data-testid={`text-bank-rate-name-${b.id}`}>
                                {b.bank_name}
                              </div>
                              <Input
                                inputMode="decimal"
                                value={perBankRates[b.id] ?? ""}
                                onChange={(e) => setPerBankRates((prev) => ({ ...prev, [b.id]: e.target.value }))}
                                placeholder="Rate"
                                className="soft-ring mt-2 h-11"
                                data-testid={`input-bank-rate-${b.id}`}
                                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }}
                              />
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No banks available</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border bg-white p-4" data-testid="section-admin-phones">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold" data-testid="text-admin-phones-title">
                        Admin Phone Number
                      </div>
                      <Badge variant="secondary" data-testid="badge-admin-phone-count">
                        {adminPhones.length}/{MAX_ADMIN_PHONES}
                      </Badge>
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
                      {adminPhones.some((p) => {
                        const cleaned = cleanPhone(p.number);
                        return cleaned.length > 0 && !isValidPhone(cleaned);
                      }) ? (
                        <div className="text-xs text-red-600">
                          Admin phone must contain only digits and be {PHONE_MIN_LENGTH}-{PHONE_MAX_LENGTH} digits.
                        </div>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-3 h-11 w-full bg-[#d9d3e8] text-[#3f178f] hover:bg-[#cfc8e0]"
                      onClick={() => addPhone("admin")}
                      disabled={adminPhones.length >= MAX_ADMIN_PHONES}
                      data-testid="button-add-admin-phone"
                    >
                      Add admin phone
                    </Button>
                    {adminPhones.length >= MAX_ADMIN_PHONES ? (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Maximum {MAX_ADMIN_PHONES} admin phone numbers allowed.
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border bg-white p-4" data-testid="section-employee-phones">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold" data-testid="text-employee-phones-title">
                        Employee Phone Number
                      </div>
                      <Badge variant="secondary" data-testid="badge-employee-phone-count">
                        {employeePhones.length}
                      </Badge>
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
                      {employeePhones.some((p) => {
                        const cleaned = cleanPhone(p.number);
                        return cleaned.length > 0 && !isValidPhone(cleaned);
                      }) ? (
                        <div className="text-xs text-red-600">
                          Employee phone must contain only digits and be {PHONE_MIN_LENGTH}-{PHONE_MAX_LENGTH} digits.
                        </div>
                      ) : null}
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
                        setPastMemberDraft((prev) => ({ ...prev, number: cleanPhone(e.target.value) }))
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
                              onClick={() => reusePastMember(member)}
                              data-testid={`button-reuse-past-member-${member.id}`}
                            >
                              Reuse
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="h-10"
                              onClick={() => removePastMember(member.id)}
                              data-testid={`button-remove-past-member-${member.id}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-muted-foreground" data-testid="text-past-members-empty">
                      Removed numbers will auto-appear here. You can also add manually.
                    </div>
                  )}
                </div>

                <Button type="submit" className="h-11 w-full" disabled={!canCreate} data-testid="button-submit-create-group">
                  Create group
                </Button>
              </form>
            </Card>

            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm lg:col-span-2" data-testid="card-create-group-summary">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold" data-testid="text-summary-title">
                  Summary
                </div>
                <Badge variant="secondary" data-testid="badge-summary-status">
                  Draft
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

              <Separator className="my-4" />

              <div className="text-xs text-muted-foreground" data-testid="text-summary-hint">
                Rates and phone numbers are required for Claim/Depo groups.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
