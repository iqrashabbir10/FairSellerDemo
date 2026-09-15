export type ProductStatus = "active" | "inactive";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sellerId: string;
  sellerName: string;
  shopName: string;
  status: ProductStatus;
  image: string;
  approved: boolean;
};

export const products: Product[] = [
  { id: "p-101", name: "Aster Ceramic Lamp", category: "Home & Living", price: 94, stock: 26, sellerId: "sel-101", sellerName: "Aisha Khan", shopName: "Veloura Home", status: "active", image: "/product-lamp.jpg", approved: true },
  { id: "p-102", name: "Mira Throw Pillow Set", category: "Home & Living", price: 42, stock: 82, sellerId: "sel-101", sellerName: "Aisha Khan", shopName: "Veloura Home", status: "active", image: "/product-pillow.jpg", approved: true },
  { id: "p-103", name: "Echo Smart Speaker", category: "Electronics", price: 118, stock: 64, sellerId: "sel-102", sellerName: "Rami Haddad", shopName: "Luma Elec", status: "active", image: "/product-speaker.jpg", approved: true },
  { id: "p-104", name: "Nova Wireless Earbuds", category: "Electronics", price: 149, stock: 53, sellerId: "sel-102", sellerName: "Rami Haddad", shopName: "Luma Elec", status: "active", image: "/product-earbuds.jpg", approved: true },
  { id: "p-105", name: "Dahlia Perfume Set", category: "Beauty", price: 68, stock: 37, sellerId: "sel-104", sellerName: "Mina Hassan", shopName: "Petalora", status: "active", image: "/product-perfume.jpg", approved: true },
  { id: "p-106", name: "Satin Skin Serum", category: "Beauty", price: 55, stock: 58, sellerId: "sel-104", sellerName: "Mina Hassan", shopName: "Petalora", status: "active", image: "/product-serum.jpg", approved: true },
  { id: "p-107", name: "CoreFlex Resistance Band", category: "Fitness", price: 39, stock: 75, sellerId: "sel-108", sellerName: "Sara Ibrahim", shopName: "Kinetik Store", status: "inactive", image: "/product-band.jpg", approved: false },
  { id: "p-108", name: "Summit Trail Bottle", category: "Sports", price: 29, stock: 94, sellerId: "sel-105", sellerName: "Leo Martin", shopName: "Stride Gear", status: "active", image: "/product-bottle.jpg", approved: true },
  { id: "p-109", name: "Sable Leather Tote", category: "Fashion", price: 124, stock: 23, sellerId: "sel-112", sellerName: "Tania Ortiz", shopName: "Meridian Wear", status: "active", image: "/product-tote.jpg", approved: true },
  { id: "p-110", name: "Luno Gold Ring", category: "Jewelry", price: 210, stock: 18, sellerId: "sel-103", sellerName: "Junaid Patel", shopName: "Oak Jewels", status: "inactive", image: "/product-ring.jpg", approved: false },
  { id: "p-111", name: "Solstice Backpack", category: "Outdoor", price: 86, stock: 46, sellerId: "sel-107", sellerName: "Omar Farouk", shopName: "North Peak", status: "active", image: "/product-backpack.jpg", approved: true },
  { id: "p-112", name: "Harbor Desk Mat", category: "Office", price: 32, stock: 102, sellerId: "sel-111", sellerName: "Khalid Rahman", shopName: "Vivid Lab", status: "active", image: "/product-deskmat.jpg", approved: true },
  { id: "p-113", name: "Iris Glow Candle", category: "Home & Living", price: 26, stock: 117, sellerId: "sel-109", sellerName: "Daniel Brooks", shopName: "Bloomcraft", status: "active", image: "/product-candle.jpg", approved: true },
  { id: "p-114", name: "Pine Travel Set", category: "Travel", price: 74, stock: 28, sellerId: "sel-109", sellerName: "Daniel Brooks", shopName: "Bloomcraft", status: "active", image: "/product-travel.jpg", approved: true },
  { id: "p-115", name: "Motive Yoga Mat", category: "Fitness", price: 61, stock: 67, sellerId: "sel-105", sellerName: "Leo Martin", shopName: "Stride Gear", status: "active", image: "/product-yoga.jpg", approved: true },
  { id: "p-116", name: "Velvet Lounge Chair", category: "Home & Living", price: 430, stock: 12, sellerId: "sel-101", sellerName: "Aisha Khan", shopName: "Veloura Home", status: "active", image: "/product-chair.jpg", approved: true },
  { id: "p-117", name: "Mosaic Phone Stand", category: "Tech Accessories", price: 21, stock: 145, sellerId: "sel-111", sellerName: "Khalid Rahman", shopName: "Vivid Lab", status: "active", image: "/product-stand.jpg", approved: true },
  { id: "p-118", name: "Luma Desk Lamp", category: "Home & Living", price: 88, stock: 34, sellerId: "sel-102", sellerName: "Rami Haddad", shopName: "Luma Elec", status: "active", image: "/product-lamp-2.jpg", approved: true },
  { id: "p-119", name: "Marina Silk Scarf", category: "Fashion", price: 48, stock: 57, sellerId: "sel-112", sellerName: "Tania Ortiz", shopName: "Meridian Wear", status: "active", image: "/product-scarf.jpg", approved: true },
  { id: "p-120", name: "Verdant Sheet Set", category: "Home & Living", price: 79, stock: 66, sellerId: "sel-104", sellerName: "Mina Hassan", shopName: "Petalora", status: "active", image: "/product-sheet.jpg", approved: true },
];

export const approvedProducts = products.filter((product) => product.approved);
