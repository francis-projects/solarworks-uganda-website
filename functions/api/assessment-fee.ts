import { calculateFee, json, type Context } from "./_shared";

export const onRequestGet = async ({ request }: Context): Promise<Response> => {
  const url = new URL(request.url);
  const location = url.searchParams.get("location") ?? "";
  const exceptional = url.searchParams.get("exceptional") === "1";
  const fee = calculateFee(location, exceptional);
  if (!fee) return json({ ok: true, available: false, message: "The travel fee for this location needs to be confirmed by the company." });
  return json({ ok: true, ...fee });
};
