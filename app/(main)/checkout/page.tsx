"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Address, DeliveryOption, Order, OrderItem } from "@/types";
import { calcDiscountedPrice, formatPrice, generateOrderNumber, calcCartTotals } from "@/lib/utils";
import { MapPin, Truck, CreditCard, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import Image from "next/image";

const STEPS = ["Хаяг", "Хүргэлт", "Төлбөр"];

const DEFAULT_DELIVERY: DeliveryOption[] = [
  { id: "mongol-shuudan", name: "Монгол шуудан", price: 5000, description: "Удаан (3-7 хоног)" },
  { id: "ubcab", name: "UBcab", price: 13000, description: "Хурдан (1-2 хоног)" },
];

export default function CheckoutPage() {
  const { selectedItems, clearSelected } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>(DEFAULT_DELIVERY);

  const [address, setAddress] = useState<Address>({
    city: "",
    district: "",
    khoroo: "",
    building: "",
    apartment: "",
    phone: "",
    extraPhone: "",
    details: "",
  });

  const [selectedDelivery, setSelectedDelivery] = useState<string>("mongol-shuudan");
  const [paymentMethod, setPaymentMethod] = useState<"qpay" | "bank-transfer">("qpay");
  const [bankInfo, setBankInfo] = useState({ bankName: "Худалдаа хөгжлийн банк", iban: "370004000", accountNumber: "459 008 919", accountHolder: "" });
  const [orderNumber] = useState(() => generateOrderNumber());

  useEffect(() => {
    if (!user) { router.push("/"); return; }
    if (selectedItems.length === 0 && !submitted) { router.push("/cart"); return; }

    getDoc(doc(db, "settings", "delivery")).then((snap) => {
      if (snap.exists() && snap.data().options) {
        setDeliveryOptions(snap.data().options);
      }
    });
    getDoc(doc(db, "settings", "bank")).then((snap) => {
      if (snap.exists()) setBankInfo(snap.data() as any);
    });
  }, [user, selectedItems.length, submitted, router]);

  const delivery = deliveryOptions.find((d) => d.id === selectedDelivery) || deliveryOptions[0];
  const { subtotal, discountAmount, finalBeforeDelivery } = calcCartTotals(selectedItems);
  const total = finalBeforeDelivery + (delivery?.price || 0);

  const addressValid =
    address.city && address.district && address.khoroo && address.phone;

  const handleSubmit = async () => {
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      const orderItems: OrderItem[] = selectedItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        selectedVariants: item.selectedVariants,
        basePrice: item.basePrice,
        discountPercent: item.discountPercent,
        finalPrice: calcDiscountedPrice(item.basePrice, item.discountPercent),
      }));

      const orderData: Omit<Order, "id"> = {
        orderNumber,
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || "",
        items: orderItems,
        address,
        delivery: { method: delivery.id, name: delivery.name, price: delivery.price },
        payment: { method: paymentMethod, status: "pending" },
        subtotal,
        discountAmount,
        deliveryFee: delivery.price,
        total,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const ref = await addDoc(collection(db, "orders"), orderData);

      if (paymentMethod === "qpay") {
        const res = await fetch("/api/qpay/create-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: ref.id, amount: total, orderNumber: (orderData as any).orderNumber }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }

      setSubmitted(true);
      clearSelected();
      router.push(`/orders/${ref.id}`);
    } catch (err) {
      alert("Захиалга үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.");
      setSubmitting(false);
    }
  };

  if (!user || selectedItems.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
              i < step ? "bg-green-500 text-white" : i === step ? "bg-yellow-400 text-gray-900" : "bg-gray-200 text-gray-400"
            }`}>
              {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
            </div>
            <span className={`ml-1.5 text-xs sm:text-sm font-medium truncate ${i === step ? "text-gray-900" : "text-gray-400"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 sm:mx-3 min-w-[12px] ${i < step ? "bg-green-400" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Order summary (always visible) */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm">
        <p className="font-semibold text-gray-700 mb-2">Захиалгын хураангуй</p>
        <div className="space-y-1 text-gray-600">
          {selectedItems.slice(0, 3).map((item) => (
            <div key={item.productId} className="flex justify-between gap-2">
              <span className="truncate min-w-0">{item.productName} ×{item.quantity}</span>
              <span className="flex-shrink-0">{formatPrice(calcDiscountedPrice(item.basePrice, item.discountPercent) * item.quantity)}</span>
            </div>
          ))}
          {selectedItems.length > 3 && <p className="text-gray-400">+{selectedItems.length - 3} бараа...</p>}
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Хямдрал</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Хүргэлт</span>
            <span>{formatPrice(delivery?.price || 0)}</span>
          </div>
          <div className="border-t pt-1 flex justify-between font-bold text-gray-900">
            <span>Нийт</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Step 0: Address */}
      {step === 0 && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-5 h-5 text-yellow-500" />
            <h2 className="font-bold text-gray-900">Хүргэлтийн хаяг</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Хот, аймаг *", key: "city" },
              { label: "Дүүрэг, сум *", key: "district" },
              { label: "Хороо, баг *", key: "khoroo" },
              { label: "Байр, гудамж", key: "building" },
              { label: "Тоот", key: "apartment" },
              { label: "Утасны дугаар *", key: "phone" },
              { label: "Нэмэлт утас", key: "extraPhone" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input
                  type={key.includes("phone") ? "tel" : "text"}
                  value={(address as any)[key]}
                  onChange={(e) => setAddress((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400"
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="text-xs text-gray-500 block mb-1">Дэлгэрэнгүй хаяг болон мэдээлэл</label>
            <textarea
              value={address.details}
              onChange={(e) => setAddress((prev) => ({ ...prev, details: e.target.value }))}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 resize-none"
              placeholder="Давхар, орц, тэмдэглэл..."
            />
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={!addressValid}
            className="w-full mt-5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            Үргэлжлүүлэх <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 1: Delivery */}
      {step === 1 && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Truck className="w-5 h-5 text-yellow-500" />
            <h2 className="font-bold text-gray-900">Хүргэлтийн төрөл</h2>
          </div>

          <div className="space-y-3">
            {deliveryOptions.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  selectedDelivery === opt.id ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value={opt.id}
                  checked={selectedDelivery === opt.id}
                  onChange={() => setSelectedDelivery(opt.id)}
                  className="w-4 h-4 accent-yellow-400"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{opt.name}</p>
                  <p className="text-sm text-gray-400">{opt.description}</p>
                </div>
                <span className="font-bold text-gray-900">{formatPrice(opt.price)}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Буцах
            </button>
            <button onClick={() => setStep(2)} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              Үргэлжлүүлэх <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="w-5 h-5 text-yellow-500" />
            <h2 className="font-bold text-gray-900">Төлбөрийн арга</h2>
          </div>

          <div className="space-y-3 mb-6">
            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
              paymentMethod === "qpay" ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:border-gray-300"
            }`}>
              <input type="radio" name="payment" value="qpay" checked={paymentMethod === "qpay"} onChange={() => setPaymentMethod("qpay")} className="w-4 h-4 accent-yellow-400" />
              <div>
                <p className="font-medium text-gray-900">QPay</p>
                <p className="text-sm text-gray-400">QR код уншуулж шууд төлөх</p>
              </div>
            </label>

            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
              paymentMethod === "bank-transfer" ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:border-gray-300"
            }`}>
              <input type="radio" name="payment" value="bank-transfer" checked={paymentMethod === "bank-transfer"} onChange={() => setPaymentMethod("bank-transfer")} className="w-4 h-4 accent-yellow-400" />
              <div>
                <p className="font-medium text-gray-900">Дансны гүйлгээ</p>
                <p className="text-sm text-gray-400">Банкны дансанд шилжүүлэх</p>
              </div>
            </label>
          </div>

          {paymentMethod === "bank-transfer" && (
            <div className="bg-blue-50 rounded-xl p-4 mb-5 text-sm space-y-1">
              <p className="font-semibold text-blue-800 mb-2">Дансны мэдээлэл</p>
              <p className="text-blue-700">{bankInfo.bankName}</p>
              <p className="text-blue-700">IBAN: {bankInfo.iban}</p>
              <p className="text-blue-700">Данс: {bankInfo.accountNumber}</p>
              {bankInfo.accountHolder && <p className="text-blue-700">Эзэмшигч: {bankInfo.accountHolder}</p>}
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-blue-600 text-xs font-medium">⚠️ Гүйлгээний утгад доорх дугаарыг заавал бичнэ үү:</p>
                <p className="text-blue-900 font-bold text-base mt-1 tracking-wider">{orderNumber}</p>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <div className="flex justify-between font-bold text-gray-900 text-lg">
              <span>Нийт төлөх дүн</span>
              <span className="text-yellow-600">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Буцах
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? "Үүсгэж байна..." : "Захиалга баталгаажуулах"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
