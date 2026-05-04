"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/Toast";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, CheckCircle, XCircle, Truck, Package, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Төлбөр хүлээгдэж байна", color: "text-yellow-700 bg-yellow-100" },
  "payment-checking": { label: "Төлбөрийг шалгаж байна", color: "text-blue-700 bg-blue-100" },
  paid: { label: "Төлбөр хийгдсэн", color: "text-green-700 bg-green-100" },
  processing: { label: "Бэлдэж байна", color: "text-purple-700 bg-purple-100" },
  shipped: { label: "Илгээгдсэн", color: "text-blue-700 bg-blue-100" },
  delivered: { label: "Хүргэгдсэн", color: "text-green-800 bg-green-200" },
  cancelled: { label: "Цуцлагдсан", color: "text-red-700 bg-red-100" },
};

export default function AdminOrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    params.then(({ id }) => {
      setOrderId(id);
      const unsub = onSnapshot(doc(db, "orders", id), (snap) => {
        if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order);
        setLoading(false);
      });
      return unsub;
    });
  }, [params]);

  const handleConfirm = async () => {
    if (!orderId || actioning) return;
    setActioning(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast("Төлбөр баталгаажууллаа!");
    } catch {
      toast("Алдаа гарлаа", "error");
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async () => {
    if (!orderId || actioning) return;
    if (!confirm("Төлбөр ороогүй гэж тэмдэглэх үү?")) return;
    setActioning(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/reject`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast("Төлбөр ороогүй гэж тэмдэглэгдлээ");
    } catch {
      toast("Алдаа гарлаа", "error");
    } finally {
      setActioning(false);
    }
  };

  const handleDelete = async () => {
    if (!orderId || deleting) return;
    if (!confirm(`"${order?.orderNumber}" захиалгыг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Захиалга устгагдлаа");
      router.push("/admin/orders");
    } catch {
      toast("Алдаа гарлаа", "error");
    } finally {
      setDeleting(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!orderId) return;
    await updateDoc(doc(db, "orders", orderId), { status, updatedAt: new Date().toISOString() });
    toast("Статус шинэчлэгдлээ!");
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-40 bg-gray-200 rounded-xl" /></div>;
  if (!order) return <div className="text-center py-20 text-gray-400">Захиалга олдсонгүй</div>;

  const status = STATUS_LABELS[order.status] || { label: order.status, color: "text-gray-600 bg-gray-100" };
  const isPaymentChecking = order.status === "payment-checking";
  const isPaid = ["paid", "processing", "shipped", "delivered"].includes(order.status);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <Link href="/admin/orders" className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm">
          <ChevronLeft className="w-4 h-4" /> Захиалгууд руу буцах
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? "Устгаж байна..." : "Устгах"}
        </button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">{order.orderNumber}</h1>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
        </div>
        <div className="text-sm text-gray-500 space-y-1">
          <p>Хэрэглэгч: <strong className="text-gray-800">{order.userName}</strong></p>
          <p>Имэйл: {order.userEmail}</p>
          <p>Огноо: {new Date(order.createdAt).toLocaleString("mn-MN")}</p>
          <p>Төлбөрийн арга: {order.payment.method === "qpay" ? "QPay" : "Дансны гүйлгээ"}</p>
        </div>
      </div>

      {/* Payment check action */}
      {isPaymentChecking && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5 mb-4">
          <p className="font-bold text-yellow-800 mb-1 text-lg">⚠️ Төлбөр шалгах шаардлагатай</p>
          <p className="text-yellow-700 text-sm mb-4">
            Захиалагч төлбөр шилжүүлсэн гэж мэдэгдлээ. Банкны данс шалгасны дараа доорх товчийг дарна уу.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleConfirm}
              disabled={actioning}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Төлбөр орсон
            </button>
            <button
              onClick={handleReject}
              disabled={actioning}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Төлбөр ороогүй
            </button>
          </div>
        </div>
      )}

      {/* Status update */}
      {isPaid && (
        <div className="bg-white rounded-xl border p-5 mb-4">
          <h2 className="font-bold text-gray-900 mb-3">Статус шинэчлэх</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "processing", label: "Бэлдэж байна", icon: Package },
              { value: "shipped", label: "Илгээгдсэн", icon: Truck },
              { value: "delivered", label: "Хүргэгдсэн", icon: CheckCircle },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => updateStatus(value)}
                disabled={order.status === value}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  order.status === value ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <h2 className="font-bold text-gray-900 mb-3">Захиалсан бараа</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {item.productImage && <Image src={item.productImage} alt="" fill className="object-cover" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                {Object.keys(item.selectedVariants).length > 0 && (
                  <p className="text-xs text-gray-400">{Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(", ")}</p>
                )}
                <p className="text-xs text-gray-500">{item.quantity} ширхэг × {formatPrice(item.finalPrice)}</p>
              </div>
              <p className="font-bold text-sm">{formatPrice(item.finalPrice * item.quantity)}</p>
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
            <span>Хүргэлт</span>
            <span>{formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t pt-2 text-base">
            <span>Нийт</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-bold text-gray-900 mb-3">Хүргэлтийн хаяг</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p>{order.address.city}, {order.address.district} дүүрэг</p>
          <p>{order.address.khoroo} хороо, {order.address.building} {order.address.apartment && `тоот ${order.address.apartment}`}</p>
          <p>📞 {order.address.phone}{order.address.extraPhone && `, ${order.address.extraPhone}`}</p>
          {order.address.details && <p className="text-gray-400">{order.address.details}</p>}
          <p className="mt-2 font-medium">Хүргэлт: {order.delivery.name} ({formatPrice(order.delivery.price)})</p>
        </div>
      </div>
    </div>
  );
}
