const eventNames = new Set(["form_start", "form_submit", "whatsapp_click", "call_click", "animation_play"]);

export function trackEvent(event: string) {
  if (!eventNames.has(event)) return;
  const body = JSON.stringify({ event, path: window.location.pathname });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
  else void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
}
