"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Package, ChevronRight, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Хүлээгдэж байна", color: "text-yellow-600 bg-yellow-50" },
  "payment-checking": { label: "Төлбөр шалгаж байна", color: "text-blue-600 bg-blue-50" },
  paid: { label: "Төлбөр хийгдсэн", color: "text-green-600 bg-green-50" },
  processing: { label: "Бэлдэж байна", color: "text-purple-600 bg-purple-50" },
  shipped: { label: "Илгээгдсэн", color: "text-blue-600 bg-blue-50" },
  delivered: { label: "Хүргэгдсэн", color: "text-green-700 bg-green-100" },
  cancelled: { label: "Цуцлагдсан", color: "text-red-600 bg-red-50" },
};

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push("/"); return; }
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid)
    );
    getDocs(q).then((snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Order))
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      setOrders(data);
      setFetching(false);
    });
  }, [user, loading, router]);

  if (loading || fetching) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border p-5 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Package className="w-20 h-20 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Захиалга байхгүй байна</h2>
        <Link href="/" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl inline-block transition-colors mt-4">
          Дэлгүүрлэх
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Миний захиалгууд</h1>

      <div className="space-y-3">
        {orders.map((order) => {
          const status = STATUS_LABELS[order.status] || { label: order.status, color: "text-gray-600 bg-gray-50" };
          return (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString("mn-MN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${status.color}`}>
                      {status.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-2">
                  {order.items.length} бараа · {order.delivery.name}
                </p>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {order.payment.method === "qpay" ? "QPay" : "Дансны гүйлгээ"}
                  </p>
                  <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
