import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Layers, Save, X } from "lucide-react";
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
import { getGroupFullData, getClientUsers, getBanks, updateGroup as updateGroupApi, createGroupBankRate, createGroupAdminNumber, createGroupEmployeeNumber } from "../lib/api";
import { useToast } from "../hooks/use-toast";

const GROUP_TYPES = ["Claim", "Depo", "Processing", "Payment"];
const PHONE_MAX_LENGTH = 12;

function cleanPhone(v) {
  return v.replace(/\s+/g, " ").trim();
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

  const [adminPhones, setAdminPhones] = useState([""]);
  const [employeePhones, setEmployeePhones] = useState([""]);

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
          setRateMode(groupData.same_rate ? "same" : "per-bank");
          setSameRate(groupData.same_rate ? String(groupData.same_rate) : "");
          
          const rates = {};
          (groupData.bankRates || []).forEach(br => {
            rates[br.bank_id] = String(br.rate);
          });
          setPerBankRates(rates);

          setAdminPhones(groupData.adminNumbers?.length ? groupData.adminNumbers.map(n => n.number) : [""]);
          setEmployeePhones(groupData.employeeNumbers?.length ? groupData.employeeNumbers.map(n => n.number) : [""]);
        }
      })
      .catch((err) => console.error("Failed to load data:", err))
      .finally(() => setLoading(false));
  }, [groupId]);

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

    const anyAdminPhone = adminPhones.some((p) => cleanPhone(p).length > 0);
    const anyEmpPhone = employeePhones.some((p) => cleanPhone(p).length > 0);
    if (!anyAdminPhone && !anyEmpPhone) return false;

    return true;
  }, [groupName, ownerClientId, groupType, rateMode, sameRate, perBankRates, banks, adminPhones, employeePhones]);

  function addPhone(list) {
    if (list === "admin") setAdminPhones((prev) => [...prev, ""]);
    else setEmployeePhones((prev) => [...prev, ""]);
  }

  function removePhone(list, index) {
    if (list === "admin") {
      setAdminPhones((prev) => {
        const next = prev.slice();
        next.splice(index, 1);
        return next.length ? next : [""];
      });
      return;
    }

    setEmployeePhones((prev) => {
      const next = prev.slice();
      next.splice(index, 1);
      return next.length ? next : [""];
    });
  }

  function updatePhone(list, index, value) {
    const nextValue = value.slice(0, PHONE_MAX_LENGTH);
    if (list === "admin") {
      setAdminPhones((prev) => {
        const next = prev.slice();
        next[index] = nextValue;
        return next;
      });
      return;
    }

    setEmployeePhones((prev) => {
      const next = prev.slice();
      next[index] = nextValue;
      return next;
    });
  }

  function onSave(e) {
    e.preventDefault();
    if (!group || !canSave) return;

    const groupPayload = {
      name: groupName.trim(),
      type: groupType,
      owner: Number(ownerClientId),
      ...(rateMode === "same" && isClaimOrDepo(groupType) ? { same_rate: Number(sameRate) } : {})
    };

    updateGroupApi(group.id, groupPayload)
      .then(() => {
        toast({
          title: "Group updated",
          description: `${groupName} has been updated successfully.`,
        });
        setLocation(`/groups/${group.id}`);
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err.message || "Failed to update group",
          variant: "destructive",
        });
      });
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
                    <div className="mt-3 space-y-2" data-testid="list-admin-phones">
                      {adminPhones.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2" data-testid={`row-admin-phone-${idx}`}>
                          <Input
                            inputMode="tel"
                            value={p}
                            maxLength={PHONE_MAX_LENGTH}
                            onChange={(e) => updatePhone("admin", idx, e.target.value)}
                            placeholder="Phone"
                            className="soft-ring h-11"
                            data-testid={`input-admin-phone-${idx}`}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={() => removePhone("admin", idx)}
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
                      className="mt-3 w-full"
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
                    <div className="mt-3 space-y-2" data-testid="list-employee-phones">
                      {employeePhones.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2" data-testid={`row-employee-phone-${idx}`}>
                          <Input
                            inputMode="tel"
                            value={p}
                            maxLength={PHONE_MAX_LENGTH}
                            onChange={(e) => updatePhone("employee", idx, e.target.value)}
                            placeholder="Phone"
                            className="soft-ring h-11"
                            data-testid={`input-employee-phone-${idx}`}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={() => removePhone("employee", idx)}
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
                      className="mt-3 w-full"
                      onClick={() => addPhone("employee")}
                      data-testid="button-add-employee-phone"
                    >
                      Add employee phone
                    </Button>
                  </div>
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
