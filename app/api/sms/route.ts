import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const { orderId, orderNumber, total } = await request.json();

    const adminPhone = process.env.CALLPRO_PHONE;
    const message = `AutoSticker захиалга: ${orderNumber}, дүн: ${total}₮. Админ панел шалгана уу.`;

    if (process.env.CALLPRO_API_URL && process.env.CALLPRO_API_KEY && adminPhone) {
      await axios.post(process.env.CALLPRO_API_URL, {
        apiKey: process.env.CALLPRO_API_KEY,
        phone: adminPhone,
        message,
      });
    } else {
      console.log("SMS (CallPro not configured):", message);
    }

    return Response.json({ success: true });
  } catch (err: any) {
    console.error("SMS error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
