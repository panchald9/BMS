import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Plus } from "lucide-react";
import AppSidebar from "../components/app-sidebar";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/Card";
import { Checkbox } from "../components/ui/Checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import { useUsersStore } from "../lib/users-store";
import { useToast } from "../hooks/use-toast";

const ALL_WORK_TYPES = ["Claimer", "Depositer"];
const PHONE_MAX_LENGTH = 12;

function parseWorkTypes(worktype) {
  if (!worktype || typeof worktype !== "string") return [];
  return worktype.split(",").map((w) => w.trim()).filter(Boolean);
}

export default function CreateUserPage() {
  const [, setLocation] = useLocation();
  const [matchEditRoute, editParams] = useRoute("/admin/users/:id/edit");
  const isEditMode = Boolean(matchEditRoute);
  const editUserId = editParams?.id ?? "";
  const { createUser } = useUsersStore();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("Client");
  const [agentWorkTypes, setAgentWorkTypes] = useState(["Claimer"]);

  const [rateClaimer, setRateClaimer] = useState("");
  const [rateDepositer, setRateDepositer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const canSubmit = useMemo(() => {
    if (!name.trim() || !email.trim() || !phone.trim()) return false;
    if (!isEditMode && !password.trim()) return false;
    if (userType === "Agent") {
      if (agentWorkTypes.length === 0) return false;
      if (agentWorkTypes.includes("Claimer") && !String(rateClaimer).trim()) return false;
      if (agentWorkTypes.includes("Depositer") && !String(rateDepositer).trim()) return false;
    }
    return true;
  }, [name, email, phone, password, isEditMode, userType, agentWorkTypes, rateClaimer, rateDepositer]);

  useEffect(() => {
    if (!isEditMode || !editUserId) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      setLocation("/login");
      return;
    }

    let active = true;
    setIsLoadingUser(true);

    fetch(`/api/users/${editUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || "Failed to load user");
        if (!active || !data) return;

        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setPhone(String(data.phone ?? "").slice(0, PHONE_MAX_LENGTH));
        setUserType(data.role ?? "Client");

        const types = parseWorkTypes(data.worktype);
        setAgentWorkTypes(types.length ? types : ["Claimer"]);

        const rateObj = data.rate && typeof data.rate === "object" ? data.rate : {};
        setRateClaimer(String(rateObj.Claimer ?? ""));
        setRateDepositer(String(rateObj.Depositer ?? ""));
      })
      .catch((error) => {
        if (!active) return;
        toast({
          title: "Load failed",
          description: error.message || "Unable to load user",
          variant: "destructive",
        });
        setLocation("/admin/users");
      })
      .finally(() => {
        if (active) setIsLoadingUser(false);
      });

    return () => {
      active = false;
    };
  }, [isEditMode, editUserId, setLocation, toast]);

  function toggleWorkType(w) {
    setAgentWorkTypes((prev) => {
      const next = prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || isSubmitting || isLoadingUser) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast({
        title: "Unauthorized",
        description: "Please login again.",
      });
      setLocation("/login");
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim().slice(0, PHONE_MAX_LENGTH),
      password,
      role: userType,
      worktype: userType === "Agent" ? agentWorkTypes.join(",") : "",
      rate: userType === "Agent"
        ? {
            ...(agentWorkTypes.includes("Claimer") ? { Claimer: Number(rateClaimer || 0) } : {}),
            ...(agentWorkTypes.includes("Depositer") ? { Depositer: Number(rateDepositer || 0) } : {}),
          }
        : { default: 0 },
    };
    if (password.trim()) {
      payload.password = password;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(isEditMode ? `/api/users/${editUserId}` : "/api/users/register", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || (isEditMode ? "Failed to update user" : "Failed to create user"));
      }

      if (!isEditMode) {
        createUser({
          id: String(data.id ?? ""),
          name: data.name ?? payload.name,
          email: data.email ?? payload.email,
          phone: data.phone ?? payload.phone,
          userType: data.role ?? payload.role,
          workTypes: typeof data.worktype === "string" && data.worktype.trim()
            ? data.worktype.split(",").map((w) => w.trim()).filter(Boolean)
            : [],
          agentRates: data.rate ?? payload.rate,
        });
      }

      toast({
        title: isEditMode ? "User updated" : "User created",
        description: isEditMode
          ? `${payload.name} has been updated successfully.`
          : `${payload.name} has been added successfully.`,
      });

      setLocation("/admin/users");
    } catch (error) {
      toast({
        title: isEditMode ? "Update failed" : "Create failed",
        description: error.message || (isEditMode ? "Unable to update user" : "Unable to create user"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
          <div className="mb-6 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/admin/users")}
              className="h-8 w-8 text-muted-foreground"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-create-user-title">
              {isEditMode ? "Edit User" : "Create New User"}
            </h1>
          </div>

          <Card className="rounded-2xl border bg-white/70 p-6 shadow-sm" data-testid="card-create-user-form">
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-create-user">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label className="text-sm" htmlFor="name" data-testid="label-user-name">
                    User Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="mt-1.5 h-11"
                    data-testid="input-user-name"
                  />
                </div>

                <div>
                  <Label className="text-sm" htmlFor="user-email" data-testid="label-user-email">
                    Email
                  </Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="mt-1.5 h-11"
                    data-testid="input-user-email"
                  />
                </div>

                <div>
                  <Label className="text-sm" htmlFor="user-phone" data-testid="label-user-phone">
                    Phone
                  </Label>
                  <Input
                    id="user-phone"
                    inputMode="tel"
                    value={phone}
                    maxLength={PHONE_MAX_LENGTH}
                    onChange={(e) => setPhone(e.target.value.slice(0, PHONE_MAX_LENGTH))}
                    placeholder="e.g., +92 300 1234567"
                    className="mt-1.5 h-11"
                    data-testid="input-user-phone"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-sm" htmlFor="user-pass" data-testid="label-user-password">
                    {isEditMode ? "Password (Optional)" : "Password"}
                  </Label>
                  <Input
                    id="user-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEditMode ? "Leave blank to keep current password" : "Create a password"}
                    className="mt-1.5 h-11"
                    data-testid="input-user-password"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-sm" data-testid="label-user-type">
                    User Type
                  </Label>
                  <Select value={userType} onValueChange={(v) => setUserType(v)}>
                    <SelectTrigger className="mt-1.5 h-11" data-testid="select-user-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Client" data-testid="option-user-type-client">
                        Client
                      </SelectItem>
                      <SelectItem value="Agent" data-testid="option-user-type-agent">
                        Agent
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {userType === "Agent" ? (
                <div className="space-y-4 rounded-xl border bg-muted/20 p-4" data-testid="section-agent-config">
                  <div className="rounded-xl border bg-white p-4" data-testid="section-work-type">
                    <div className="mb-3">
                      <div className="text-sm font-semibold" data-testid="text-work-type-heading">
                        Work Type
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground" data-testid="text-work-type-hint">
                        You can assign multiple work types to an Agent.
                      </div>
                    </div>

                    <div className="space-y-2">
                      {ALL_WORK_TYPES.map((w) => {
                        const checked = agentWorkTypes.includes(w);
                        return (
                          <label
                            key={w}
                            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2 text-sm transition hover:bg-muted/50"
                            data-testid={`row-work-type-${w.toLowerCase()}`}
                          >
                            <span className="text-foreground">{w}</span>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleWorkType(w)}
                              data-testid={`checkbox-work-type-${w.toLowerCase()}`}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-4" data-testid="section-agent-rate">
                    <div className="mb-3">
                      <div className="text-sm font-semibold" data-testid="text-rate-heading">
                        Rate
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground" data-testid="text-rate-hint">
                        Set separate rates for selected work types.
                      </div>
                    </div>
                    {agentWorkTypes.includes("Claimer") ? (
                      <div className="mt-3">
                        <Label className="text-sm" htmlFor="claimer-rate" data-testid="label-claimer-rate">
                          Claimer Rate
                        </Label>
                        <Input
                          id="claimer-rate"
                          inputMode="decimal"
                          value={rateClaimer}
                          onChange={(e) => setRateClaimer(e.target.value)}
                          placeholder="0.00"
                          className="mt-1.5 h-11"
                          data-testid="input-claimer-rate"
                        />
                      </div>
                    ) : null}

                    {agentWorkTypes.includes("Depositer") ? (
                      <div className="mt-3">
                        <Label className="text-sm" htmlFor="depositer-rate" data-testid="label-depositer-rate">
                          Depositer Rate
                        </Label>
                        <Input
                          id="depositer-rate"
                          inputMode="decimal"
                          value={rateDepositer}
                          onChange={(e) => setRateDepositer(e.target.value)}
                          placeholder="0.00"
                          className="mt-1.5 h-11"
                          data-testid="input-depositer-rate"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="px-8"
                  disabled={!canSubmit || isSubmitting || isLoadingUser}
                  data-testid="button-create-user"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isLoadingUser ? "Loading..." : isSubmitting ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create User")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppSidebar>
  );
}
