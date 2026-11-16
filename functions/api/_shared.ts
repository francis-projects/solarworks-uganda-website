import { calculateAssessmentFee } from "../../shared/business";

export interface Env extends Cloudflare.Env {
  TURNSTILE_SECRET_KEY?: string;
  RATE_LIMIT_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ALERT_EMAIL_TO?: string;
}

export type Context = { request: Request; env: Env; waitUntil?: (promise: Promise<unknown>) => void };

const securityHeaders: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
};

export function json(body: Record<string, unknown>, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...securityHeaders, ...extraHeaders } });
}

export function originAllowed(request: Request, env: Env): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  const requestOrigin = new URL(request.url).origin;
  if (origin === requestOrigin) return true;
  const allowlist = (env.ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  return allowlist.includes(origin);
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  if (!(request.headers.get("Content-Type") ?? "").toLowerCase().includes("application/json")) return null;
  const length = Number(request.headers.get("Content-Length") ?? 0);
  if (length > 20_000) return null;
  try {
    const text = await request.text();
    if (text.length > 20_000) return null;
    const data: unknown = JSON.parse(text);
    return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : null;
  } catch { return null; }
}

export async function checkRateLimit(request: Request, env: Env, action: string, maxPerMinute: number): Promise<boolean> {
  if (!env.RATE_LIMIT_SECRET) return false;
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.RATE_LIMIT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ip));
  const keyHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const windowStart = Math.floor(Date.now() / 60_000) * 60_000;
  await env.DB.prepare(`INSERT INTO rate_limits (key_hash, action, window_start, request_count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(key_hash, action) DO UPDATE SET
      request_count = CASE WHEN rate_limits.window_start = ? THEN rate_limits.request_count + 1 ELSE 1 END,
      window_start = ?`).bind(keyHash, action, windowStart, windowStart, windowStart).run();
  const row = await env.DB.prepare("SELECT request_count FROM rate_limits WHERE key_hash = ? AND action = ?").bind(keyHash, action).first<{ request_count: number }>();
  await env.DB.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(windowStart - 3_600_000).run();
  return (row?.request_count ?? maxPerMinute + 1) <= maxPerMinute;
}

export async function verifyTurnstile(token: unknown, request: Request, env: Env): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY || typeof token !== "string" || token.length < 10 || token.length > 2048) return false;
  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) body.set("remoteip", remoteIp);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  if (!response.ok) return false;
  const result = await response.json() as { success?: boolean; action?: string };
  return result.success === true && (!result.action || result.action === "public-enquiry");
}

export function normalisePhone(value: string): string | null {
  const compact = value.replace(/[\s()-]/g, "");
  const e164 = compact.startsWith("0") ? `+256${compact.slice(1)}` : compact.startsWith("256") ? `+${compact}` : compact;
  return /^\+2567\d{8}$/.test(e164) ? e164 : null;
}

export function validateEnquiry(body: Record<string, unknown>): { ok: true; value: EnquiryInput } | { ok: false; fieldErrors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const phone = typeof body.phone === "string" ? normalisePhone(body.phone) : null;
  const email = typeof body.email === "string" && body.email.trim() ? body.email.trim() : null;
  const customerType = typeof body.customer_type === "string" ? body.customer_type.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const allowedCustomerTypes = ["Home", "Shop or office", "Clinic or health facility", "School", "NGO", "Agro-processing", "Hotel or hospitality", "Other"];
  const allowedInterests = ["Battery backup", "Solar + battery", "Maintenance", "Not sure"];
  const rawInterests = Array.isArray(body.interests) ? body.interests.filter((item): item is string => typeof item === "string") : [];
  const interests = [...new Set(rawInterests.filter((item) => allowedInterests.includes(item)))].sort();
  if (fullName.length < 2 || fullName.length > 80) errors.full_name = "Enter a name between 2 and 80 characters.";
  if (!phone) errors.phone = "Enter a valid Ugandan mobile number.";
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.email = "Enter a valid email address.";
  if (!allowedCustomerTypes.includes(customerType)) errors.customer_type = "Choose a valid site type.";
  if (!location || location.length > 120) errors.location = "Enter a location between 1 and 120 characters.";
  if (!interests.length) errors.interests = "Choose at least one valid service.";
  if (body.consent !== true) errors.consent = "Consent is required before submitting.";
  if (typeof body.message === "string" && body.message.length > 1000) errors.message = "Message must be 1,000 characters or fewer.";
  if (typeof body.monthly_bill_ugx === "number" && (!Number.isInteger(body.monthly_bill_ugx) || body.monthly_bill_ugx < 0)) errors.monthly_bill_ugx = "Enter a valid amount in UGX.";
  if (typeof body.fuel_spend_ugx === "number" && (!Number.isInteger(body.fuel_spend_ugx) || body.fuel_spend_ugx < 0)) errors.fuel_spend_ugx = "Enter a valid amount in UGX.";
  if (typeof body.outage_hours === "number" && (!Number.isFinite(body.outage_hours) || body.outage_hours < 0 || body.outage_hours > 48)) errors.outage_hours = "Enter an outage duration up to 48 hours.";
  if (typeof body.generator_kva === "number" && (!Number.isFinite(body.generator_kva) || body.generator_kva < 0 || body.generator_kva > 10000)) errors.generator_kva = "Enter a valid generator size.";
  if (Object.keys(errors).length || !phone) return { ok: false, fieldErrors: errors };
  return { ok: true, value: {
    fullName, phone, email, customerType, location, interests,
    monthlyBill: typeof body.monthly_bill_ugx === "number" ? body.monthly_bill_ugx : null,
    outagePattern: typeof body.outage_pattern === "string" ? body.outage_pattern.slice(0, 40) : null,
    outageHours: typeof body.outage_hours === "number" ? body.outage_hours : null,
    hasGenerator: typeof body.has_generator === "boolean" ? body.has_generator : null,
    generatorKva: typeof body.generator_kva === "number" ? body.generator_kva : null,
    fuelSpend: typeof body.fuel_spend_ugx === "number" ? body.fuel_spend_ugx : null,
    message: typeof body.message === "string" ? body.message.trim() : null,
    source: typeof body.source === "string" ? body.source.slice(0, 400) : null,
    utmCampaign: typeof body.utm_campaign === "string" ? body.utm_campaign.slice(0, 200) : null,
    referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 400) : null,
    landingPage: typeof body.landing_page === "string" ? body.landing_page.slice(0, 200) : null,
  } };
}

