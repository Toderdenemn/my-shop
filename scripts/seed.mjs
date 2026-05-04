import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Parse .env.local manually
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
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

initializeApp({
  credential: cert({
    projectId: env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY,
  }),
});

const db = getFirestore();

// ── Categories ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: "sticker", name: "Стикер", order: 1 },
  { slug: "protection", name: "Хамгаалалт", order: 2 },
  { slug: "interior", name: "Дотоод чимэглэл", order: 3 },
  { slug: "exterior", name: "Гадна чимэглэл", order: 4 },
  { slug: "lighting", name: "Гэрэлтүүлэг", order: 5 },
  { slug: "accessories", name: "Дагалдах хэрэгсэл", order: 6 },
];

// ── Product templates per category ──────────────────────────────────────────
const TEMPLATES = {
  sticker: {
    names: [
      "Аниме дүрт стикер", "Гал дөлтэй стикер", "Загасны стикер", "Спорт стикер",
      "JDM стикер", "Skull стикер", "Тугны стикер", "Ой модны стикер",
      "Хурдны стикер", "Racing стикер", "Урлалын стикер", "Хотын стикер",
      "Хөлбөмбөгийн стикер", "Мотоциклын стикер", "Drift стикер", "Dragon стикер",
      "Цэцгийн стикер", "Геометр загварт стикер", "Тооны стикер", "Нэрийн стикер",
    ],
    desc: (n) => `${n} — авто машины гадна болон дотоод гадаргад зориулсан өндөр чанарын vinyl стикер. Нарны тусгал, бороо, мөнхийн хүрэлцэлд тэсвэртэй.`,
    variants: [
      { name: "Хэмжээ", options: ["10×10 см", "15×15 см", "20×20 см", "30×30 см"] },
      { name: "Өнгө", options: ["Хар", "Цагаан", "Улаан", "Шар"] },
    ],
    priceRange: [3000, 25000],
  },
  protection: {
    names: [
      "Бамперийн хамгаалалт", "Хаалганы ирмэгийн хамгаалалт", "Толин хамгаалалт",
      "Бүтэн биеийн хамгаалалт фолио", "Урд шилний хамгаалалт", "Ар шилний хамгаалалт",
      "Дугуйн нумны хамгаалалт", "Прагийн хамгаалалт", "Бамперийн нэмэлт хамгаалалт",
      "Хаалганы хонхорхойн хамгаалалт", "Багажны хамгаалалт", "Хайрга хамгаалах фолио",
      "Тунгалаг PPF фолио", "Матан PPF фолио", "Хромын хамгаалалт",
    ],
    desc: (n) => `${n} — машины гадна гадаргыг хашир, зуравч, хайргаас хамгаалах өндөр чанарын материал. Суурилуулахад хялбар, 3-5 жилийн баталгаат хугацаатай.`,
    variants: [
      { name: "Хэмжээ", options: ["S (жижиг)", "M (дунд)", "L (том)", "XL (их том)"] },
    ],
    priceRange: [15000, 120000],
  },
  interior: {
    names: [
      "Хулдаасны хаалт", "Хорго чимэглэл", "Дугуйн бариулын хаалт", "Тоормосны чимэглэл",
      "Сандалийн хаалт", "Дэлгэцний хүрээ", "Хаалганы панелийн чимэглэл", "Таазны чимэглэл",
      "Гишгүүрийн чимэглэл", "Консолийн хаалт", "Климатын товчлуурын чимэглэл",
      "Тольны чимэглэлт хүрээ", "Хогийн сав", "Зүү эмх журмын хайрцаг", "Агааржуулалтын чимэглэл",
      "Ар сандалийн хэрэгслийн хайрцаг", "Машины гэрэлтүүлгийн чимэглэл",
    ],
    desc: (n) => `${n} — машины дотоод орчинг гоо сайхантай болгох, тусгайлан бүтээгдсэн чимэглэл. Суурилуулахад хялбар, олон загвар бүхий.`,
    variants: [
      { name: "Загвар", options: ["Carbon", "Wood", "Chrome", "Matte Black"] },
    ],
    priceRange: [5000, 60000],
  },
  exterior: {
    names: [
      "Спойлер", "Бамперийн доод хаалт", "Хажуугийн скирт", "Хаалганы гар хаалт",
      "Толины чимэглэл", "Антенны хаалт", "Дугуйн нумны өргөтгөл", "Хромын молдинг",
      "Ар бамперийн хаалт", "Урд бамперийн чимэглэл", "Нүүрний тор (гриль)", "Хаалганы тэмдэглэл",
      "Хажуугийн судал чимэглэл", "Ар торны хаалт", "Загварт скирт багц",
    ],
    desc: (n) => `${n} — машины гадна дүр төрхийг сайжруулах, өндөр чанарын ABS пластик материалаар хийгдсэн. Тусгай будагтай нийцэх боломжтой.`,
    variants: [
      { name: "Өнгө", options: ["Матан хар", "Хром", "Цагаан", "Будаагүй (OEM)"] },
    ],
    priceRange: [20000, 250000],
  },
  lighting: [
    {
      names: [
        "LED дотоод гэрэлтүүлэг", "RGB ёроолын гэрэл", "Эрхий хурууны гэрэл", "Хаалганы гэрэл",
        "Дугуйн гэрэлт чимэглэл", "LED хаяг гэрэл", "DRL гэрэл", "Угаагчийн гэрэл",
        "Нам дохионы гэрэл", "Өндөр дохионы LED", "Эргэлтийн дохионы LED",
        "Хөдөлгүүрийн тасалгааны гэрэл", "Багажны тасалгааны гэрэл", "Ёроолын RGB гэрэл",
        "Оврийн гэрэл (LED)", "Нарны хавтанцар гэрэл", "Flash дохионы гэрэл",
      ],
      desc: (n) => `${n} — машинд зориулсан энерги хэмнэлттэй, урт эдэлгээт LED гэрэлтүүлэг. Суурилуулахад хялбар залгуур системтэй.`,
      variants: [
        { name: "Өнгө", options: ["Цагаан", "Шар", "Улаан", "RGB (өнгө солигддог)"] },
        { name: "Хэмжээ", options: ["30 см", "60 см", "90 см", "120 см"] },
      ],
      priceRange: [8000, 80000],
    },
  ],
  accessories: {
    names: [
      "Машины ариутгагч", "Гар утасны дэгдэлт", "Машины цэнэглэгч", "Тоосонцор шүүлтүүр",
      "Хулдаасны хамгаалалт", "Халаагчийн дугтуй", "Машины агааржуулагч", "Дугуй угааах хэрэгсэл",
      "Тольны дэгдэлт", "Дотор зохион байгуулагч", "Машины аяга тавиур", "Нарнаас хамгаалах хөшиг",
      "Машины гэрэлтүүлгийн хэрэгсэл", "Гар утасны дамжуулагч", "Автомат хаалганы сэрэмжлүүлэгч",
      "Дугуйн даралт хэмжигч", "Машины DVR камер", "Буцааж харах камер",
      "Парк хийх мэдрэгч", "Машины хөлдөлтөөс хамгаалагч",
    ],
    desc: (n) => `${n} — машин болон жолоочид зориулсан практик хэрэгсэл. Өдөр тутмын ашиглалтад тохиромжтой, өндөр чанарын материал.`,
    variants: [
      { name: "Загвар", options: ["Энгийн", "Дэвшилтэт", "Pro"] },
    ],
    priceRange: [5000, 90000],
  },
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateProducts(categories) {
  const products = [];
  const catMap = {};
  for (const c of categories) catMap[c.slug] = c.id;

  const catSlugs = Object.keys(catMap);
  let idx = 0;

  // Distribute 800 products across categories
  const countPerCat = Math.floor(800 / catSlugs.length); // ~133 each

  for (const slug of catSlugs) {
    let tmpl = TEMPLATES[slug];
    // lighting is nested array for some reason - normalize
    if (Array.isArray(tmpl)) tmpl = tmpl[0];

    const count = slug === catSlugs[catSlugs.length - 1]
      ? 800 - idx  // give remainder to last category
      : countPerCat;

    for (let i = 0; i < count; i++) {
      const baseName = randFrom(tmpl.names);
      const suffix = i < tmpl.names.length ? "" : ` v${i + 1}`;
      const name = `${baseName}${suffix}`;
      const [minP, maxP] = tmpl.priceRange;
      const basePrice = randInt(minP, maxP);
      const hasDiscount = Math.random() < 0.35;
      const discountPercent = hasDiscount ? randFrom([5, 10, 15, 20, 25, 30]) : 0;
      const stock = randInt(0, 150);

      products.push({
        name,
        description: tmpl.desc(name),
        categoryId: catMap[slug],
        basePrice,
        discountPercent,
        stock,
        images: [],
        variants: tmpl.variants,
        isActive: true,
        createdAt: new Date(Date.now() - randInt(0, 90) * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
      idx++;
    }
  }

  return products;
}

async function seed() {
  console.log("🌱 Seed эхэллээ...");

  // 1. Categories
  console.log("📁 Категори үүсгэж байна...");
  const catSnap = await db.collection("categories").get();
  const existingSlugs = new Set(catSnap.docs.map((d) => d.data().slug));

  const createdCats = [];
  for (const cat of CATEGORIES) {
    if (existingSlugs.has(cat.slug)) {
      const existing = catSnap.docs.find((d) => d.data().slug === cat.slug);
      createdCats.push({ ...cat, id: existing.id });
      console.log(`  ✓ Байна: ${cat.name}`);
    } else {
      const ref = await db.collection("categories").add({ ...cat, isActive: true });
      createdCats.push({ ...cat, id: ref.id });
      console.log(`  + Үүсгэлээ: ${cat.name}`);
    }
  }

  // 2. Products in batches of 499
  console.log("\n📦 800 бараа үүсгэж байна...");
  const products = generateProducts(createdCats);
  const BATCH_SIZE = 499;
  let done = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const chunk = products.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const p of chunk) {
      const ref = db.collection("products").doc();
      batch.set(ref, p);
    }
    await batch.commit();
    done += chunk.length;
    console.log(`  ✓ ${done}/${products.length} бараа нэмэгдлээ`);
  }

  console.log("\n✅ Дууслаа! Нийт:", products.length, "бараа нэмэгдлээ.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Алдаа:", err.message);
  process.exit(1);
});
