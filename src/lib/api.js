const API_BASE = "/api";

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export function getBanks() {
  return request("/banks");
}

export function getBankById(id) {
  return request(`/banks/${id}`);
}

export function createBank(payload) {
  return request("/banks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBank(id, payload) {
  return request(`/banks/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteBank(id) {
  return request(`/banks/${id}`, {
    method: "DELETE",
  });
}

export function getClientUsers() {
  return request("/users/clients");
}

export function createGroup(payload) {
  return request("/groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createGroupBankRate(payload) {
  return request("/group-bank-rates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createGroupAdminNumber(payload) {
  return request("/group-admin-numbers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createGroupEmployeeNumber(payload) {
  return request("/group-employee-numbers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getGroups() {
  return request("/groups");
}

export function getBillGroups(type) {
  const params = new URLSearchParams({ type: String(type || "") });
  return request(`/groups/bill-config?${params.toString()}`);
}

export function getGroupById(id) {
  return request(`/groups/${id}`);
}

export function getGroupFullData(id) {
  return request(`/groups/${id}/full`);
}

export function updateGroup(id, payload) {
  return request(`/groups/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteGroup(id) {
  return request(`/groups/${id}`, {
    method: "DELETE",
  });
}

export function getAgentUsers(worktype) {
  const params = new URLSearchParams();
  if (worktype) params.set("worktype", String(worktype));
  const query = params.toString();
  return request(`/users/agents${query ? `?${query}` : ""}`);
}
