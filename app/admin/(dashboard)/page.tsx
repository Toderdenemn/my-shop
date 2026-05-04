"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ShoppingBag, Package, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { Order } from "@/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Хүлээгдэж байна", color: "text-yellow-600 bg-yellow-50" },
  "payment-checking": { label: "Шалгаж байна", color: "text-blue-600 bg-blue-50" },
  paid: { label: "Төлбөр хийгдсэн", color: "text-green-600 bg-green-50" },
  processing: { label: "Бэлдэж байна", color: "text-purple-600 bg-purple-50" },
  shipped: { label: "Илгээгдсэн", color: "text-blue-600 bg-blue-50" },
  delivered: { label: "Хүргэгдсэн", color: "text-green-700 bg-green-100" },
  cancelled: { label: "Цуцлагдсан", color: "text-red-600 bg-red-50" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0, pendingOrders: 0, totalRevenue: 0, totalProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats({
          totalOrders: data.totalOrders,
          pendingOrders: data.pendingOrders,
          totalRevenue: data.totalRevenue,
          totalProducts: data.totalProducts,
        });
        setRecentOrders(data.recentOrders || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Хянах самбар</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Нийт захиалга", value: stats.totalOrders, icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
          { label: "Шалгах захиалга", value: stats.pendingOrders, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
          { label: "Нийт орлого", value: formatPrice(stats.totalRevenue), icon: TrendingUp, color: "text-green-600 bg-green-50" },
          { label: "Нийт бараа", value: stats.totalProducts, icon: Package, color: "text-purple-600 bg-purple-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 border">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">Сүүлийн захиалгууд</h2>
          <Link href="/admin/orders" className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
            Бүгдийг харах <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y">
          {recentOrders.map((order) => {
            const status = STATUS_LABELS[order.status] || { label: order.status, color: "text-gray-600 bg-gray-50" };
            return (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{order.userName} · {new Date(order.createdAt).toLocaleDateString("mn-MN")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
                  <span className="font-bold text-gray-900">{formatPrice(order.total)}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            );
          })}
          {recentOrders.length === 0 && (
            <p className="text-center py-8 text-gray-400">Захиалга байхгүй байна</p>
          )}
        </div>
      </div>
    </div>
  );
}
