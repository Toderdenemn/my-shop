import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newUsername, newPassword } = await request.json();

  const adminDoc = await adminDb.doc("admin/credentials").get();
  if (!adminDoc.exists) {
    return Response.json({ error: "Admin not found" }, { status: 404 });
  }

  const adminData = adminDoc.data()!;
  const passwordMatch = await bcrypt.compare(currentPassword, adminData.passwordHash);
  if (!passwordMatch) {
    return Response.json({ error: "Одоогийн нууц үг буруу байна" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (newUsername) updates.username = newUsername;
  if (newPassword) updates.passwordHash = await bcrypt.hash(newPassword, 12);

  await adminDb.doc("admin/credentials").update(updates);

  return Response.json({ success: true });
}
