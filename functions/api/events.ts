import { json, protectPublicRequest, readJson, type Context } from "./_shared";

const allowedEvents = new Set(["form_start", "form_submit", "whatsapp_click", "call_click", "animation_play"]);

export const onRequestPost = async (context: Context): Promise<Response> => {
  const blocked = await protectPublicRequest(context, "event");
  if (blocked) return blocked;
  const body = await readJson(context.request);
  if (!body || typeof body.event !== "string" || !allowedEvents.has(body.event)) return json({ ok: false }, 400);
  const path = typeof body.path === "string" && /^\/[a-z0-9/_-]{0,200}$/i.test(body.path) ? body.path : "/";
  try {
    await context.env.DB.batch([
      context.env.DB.prepare("INSERT INTO site_events (event_type, page_path) VALUES (?, ?)").bind(body.event, path),
      context.env.DB.prepare("DELETE FROM site_events WHERE occurred_at < datetime('now', '-90 days')"),
    ]);
    return json({ ok: true });
  } catch { return json({ ok: false }, 503); }
};
