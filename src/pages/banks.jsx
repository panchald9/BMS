import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Building2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import AppSidebar from "../components/app-sidebar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/Separator";
import { createBank, deleteBank, getBanks, updateBank } from "../lib/api";

const ROWS_PER_PAGE = 8;

export default function BanksPage() {
  const [, setLocation] = useLocation();

  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bankName, setBankName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const canAdd = useMemo(() => bankName.trim().length > 0, [bankName]);
  const totalPages = Math.max(1, Math.ceil(banks.length / ROWS_PER_PAGE));
  const pageStart = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedBanks = useMemo(
    () => banks.slice(pageStart, pageStart + ROWS_PER_PAGE),
    [banks, pageStart]
  );

  useEffect(() => {
    async function loadBanks() {
      try {
        setLoading(true);
        setError("");
        const data = await getBanks();
        setBanks(data || []);
      } catch (err) {
        setError(err.message || "Failed to load banks");
      } finally {
        setLoading(false);
      }
    }

    loadBanks();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [banks.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function startEdit(bank) {
    setEditingId(bank.id);
    setEditingValue(bank.bank_name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingValue("");
  }

  async function saveEdit() {
    if (!editingId) return;

    const nextName = editingValue.trim();
    if (!nextName) return;

    try {
      setError("");
      const updated = await updateBank(editingId, { bank_name: nextName });
      setBanks((prev) => prev.map((b) => (b.id === editingId ? updated : b)));
      cancelEdit();
    } catch (err) {
      setError(err.message || "Failed to update bank");
    }
  }

  async function removeBank(id) {
    try {
      setError("");
      await deleteBank(id);
      if (editingId === id) cancelEdit();
      setBanks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete bank");
    }
  }

  async function addBank(e) {
    e.preventDefault();
    if (!canAdd) return;

    try {
      setError("");
      const created = await createBank({ bank_name: bankName.trim() });
      setBanks((prev) => [created, ...prev]);
      setBankName("");
    } catch (err) {
      setError(err.message || "Failed to create bank");
    }
  }

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="container-responsive py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">Banks</h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Create new banks, edit names, and manage your list.
              </p>
              {error ? <p className="mt-2 text-xs sm:text-sm text-red-600">{error}</p> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{banks.length} banks</Badge>
              <Button variant="secondary" onClick={() => setLocation("/dashboard")} className="btn-touch">
                Back to Dashboard
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
            {/* CREATE BANK */}
            <Card className="rounded-2xl border bg-white/70 p-4 sm:p-5 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">Create Bank</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Add a bank name and save it to your list.
                  </div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>

              <form onSubmit={addBank} className="space-y-4">
                <div>
                  <Label className="text-sm">Bank Name</Label>
                  <Input
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g., HBL"
                    className="mt-1 h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <Button type="submit" className="h-11 sm:h-12 w-full btn-touch" disabled={!canAdd}>
                  <Plus className="h-4 w-4" /> Add bank
                </Button>
              </form>
            </Card>

            {/* BANK LIST */}
            <Card className="rounded-2xl border bg-white/70 p-4 sm:p-5 shadow-sm lg:col-span-3">
              <div className="text-sm font-semibold">Bank list</div>
              <Separator className="my-4" />

              <div className="space-y-2">
                {loading ? (
                  <div className="rounded-2xl border bg-white/50 px-4 py-4 text-xs sm:text-sm text-muted-foreground">
                    Loading banks...
                  </div>
                ) : banks.length ? (
                  paginatedBanks.map(b => {
                    const isEditing = editingId === b.id;
                    return (
                      <div key={b.id} className="rounded-2xl border bg-white/70 p-3 sm:p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                          {!isEditing ? (
                            <div className="text-sm font-semibold break-words">{b.bank_name}</div>
                          ) : (
                            <Input
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              className="h-10 sm:h-11 text-sm sm:text-base"
                            />
                          )}

                          <div className="flex gap-2 flex-wrap">
                            {!isEditing ? (
                              <>
                                <Button variant="secondary" onClick={() => startEdit(b)} className="btn-touch flex-1 sm:flex-none">
                                  <Pencil className="h-4 w-4" /> <span className="sm:inline">Edit</span>
                                </Button>
                                <Button variant="secondary" onClick={() => removeBank(b.id)} className="btn-touch flex-1 sm:flex-none">
                                  <Trash2 className="h-4 w-4" /> <span className="sm:inline">Delete</span>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button onClick={saveEdit} disabled={!editingValue.trim()} className="btn-touch flex-1 sm:flex-none">
                                  <Save className="h-4 w-4" /> <span className="sm:inline">Save</span>
                                </Button>
                                <Button variant="secondary" onClick={cancelEdit} className="btn-touch flex-1 sm:flex-none">
                                  <X className="h-4 w-4" /> <span className="sm:inline">Cancel</span>
                                </Button>
                              </>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border bg-white/50 px-4 py-4 text-xs sm:text-sm text-muted-foreground">
                    No banks yet. Create your first bank on the left.
                  </div>
                )}
              </div>
              {!loading && banks.length > ROWS_PER_PAGE ? (
                <div className="mt-4 flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
                  <div className="text-muted-foreground">
                    Showing {pageStart + 1}-{Math.min(pageStart + ROWS_PER_PAGE, banks.length)} of {banks.length}
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
  );
}
