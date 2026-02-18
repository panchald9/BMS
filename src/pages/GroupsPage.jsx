import { useMemo, useEffect, useState } from "react"
import { useLocation } from "wouter"
import { Pencil, Plus, Trash2 } from "lucide-react"
import AppSidebar from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getGroups, deleteGroup as deleteGroupApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function GroupsPage() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGroups()
      .then((data) => setGroups(data))
      .catch((err) => console.error("Failed to load groups:", err))
      .finally(() => setLoading(false))
  }, [])

  const canEditOrDelete = useMemo(() => groups.length > 0, [groups.length])

  function handleDelete(id, name) {
    if (!confirm(`Delete group "${name}"?`)) return

    deleteGroupApi(id)
      .then(() => {
        setGroups((prev) => prev.filter((g) => g.id !== id))
        toast({
          title: "Group deleted",
          description: `${name} has been deleted successfully.`,
        })
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err.message || "Failed to delete group",
          variant: "destructive",
        })
      })
  }

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight" data-testid="text-groups-title">
                All Groups
              </h1>
              <p className="mt-1 text-sm text-muted-foreground" data-testid="text-groups-subtitle">
                View created groups. Create new groups from the button above.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" data-testid="badge-groups-count">
                {groups.length} groups
              </Badge>
              <Button onClick={() => setLocation("/groups/new")} data-testid="button-create-new-group">
                <Plus className="h-4 w-4" /> Create new group
              </Button>
              <Button
                variant="secondary"
                onClick={() => setLocation("/dashboard")}
                data-testid="button-back-dashboard"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm" data-testid="card-groups-list">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold" data-testid="text-group-list-heading">
                    Group list
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid="text-group-list-hint">
                    Edit or delete any group from the list.
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2" data-testid="list-groups">
                {loading ? (
                  <div className="rounded-2xl border bg-white/50 px-4 py-4 text-sm text-muted-foreground" data-testid="loading-groups">
                    Loading groups...
                  </div>
                ) : groups.length ? (
                  groups.map((g) => (
                    <div
                      key={g.id}
                      className="group rounded-2xl border bg-white/70 p-4 transition hover:bg-white/90"
                      role="button"
                      tabIndex={0}
                      onClick={() => setLocation(`/groups/${g.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setLocation(`/groups/${g.id}`)
                      }}
                      data-testid={`card-group-${g.id}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold" data-testid={`text-group-name-${g.id}`}>
                            {g.name}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span data-testid={`text-group-type-${g.id}`}>{g.type}</span>
                            <span className="text-muted-foreground/60">•</span>
                            <span data-testid={`text-group-owner-${g.id}`}>Owner: {g.owner}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" data-testid={`badge-group-type-${g.id}`}>
                            {g.type}
                          </Badge>
                          <Button
                            variant="secondary"
                            disabled={!canEditOrDelete}
                            onClick={(e) => {
                              e.stopPropagation()
                              setLocation(`/groups/edit/${g.id}`)
                            }}
                            data-testid={`button-edit-group-${g.id}`}
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={!canEditOrDelete}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(g.id, g.name)
                            }}
                            data-testid={`button-delete-group-${g.id}`}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border bg-white/50 px-4 py-4 text-sm text-muted-foreground" data-testid="empty-groups">
                    No groups yet. Click "Create new group" to add one.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppSidebar>
  )
}
