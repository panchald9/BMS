import { useSyncExternalStore } from "react";

const STORAGE_KEY = "bms_users";

let users = loadUsers();
const listeners = new Set();

function loadUsers() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistUsers() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage failures.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return users;
}

function createUser(user) {
  users = [user, ...users];
  persistUsers();
  emit();
}

function deleteUser(id) {
  users = users.filter((user) => user.id !== id);
  persistUsers();
  emit();
}

export function useUsersStore() {
  const storeUsers = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    users: storeUsers,
    createUser,
    deleteUser,
  };
}
