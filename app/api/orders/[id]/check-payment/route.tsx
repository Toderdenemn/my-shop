import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
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

  await sendAdminSms(
    `Hipay "${orderData.orderNumber}" дугаартай захиалгийн ${orderData.total}₮-ийг шалгана уу`
  );

  return Response.json({ success: true });
}