export type EnquiryInput = {
  fullName: string; phone: string; email: string | null; customerType: string; location: string; interests: string[];
  monthlyBill: number | null; outagePattern: string | null; outageHours: number | null; hasGenerator: boolean | null;
  generatorKva: number | null; fuelSpend: number | null; message: string | null; source: string | null;
  utmCampaign: string | null; referrer: string | null; landingPage: string | null;
};

export function makeReference(prefix: "L" | "A" | "E"): string {
  const random = crypto.getRandomValues(new Uint8Array(4));
  const suffix = Array.from(random, (value) => value.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `${prefix}-${new Date().getUTCFullYear()}-${suffix}`;
}

export async function saveEnquiry(env: Env, value: EnquiryInput): Promise<{ id: number; reference: string }> {
  const interestsJson = JSON.stringify(value.interests);
  const existing = await env.DB.prepare(`SELECT id, reference FROM enquiries
    WHERE phone = ? AND interests_json = ? AND deleted_at IS NULL
    AND created_at >= datetime('now', '-24 hours') ORDER BY created_at DESC LIMIT 1`)
    .bind(value.phone, interestsJson).first<{ id: number; reference: string }>();
  if (existing) {
    await env.DB.prepare(`UPDATE enquiries SET updated_at = datetime('now'), full_name = ?, email = ?, location = ?,
      monthly_bill_ugx = ?, outage_pattern = ?, outage_hours = ?, has_generator = ?, generator_kva = ?,
      fuel_spend_ugx = ?, message = ?, source = ?, utm_campaign = ?, referrer = ?, landing_page = ? WHERE id = ?`)
      .bind(value.fullName, value.email, value.location, value.monthlyBill, value.outagePattern, value.outageHours,
        value.hasGenerator === null ? null : Number(value.hasGenerator), value.generatorKva, value.fuelSpend,
        value.message, value.source, value.utmCampaign, value.referrer, value.landingPage, existing.id).run();
    await env.DB.prepare("INSERT INTO enquiry_events (enquiry_id, kind, detail) VALUES (?, 'updated', 'duplicate request refreshed')").bind(existing.id).run();
    await env.DB.prepare("INSERT INTO consent_records (enquiry_id, consent_text_version, privacy_notice_version) VALUES (?, 'contact-v1', 'draft-1')").bind(existing.id).run();
    return existing;
  }
  const reference = makeReference("L");
  const result = await env.DB.prepare(`INSERT INTO enquiries (
    reference, full_name, phone, email, customer_type, location, interests_json, monthly_bill_ugx,
    outage_pattern, outage_hours, has_generator, generator_kva, fuel_spend_ugx, message, source,
    utm_campaign, referrer, landing_page
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(reference, value.fullName, value.phone, value.email, value.customerType, value.location, interestsJson,
      value.monthlyBill, value.outagePattern, value.outageHours, value.hasGenerator === null ? null : Number(value.hasGenerator),
      value.generatorKva, value.fuelSpend, value.message, value.source, value.utmCampaign, value.referrer, value.landingPage).run();
  const id = Number(result.meta.last_row_id);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO enquiry_events (enquiry_id, kind, detail) VALUES (?, 'created', 'public website form')").bind(id),
    env.DB.prepare("INSERT INTO consent_records (enquiry_id, consent_text_version, privacy_notice_version) VALUES (?, 'contact-v1', 'draft-1')").bind(id),
  ]);
  return { id, reference };
}

export async function notifyByEmail(env: Env, to: string, subject: string, text: string): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text }),
    });
    return response.ok;
  } catch { return false; }
}

export async function protectPublicRequest(context: Context, action: string): Promise<Response | null> {
  const { request, env } = context;
  if (!originAllowed(request, env)) return json({ ok: false, error: "This request could not be accepted." }, 403);
  if ((request.headers.get("Content-Length") ?? "0") && Number(request.headers.get("Content-Length")) > 20_000) return json({ ok: false, error: "Request is too large." }, 413);
  if (!env.RATE_LIMIT_SECRET) return json({ ok: false, error: "Online requests are temporarily unavailable. Please call or message SolarWorks Uganda." }, 503);
  try {
    if (!await checkRateLimit(request, env, action, 8)) return json({ ok: false, error: "Too many requests. Please wait a minute and try again." }, 429);
  } catch {
    return json({ ok: false, error: "Online requests are temporarily unavailable. Please call or message SolarWorks Uganda." }, 503);
  }
  return null;
}

export function calculateFee(location: string, exceptional: boolean) {
  return calculateAssessmentFee(location, exceptional);
}
