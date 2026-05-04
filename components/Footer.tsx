import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin, ShoppingBag } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        <div>
          <div className="mb-3">
            <Image src="/logo.png" alt="HiCar" width={110} height={34} style={{ height: 34, width: "auto" }} />
          </div>
          <p className="text-sm leading-relaxed">
            Монголын шилдэг автомашины стикер болон чимэглэлийн дэлгүүр.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Холбоосууд</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/" className="hover:text-yellow-400 transition-colors flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5" /> Бараа үзэх
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-yellow-400 transition-colors flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5" /> Сагс
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-yellow-400 transition-colors flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5" /> Миний захиалгууд
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Холбоо барих</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span>88084115</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Монгол Улс, Улаанбаатар</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} AutoSticker. Бүх эрх хуулиар хамгаалагдсан.
      </div>
    </footer>
  );
}
