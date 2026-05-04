import { CartItem } from "@/types";

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("mn-MN").format(amount) + "₮";
}

export function calcDiscountedPrice(basePrice: number, discountPercent: number): number {
  if (!discountPercent) return basePrice;
  return Math.round(basePrice * (1 - discountPercent / 100));
}

export function calcCartTotals(items: CartItem[]) {
  let subtotal = 0;
  let discountAmount = 0;

  for (const item of items) {
    const base = item.basePrice * item.quantity;
    const discounted = calcDiscountedPrice(item.basePrice, item.discountPercent) * item.quantity;
    subtotal += base;
    discountAmount += base - discounted;
  }

  return { subtotal, discountAmount, finalBeforeDelivery: subtotal - discountAmount };
}

export function generateOrderNumber(): string {
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `APR30-${rand}`;
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
