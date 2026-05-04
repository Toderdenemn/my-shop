import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkQPayPayment } from "@/lib/qpay";
import { sendAdminSms } from "@/lib/sms";

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

  const order = orderSnap.data()!;
  if (order.userId !== userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoiceId = order.payment?.qpayInvoiceId;
  if (!invoiceId) {
    return Response.json({ error: "No QPay invoice" }, { status: 400 });
  }

  const result = await checkQPayPayment(invoiceId);
  const isPaid = result.count > 0;

  if (isPaid) {
    await orderRef.update({
      status: "paid",
      "payment.status": "paid",
      "payment.confirmedAt": new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await sendAdminSms(
      `Hipay "${order.orderNumber}" дугаартай захиалгийн ${order.total}₮ төлөгдлөө`
    );
  }

  return Response.json({ paid: isPaid });
}
