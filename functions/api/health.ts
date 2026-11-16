import { json, type Context } from "./_shared";

export const onRequestGet = async ({ env }: Context): Promise<Response> => {
  try {
    await env.DB.prepare("SELECT 1").first();
    return json({ ok: true });
  } catch {
    return json({ ok: false }, 503);
  }
};
