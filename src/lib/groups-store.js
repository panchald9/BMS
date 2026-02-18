import { useSyncExternalStore } from "react"

const STORAGE_KEY = "bms_groups"

let groups = loadGroups()
const listeners = new Set()

function loadGroups() {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistGroups() {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  } catch {
    // Ignore storage failures
  }
}

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return groups
}

function createGroup(group) {
  groups = [group, ...groups]
  persistGroups()
  emit()
}

function deleteGroup(id) {
  groups = groups.filter((group) => group.id !== id)
  persistGroups()
  emit()
}

export function useGroupsStore() {
  const storeGroups = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return {
    groups: storeGroups,
    createGroup,
    deleteGroup,
  }
}
