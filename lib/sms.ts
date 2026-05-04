import { adminDb } from "@/lib/firebase-admin";

export async function sendAdminSms(text: string) {
  const apiUrl = process.env.SMS_API_URL;
  const apiKey = process.env.SMS_API_KEY;
  const from = process.env.SMS_FROM;

  let to = process.env.ADMIN_PHONE;
  try {
    const smsSnap = await adminDb.doc("settings/sms").get();
    if (smsSnap.exists && smsSnap.data()?.adminPhone) {
      to = smsSnap.data()!.adminPhone;
    }
  } catch {}

  if (!apiUrl || !apiKey || !from || !to) {
    console.log("SMS not configured");
    return;
  }

  const url = `${apiUrl}?from=${from}&to=${to}&text=${encodeURIComponent(text)}`;
  const res = await fetch(url, { method: "GET", headers: { "x-api-key": apiKey } });
  const body = await res.text();
  console.log("SMS result:", res.status, body);
}
