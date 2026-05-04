import { adminDb } from "@/lib/firebase-admin";
import bcrypt from "bcryptjs";

export async function GET() {
  return setup();
}

export async function POST() {
  return setup();
}

async function setup() {
  const username = "admin";
  const password = "Admin@2024!";
  const passwordHash = await bcrypt.hash(password, 12);

  await adminDb.doc("admin/credentials").set({ username, passwordHash });

  await adminDb.doc("settings/delivery").set({
    options: [
      { id: "mongol-shuudan", name: "Монгол шуудан", price: 5000, description: "Удаан (3-7 хоног)" },
      { id: "ubcab", name: "UBcab", price: 13000, description: "Хурдан (1-2 хоног)" },
    ],
  });

  await adminDb.doc("settings/bank").set({
    bankName: "Худалдаа хөгжлийн банк",
    iban: "370004000",
    accountNumber: "459 008 919",
    accountHolder: "",
  });

  return Response.json({
    success: true,
    message: "Admin setup complete",
    credentials: { username, password },
  });
}
