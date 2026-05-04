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

// Category slug → loremflickr keyword
const CAT_KEYWORDS = {
  sticker:     "car,sticker,decal,vinyl",
  protection:  "car,paint,protection,ppf",
  interior:    "car,interior,dashboard,seat",
  exterior:    "car,bumper,spoiler,body",
  lighting:    "car,led,headlight,automotive",
  accessories: "car,accessory,auto,parts",
};

const DEFAULT_KW = "car,auto,accessory";

async function fixImages() {
  console.log("🖼️  Auto accessories зурагнуудыг орлуулж байна...");

  // Load categories to build id→slug map
  const catSnap = await db.collection("categories").get();
  const catMap = {};
  for (const d of catSnap.docs) {
    catMap[d.id] = d.data().slug;
  }

  const snap = await db.collection("products").get();
  const total = snap.docs.length;
  console.log(`  Нийт ${total} бараа`);

  const BATCH_SIZE = 499;
  let done = 0;
  let idx = 0;

  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const chunk = snap.docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const docSnap of chunk) {
      const data = docSnap.data();
      const slug = catMap[data.categoryId] || "";
      const kw = CAT_KEYWORDS[slug] || DEFAULT_KW;
      const lock = idx + 1;

      // 3 images per product — lock varies so each image is different
      const images = [
        `https://loremflickr.com/400/400/${kw}?lock=${lock}`,
        `https://loremflickr.com/400/400/${kw}?lock=${lock + 10000}`,
        `https://loremflickr.com/400/400/${kw}?lock=${lock + 20000}`,
      ];

      batch.update(docSnap.ref, { images });
      idx++;
    }

    await batch.commit();
    done += chunk.length;
    console.log(`  ✓ ${done}/${total}`);
  }

  console.log("✅ Дууслаа!");
  process.exit(0);
}

fixImages().catch((err) => {
  console.error("❌ Алдаа:", err.message);
  process.exit(1);
});
