import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

async function sendSms(total: number) {
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

  const text = `Захиралаа.. Hicar шинэ захиалга үүслээ.. захиалгаа шалгаарай`;
  const url = `${apiUrl}?from=${from}&to=${to}&text=${encodeURIComponent(text)}`;

  console.log("Sending SMS to:", to, "text:", text);

  const res = await fetch(url, {
    method: "GET",
    headers: { "x-api-key": apiKey },
  });

  const body = await res.text();
  console.log("SMS result:", res.status, body);
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const { userId } = await request.json();

  const orderRef = adminDb.doc(`orders/${id}`);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  const orderData = orderSnap.data()!;
  if (orderData.userId !== userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await orderRef.update({
    status: "payment-checking",
    "payment.status": "checking",
    "payment.checkedAt": new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await sendSms(orderData.total);

  return Response.json({ success: true });
}
