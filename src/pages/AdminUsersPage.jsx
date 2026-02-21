import { useEffect, useMemo, useState } from "react"
import { useLocation } from "wouter"
import { Pencil, Plus, Trash2 } from "lucide-react"

import AppSidebar from "../components/AppSidebar"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/Card"
import { Separator } from "../components/ui/Separator"
import { useToast } from "../hooks/use-toast"

function parseWorkTypes(worktype) {
  if (!worktype || typeof worktype !== "string") return []
  return worktype.split(",").map((w) => w.trim()).filter(Boolean)
}

function toUiUser(apiUser) {
  return {
    id: String(apiUser.id),
    name: apiUser.name || "",
    email: apiUser.email || "",
    phone: apiUser.phone || "",
    userType: apiUser.role || "Client",
    workTypes: parseWorkTypes(apiUser.worktype),
    rate: apiUser.rate,
  }
}

export default function AdminUsersPage() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState("")

  const canEditOrDelete = useMemo(() => users.length > 0, [users.length])

  async function fetchUsers() {
    const token = localStorage.getItem("authToken")
    if (!token) {
      setLocation("/login")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.message || "Failed to load users")
      setUsers(Array.isArray(data) ? data.map(toUiUser) : [])
    } catch (error) {
      toast({ title: "Load failed", description: error.message || "Unable to fetch users" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  async function handleDeleteUser(user) {
    const token = localStorage.getItem("authToken")
    if (!token) {
      setLocation("/login")
      return
    }

    const sure = window.confirm(`Delete user "${user.name}"?`)
    if (!sure) return

    setDeletingId(user.id)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.message || "Failed to delete user")
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      toast({ title: "User deleted", description: `${user.name} removed successfully.` })
    } catch (error) {
      toast({ title: "Delete failed", description: error.message || "Unable to delete user" })
    } finally {
      setDeletingId("")
    }
  }

  function handleEditUser(user) {
    setLocation(`/admin/users/${user.id}/edit`)
  }

  return (
    <AppSidebar>
      <div className="min-h-svh w-full bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight" data-testid="text-users-title">
                Users
              </h1>
              <p className="mt-1 text-sm text-muted-foreground" data-testid="text-users-subtitle">
                Create Clients and Agents. Agents can be assigned multiple work types.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" data-testid="badge-user-count">
                {users.length} users
              </Badge>
              <Button onClick={() => setLocation("/admin/users/new")} data-testid="button-create-new-user">
                <Plus className="h-4 w-4" /> Create new user
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
            <Card className="rounded-2xl border bg-white/70 p-5 shadow-sm" data-testid="card-users-list">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold" data-testid="text-user-list-heading">
                    User list
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid="text-user-list-hint">
                    Edit or delete any user from the list.
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2" data-testid="list-users">
                {isLoading ? (
                  <div className="rounded-2xl border bg-white/50 px-4 py-4 text-sm text-muted-foreground">
                    Loading users...
                  </div>
                ) : users.length ? (
                  users.map((u) => (
                    <div
                      key={u.id}
                      className="group rounded-2xl border bg-white/70 p-4 transition hover:bg-white/90"
                      data-testid={`card-user-${u.id}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold" data-testid={`text-user-name-${u.id}`}>
                            {u.name}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span data-testid={`text-user-email-${u.id}`}>{u.email}</span>
                            <span className="text-muted-foreground/60">•</span>
                            <span data-testid={`text-user-phone-${u.id}`}>{u.phone}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" data-testid={`badge-user-type-${u.id}`}>
                            {u.userType}
                          </Badge>
                          {u.userType === "Agent" ? (
                            <Badge variant="outline" data-testid={`badge-user-worktypes-${u.id}`}>
                              {u.workTypes.join(", ")}
                            </Badge>
                          ) : null}

                          <Button
                            variant="secondary"
                            disabled={!canEditOrDelete}
                            onClick={() => {
                              handleEditUser(u)
                            }}
                            className="ml-2"
                            data-testid={`button-edit-user-${u.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={!canEditOrDelete || deletingId === u.id}
                            onClick={() => handleDeleteUser(u)}
                            data-testid={`button-delete-user-${u.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingId === u.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className="rounded-2xl border bg-white/50 px-4 py-4 text-sm text-muted-foreground"
                    data-testid="empty-users"
                  >
                    No users yet. Click "Create new user" to add one.
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
