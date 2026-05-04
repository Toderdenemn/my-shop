import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { createQPayInvoice } from "@/lib/qpay";

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, orderNumber } = await request.json();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = `${appUrl}/api/qpay/callback?orderId=${orderId}`;

    const result = await createQPayInvoice({
      orderId,
      amount,
      description: `AutoSticker захиалга ${orderNumber}`,
      callbackUrl,
    });

    await adminDb.doc(`orders/${orderId}`).update({
      "payment.qpayInvoiceId": result.invoice_id,
      "payment.qpayQrCode": result.qr_image,
      "payment.qpayDeeplinks": result.urls || [],
      updatedAt: new Date().toISOString(),
    });

    return Response.json({ success: true, invoiceId: result.invoice_id });
  } catch (err: any) {
    console.error("QPay invoice error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
