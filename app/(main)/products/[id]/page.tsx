"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types";
import { calcDiscountedPrice, formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toast";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, ChevronLeft, Minus, Plus, Package, Truck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    params.then(({ id }) => {
      getDoc(doc(db, "products", id)).then((snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Product;
          setProduct(data);
          const defaults: Record<string, string> = {};
          data.variants.forEach((v) => {
            if (v.options.length > 0) defaults[v.name] = v.options[0];
          });
          setSelectedVariants(defaults);
        }
        setLoading(false);
      });
    });
  }, [params]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-4xl mb-4">😕</p>
        <p className="text-gray-500">Бараа олдсонгүй</p>
        <Link href="/" className="text-blue-500 hover:underline mt-2 inline-block">Нүүр хуудас</Link>
      </div>
    );
  }

  const discountedPrice = calcDiscountedPrice(product.basePrice, product.discountPercent);
  const hasDiscount = product.discountPercent > 0;
  const savings = product.basePrice - discountedPrice;
  const totalPrice = discountedPrice * quantity;

  const handleAddToCart = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      quantity,
      selectedVariants,
      basePrice: product.basePrice,
      discountPercent: product.discountPercent,
    });
    toast("Сагсанд нэмэгдлээ!");
  };

  const handleBuyNow = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      quantity,
      selectedVariants,
      basePrice: product.basePrice,
      discountPercent: product.discountPercent,
    });
    router.push("/cart");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link href="/" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ChevronLeft className="w-4 h-4" />
        Буцах
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3">
            {product.images[selectedImage] ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                <Package className="w-16 h-16" />
              </div>
            )}
            {hasDiscount && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                -{product.discountPercent}%
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === i ? "border-yellow-400" : "border-transparent"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {/* Price */}
          <div className="mb-4">
            {hasDiscount ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-red-500">
                    {formatPrice(discountedPrice)}
                  </span>
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.basePrice)}
                  </span>
                </div>
                <p className="text-green-600 text-sm mt-1">
                  {formatPrice(savings)} хэмнэлт ({product.discountPercent}% хямдрал)
                </p>
              </>
            ) : (
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(product.basePrice)}
              </span>
            )}
          </div>

          {/* Variants */}
          {product.variants.map((variant) => (
            <div key={variant.name} className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">{variant.name}</p>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedVariants((prev) => ({ ...prev, [variant.name]: opt }))}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedVariants[variant.name] === opt
                        ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Тоо хэмжээ</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400">({product.stock} ширхэг бэлэн)</span>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Нийт ({quantity} ширхэг)</span>
              <span className="font-bold text-gray-900">{formatPrice(totalPrice)}</span>
            </div>
          </div>

          {/* Buttons */}
          {product.stock === 0 ? (
            <div className="bg-gray-100 text-gray-500 text-center py-3 rounded-xl font-medium">
              Дууссан байна
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleBuyNow}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl transition-colors"
              >
                Одоо худалдаж авах
              </button>
              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-2 border-2 border-yellow-400 text-yellow-600 font-bold py-3 rounded-xl hover:bg-yellow-50 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Сагсанд нэмэх
              </button>
            </div>
          )}

          {/* Delivery info */}
          <div className="mt-6 border-t pt-4 space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-400" />
              <span>Монгол шуудан / UBcab хүргэлт боломжтой</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-2">Барааны тайлбар</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
