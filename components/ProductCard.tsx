"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types";
import { calcDiscountedPrice, formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toast";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { user, signInWithGoogle } = useAuth();

  const discountedPrice = calcDiscountedPrice(product.basePrice, product.discountPercent);
  const hasDiscount = product.discountPercent > 0;
  const savings = product.basePrice - discountedPrice;
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      if (confirm("Сагсанд нэмэхийн тулд нэвтрэх шаардлагатай. Google-ээр нэвтрэх үү?")) {
        await signInWithGoogle();
      }
      return;
    }
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      quantity: 1,
      selectedVariants: {},
      basePrice: product.basePrice,
      discountPercent: product.discountPercent,
    });
    toast("Сагсанд нэмэгдлээ!");
  };

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-200">
              <ShoppingCart className="w-10 h-10" />
            </div>
          )}

          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{product.discountPercent}%
            </span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-gray-700 font-bold text-xs px-3 py-1.5 rounded-full">Дууссан</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 leading-snug group-hover:text-yellow-600 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-end justify-between gap-2">
            <div>
              {hasDiscount ? (
                <>
                  <p className="text-red-500 font-bold text-base leading-tight">{formatPrice(discountedPrice)}</p>
                  <p className="text-gray-400 text-xs line-through">{formatPrice(product.basePrice)}</p>
                  <p className="text-green-600 text-xs font-medium">{formatPrice(savings)} хэмнэлт</p>
                </>
              ) : (
                <p className="text-gray-900 font-bold text-base">{formatPrice(product.basePrice)}</p>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-100 disabled:text-gray-400 text-gray-900 p-2 rounded-lg transition-colors"
              title="Сагсанд нэмэх"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
