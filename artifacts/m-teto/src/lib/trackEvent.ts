/**
 * trackEvent — anonymously logs every user interaction to the backend.
 * Uses the anonymous sessionId from localStorage. No PII ever sent.
 *
 * Call this throughout the app to populate the admin portal's
 * User Journeys, AI Insights, and Intervention data.
 */

const API_BASE = import.meta.env.BASE_URL
  ? `${import.meta.env.BASE_URL}api`.replace(/\/\//g, "/")
  : "/api";

function getSessionId(): string {
  let id = localStorage.getItem("mteto_session_id");
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("mteto_session_id", id);
  }
  return id;
}

function getContext() {
  return {
    gradeLevel: localStorage.getItem("mteto_grade") || undefined,
    province: localStorage.getItem("mteto_province") || undefined,
  };
}

export async function trackEvent(
  eventType: string,
  eventData?: Record<string, any>
): Promise<void> {
  try {
    const ctx = getContext();
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getSessionId(),
        eventType,
        eventData: eventData ?? {},
        gradeLevel: ctx.gradeLevel,
        province: ctx.province,
      }),
    });
  } catch {
    // Silent — never interrupt the user experience
  }
}

export { getSessionId };
