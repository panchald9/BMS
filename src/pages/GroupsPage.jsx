import { useMemo, useEffect, useState } from "react"
import { useLocation } from "wouter"
import { Pencil, Plus, Trash2 } from "lucide-react"
import AppSidebar from "../components/app-sidebar"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/Card"
import { Separator } from "../components/ui/Separator"
import { getGroups, deleteGroup as deleteGroupApi } from "../lib/api"
import { useToast } from "../hooks/use-toast"

const ROWS_PER_PAGE = 7

export default function GroupsPage() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  const [groups, setGroups] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    getGroups()
      .then((data) => setGroups(data))
      .catch((err) => console.error("Failed to load groups:", err))
      .finally(() => setLoading(false))
  }, [])

  const canEditOrDelete = useMemo(() => groups.length > 0, [groups.length])
  const visibleGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const filtered = !q
      ? groups
      : groups.filter((g) =>
          [g.name, g.type, g.owner, g.owner_name, g.owner_phone]
            .map((v) => String(v || "").toLowerCase())
            .some((v) => v.includes(q))
        )

    return [...filtered].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" }))
  }, [groups, searchQuery])
  const totalPages = Math.max(1, Math.ceil(visibleGroups.length / ROWS_PER_PAGE))
  const pageStart = (currentPage - 1) * ROWS_PER_PAGE
  const paginatedGroups = useMemo(
    () => visibleGroups.slice(pageStart, pageStart + ROWS_PER_PAGE),
    [pageStart, visibleGroups]
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [groups.length, searchQuery])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

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

              <div className="mt-4">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search groups..."
                  className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  data-testid="input-search-groups"
                />
              </div>

              <Separator className="my-4" />

              <div className="space-y-2" data-testid="list-groups">
                {loading ? (
                  <div className="rounded-2xl border bg-white/50 px-4 py-4 text-sm text-muted-foreground" data-testid="loading-groups">
                    Loading groups...
                  </div>
                ) : visibleGroups.length ? (
                  paginatedGroups.map((g) => (
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
                            <span data-testid={`text-group-owner-${g.id}`}>Owner: {g.owner_name || g.owner}</span>
                            <span className="text-muted-foreground/60">â€¢</span>
                            <span data-testid={`text-group-owner-phone-${g.id}`}>{g.owner_phone || "-"}</span>
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
                    {searchQuery.trim()
                      ? "No groups match your search."
                      : "No groups yet. Click \"Create new group\" to add one."}
                  </div>
                )}
              </div>
              {!loading && visibleGroups.length > ROWS_PER_PAGE ? (
                <div className="mt-4 flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
                  <div className="text-muted-foreground">
                    Showing {pageStart + 1}-{Math.min(pageStart + ROWS_PER_PAGE, visibleGroups.length)} of {visibleGroups.length}
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
  )
}
