"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { CartItem } from "@/types";
import { calcDiscountedPrice } from "@/lib/utils";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, selectedVariants: Record<string, string>) => void;
  updateQuantity: (productId: string, selectedVariants: Record<string, string>, qty: number) => void;
  toggleSelect: (productId: string, selectedVariants: Record<string, string>) => void;
  selectAll: (selected: boolean) => void;
  selectedItems: CartItem[];
  clearCart: () => void;
  clearSelected: () => void;
  totalCount: number;
}

interface CartItemWithSelected extends CartItem {
  selected: boolean;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  toggleSelect: () => {},
  selectAll: () => {},
  selectedItems: [],
  clearCart: () => {},
  clearSelected: () => {},
  totalCount: 0,
});

function itemKey(productId: string, selectedVariants: Record<string, string>): string {
  return productId + JSON.stringify(Object.entries(selectedVariants).sort());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemWithSelected[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cart");
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const key = itemKey(newItem.productId, newItem.selectedVariants);
      const existing = prev.find(
        (i) => itemKey(i.productId, i.selectedVariants) === key
      );
      if (existing) {
        return prev.map((i) =>
          itemKey(i.productId, i.selectedVariants) === key
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, { ...newItem, selected: true }];
    });
  };

  const removeItem = (productId: string, selectedVariants: Record<string, string>) => {
    const key = itemKey(productId, selectedVariants);
    setItems((prev) => prev.filter((i) => itemKey(i.productId, i.selectedVariants) !== key));
  };

  const updateQuantity = (
    productId: string,
    selectedVariants: Record<string, string>,
    qty: number
  ) => {
    const key = itemKey(productId, selectedVariants);
    setItems((prev) =>
      prev.map((i) =>
        itemKey(i.productId, i.selectedVariants) === key ? { ...i, quantity: qty } : i
      )
    );
  };

  const toggleSelect = (productId: string, selectedVariants: Record<string, string>) => {
    const key = itemKey(productId, selectedVariants);
    setItems((prev) =>
      prev.map((i) =>
        itemKey(i.productId, i.selectedVariants) === key ? { ...i, selected: !i.selected } : i
      )
    );
  };

  const selectAll = (selected: boolean) => {
    setItems((prev) => prev.map((i) => ({ ...i, selected })));
  };

  const clearCart = () => setItems([]);

  const clearSelected = () =>
    setItems((prev) => prev.filter((i) => !i.selected));

  const selectedItems = items.filter((i) => i.selected);
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        toggleSelect,
        selectAll,
        selectedItems,
        clearCart,
        clearSelected,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
