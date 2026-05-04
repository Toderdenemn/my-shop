import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(join(__dirname, "../.env.local"), "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  let val = trimmed.slice(idx + 1).trim();
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  env[key] = val.replace(/\\n/g, "\n");
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY,
    }),
  });
}

const db = getFirestore();

async function deleteCollection(name) {
  console.log(`🗑️  "${name}" устгаж байна...`);
  const snap = await db.collection(name).get();
  const total = snap.docs.length;
  if (total === 0) { console.log(`  Хоосон байна, алгасав.\n`); return; }
  console.log(`  Нийт ${total} document олдлоо`);

  const BATCH_SIZE = 499;
  let done = 0;
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const chunk = snap.docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const doc of chunk) batch.delete(doc.ref);
    await batch.commit();
    done += chunk.length;
    console.log(`  ✓ ${done}/${total} устгагдлаа`);
  }
  console.log(`✅ "${name}" бүгд устгагдлаа!\n`);
}

async function deleteAll() {
  await deleteCollection("products");
  await deleteCollection("orders");
  process.exit(0);
}

deleteAll().catch((err) => {
  console.error("❌ Алдаа:", err.message);
  process.exit(1);
});
