import { adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin-auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snap = await adminDb.collection("orders").orderBy("createdAt", "desc").get();
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return Response.json(orders);
}
