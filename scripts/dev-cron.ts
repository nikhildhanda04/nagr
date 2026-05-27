// Local dev nag/shame trigger. Prod uses Vercel Cron (see vercel.json); locally
// run this alongside `bun run dev` in a second terminal:
//
//   bun run cron:dev
//
// Hits /api/cron/tick every CRON_INTERVAL_SEC (default 60s). Bun auto-loads .env.
const BASE = process.env.CRON_BASE_URL ?? "http://localhost:3000";
const SECRET = process.env.CRON_SECRET;
const INTERVAL = Number(process.env.CRON_INTERVAL_SEC ?? "60") * 1000;

if (!SECRET) {
  console.error("CRON_SECRET is not set in .env");
  process.exit(1);
}

async function tick() {
  try {
    const res = await fetch(`${BASE}/api/cron/tick`, {
      headers: { authorization: `Bearer ${SECRET}` },
    });
    const body = await res.text();
    console.log(`${new Date().toISOString()}  ${res.status}  ${body}`);
  } catch (err) {
    console.error(`${new Date().toISOString()}  tick failed:`, err);
  }
}

console.log(`dev-cron → ${BASE}/api/cron/tick every ${INTERVAL / 1000}s`);
void tick();
setInterval(tick, INTERVAL);
