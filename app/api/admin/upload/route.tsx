import { NextRequest } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin-auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `products/${uuidv4()}.${ext}`;

  const bucket = adminStorage.bucket();
  const fileRef = bucket.file(filename);
  await fileRef.save(buffer, { contentType: file.type, public: true });

  const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;
  return Response.json({ url });
}
