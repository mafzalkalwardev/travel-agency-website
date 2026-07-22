/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Booking path smoke: branded templates via Resend (no TravelLine hold).
 * Run: node scripts/smoke-booking.js
 */
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const env = { ...process.env };
  for (const file of [".env.local", ".env"]) {
    const filePath = path.join(__dirname, "..", file);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in env) || env[key] === "") env[key] = value;
    }
  }
  return env;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function sendResend(env, { to, subject, html }) {
  const from = env.BOOKING_FROM_EMAIL || env.AUTH_FROM_EMAIL || "noreply@flywithalqibla.com";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from.includes("<") ? from : `Al Qibla Air Services <${from}>`,
      to: [to],
      subject,
      html,
    }),
  });
  const body = await res.text();
  assert(res.ok, `resend ${res.status} ${body}`);
  assert(!from.includes("@resend.dev"), `still sandbox from: ${from}`);
  assert(from.includes("flywithalqibla.com"), `from not company domain: ${from}`);
  return JSON.parse(body);
}

async function main() {
  const env = loadEnv();
  assert(env.RESEND_API_KEY, "RESEND_API_KEY missing");
  assert(env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL missing");
  assert(env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY missing");

  const adminTo = env.BOOKING_ADMIN_EMAIL || env.ADMIN_EMAIL || "salesalqibla@gmail.com";
  const stamp = Date.now();
  const ref = `SMOKE${String(stamp).slice(-6)}`;

  console.log("== Booking received templates ==");
  const receivedCustomer = await sendResend(env, {
    to: adminTo,
    subject: `[Smoke] Booking request ${ref} — LHE-JED Group`,
    html: `<p>Hello Smoke Tester,</p><p>Booking request <strong>${ref}</strong> received for LHE-JED Group. Complete payment on WhatsApp.</p><p>From: flywithalqibla.com booking path.</p>`,
  });
  console.log("customer template OK", receivedCustomer.id);

  const receivedAdmin = await sendResend(env, {
    to: adminTo,
    subject: `[Smoke] New booking ${ref} — Smoke Tester`,
    html: `<p><strong>New booking requires action</strong></p><p>Ref ${ref}. Open Admin Bookings: https://flywithalqibla.com/admin/bookings/</p>`,
  });
  console.log("admin template OK", receivedAdmin.id);

  console.log("\n== Payment confirmed templates ==");
  const paid = await sendResend(env, {
    to: adminTo,
    subject: `[Smoke] Payment confirmed — booking ${ref}`,
    html: `<p>Payment confirmed for ${ref}. Seats held path OK (email only; no TravelLine hold created).</p>`,
  });
  console.log("payment template OK", paid.id);

  console.log("\n== Customer approval templates ==");
  const approved = await sendResend(env, {
    to: adminTo,
    subject: `[Smoke] You're approved to book with Al Qibla`,
    html: `<p>Hello Smoke Tester,</p><p>Your account is approved. Browse tickets: https://flywithalqibla.com/available-tickets/</p>`,
  });
  console.log("approval template OK", approved.id);

  console.log("\n== DB booking insert/cleanup (no supplier hold) ==");
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      status: "cancelled",
      product_type: "ticket",
      customer_name: "Smoke Tester",
      customer_phone: "+920000000000",
      customer_email: adminTo,
      passenger_details: { names: "Smoke Tester", notes: "automated smoke — safe to ignore" },
      passengers: 1,
      quoted_price: 1,
      currency: "PKR",
      product_title: `[SMOKE] Booking path ${ref}`,
      source_page: "/scripts/smoke-booking",
      admin_notes: "Automated smoke booking — cancelled, no hold",
    })
    .select("id")
    .single();

  assert(!error, `booking insert: ${error?.message}`);
  assert(booking?.id, "missing booking id");
  console.log("inserted cancelled smoke booking", booking.id);

  const { error: delErr } = await supabase.from("bookings").delete().eq("id", booking.id);
  assert(!delErr, `booking cleanup: ${delErr?.message}`);
  console.log("cleaned smoke booking");

  console.log("\n== Live admin pages ==");
  for (const url of [
    "https://flywithalqibla.com/admin/bookings/",
    "https://flywithalqibla.com/admin/customers/",
  ]) {
    const res = await fetch(url, { redirect: "manual" });
    assert(res.status === 307 || res.status === 302 || res.status === 200, `${url} => ${res.status}`);
    console.log(url, res.status);
  }

  console.log("\nBOOKING SMOKE PASSED — check inbox for 4 smoke emails at", adminTo);
}

main().catch((err) => {
  console.error("BOOKING SMOKE FAILED:", err.message || err);
  process.exit(1);
});
