import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { signAdminToken } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const adminDoc = await adminDb.doc("admin/credentials").get();
    if (!adminDoc.exists) {
      return Response.json({ error: "Admin not configured" }, { status: 401 });
    }

    const adminData = adminDoc.data()!;
    if (adminData.username !== username) {
      return Response.json({ error: "Нэвтрэх нэр эсвэл нууц үг буруу байна" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, adminData.passwordHash);
    if (!passwordMatch) {
      return Response.json({ error: "Нэвтрэх нэр эсвэл нууц үг буруу байна" }, { status: 401 });
    }

    const token = await signAdminToken(username);

    const response = Response.json({ success: true });
    const headers = new Headers(response.headers);
    headers.set(
      "Set-Cookie",
      `admin_token=${token}; HttpOnly; Path=/; Max-Age=${8 * 3600}; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );

    return new Response(response.body, { status: 200, headers });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
