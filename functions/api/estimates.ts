import { calculateEstimate } from "../../shared/business";
import { json, makeReference, protectPublicRequest, readJson, verifyTurnstile, type Context } from "./_shared";

export const onRequestPost = async (context: Context): Promise<Response> => {
  const protectedResponse = await protectPublicRequest(context, "estimate");
  if (protectedResponse) return protectedResponse;
  const body = await readJson(context.request);
  if (!body) return json({ ok: false, error: "Send the estimate as valid JSON." }, 400);
  if (!await verifyTurnstile(body.turnstile_token, context.request, context.env)) return json({ ok: false, error: "Complete the security check before saving the estimate." }, 400);
  const mode = body.mode;
  const peakLoadW = Number(body.peak_load_w);
  const backupHours = Number(body.backup_hours);
  const dailyEnergyKwh = body.daily_energy_kwh === null ? null : Number(body.daily_energy_kwh);
  if ((mode !== "backup" && mode !== "hybrid") || !Number.isFinite(peakLoadW) || peakLoadW < 1 || peakLoadW > 100_000 || !Number.isFinite(backupHours) || backupHours <= 0 || backupHours > 48 || (mode === "hybrid" && (!dailyEnergyKwh || !Number.isFinite(dailyEnergyKwh) || dailyEnergyKwh <= 0))) {
    return json({ ok: false, error: "Enter valid system requirements and try again." }, 400);
  }
  const result = calculateEstimate({ mode, peakLoadW, backupHours, dailyEnergyKwh });
  const reference = makeReference("E");
  try {
    await context.env.DB.prepare(`INSERT INTO preliminary_estimates (reference, system_mode, peak_load_w, backup_hours, daily_energy_kwh, result_json, pricing_config_version, source)
      VALUES (?, ?, ?, ?, ?, ?, '2026-11-16', ?)`)
      .bind(reference, mode, peakLoadW, backupHours, dailyEnergyKwh, JSON.stringify(result), typeof body.source === "string" ? body.source.slice(0, 200) : "public website").run();
    return json({ ok: true, reference, result });
  } catch {
    return json({ ok: false, error: "We could not save the estimate. You can still use the result shown on this page." }, 503);
  }
};
