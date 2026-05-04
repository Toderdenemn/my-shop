import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

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

  if (orderData.status !== "pending") {
    return Response.json({ error: "Cannot cancel this order" }, { status: 400 });
  }

  await orderRef.update({
    status: "cancelled",
    "payment.status": "failed",
    updatedAt: new Date().toISOString(),
  });

  return Response.json({ success: true });
}
