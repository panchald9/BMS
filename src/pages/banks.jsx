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

export default function BanksPage() {
  const [, setLocation] = useLocation();

  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bankName, setBankName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const canAdd = useMemo(() => bankName.trim().length > 0, [bankName]);

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
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Banks</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Create new banks, edit names, and manage your list.
              </p>
              {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{banks.length} banks</Badge>
              <Button variant="secondary" onClick={() => setLocation("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* CREATE BANK */}
            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm lg:col-span-2">
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
                  <Label>Bank Name</Label>
                  <Input
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g., HBL"
                    className="mt-1 h-11"
                  />
                </div>

                <Button type="submit" className="h-11 w-full" disabled={!canAdd}>
                  <Plus className="h-4 w-4" /> Add bank
                </Button>
              </form>
            </Card>

            {/* BANK LIST */}
            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm lg:col-span-3">
              <div className="text-sm font-semibold">Bank list</div>
              <Separator className="my-4" />

              <div className="space-y-2">
                {loading ? (
                  <div className="rounded-2xl border bg-white/50 px-4 py-4 text-sm text-muted-foreground">
                    Loading banks...
                  </div>
                ) : banks.length ? (
                  banks.map(b => {
                    const isEditing = editingId === b.id;
                    return (
                      <div key={b.id} className="rounded-2xl border bg-white/70 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                          {!isEditing ? (
                            <div className="text-sm font-semibold">{b.bank_name}</div>
                          ) : (
                            <Input
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              className="h-10"
                            />
                          )}

                          <div className="flex gap-2">
                            {!isEditing ? (
                              <>
                                <Button variant="secondary" onClick={() => startEdit(b)}>
                                  <Pencil className="h-4 w-4" /> Edit
                                </Button>
                                <Button variant="secondary" onClick={() => removeBank(b.id)}>
                                  <Trash2 className="h-4 w-4" /> Delete
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button onClick={saveEdit} disabled={!editingValue.trim()}>
                                  <Save className="h-4 w-4" /> Save
                                </Button>
                                <Button variant="secondary" onClick={cancelEdit}>
                                  <X className="h-4 w-4" /> Cancel
                                </Button>
                              </>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border bg-white/50 px-4 py-4 text-sm text-muted-foreground">
                    No banks yet. Create your first bank on the left.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
