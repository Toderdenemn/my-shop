import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { total } = await request.json();

    const apiUrl = process.env.SMS_API_URL;
    const apiKey = process.env.SMS_API_KEY;
    const from = process.env.SMS_FROM;

    // Firestore-оос admin дугаар авна, байхгүй бол .env-ээс авна
    let to = process.env.ADMIN_PHONE;
    try {
      const smsSnap = await adminDb.doc("settings/sms").get();
      if (smsSnap.exists && smsSnap.data()?.adminPhone) {
        to = smsSnap.data()!.adminPhone;
      }
    } catch {}

    const text = `Hicar.mn shine zahialga uuslee ${total}`;

    console.log("SMS config:", { apiUrl, from, to, hasKey: !!apiKey });

    if (!apiUrl || !apiKey || !from || !to) {
      console.log("SMS not configured, skipping");
      return Response.json({ success: true });
    }

    const url = `${apiUrl}?from=${from}&to=${to}&text=${encodeURIComponent(text)}`;
    console.log("SMS URL:", url);

    const res = await fetch(url, {
      method: "GET",
      headers: { "x-api-key": apiKey },
    });

    const responseText = await res.text();
    console.log("SMS response status:", res.status, "body:", responseText);

    return Response.json({ success: true, status: res.status, response: responseText });
  } catch (err: any) {
    console.error("SMS error:", err.message);
    return Response.json({ success: false, error: err.message });
  }
}
