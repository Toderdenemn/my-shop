import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin-auth";

async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token && (await verifyAdminToken(token));
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await auth())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await request.json();
  await adminDb.doc(`products/${id}`).update(body);
  return Response.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await auth())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await adminDb.doc(`products/${id}`).delete();
  return Response.json({ success: true });
}
