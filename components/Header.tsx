"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, Search, User, LogOut, Package, ChevronDown, Flame } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Category } from "@/types";

export default function Header() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { totalCount } = useCart();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getDocs(collection(db, "categories")).then((snap) => {
      setCategories(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Category))
          .filter((c) => c.isActive)
          .sort((a, b) => a.order - b.order)
      );
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="bg-gray-900 sticky top-0 z-50 shadow-lg">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-[90px] flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image src="/logo.png" alt="HiCar" height={81} width={270} style={{ height: 81, width: "auto" }} />
        </Link>

        {/* Search — centered */}
        <form onSubmit={handleSearch} className="flex-1 flex min-w-0 max-w-xs mx-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Бараа хайх..."
            className="flex-1 min-w-0 px-3 py-2 rounded-l-lg bg-gray-800 text-white placeholder-gray-400 text-sm outline-none border border-gray-600 border-r-0 focus:border-yellow-400 transition-colors"
          />
          <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 px-3 sm:px-4 py-2 rounded-r-lg transition-colors flex-shrink-0">
            <Search className="w-4 h-4 text-gray-900" />
          </button>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 text-white text-sm hover:text-yellow-400 transition-colors"
              >
                {user.photoURL ? (
                  <Image src={user.photoURL} alt="" width={28} height={28} className="rounded-full ring-2 ring-gray-700" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-xs">
                    {user.displayName?.[0] || "U"}
                  </div>
                )}
                <span className="hidden sm:block max-w-[80px] truncate text-xs">
                  {user.displayName?.split(" ")[0]}
                </span>
                <ChevronDown className="w-3 h-3 hidden sm:block" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl py-2 w-48 z-50 border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">{user.displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link href="/orders" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Package className="w-4 h-4" /> Миний захиалгууд
                    </Link>
                    <button onClick={() => { signOut(); setShowUserMenu(false); }} className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full">
                      <LogOut className="w-4 h-4" /> Гарах
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={signInWithGoogle} className="text-white text-sm hover:text-yellow-400 transition-colors flex items-center gap-1">
              <User className="w-5 h-5" />
              <span className="hidden sm:block text-xs">Нэвтрэх</span>
            </button>
          )}

          <Link href="/cart" className="relative text-white hover:text-yellow-400 transition-colors">
            <ShoppingCart className="w-6 h-6" />
            {totalCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                {totalCount > 99 ? "99+" : totalCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Category nav */}
      <nav className="bg-gray-800 border-t border-gray-700 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex gap-1 py-1.5 min-w-max sm:min-w-0">
          <Link href="/" className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg whitespace-nowrap transition-colors">
            Бүх бараа
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/?category=${cat.slug}`}
              className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg whitespace-nowrap transition-colors"
            >
              {cat.name}
            </Link>
          ))}
          <Link href="/?sale=true" className="px-3 py-1.5 text-xs font-medium text-yellow-400 hover:text-yellow-300 hover:bg-gray-700 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> Хямдрал
          </Link>
        </div>
      </nav>
    </header>
  );
}
