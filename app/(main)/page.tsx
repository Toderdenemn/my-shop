"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, Category } from "@/types";
import ProductCard from "@/components/ProductCard";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

export default function HomePage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");

  const q = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";
  const onSale = searchParams.get("sale") === "true";
  const [sortBy, setSortBy] = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  useEffect(() => {
    getDocs(collection(db, "categories")).then((snap) => {
      setCategories(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Category))
          .filter((c) => c.isActive)
          .sort((a, b) => a.order - b.order)
      );
    });
    getDoc(doc(db, "settings", "banner")).then((snap) => {
      if (snap.exists()) setBannerUrl(snap.data().imageUrl || "");
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const productsRef = collection(db, "products");
      const constraints: Parameters<typeof query>[1][] = [
        where("isActive", "==", true),
      ];

      if (onSale) constraints.push(where("discountPercent", ">", 0));

      if (categorySlug) {
        const cat = categories.find((c) => c.slug === categorySlug);
        if (cat) constraints.push(where("categoryId", "==", cat.id));
      }

      const snap = await getDocs(query(productsRef, ...constraints));
      let results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));

      if (q) {
        results = results.filter((p) =>
          p.name.toLowerCase().includes(q.toLowerCase())
        );
      }

      if (priceMin) results = results.filter((p) => p.basePrice >= Number(priceMin));
      if (priceMax) results = results.filter((p) => p.basePrice <= Number(priceMax));

      if (sortBy === "price-asc") results.sort((a, b) => a.basePrice - b.basePrice);
      else if (sortBy === "price-desc") results.sort((a, b) => b.basePrice - a.basePrice);
      else results.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

      setProducts(results);
    } finally {
      setLoading(false);
    }
  }, [q, categorySlug, onSale, sortBy, priceMin, priceMax, categories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero banner */}
      {!q && !categorySlug && !onSale && (
        <div
          className="relative rounded-xl p-5 sm:p-8 mb-8 text-white overflow-hidden"
          style={bannerUrl
            ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "linear-gradient(to right, #111827, #374151)" }
          }
        >
          {bannerUrl && <div className="absolute inset-0 bg-black/50" />}
          <div className="relative z-10">
          <div className="mb-3">
            <img src="/logo.png" alt="HiCar" className="h-[88px] sm:h-[110px] w-auto" />
          </div>
          <p className="text-gray-300 text-sm sm:text-lg drop-shadow">
            Автомашины стикер болон чимэглэлийн шилдэг сонголт
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/?category=sticker" className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors text-sm">
              Стикер харах
            </a>
            <a href="/?sale=true" className="border border-white text-white px-4 py-2 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors text-sm">
              🔥 Хямдрал
            </a>
          </div>
          </div>
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <a
          href="/"
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !categorySlug && !onSale ? "bg-gray-900 text-white" : "bg-white text-gray-700 border hover:bg-gray-50"
          }`}
        >
          Бүх бараа
        </a>
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`/?category=${cat.slug}`}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              categorySlug === cat.slug ? "bg-gray-900 text-white" : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            {cat.name}
          </a>
        ))}
        <a
          href="/?sale=true"
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            onSale ? "bg-red-500 text-white" : "bg-white text-red-500 border border-red-200 hover:bg-red-50"
          }`}
        >
          🔥 Хямдрал
        </a>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <p className="text-gray-500 text-sm">
          {loading ? "Ачааллаж байна..." : `${products.length} бараа олдлоо`}
          {q && <span className="ml-1 text-gray-700 font-medium">&ldquo;{q}&rdquo;</span>}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-2.5 py-2 border rounded-lg text-sm hover:bg-gray-50 whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden xs:inline">Шүүлтүүр</span>
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-2 border rounded-lg text-sm outline-none max-w-[150px]"
          >
            <option value="newest">Шинэ эхэндээ</option>
            <option value="price-asc">Үнэ: бага → их</option>
            <option value="price-desc">Үнэ: их → бага</option>
          </select>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-4 mb-4 flex gap-4 flex-wrap">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Доод үнэ (₮)</label>
            <input
              type="number"
              placeholder="0"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm w-32 outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Дээд үнэ (₮)</label>
            <input
              type="number"
              placeholder="Хязгааргүй"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm w-32 outline-none"
            />
          </div>
        </div>
      )}

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-t-lg" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-6xl mb-4">🔍</p>
          <p className="text-gray-500 text-lg">Бараа олдсонгүй</p>
          <a href="/" className="text-blue-500 hover:underline mt-2 inline-block">
            Бүх барааг харах
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
