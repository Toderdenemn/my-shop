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

async function addImages() {
  console.log("🖼️  Зураг нэмж байна...");
  const snap = await db.collection("products").get();
  const total = snap.docs.length;
  console.log(`  Нийт ${total} бараа олдлоо`);

  const BATCH_SIZE = 499;
  let done = 0;

  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const chunk = snap.docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const docSnap of chunk) {
      const seed = docSnap.id;
      // 1 main image + 2 extra — бүгд тогтмол (seed-based)
      const images = [
        `https://picsum.photos/seed/${seed}/400/400`,
        `https://picsum.photos/seed/${seed}a/400/400`,
        `https://picsum.photos/seed/${seed}b/400/400`,
      ];
      batch.update(docSnap.ref, { images });
    }

    await batch.commit();
    done += chunk.length;
    console.log(`  ✓ ${done}/${total}`);
  }

  console.log("✅ Бүгд дууслаа!");
  process.exit(0);
}

addImages().catch((err) => {
  console.error("❌ Алдаа:", err.message);
  process.exit(1);
});
