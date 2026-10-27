/**
 * M-TETO Service Provider API Client
 * All case-tracking calls use ?demo=true for the seeded demo dataset.
 * Copyright: Adv. Thando Gumede ZA — M-TETO™
 */

const API = "/api";
function spHeaders(extra?: Record<string, string>): Record<string, string> {
  let pin = "";
  try {
    const user = JSON.parse(sessionStorage.getItem("sp_auth_user") ?? "null");
    pin = typeof user?.pin === "string" ? user.pin : "";
  } catch {
    pin = "";
  }
  return {
    "Content-Type": "application/json",
    "x-sp-pin": pin,
    ...(extra ?? {}),
  };
}

export async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: spHeaders(opts?.headers as Record<string, string>),
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

// ── Cases ────────────────────────────────────────────────────
export const spApi = {
  getDemoCases: (params?: Record<string, string>) => {
    const q = new URLSearchParams({ limit: "100", ...params });
    return apiFetch(`/demo-cases?${q}`);
  },

  getCaseById: (id: string) => apiFetch(`/demo-cases/${id}`),

  // ── Full 15-step justice value chain timeline ──────────────
  getCaseTimeline: (id: string) =>
    apiFetch(`/cases/${id}/timeline?demo=true`),

  // ── Step update (status, notes, actor details) ─────────────
  updateTimelineStep: (
    caseId: string,
    stepId: string,
    data: {
      status: string;
      officialNotes?: string;
      actorName?: string;
      actorPhone?: string;
      actorBadge?: string;
      delayReason?: string;
      pendingActions?: string[];
    }
  ) =>
    apiFetch(`/cases/${caseId}/timeline/${stepId}?demo=true`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Legacy update (simple status + notes)
  addUpdate: (caseId: string, data: object) =>
    apiFetch(`/sp/cases/${caseId}/update`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ── Documents / Evidence ───────────────────────────────────
  getDocuments: (caseId: string) =>
    apiFetch(`/cases/${caseId}/documents?demo=true`),

  getDocumentFile: (caseId: string, docId: string) =>
    apiFetch(`/cases/${caseId}/documents/${docId}/file?demo=true`),

  uploadDocument: (
    caseId: string,
    data: {
      documentType: string;
      documentLabel: string;
      fileName: string;
      fileType: string;
      fileSizeBytes: number;
      fileData: string;           // base64 encoded
      fileHash?: string;          // SHA-256 integrity hash
      description?: string;
      stepId?: string;
      uploadedBy?: string;
    }
  ) =>
    apiFetch(`/cases/${caseId}/documents?demo=true`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ── Messages (inter-SP communication) ─────────────────────
  getMessages: (caseId: string) =>
    apiFetch(`/cases/${caseId}/messages?demo=true`),

  sendMessage: (
    caseId: string,
    data: {
      senderName: string;
      senderTitle?: string;
      messageType?: string;
      subject?: string;
      body: string;
      stepId?: string;
      isUrgent?: boolean;
    }
  ) =>
    apiFetch(`/cases/${caseId}/messages?demo=true`, {
      method: "POST",
      body: JSON.stringify({ ...data, senderRole: "official" }),
    }),

  // ── Escalations ────────────────────────────────────────────
  getEscalations: (caseId: string) =>
    apiFetch(`/cases/${caseId}/escalations?demo=true`),

  createEscalation: (
    caseId: string,
    data: {
      escalationBody: string;
      reason: string;
      stepId?: string;
      severity?: string;
      submittedBy?: string;
    }
  ) =>
    apiFetch(`/cases/${caseId}/escalate?demo=true`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ── Flag a case ────────────────────────────────────────────
  flagCase: (caseId: string, reason: string) =>
    apiFetch(`/cases/${caseId}/flag?demo=true`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  // ── Dashboard stats ────────────────────────────────────────
  getStats: () => apiFetch(`/sp/stats`),

  // ── Inquiry stats (for nav badge) ──────────────────────────
  getInquiryStats: () => apiFetch(`/sp/inquiry-stats`),

  // ── Inbox / Inquiries ──────────────────────────────────────
  getInquiries: (params?: {
    type?: string; status?: string; urgency?: string;
    limit?: number; offset?: number; q?: string;
  }) => {
    const p = new URLSearchParams();
    if (params?.type)    p.set("type",    params.type);
    if (params?.status)  p.set("status",  params.status);
    if (params?.urgency) p.set("urgency", params.urgency);
    if (params?.limit)   p.set("limit",   String(params.limit));
    if (params?.offset)  p.set("offset",  String(params.offset));
    if (params?.q)       p.set("q",       params.q);
    return apiFetch(`/sp/inquiries${p.toString() ? `?${p}` : ""}`);
  },

  getInquiry: (id: string) => apiFetch(`/sp/inquiries/${id}`),

  respondToInquiry: (
    id: string,
    data: {
      responderName: string;
      responderRole?: string;
      responderDepartment?: string;
      body: string;
      channel?: string;
      isInternal?: boolean;
    }
  ) =>
    apiFetch(`/sp/inquiries/${id}/respond`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateInquiryStatus: (
    id: string,
    data: { status?: string; assignedTo?: string; assignedDepartment?: string }
  ) =>
    apiFetch(`/sp/inquiries/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  createInquiry: (data: {
    type?: string; urgency?: string; contactName?: string;
    contactPhone?: string; contactEmail?: string;
    subject: string; body: string; geoLat?: number; geoLng?: number;
    geoAddress?: string; organisationSlug?: string;
  }) =>
    apiFetch(`/sp/inquiries`, { method: "POST", body: JSON.stringify(data) }),

  // ── Emergency Events ───────────────────────────────────────
  getEmergencyEvents: () => apiFetch(`/sp/emergency-events`),

  recordEmergencyOutcome: (
    id: string,
    data: {
      wasHelped?: boolean;
      incidentNature?: string;
      incidentDescription?: string;
      caseOpened?: boolean;
      casNumber?: string;
      linkedCaseId?: string;
      attendingOfficer?: string;
      attendingOfficerBadge?: string;
      attendingOrg?: string;
      responseTimeMinutes?: number;
      childSafe?: boolean;
      hospitalised?: boolean;
      perpetratorApprehended?: boolean;
      followUpRequired?: boolean;
      followUpNotes?: string;
      recordedBy?: string;
    }
  ) =>
    apiFetch(`/sp/emergency-events/${id}/outcome`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ── Accountability / Whistleblower ─────────────────────────
  reportAccountability: (data: object) =>
    apiFetch(`/sp/accountability`, { method: "POST", body: JSON.stringify(data) }),

  whistleblow: (data: object) =>
    apiFetch(`/sp/whistleblow`, { method: "POST", body: JSON.stringify(data) }),
};
