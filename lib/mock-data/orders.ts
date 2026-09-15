export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  sellerName: string;
  shopName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  date: string;
};

export const orders: Order[] = [
  { id: "ORD-4201", customerId: "cus-101", customerName: "Layla Ahmed", sellerId: "sel-101", sellerName: "Aisha Khan", shopName: "Veloura Home", items: [{ productId: "p-101", name: "Aster Ceramic Lamp", quantity: 1, price: 94 }, { productId: "p-102", name: "Mira Throw Pillow Set", quantity: 2, price: 42 }], total: 178, status: "Delivered", date: "2025-09-04" },
  { id: "ORD-4202", customerId: "cus-104", customerName: "Noah Smith", sellerId: "sel-102", sellerName: "Rami Haddad", shopName: "Luma Elec", items: [{ productId: "p-103", name: "Echo Smart Speaker", quantity: 1, price: 118 }], total: 118, status: "Shipped", date: "2025-09-07" },
  { id: "ORD-4203", customerId: "cus-107", customerName: "Sara Ali", sellerId: "sel-105", sellerName: "Leo Martin", shopName: "Stride Gear", items: [{ productId: "p-115", name: "Motive Yoga Mat", quantity: 2, price: 61 }], total: 122, status: "Processing", date: "2025-09-12" },
  { id: "ORD-4204", customerId: "cus-109", customerName: "Ethan Cole", sellerId: "sel-104", sellerName: "Mina Hassan", shopName: "Petalora", items: [{ productId: "p-105", name: "Dahlia Perfume Set", quantity: 1, price: 68 }, { productId: "p-120", name: "Verdant Sheet Set", quantity: 1, price: 79 }], total: 147, status: "Pending", date: "2025-09-13" },
  { id: "ORD-4205", customerId: "cus-112", customerName: "Amelia Clark", sellerId: "sel-112", sellerName: "Tania Ortiz", shopName: "Meridian Wear", items: [{ productId: "p-109", name: "Sable Leather Tote", quantity: 1, price: 124 }, { productId: "p-119", name: "Marina Silk Scarf", quantity: 1, price: 48 }], total: 172, status: "Delivered", date: "2025-09-09" },
  { id: "ORD-4206", customerId: "cus-102", customerName: "Imran Khan", sellerId: "sel-107", sellerName: "Omar Farouk", shopName: "North Peak", items: [{ productId: "p-111", name: "Solstice Backpack", quantity: 1, price: 86 }], total: 86, status: "Cancelled", date: "2025-09-05" },
  { id: "ORD-4207", customerId: "cus-118", customerName: "Maya Ross", sellerId: "sel-109", sellerName: "Daniel Brooks", shopName: "Bloomcraft", items: [{ productId: "p-113", name: "Iris Glow Candle", quantity: 3, price: 26 }], total: 78, status: "Shipped", date: "2025-09-14" },
  { id: "ORD-4208", customerId: "cus-106", customerName: "Nora Bell", sellerId: "sel-101", sellerName: "Aisha Khan", shopName: "Veloura Home", items: [{ productId: "p-116", name: "Velvet Lounge Chair", quantity: 1, price: 430 }], total: 430, status: "Processing", date: "2025-09-11" },
  { id: "ORD-4209", customerId: "cus-103", customerName: "Omar Rahman", sellerId: "sel-111", sellerName: "Khalid Rahman", shopName: "Vivid Lab", items: [{ productId: "p-117", name: "Mosaic Phone Stand", quantity: 2, price: 21 }], total: 42, status: "Delivered", date: "2025-08-31" },
  { id: "ORD-4210", customerId: "cus-110", customerName: "Zayn Malik", sellerId: "sel-102", sellerName: "Rami Haddad", shopName: "Luma Elec", items: [{ productId: "p-104", name: "Nova Wireless Earbuds", quantity: 1, price: 149 }], total: 149, status: "Pending", date: "2025-09-15" },
  { id: "ORD-4211", customerId: "cus-115", customerName: "Hassan Ali", sellerId: "sel-109", sellerName: "Daniel Brooks", shopName: "Bloomcraft", items: [{ productId: "p-114", name: "Pine Travel Set", quantity: 1, price: 74 }], total: 74, status: "Delivered", date: "2025-09-03" },
  { id: "ORD-4212", customerId: "cus-111", customerName: "Lina Moreno", sellerId: "sel-105", sellerName: "Leo Martin", shopName: "Stride Gear", items: [{ productId: "p-108", name: "Summit Trail Bottle", quantity: 1, price: 29 }, { productId: "p-115", name: "Motive Yoga Mat", quantity: 1, price: 61 }], total: 90, status: "Pending", date: "2025-09-15" },
  { id: "ORD-4213", customerId: "cus-101", customerName: "Layla Ahmed", sellerId: "sel-104", sellerName: "Mina Hassan", shopName: "Petalora", items: [{ productId: "p-106", name: "Satin Skin Serum", quantity: 1, price: 55 }], total: 55, status: "Cancelled", date: "2025-08-29" },
  { id: "ORD-4214", customerId: "cus-117", customerName: "Ari Lewis", sellerId: "sel-112", sellerName: "Tania Ortiz", shopName: "Meridian Wear", items: [{ productId: "p-119", name: "Marina Silk Scarf", quantity: 2, price: 48 }], total: 96, status: "Processing", date: "2025-09-10" },
  { id: "ORD-4215", customerId: "cus-108", customerName: "Priya Verma", sellerId: "sel-107", sellerName: "Omar Farouk", shopName: "North Peak", items: [{ productId: "p-111", name: "Solstice Backpack", quantity: 1, price: 86 }, { productId: "p-111", name: "Solstice Backpack", quantity: 1, price: 86 }], total: 172, status: "Delivered", date: "2025-09-01" },
  { id: "ORD-4216", customerId: "cus-119", customerName: "Liam Young", sellerId: "sel-111", sellerName: "Khalid Rahman", shopName: "Vivid Lab", items: [{ productId: "p-117", name: "Mosaic Phone Stand", quantity: 3, price: 21 }], total: 63, status: "Shipped", date: "2025-09-15" },
  { id: "ORD-4217", customerId: "cus-114", customerName: "Adda Brown", sellerId: "sel-101", sellerName: "Aisha Khan", shopName: "Veloura Home", items: [{ productId: "p-101", name: "Aster Ceramic Lamp", quantity: 1, price: 94 }, { productId: "p-116", name: "Velvet Lounge Chair", quantity: 1, price: 430 }], total: 524, status: "Processing", date: "2025-09-12" },
  { id: "ORD-4218", customerId: "cus-105", customerName: "Sara Noor", sellerId: "sel-104", sellerName: "Mina Hassan", shopName: "Petalora", items: [{ productId: "p-105", name: "Dahlia Perfume Set", quantity: 1, price: 68 }], total: 68, status: "Delivered", date: "2025-08-27" },
  { id: "ORD-4219", customerId: "cus-120", customerName: "David Hall", sellerId: "sel-112", sellerName: "Tania Ortiz", shopName: "Meridian Wear", items: [{ productId: "p-109", name: "Sable Leather Tote", quantity: 1, price: 124 }], total: 124, status: "Pending", date: "2025-09-14" },
  { id: "ORD-4220", customerId: "cus-116", customerName: "Diana Hall", sellerId: "sel-105", sellerName: "Leo Martin", shopName: "Stride Gear", items: [{ productId: "p-108", name: "Summit Trail Bottle", quantity: 2, price: 29 }], total: 58, status: "Delivered", date: "2025-09-02" },
];
