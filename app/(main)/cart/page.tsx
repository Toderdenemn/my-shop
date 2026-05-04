"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ShoppingBag, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { calcDiscountedPrice, formatPrice, calcCartTotals } from "@/lib/utils";
import { toast } from "@/components/Toast";

export default function CartPage() {
  const { items, removeItem, updateQuantity, toggleSelect, selectAll, selectedItems, clearSelected } = useCart();
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  const allSelected = items.length > 0 && items.every((i) => (i as any).selected);

  const { subtotal, discountAmount, finalBeforeDelivery } = calcCartTotals(selectedItems);

  const handleCheckout = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    if (selectedItems.length === 0) {
      toast("Худалдаж авах барааг сонгоно уу.", "error");
      return;
    }
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-20 h-20 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Сагс хоосон байна</h2>
        <p className="text-gray-400 mb-6">Бараа нэмээд дахин ирнэ үү</p>
        <Link
          href="/"
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8 py-3 rounded-xl inline-block transition-colors"
        >
          Дэлгүүр хэсэх
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Миний сагс</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Item list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Select all */}
          <div className="bg-white rounded-xl p-4 border flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => selectAll(e.target.checked)}
              className="w-5 h-5 accent-yellow-400 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">
              Бүгдийг сонгох ({items.length})
            </span>
            {selectedItems.length > 0 && (
              <button
                onClick={clearSelected}
                className="ml-auto text-red-500 text-sm hover:text-red-600 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Сонгосоныг устгах
              </button>
            )}
          </div>

          {items.map((item) => {
            const typedItem = item as typeof item & { selected: boolean };
            const finalPrice = calcDiscountedPrice(item.basePrice, item.discountPercent);
            const hasDiscount = item.discountPercent > 0;

            return (
              <div key={item.productId + JSON.stringify(item.selectedVariants)} className="bg-white rounded-xl p-4 border">
                <div className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={typedItem.selected}
                    onChange={() => toggleSelect(item.productId, item.selectedVariants)}
                    className="w-5 h-5 accent-yellow-400 cursor-pointer mt-1 flex-shrink-0"
                  />

                  {/* Image */}
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {item.productImage ? (
                      <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
                        Зураггүй
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-medium text-gray-800 hover:text-yellow-600 line-clamp-2 text-sm"
                    >
                      {item.productName}
                    </Link>

                    {Object.entries(item.selectedVariants).length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {Object.entries(item.selectedVariants)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                      {/* Price */}
                      <div className="min-w-0">
                        {hasDiscount ? (
                          <>
                            <span className="text-red-500 font-bold text-sm">{formatPrice(finalPrice)}</span>
                            <span className="text-gray-400 text-xs line-through ml-1.5">
                              {formatPrice(item.basePrice)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-gray-900 text-sm">{formatPrice(item.basePrice)}</span>
                        )}
                      </div>

                      {/* Qty + remove */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => updateQuantity(item.productId, item.selectedVariants, Math.max(1, item.quantity - 1))}
                          className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.selectedVariants, item.quantity + 1)}
                          className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-gray-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.productId, item.selectedVariants)}
                          className="w-7 h-7 rounded-md text-red-400 hover:text-red-600 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-5 sticky top-32">
            <h2 className="font-bold text-gray-900 mb-4">Нийт дүн</h2>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Барааны үнэ ({selectedItems.length} бараа)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Хямдрал</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                <span>Барааны нийт</span>
                <span>{formatPrice(finalBeforeDelivery)}</span>
              </div>
              <p className="text-xs text-gray-400">+ Хүргэлтийн төлбөр дараагийн алхамд</p>
            </div>

            {discountAmount > 0 && (
              <div className="bg-green-50 text-green-700 text-sm rounded-lg p-3 mb-4">
                🎉 {formatPrice(discountAmount)} хэмнэлт хийлээ!
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
              className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Захиалга хийх
              <ChevronRight className="w-4 h-4" />
            </button>

            {selectedItems.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-2">Барааг сонгоно уу</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
