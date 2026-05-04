import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin-auth";
import { v4 as uuidv4 } from "uuid";

async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token && (await verifyAdminToken(token));
}

export async function GET() {
  if (!(await auth())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const snap = await adminDb.collection("products").orderBy("createdAt", "desc").get();
  return Response.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function POST(request: NextRequest) {
  if (!(await auth())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const id = uuidv4();
  const now = new Date().toISOString();
  await adminDb.collection("products").doc(id).set({ ...body, createdAt: now, updatedAt: now });
  return Response.json({ id });
}
