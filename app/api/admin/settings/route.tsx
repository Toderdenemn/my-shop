import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin-auth";

async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token && (await verifyAdminToken(token));
}

export async function GET() {
  if (!(await auth())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [deliverySnap, bankSnap, smsSnap, bannerSnap] = await Promise.all([
    adminDb.doc("settings/delivery").get(),
    adminDb.doc("settings/bank").get(),
    adminDb.doc("settings/sms").get(),
    adminDb.doc("settings/banner").get(),
  ]);

  return Response.json({
    delivery: deliverySnap.data() ?? { options: [] },
    bank: bankSnap.data() ?? {},
    sms: smsSnap.data() ?? { adminPhone: "" },
    banner: bannerSnap.data() ?? { imageUrl: "" },
  });
}

export async function POST(request: NextRequest) {
  if (!(await auth())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { delivery, bank, sms, banner } = await request.json();

  await Promise.all([
    adminDb.doc("settings/delivery").set(delivery),
    adminDb.doc("settings/bank").set(bank),
    adminDb.doc("settings/sms").set(sms),
    banner !== undefined ? adminDb.doc("settings/banner").set(banner) : Promise.resolve(),
  ]);

  return Response.json({ success: true });
}
