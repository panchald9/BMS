import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useLocation } from "wouter";
import AppSidebar from "../components/app-sidebar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/Separator";
import { findGroupsByContactNumber } from "../lib/api";

export default function FindeContactPage() {
  const [, setLocation] = useLocation();
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const canSearch = useMemo(() => number.trim().length > 0, [number]);

  async function onSearch(e) {
    e.preventDefault();
    if (!canSearch) return;

    try {
      setLoading(true);
      setError("");
      setSearched(true);
      const data = await findGroupsByContactNumber(number.trim());
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setResults([]);
      setError(err.message || "Failed to search contact number");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight" data-testid="text-find-contact-title">
                Finde Contact
              </h1>
              <p className="mt-1 text-sm text-muted-foreground" data-testid="text-find-contact-subtitle">
                Enter a contact number to find group details and bank rates.
              </p>
            </div>
            <Badge variant="secondary" data-testid="badge-find-contact-count">
              {results.length} groups
            </Badge>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm lg:col-span-2">
              <div className="text-sm font-semibold">Search Number</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Search from both admin and employee number tables.
              </div>

              <Separator className="my-4" />

              <form onSubmit={onSearch} className="space-y-4">
                <div>
                  <Label htmlFor="contact-number">Contact number</Label>
                  <Input
                    id="contact-number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="e.g. 0771234567"
                    className="mt-1 h-11"
                    data-testid="input-find-contact-number"
                  />
                </div>

                <Button type="submit" className="w-full h-11" disabled={!canSearch || loading} data-testid="button-find-contact-search">
                  <Search className="h-4 w-4" /> {loading ? "Searching..." : "Search"}
                </Button>
              </form>

              {error ? (
                <p className="mt-3 text-sm text-red-600" data-testid="text-find-contact-error">
                  {error}
                </p>
              ) : null}
            </Card>

            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm lg:col-span-3">
              <div className="text-sm font-semibold">Search Results</div>
              <Separator className="my-4" />

              {!searched ? (
                <div className="rounded-2xl border bg-white/50 px-4 py-4 text-sm text-muted-foreground">
                  Enter a number and click search.
                </div>
              ) : loading ? (
                <div className="rounded-2xl border bg-white/50 px-4 py-4 text-sm text-muted-foreground">
                  Loading results...
                </div>
              ) : !results.length ? (
                <div className="rounded-2xl border bg-white/50 px-4 py-4 text-sm text-muted-foreground">
                  No group found for this number.
                </div>
              ) : (
                <div className="space-y-3" data-testid="list-find-contact-results">
                  {results.map((group) => (
                    <div key={group.id} className="rounded-2xl border bg-white p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold">{group.name}</div>
                        <Badge variant="secondary">{group.type || "N/A"}</Badge>
                      </div>

                      <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                        <div>Owner ID: {group.owner || "-"}</div>
                        <div>Owner Name: {group.ownerName || "-"}</div>
                        <div>Same Rate: {group.sameRate || "-"}</div>
                      </div>

                      <Separator className="my-3" />

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground">Matched Number(s)</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {(group.matches || []).map((m, idx) => (
                              <Badge key={`${m.number}-${idx}`} variant="secondary">
                                {m.number} ({m.source})
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-muted-foreground">Bank Rates</div>
                          {group.banks?.length ? (
                            <div className="mt-1 space-y-1 text-sm">
                              {group.banks.map((b) => (
                                <div key={`${group.id}-${b.bankId}`} className="flex items-center justify-between gap-2 rounded-lg border px-2 py-1">
                                  <span>{b.bankName}</span>
                                  <span className="tabular-nums">{b.rate}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-1 text-sm text-muted-foreground">No bank rates</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <Button
                          variant="secondary"
                          onClick={() => setLocation(`/groups/${group.id}`)}
                          data-testid={`button-view-group-${group.id}`}
                        >
                          View Group
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
