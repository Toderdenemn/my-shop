"use client";

import { useEffect, useState } from "react";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Төлбөр хүлээгдэж байна", color: "text-yellow-700 bg-yellow-100" },
  "payment-checking": { label: "Төлбөрийг шалгаж байна", color: "text-blue-700 bg-blue-100" },
  paid: { label: "Төлбөр хийгдсэн", color: "text-green-700 bg-green-100" },
  processing: { label: "Бэлдэж байна", color: "text-purple-700 bg-purple-100" },
  shipped: { label: "Илгээгдсэн", color: "text-blue-700 bg-blue-100" },
  delivered: { label: "Хүргэгдсэн", color: "text-green-800 bg-green-200" },
  cancelled: { label: "Цуцлагдсан", color: "text-red-700 bg-red-100" },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.userName.toLowerCase().includes(search.toLowerCase()) ||
      o.userEmail.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = orders.filter((o) => o.status === "payment-checking").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Захиалгууд</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-600 font-medium mt-0.5">
              ⚠️ {pendingCount} захиалга шалгалт хүлээж байна
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Захиалгын дугаар, нэр хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-yellow-400"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
        >
          <option value="all">Бүх статус</option>
          {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-center py-10 text-gray-400">Захиалга олдсонгүй</p>
          ) : (
            <div className="divide-y">
              {filtered.map((order) => {
                const status = STATUS_LABELS[order.status] || { label: order.status, color: "text-gray-600 bg-gray-100" };
                const isUrgent = order.status === "payment-checking";
                return (
                  <Link key={order.id} href={`/admin/orders/${order.id}`} className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${isUrgent ? "border-l-4 border-yellow-400" : ""}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{order.orderNumber}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {order.userName} · {order.payment.method === "qpay" ? "QPay" : "Дансны гүйлгээ"} · {new Date(order.createdAt).toLocaleDateString("mn-MN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">{formatPrice(order.total)}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
