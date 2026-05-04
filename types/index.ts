export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  order: number;
  isActive: boolean;
}

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  images: string[];
  basePrice: number;
  discountPercent: number;
  stock: number;
  variants: ProductVariant[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  selectedVariants: Record<string, string>;
  basePrice: number;
  discountPercent: number;
}

export interface Address {
  city: string;
  district: string;
  khoroo: string;
  building: string;
  apartment: string;
  phone: string;
  extraPhone: string;
  details: string;
}

export interface DeliveryOption {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  selectedVariants: Record<string, string>;
  basePrice: number;
  discountPercent: number;
  finalPrice: number;
}

export type PaymentMethod = "qpay" | "bank-transfer";
export type PaymentStatus = "pending" | "checking" | "paid" | "failed";
export type OrderStatus =
  | "pending"
  | "payment-checking"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  address: Address;
  delivery: {
    method: string;
    name: string;
    price: number;
  };
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    qpayInvoiceId?: string;
    qpayQrCode?: string;
    qpayDeeplinks?: QPayDeeplink[];
    checkedAt?: string;
    confirmedAt?: string;
  };
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QPayDeeplink {
  name: string;
  logo: string;
  description: string;
  scheme: string;
  link: string;
}

export interface SiteSettings {
  delivery: {
    options: DeliveryOption[];
  };
  bank: {
    bankName: string;
    iban: string;
    accountNumber: string;
    accountHolder: string;
  };
}
