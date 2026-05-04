import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin-auth";

async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token && (await verifyAdminToken(token));
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await auth())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  await adminDb.doc(`orders/${id}`).delete();
  return Response.json({ success: true });
}
