"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";
import { formatPrice, calcDiscountedPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2, Eye, EyeOff, Search } from "lucide-react";
import { toast } from "@/components/Toast";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" барааг устгах уу?`)) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast("Бараа устгагдлаа!");
  };

  const handleToggleActive = async (product: Product) => {
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
    toast(product.isActive ? "Нуугдлаа" : "Харагдах болло");
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Бараа</h1>
        <Link
          href="/admin/products/new"
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Бараа нэмэх
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Бараа хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-yellow-400"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-4 animate-pulse flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-center py-10 text-gray-400">Бараа байхгүй байна</p>
          ) : (
            <div className="divide-y">
              {filtered.map((product) => {
                const discounted = calcDiscountedPrice(product.basePrice, product.discountPercent);
                return (
                  <div key={product.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.images[0] ? (
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">Зург</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${product.isActive ? "text-gray-900" : "text-gray-400"}`}>
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {product.discountPercent > 0 ? (
                          <>
                            <span className="text-red-500 text-sm font-bold">{formatPrice(discounted)}</span>
                            <span className="text-gray-400 text-xs line-through">{formatPrice(product.basePrice)}</span>
                            <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded">-{product.discountPercent}%</span>
                          </>
                        ) : (
                          <span className="text-gray-700 text-sm font-bold">{formatPrice(product.basePrice)}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Үлдэгдэл: {product.stock}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!product.isActive && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Нуугдсан</span>
                      )}
                      <button onClick={() => handleToggleActive(product)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" title={product.isActive ? "Нуух" : "Харуулах"}>
                        {product.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <Link href={`/admin/products/${product.id}`} className="p-2 text-blue-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(product.id, product.name)} className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
