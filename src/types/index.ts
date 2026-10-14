export interface ProductWithCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAt: number | null;
  images: string[];
  sku: string | null;
  stock: number;
  isActive: boolean;
  featured: boolean;
  isDigital: boolean;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variants?: {
    id: string;
    name: string;
    price: number;
    stock: number;
  }[];
}

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string | null;
  paidAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string | null;
  }[];
}

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  quantity: number;
  variantId?: string;
  variantName?: string;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}
