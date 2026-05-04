"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, Category, ProductVariant } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";
import { Plus, Trash2, X, Upload, ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ProductFormPage({ params }: PageProps<"/admin/products/[id]">) {
  const router = useRouter();
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [productId, setProductId] = useState("");

  const [form, setForm] = useState<Omit<Product, "id" | "createdAt" | "updatedAt">>({
    name: "", description: "", categoryId: "", images: [],
    basePrice: 0, discountPercent: 0, stock: 1, variants: [], isActive: true,
  });

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data.filter((c: Category) => c.isActive) : []));

    params.then(({ id }) => {
      setProductId(id);
      if (id === "new") {
        setIsNew(true);
        setLoading(false);
      } else {
        getDoc(doc(db, "products", id)).then((snap) => {
          if (snap.exists()) {
            const data = snap.data() as Product;
            setForm({
              name: data.name, description: data.description, categoryId: data.categoryId,
              images: data.images, basePrice: data.basePrice, discountPercent: data.discountPercent,
              stock: data.stock, variants: data.variants, isActive: data.isActive,
            });
          }
          setLoading(false);
        });
      }
    });
  }, [params]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) urls.push(data.url);
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      toast(`${urls.length} зураг нэмэгдлээ!`);
    } catch {
      toast("Зураг оруулахад алдаа гарлаа", "error");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const removeImage = (url: string) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((i) => i !== url) }));
  };

  const addVariant = () => {
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { name: "", options: [] }] }));
  };

  const updateVariant = (i: number, field: keyof ProductVariant, value: string | string[]) => {
    setForm((prev) => {
      const v = [...prev.variants];
      v[i] = { ...v[i], [field]: value };
      return { ...prev, variants: v };
    });
  };

  const removeVariant = (i: number) => {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }));
  };

  const addVariantOption = (vi: number, optionInput: string) => {
    if (!optionInput.trim()) return;
    const options = optionInput.split(",").map((o) => o.trim()).filter(Boolean);
    const existing = form.variants[vi].options;
    updateVariant(vi, "options", [...existing, ...options.filter((o) => !existing.includes(o))]);
  };

  const removeVariantOption = (vi: number, opt: string) => {
    setForm((prev) => {
      const v = [...prev.variants];
      const prices = { ...(v[vi].prices || {}) };
      delete prices[opt];
      v[vi] = { ...v[vi], options: v[vi].options.filter((o) => o !== opt), prices: Object.keys(prices).length > 0 ? prices : undefined };
      return { ...prev, variants: v };
    });
  };

  const updateVariantPrice = (vi: number, opt: string, value: string) => {
    setForm((prev) => {
      const v = [...prev.variants];
      const prices = { ...(v[vi].prices || {}) };
      if (value) prices[opt] = Number(value);
      else delete prices[opt];
      v[vi] = { ...v[vi], prices: Object.keys(prices).length > 0 ? prices : undefined };
      return { ...prev, variants: v };
    });
  };

  const handleSave = async () => {
    if (!form.name || form.basePrice <= 0) {
      toast("Нэр болон үнэ заавал оруулна уу", "error");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        toast("Бараа нэмэгдлээ!");
        router.push("/admin/products");
      } else {
        await fetch(`/api/admin/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, updatedAt: new Date().toISOString() }),
        });
        toast("Өөрчлөлт хадгалагдлаа!");
      }
    } catch {
      toast("Хадгалахад алдаа гарлаа", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-40 bg-gray-200 rounded-xl" /></div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isNew ? "Бараа нэмэх" : "Бараа засах"}</h1>
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Үндсэн мэдээлэл</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Барааны нэр *</label>
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Тайлбар</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Ангилал</label>
            <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400">
              <option value="">-- Ангилал сонгох --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {categories.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Ангилал байхгүй байна.{" "}
                <Link href="/admin/categories" className="text-yellow-600 underline">Ангилал нэмэх</Link>
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Үнэ ба нөөц</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Үнэ (₮) *</label>
              <input type="number" min="0" value={form.basePrice} onChange={(e) => setForm((p) => ({ ...p, basePrice: Number(e.target.value) }))} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Хямдрал (%)</label>
              <input type="number" min="0" max="100" value={form.discountPercent} onChange={(e) => setForm((p) => ({ ...p, discountPercent: Number(e.target.value) }))} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Үлдэгдэл</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
            </div>
          </div>
          {form.discountPercent > 0 && (
            <p className="text-sm text-green-600">
              Хямдарсан үнэ: {Math.round(form.basePrice * (1 - form.discountPercent / 100)).toLocaleString()}₮
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-bold text-gray-900">Зурагнууд</h2>
          <div className="flex flex-wrap gap-3">
            {form.images.map((img, i) => (
              <div key={i} className="relative group">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <Image src={img} alt="" fill className="object-cover" />
                </div>
                <button onClick={() => removeImage(img)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className={`w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-yellow-400 transition-colors ${uploadingImages ? "opacity-50 cursor-not-allowed" : ""}`}>
              <Upload className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-xs text-gray-400 text-center">{uploadingImages ? "Байршуулж байна..." : "Нэмэх"}</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploadingImages} className="hidden" />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Хэмжээ / Төрлүүд</h2>
            <button onClick={addVariant} className="flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-700 font-medium">
              <Plus className="w-4 h-4" /> Нэмэх
            </button>
          </div>
          {form.variants.map((variant, vi) => (
            <div key={vi} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Төрлийн нэр (жишээ: Хэмжээ)"
                  value={variant.name}
                  onChange={(e) => updateVariant(vi, "name", e.target.value)}
                  className="text-sm font-medium border rounded-lg px-3 py-1.5 outline-none focus:border-yellow-400 flex-1 mr-3"
                />
                <button onClick={() => removeVariant(vi)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {variant.options.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_120px_32px] text-xs text-gray-400 px-3 py-1.5 bg-gray-50 border-b">
                    <span>Сонголт</span><span>Үнэ (₮)</span><span />
                  </div>
                  {variant.options.map((opt) => (
                    <div key={opt} className="grid grid-cols-[1fr_120px_32px] items-center px-3 py-2 border-b last:border-0 gap-2">
                      <span className="text-sm text-gray-800">{opt}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder={String(form.basePrice || "үнэ")}
                        value={variant.prices?.[opt] ?? ""}
                        onChange={(e) => updateVariantPrice(vi, opt, e.target.value)}
                        className="border rounded-lg px-2 py-1 text-sm outline-none focus:border-yellow-400 w-full"
                      />
                      <button onClick={() => removeVariantOption(vi, opt)} className="text-gray-300 hover:text-red-500 flex items-center justify-center">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Сонголт нэмэх (таслалаар тусгаарлаж болно)"
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-yellow-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addVariantOption(vi, (e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                    addVariantOption(vi, input.value);
                    input.value = "";
                  }}
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-700"
                >
                  Нэмэх
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="w-5 h-5 accent-yellow-400" />
            <div>
              <p className="font-medium text-gray-900">Идэвхтэй</p>
              <p className="text-xs text-gray-400">Чеклэсэн бол харагдах болно</p>
            </div>
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-200 text-gray-900 font-bold py-3 rounded-xl transition-colors"
        >
          {saving ? "Хадгалж байна..." : isNew ? "Бараа нэмэх" : "Өөрчлөлт хадгалах"}
        </button>
      </div>
    </div>
  );
}
