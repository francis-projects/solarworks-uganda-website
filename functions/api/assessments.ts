import { calculateFee, json, notifyByEmail, protectPublicRequest, readJson, saveEnquiry, validateEnquiry, verifyTurnstile, type Context } from "./_shared";

export const onRequestPost = async (context: Context): Promise<Response> => {
  const protectedResponse = await protectPublicRequest(context, "assessment");
  if (protectedResponse) return protectedResponse;
  const body = await readJson(context.request);
  if (!body) return json({ ok: false, error: "Send the request as valid JSON." }, 400);
  const validation = validateEnquiry(body);
  if (!validation.ok) return json({ ok: false, error: "Check the highlighted fields and try again.", field_errors: validation.fieldErrors }, 400);
  if (!await verifyTurnstile(body.turnstile_token, context.request, context.env)) {
    const configured = Boolean(context.env.TURNSTILE_SECRET_KEY);
    return json({ ok: false, error: configured ? "The security check expired. Please complete it again." : "Online requests are not configured yet. Please call or message the team." }, configured ? 400 : 503);
  }
  const fee = calculateFee(validation.value.location, false);
  if (!fee) return json({ ok: false, error: "We cannot calculate an exact assessment fee for this location yet. Please call or message the team before requesting a physical visit.", field_errors: { location: "Exact travel fee not configured for this location." } }, 422);
  const submittedFee = body.fee_quote as { totalUgx?: unknown; distanceKm?: unknown } | undefined;
  if (submittedFee?.totalUgx !== fee.totalUgx || submittedFee.distanceKm !== fee.distanceKm) {
    return json({ ok: false, error: "The assessment fee changed. Refresh the fee and try again." }, 409);
  }
  const preference = body.payment_preference;
  if (preference !== "advance" && preference !== "on_arrival") return json({ ok: false, error: "Choose how you would prefer to pay." }, 400);
  try {
    const lead = await saveEnquiry(context.env, validation.value);
    const assessmentReference = `A${lead.reference.slice(1)}`;
    const requestedDate = typeof body.requested_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.requested_date) ? body.requested_date : null;
    const result = await context.env.DB.prepare(`INSERT INTO assessment_requests (
      reference, enquiry_id, requested_location, district_key, travel_distance_km, fee_ugx,
      exceptional_travel_charge_ugx, payment_preference, payment_status, appointment_status,
      requested_date, cancellation_terms_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'requested', ?, ?)`)
      .bind(assessmentReference, lead.id, validation.value.location, validation.value.location.toLocaleLowerCase("en-UG"),
        fee.distanceKm, fee.totalUgx, fee.exceptionalChargeUgx, preference, requestedDate, "draft-1").run();
    await context.env.DB.prepare("INSERT INTO enquiry_events (enquiry_id, kind, detail) VALUES (?, 'assessment_requested', ?)")
      .bind(lead.id, `assessment ${assessmentReference}; fee disclosed ${fee.totalUgx} UGX`).run();
    const alert = context.env.ALERT_EMAIL_TO
      ? notifyByEmail(context.env, context.env.ALERT_EMAIL_TO, `Site assessment request ${assessmentReference}`, `${validation.value.fullName}\n${validation.value.phone}\n${validation.value.customerType}\n${validation.value.location}\nAssessment fee: UGX ${fee.totalUgx.toLocaleString("en-UG")}\nPayment preference: ${preference}\n\n${validation.value.message ?? ""}`)
      : Promise.resolve(false);
    const acknowledgement = validation.value.email
      ? notifyByEmail(context.env, validation.value.email, "We received your SolarWorks Uganda assessment request", `Thank you for contacting SolarWorks Uganda. Your assessment request reference is ${assessmentReference}. The team will review it and contact you to confirm an appointment. The request is not an appointment confirmation and no payment has been collected.`)
      : Promise.resolve(false);
    const [alertSent, acknowledgementSent] = await Promise.all([alert, acknowledgement]);
    await context.env.DB.batch([
      context.env.DB.prepare("INSERT INTO enquiry_events (enquiry_id, kind, detail) VALUES (?, 'notification_result', ?)").bind(lead.id, `assessment_owner_email=${alertSent ? "sent" : "not_configured_or_unavailable"}`),
      context.env.DB.prepare("INSERT INTO enquiry_events (enquiry_id, kind, detail) VALUES (?, 'notification_result', ?)").bind(lead.id, `assessment_customer_acknowledgement=${acknowledgementSent ? "sent" : "on_page_only"}`),
    ]);
    return json({ ok: true, reference: assessmentReference, payment_status: "unpaid", appointment_status: "requested", saved: Boolean(result.meta.last_row_id) });
  } catch {
    return json({ ok: false, error: "We could not save your assessment request. Please call or message the team." }, 503);
  }
};
