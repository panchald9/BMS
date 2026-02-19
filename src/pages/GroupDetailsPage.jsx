import { useMemo, useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ChevronLeft, Layers, Pencil } from "lucide-react";
import AppSidebar from "../components/app-sidebar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/Card";
import { Separator } from "../components/ui/Separator";
import { getGroupFullData } from "../lib/api";

function isClaimOrDepo(t) {
  return t === "Claim" || t === "Depo";
}

function Chip({ value, testId }) {
  return (
    <span
      className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-medium text-foreground shadow-sm"
      data-testid={testId}
    >
      {value}
    </span>
  );
}

export default function GroupDetailsPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/groups/:id");
  const groupId = params?.id ?? "";

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    
    getGroupFullData(groupId)
      .then((data) => setGroup(data))
      .catch((err) => console.error("Failed to load group:", err))
      .finally(() => setLoading(false));
  }, [groupId]);

  const rateRows = useMemo(() => {
    if (!group) return [];
    if (!isClaimOrDepo(group.type)) return [];

    if (group.same_rate) {
      return [{ bankId: "all", bankName: "All banks", rate: group.same_rate }];
    }

    return (group.bankRates || []).map((br) => ({
      bankId: br.bank_id,
      bankName: br.bank_name,
      rate: br.rate
    }));
  }, [group]);

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
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setLocation("/groups")} data-testid="button-back-groups">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            </div>

            <Card className="mt-6 rounded-2xl border bg-white/70 p-6 shadow-sm" data-testid="card-group-not-found">
              <div className="text-sm font-semibold" data-testid="text-group-not-found-title">
                Group not found
              </div>
              <div className="mt-1 text-sm text-muted-foreground" data-testid="text-group-not-found-hint">
                This group may have been deleted.
              </div>
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
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-4xl font-semibold tracking-tight" data-testid="text-group-details-title">
                  {group.name}
                </h1>
                <Badge variant="secondary" data-testid="badge-group-details-type">
                  {group.type}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground" data-testid="text-group-details-subtitle">
                Owner: <span className="font-medium text-foreground" data-testid="text-group-details-owner">{group.owner}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => setLocation("/groups")} data-testid="button-back-groups-top">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setLocation(`/groups/edit/${group.id}`)} data-testid="button-edit-group-details">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm lg:col-span-3" data-testid="card-group-details-main">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold" data-testid="text-group-details-heading">Overview</div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid="text-group-details-hint">
                    Rates + phone numbers linked to this group.
                  </div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted" aria-hidden>
                  <Layers className="h-5 w-5" />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="rounded-2xl border bg-white p-4" data-testid="section-group-rates">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold" data-testid="text-group-rates-title">Rates</div>
                    <Badge variant="secondary" data-testid="badge-group-rate-mode">
                      {isClaimOrDepo(group.type) ? (group.same_rate ? "Same" : "Per bank") : "N/A"}
                    </Badge>
                  </div>

                  {!isClaimOrDepo(group.type) ? (
                    <div className="mt-2 text-sm text-muted-foreground" data-testid="text-group-rates-na">
                      Rates are not used for Processing/Payment groups.
                    </div>
                  ) : (
                    <div className="mt-3 overflow-hidden rounded-xl border" data-testid="table-group-rates">
                      <div className="grid grid-cols-2 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                        <div data-testid="text-group-rates-header-bank">Bank</div>
                        <div className="text-right" data-testid="text-group-rates-header-rate">Rate</div>
                      </div>
                      {rateRows.map((r) => (
                        <div
                          key={r.bankId}
                          className="grid grid-cols-2 items-center border-t bg-white px-3 py-3 text-sm"
                          data-testid={`row-group-rate-${r.bankId}`}
                        >
                          <div className="font-medium" data-testid={`text-group-rate-bank-${r.bankId}`}>{r.bankName}</div>
                          <div className="text-right tabular-nums" data-testid={`text-group-rate-value-${r.bankId}`}>{r.rate || "-"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border bg-white p-4" data-testid="section-group-admin-phones">
                    <div className="text-sm font-semibold" data-testid="text-group-admin-phones-title">Admin phones</div>
                    <div className="mt-3 flex flex-wrap gap-2" data-testid="list-group-admin-phones">
                      {(group.adminNumbers?.length ? group.adminNumbers.map(n => n.number) : ["-"]).map((p, idx) => (
                        <Chip key={idx} value={p} testId={`chip-group-admin-phone-${idx}`} />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white p-4" data-testid="section-group-employee-phones">
                    <div className="text-sm font-semibold" data-testid="text-group-employee-phones-title">Employee phones</div>
                    <div className="mt-3 flex flex-wrap gap-2" data-testid="list-group-employee-phones">
                      {(group.employeeNumbers?.length ? group.employeeNumbers.map(n => n.number) : ["-"]).map((p, idx) => (
                        <Chip key={idx} value={p} testId={`chip-group-employee-phone-${idx}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm lg:col-span-2" data-testid="card-group-details-side">
              <div className="text-sm font-semibold" data-testid="text-group-details-side-title">Quick actions</div>
              <div className="mt-1 text-xs text-muted-foreground" data-testid="text-group-details-side-hint">
                Jump straight into editing.
              </div>

              <Separator className="my-4" />

              <Button className="w-full" onClick={() => setLocation(`/groups/edit/${group.id}`)} data-testid="button-edit-group-side">
                <Pencil className="h-4 w-4" /> Edit group
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
