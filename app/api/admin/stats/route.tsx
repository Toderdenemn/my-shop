import { adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin-auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [ordersSnap, productsSnap] = await Promise.all([
    adminDb.collection("orders").orderBy("createdAt", "desc").get(),
    adminDb.collection("products").get(),
  ]);

  const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
  const paidOrders = orders.filter((o) =>
    ["paid", "processing", "shipped", "delivered"].includes(o.status)
  );

  return Response.json({
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === "payment-checking").length,
    totalRevenue: paidOrders.reduce((sum, o) => sum + o.total, 0),
    totalProducts: productsSnap.size,
    recentOrders: orders.slice(0, 5),
  });
}
