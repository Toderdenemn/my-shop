import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkQPayPayment } from "@/lib/qpay";

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");
    if (!orderId) return Response.json({ error: "Missing orderId" }, { status: 400 });

    const orderRef = adminDb.doc(`orders/${orderId}`);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return Response.json({ error: "Order not found" }, { status: 404 });

    const order = orderSnap.data()!;
    const invoiceId = order.payment?.qpayInvoiceId;
    if (!invoiceId) return Response.json({ error: "No invoice" }, { status: 400 });

    const paymentResult = await checkQPayPayment(invoiceId);
    const isPaid = paymentResult.count > 0;

    if (isPaid) {
      await orderRef.update({
        status: "paid",
        "payment.status": "paid",
        "payment.confirmedAt": new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return Response.json({ success: true, paid: isPaid });
  } catch (err: any) {
    console.error("QPay callback error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
