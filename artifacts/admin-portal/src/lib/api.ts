export const API_BASE = "/api";
export function adminHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Admin-Pin": sessionStorage.getItem("mteto_admin_pin") ?? "",
  };
}

export async function fetchAdmin(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: adminHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchPublic(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/overview`, {
    headers: { "X-Admin-Pin": pin },
    credentials: "include",
  });
  if (!res.ok) return false;
  sessionStorage.setItem("mteto_admin_pin", pin);
  return true;
}
