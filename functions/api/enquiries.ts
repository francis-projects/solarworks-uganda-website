import { json, notifyByEmail, protectPublicRequest, readJson, saveEnquiry, validateEnquiry, verifyTurnstile, type Context } from "./_shared";

export const onRequestPost = async (context: Context): Promise<Response> => {
  const protectedResponse = await protectPublicRequest(context, "enquiry");
  if (protectedResponse) return protectedResponse;
  const body = await readJson(context.request);
  if (!body) return json({ ok: false, error: "Send the request as valid JSON." }, 400);
  const validation = validateEnquiry(body);
  if (!validation.ok) return json({ ok: false, error: "Check the highlighted fields and try again.", field_errors: validation.fieldErrors }, 400);
  if (!await verifyTurnstile(body.turnstile_token, context.request, context.env)) {
    const configured = Boolean(context.env.TURNSTILE_SECRET_KEY);
    return json({ ok: false, error: configured ? "The security check expired. Please complete it again." : "Online requests are not configured yet. Please call or message the team." }, configured ? 400 : 503);
  }
  try {
    const lead = await saveEnquiry(context.env, validation.value);
    const notify = context.env.ALERT_EMAIL_TO
      ? notifyByEmail(context.env, context.env.ALERT_EMAIL_TO, `New website enquiry ${lead.reference}`, `${validation.value.fullName}\n${validation.value.phone}\n${validation.value.email ?? "No email supplied"}\n${validation.value.customerType}\n${validation.value.location}\n${validation.value.interests.join(", ")}\n\n${validation.value.message ?? ""}`)
      : Promise.resolve(false);
    const acknowledge = validation.value.email
      ? notifyByEmail(context.env, validation.value.email, "We received your SolarWorks Uganda enquiry", `Thank you for contacting SolarWorks Uganda. Your reference is ${lead.reference}. The team will review your request and contact you using the details you provided. This is an acknowledgement only, not a quotation or appointment confirmation.`)
      : Promise.resolve(false);
    const [alertSent, acknowledgementSent] = await Promise.all([notify, acknowledge]);
    await context.env.DB.batch([
      context.env.DB.prepare("INSERT INTO enquiry_events (enquiry_id, kind, detail) VALUES (?, 'notification_result', ?)").bind(lead.id, `owner_email=${alertSent ? "sent" : "not_configured_or_unavailable"}`),
      context.env.DB.prepare("INSERT INTO enquiry_events (enquiry_id, kind, detail) VALUES (?, 'notification_result', ?)").bind(lead.id, `customer_acknowledgement=${acknowledgementSent ? "sent" : "on_page_only"}`),
    ]);
    return json({ ok: true, reference: lead.reference, acknowledgement: acknowledgementSent ? "email" : "on_page" });
  } catch {
    return json({ ok: false, error: "We could not save your request. Please call or message the team." }, 503);
  }
};
