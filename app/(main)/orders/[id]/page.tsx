"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle, XCircle, Clock, Package, Truck, CreditCard, Copy, RefreshCw, QrCode, ChevronLeft, ArrowLeftRight,
} from "lucide-react";
import { toast } from "@/components/Toast";
import { useRouter } from "next/navigation";

const COUNTDOWN_SECS = 300;

const STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: "Хүлээгдэж байна", icon: <Clock className="w-5 h-5" />, color: "text-yellow-600" },
  "payment-checking": { label: "Төлбөр шалгаж байна", icon: <RefreshCw className="w-5 h-5 animate-spin" />, color: "text-blue-600" },
  paid: { label: "Төлбөр баталгаажсан", icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600" },
  processing: { label: "Бэлдэж байна", icon: <Package className="w-5 h-5" />, color: "text-purple-600" },
  shipped: { label: "Илгээгдсэн", icon: <Truck className="w-5 h-5" />, color: "text-blue-600" },
  delivered: { label: "Хүргэгдсэн", icon: <CheckCircle className="w-5 h-5" />, color: "text-green-700" },
  cancelled: { label: "Цуцлагдсан", icon: <XCircle className="w-5 h-5" />, color: "text-red-600" },
};

export default function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkingQpay, setCheckingQpay] = useState(false);
  const [switchingPayment, setSwitchingPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [countdownActive, setCountdownActive] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [orderId, setOrderId] = useState<string>("");
  const [bankInfo, setBankInfo] = useState({ bankName: "Худалдаа хөгжлийн банк", iban: "370004000", accountNumber: "459 008 919", accountHolder: "" });

  useEffect(() => {
    params.then(({ id }) => setOrderId(id));
    getDoc(doc(db, "settings", "bank")).then((snap) => {
      if (snap.exists()) setBankInfo(snap.data() as any);
    });
  }, [params]);

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, "orders", orderId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Order;
        setOrder(data);

        if (data.status === "paid" || data.status === "cancelled") {
          setCountdownActive(false);
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_SECS);
    setCountdownActive(true);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setCountdownActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const handleCheckPayment = async () => {
    if (!order || !user || checking) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/check-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      if (!res.ok) throw new Error("Failed");
      startCountdown();
      toast("Шалгаж байна, удахгүй хариу ирнэ.");
    } catch {
      toast("Алдаа гарлаа. Дахин оролдоно уу.", "error");
    } finally {
      setChecking(false);
    }
  };

  const handleCheckQpay = async () => {
    if (!order || !user || checkingQpay) return;
    setCheckingQpay(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/check-qpay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (data.paid) {
        toast("Төлбөр баталгаажлаа!");
      } else {
        toast("Төлбөр бүртгэгдээгүй байна. Дахин оролдоно уу.", "error");
      }
    } catch {
      toast("Алдаа гарлаа. Дахин оролдоно уу.", "error");
    } finally {
      setCheckingQpay(false);
    }
  };

  const handleCancel = async () => {
    if (!order || !user || cancelling) return;
    if (!confirm("Захиалгыг цуцлах уу?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      if (!res.ok) throw new Error("Failed");
      toast("Захиалга цуцлагдлаа.");
    } catch {
      toast("Алдаа гарлаа. Дахин оролдоно уу.", "error");
    } finally {
      setCancelling(false);
    }
  };

  const handleSwitchPayment = async (newMethod: "qpay" | "bank-transfer") => {
    if (!order || !user || switchingPayment) return;
    setSwitchingPayment(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/switch-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: newMethod, userId: user.uid }),
      });
      if (!res.ok) throw new Error("Failed");
      toast("Төлбөрийн арга солигдлоо!");
    } catch {
      toast("Алдаа гарлаа. Дахин оролдоно уу.", "error");
    } finally {
      setSwitchingPayment(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast("Хуулагдлаа!");
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-40 bg-gray-200 rounded-xl" />
        <div className="h-32 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-20 text-gray-400">Захиалга олдсонгүй</div>;
  }

  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
  const isPaid = order.status === "paid" || order.status === "processing" || order.status === "shipped" || order.status === "delivered";
  const isFailed = order.payment.status === "failed" || (order.status === "cancelled");
  const canCheckPayment = (order.status === "pending" || order.status === "cancelled") && !countdownActive;
  const canSwitch = order.status === "pending" || order.status === "cancelled";

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link href="/orders" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-5 text-sm">
        <ChevronLeft className="w-4 h-4" /> Захиалгууд руу буцах
      </Link>

      {/* Order header */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
          <h1 className="font-bold text-lg text-gray-900">{order.orderNumber}</h1>
          <div className={`flex items-center gap-1.5 font-medium text-sm ${statusInfo.color} flex-shrink-0`}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString("mn-MN")}</p>
      </div>

      {/* Payment section */}
      {order.payment.method === "qpay" && !isPaid && (
        <div className="bg-white rounded-xl border p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-5 h-5 text-yellow-500" />
            <h2 className="font-bold text-gray-900">QPay төлбөр</h2>
          </div>

          {order.payment.qpayQrCode ? (
            <>
              <div className="flex justify-center mb-4">
                <img src={`data:image/png;base64,${order.payment.qpayQrCode}`} alt="QPay QR" className="w-48 h-48" />
              </div>
              {order.payment.qpayDeeplinks && order.payment.qpayDeeplinks.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {order.payment.qpayDeeplinks.slice(0, 6).map((dl) => (
                    <a key={dl.name} href={dl.link} className="flex flex-col items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      {dl.logo && <img src={dl.logo} alt={dl.name} className="w-8 h-8 rounded mb-1" onError={(e) => (e.currentTarget.style.display = "none")} />}
                      <span className="text-xs text-gray-600 text-center line-clamp-1">{dl.name}</span>
                    </a>
                  ))}
                </div>
              )}
              <p className="text-center text-sm text-gray-500 mt-4">
                Нийт: <strong>{formatPrice(order.total)}</strong>
              </p>
              <p className="text-center text-xs text-gray-400 mt-1">QPay-д төлсний дараа автоматаар баталгаажна</p>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">QR код ачааллаж байна...</div>
          )}

          {canSwitch && (
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={handleCheckQpay}
                disabled={checkingQpay}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-200 text-gray-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {checkingQpay ? <><RefreshCw className="w-4 h-4 animate-spin" /> Шалгаж байна...</> : "Төлбөр шалгах"}
              </button>
              <button
                onClick={() => handleSwitchPayment("bank-transfer")}
                disabled={switchingPayment}
                className="w-full border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
                {switchingPayment ? "Солж байна..." : "Дансаар төлөх"}
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full border border-red-200 hover:border-red-300 text-red-400 hover:text-red-600 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                {cancelling ? "Цуцалж байна..." : "Захиалга цуцлах"}
              </button>
            </div>
          )}
        </div>
      )}

      {order.payment.method === "bank-transfer" && !isPaid && (
        <div className="bg-white rounded-xl border p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-yellow-500" />
            <h2 className="font-bold text-gray-900">Дансны гүйлгээ</h2>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
            {[
              { label: "Банк", value: bankInfo.bankName, copy: bankInfo.bankName },
              { label: "IBAN", value: bankInfo.iban, copy: bankInfo.iban },
              { label: "Данс", value: bankInfo.accountNumber, copy: bankInfo.accountNumber },
              { label: "Дүн", value: formatPrice(order.total), copy: String(order.total), bold: true },
              { label: "Гүйлгээний утга", value: order.orderNumber, copy: order.orderNumber, bold: true },
            ].map(({ label, value, copy, bold }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-blue-600 flex-shrink-0">{label}</span>
                <div className="flex items-center gap-1 min-w-0">
                  <span className={`text-right break-all ${bold ? "font-bold text-blue-900" : "font-medium text-blue-900"}`}>{value}</span>
                  <button onClick={() => copyToClipboard(copy)} className="text-blue-400 hover:text-blue-600 flex-shrink-0">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Countdown */}
          {countdownActive && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-sm text-yellow-700 mb-1">Админ шалгаж байна...</p>
              <div className="text-3xl font-bold text-yellow-600 font-mono">
                {formatCountdown(countdown)}
              </div>
              <p className="text-xs text-yellow-500 mt-1">Хугацаа дуусахаас өмнө хариу ирнэ</p>
            </div>
          )}

          {/* Payment result */}
          {isPaid && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="font-bold text-green-700">Төлбөр амжилттай баталгаажлаа!</p>
            </div>
          )}

          {isFailed && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
              <p className="font-bold text-red-600">Төлбөр баталгаажаагүй байна</p>
              <p className="text-sm text-red-500 mt-1">Дахин гүйлгээ хийгээд шалгах товч дарна уу</p>
            </div>
          )}

          {canCheckPayment && (
            <button
              onClick={handleCheckPayment}
              disabled={checking}
              className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-200 text-gray-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {checking ? <><RefreshCw className="w-4 h-4 animate-spin" /> Шалгаж байна...</> : "Төлбөр шалгах"}
            </button>
          )}

          {canSwitch && (
            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={() => handleSwitchPayment("qpay")}
                disabled={switchingPayment}
                className="w-full border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
                {switchingPayment ? "Солж байна..." : "QPay-ээр төлөх"}
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full border border-red-200 hover:border-red-300 text-red-400 hover:text-red-600 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                {cancelling ? "Цуцалж байна..." : "Захиалга цуцлах"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success */}
      {isPaid && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-4 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <h2 className="font-bold text-green-700 text-lg">Захиалга амжилттай!</h2>
          <p className="text-green-600 text-sm mt-1">Таны захиалга хүлээн авагдлаа. Удахгүй хүргэнэ.</p>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h2 className="font-bold text-gray-900 mb-3">Захиалсан бараа</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {item.productImage && <Image src={item.productImage} alt={item.productName} fill className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.productName}</p>
                {Object.entries(item.selectedVariants).length > 0 && (
                  <p className="text-xs text-gray-400">{Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(", ")}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold">{formatPrice(item.finalPrice)}</p>
                <p className="text-xs text-gray-400">×{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Барааны дүн</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Хямдрал</span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-500">
            <span>Хүргэлт ({order.delivery.name})</span>
            <span>{formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2">
            <span>Нийт</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery info */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-bold text-gray-900 mb-3">Хүргэлтийн мэдээлэл</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p>{order.address.city}, {order.address.district}</p>
          <p>{order.address.khoroo} хороо, {order.address.building} {order.address.apartment}</p>
          <p>📞 {order.address.phone}{order.address.extraPhone && `, ${order.address.extraPhone}`}</p>
          {order.address.details && <p className="text-gray-400">{order.address.details}</p>}
        </div>
      </div>
    </div>
  );
}
