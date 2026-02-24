const API_BASE = "/api";
let isAuthRedirectInProgress = false;

function handleAuthExpired() {
  if (isAuthRedirectInProgress) return;
  isAuthRedirectInProgress = true;
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  } else {
    isAuthRedirectInProgress = false;
  }
}

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
    if (response.status === 401) {
      handleAuthExpired();
    }
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

export function getGroupClientOptionsByType(type) {
  const params = new URLSearchParams({ type: String(type || "") });
  return request(`/groups/client-options?${params.toString()}`).catch(async () => {
    const rows = await request(`/groups/bill-config?${params.toString()}`);
    return (rows || []).map((row) => ({
      id: String(row.id),
      name: row.name || "",
      clientId: String(row.ownerClientId || ""),
      clientName: row.ownerName || "",
    }));
  });
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

export function getBills(type) {
  const params = new URLSearchParams();
  if (type) params.set("type", String(type));
  const q = params.toString();
  return request(`/bills${q ? `?${q}` : ""}`);
}

export function getAgentBills() {
  return request("/bills/agent");
}

export function getClientAllBills(clientId) {
  const params = new URLSearchParams({ client_id: String(clientId || "") });
  return request(`/bills/client-all?${params.toString()}`);
}

export function getAgentAllBills(agentId) {
  const params = new URLSearchParams({ agent_id: String(agentId || "") });
  return request(`/bills/agent-all?${params.toString()}`);
}

export function createBill(payload) {
  return request("/bills", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function bulkUploadBills(file) {
  const token = localStorage.getItem("authToken");
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/bills/bulk-upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
    }
    const error = new Error(data?.message || "Bulk upload failed");
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export function updateBill(id, payload) {
  return request(`/bills/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteBill(id) {
  return request(`/bills/${id}`, {
    method: "DELETE",
  });
}

export function getOtherBills(kind) {
  const params = new URLSearchParams();
  if (kind) params.set("kind", String(kind));
  const q = params.toString();
  return request(`/other-bills${q ? `?${q}` : ""}`);
}

export function createOtherBill(payload) {
  return request("/other-bills", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOtherBill(id, payload) {
  return request(`/other-bills/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteOtherBill(id) {
  return request(`/other-bills/${id}`, {
    method: "DELETE",
  });
}

export function getPaymentMethods() {
  return request("/payment-methods");
}

export function getPaymentMethodById(id) {
  return request(`/payment-methods/${id}`);
}

export function createPaymentMethod(payload) {
  return request("/payment-methods", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePaymentMethod(id, payload) {
  return request(`/payment-methods/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deletePaymentMethod(id) {
  return request(`/payment-methods/${id}`, {
    method: "DELETE",
  });
}

export function getDollarRates() {
  return request("/dollar-rates");
}

export function getDollarRateById(id) {
  return request(`/dollar-rates/${id}`);
}

export function getDollarRateByDate(dateISO) {
  const params = new URLSearchParams({ date: String(dateISO || "") });
  return fetch(`${API_BASE}/dollar-rates/by-date?${params.toString()}`, {
    headers: {
      ...getAuthHeaders(),
    },
  }).then(async (response) => {
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401) {
        handleAuthExpired();
      }
      if (response.status === 404) {
        return null;
      }
      throw new Error(data?.message || "Request failed");
    }
    return data;
  });
}

export function createDollarRate(payload) {
  return request("/dollar-rates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDollarRate(id, payload) {
  return request(`/dollar-rates/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteDollarRate(id) {
  return request(`/dollar-rates/${id}`, {
    method: "DELETE",
  });
}

export function getTransactionDetails() {
  return request("/transaction-details");
}

export function getTransactionDetailById(id) {
  return request(`/transaction-details/${id}`);
}

export function createTransactionDetail(payload) {
  return request("/transaction-details", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTransactionDetail(id, payload) {
  return request(`/transaction-details/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTransactionDetail(id) {
  return request(`/transaction-details/${id}`, {
    method: "DELETE",
  });
}

export function getProcessingGroupCalculations() {
  return request("/processing-group-calculations");
}

export function getProcessingGroupCalculationById(id) {
  return request(`/processing-group-calculations/${id}`);
}

export function createProcessingGroupCalculation(payload) {
  return request("/processing-group-calculations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProcessingGroupCalculation(id, payload) {
  return request(`/processing-group-calculations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteProcessingGroupCalculation(id) {
  return request(`/processing-group-calculations/${id}`, {
    method: "DELETE",
  });
}

export function getProcessingCalculations() {
  return request("/processing-calculations");
}

export function getProcessingCalculationById(id) {
  return request(`/processing-calculations/${id}`);
}

export function createProcessingCalculation(payload) {
  return request("/processing-calculations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProcessingCalculation(id, payload) {
  return request(`/processing-calculations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteProcessingCalculation(id) {
  return request(`/processing-calculations/${id}`, {
    method: "DELETE",
  });
}
