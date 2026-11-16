// Sparar och hämtar Bajentipsets data i Netlify Blobs.
// Kräver miljövariabeln ADMIN_PASSWORD (Site configuration -> Environment variables).
import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

export const config = { path: "/api/tips" };

const same = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

export default async (req) => {
  const store = getStore({ name: "bajentipset", consistency: "strong" });

  if (req.method === "GET") {
    const data = await store.get("data", { type: "json" });
    if (!data) return new Response(null, { status: 204 });
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  }

  if (req.method === "POST") {
    const password = (globalThis.Netlify?.env.get("ADMIN_PASSWORD")) ?? process.env.ADMIN_PASSWORD;
    if (!password) return new Response("ADMIN_PASSWORD saknas i Netlify.", { status: 500 });
    if (!same(req.headers.get("x-admin-password") || "", password)) return new Response("Fel lösenord.", { status: 401 });
    let data;
    try { data = await req.json(); } catch { return new Response("Ogiltig data.", { status: 400 }); }
    const ok = data && Array.isArray(data.participants) && Array.isArray(data.fixtures) &&
      Array.isArray(data.results) && data.results.length === data.fixtures.length && Array.isArray(data.players);
    if (!ok) return new Response("Ogiltig data.", { status: 400 });
    await store.setJSON("data", data);
    return Response.json({ ok: true });
  }

  return new Response("Metoden stöds inte.", { status: 405 });
};
