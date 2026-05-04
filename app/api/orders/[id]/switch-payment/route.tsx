import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { createQPayInvoice } from "@/lib/qpay";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const { method, userId } = await request.json();

  const orderRef = adminDb.doc(`orders/${id}`);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  const orderData = orderSnap.data()!;
  if (orderData.userId !== userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (method === "bank-transfer") {
    await orderRef.update({
      "payment.method": "bank-transfer",
      "payment.status": "pending",
      "payment.qpayInvoiceId": null,
      "payment.qpayQrCode": null,
      "payment.qpayDeeplinks": [],
      status: "pending",
      updatedAt: new Date().toISOString(),
    });
    return Response.json({ success: true });
  }

  if (method === "qpay") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = `${appUrl}/api/qpay/callback?orderId=${id}`;

    const result = await createQPayInvoice({
      orderId: id,
      amount: orderData.total,
      description: `HiCar захиалга ${orderData.orderNumber}`,
      callbackUrl,
    });

    await orderRef.update({
      "payment.method": "qpay",
      "payment.status": "pending",
      "payment.qpayInvoiceId": result.invoice_id,
      "payment.qpayQrCode": result.qr_image,
      "payment.qpayDeeplinks": result.urls || [],
      status: "pending",
      updatedAt: new Date().toISOString(),
    });

    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid method" }, { status: 400 });
}
