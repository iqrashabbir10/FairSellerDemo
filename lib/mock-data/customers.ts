export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  joinedAt: string;
  status: "active" | "blocked";
};

export const customers: Customer[] = [
  { id: "cus-101", name: "Layla Ahmed", email: "layla.a@example.com", phone: "+971 50 242 4477", ordersCount: 6, totalSpent: 540, joinedAt: "2024-02-15", status: "active" },
  { id: "cus-102", name: "Imran Khan", email: "imran.k@example.com", phone: "+92 300 211 6789", ordersCount: 4, totalSpent: 346, joinedAt: "2024-05-17", status: "active" },
  { id: "cus-103", name: "Omar Rahman", email: "omar.r@example.com", phone: "+966 55 338 4024", ordersCount: 7, totalSpent: 976, joinedAt: "2023-11-02", status: "active" },
  { id: "cus-104", name: "Noah Smith", email: "noah.s@example.com", phone: "+1 415 449 9899", ordersCount: 3, totalSpent: 286, joinedAt: "2024-09-08", status: "active" },
  { id: "cus-105", name: "Sara Noor", email: "sara.n@example.com", phone: "+971 50 710 2834", ordersCount: 5, totalSpent: 420, joinedAt: "2024-07-09", status: "active" },
  { id: "cus-106", name: "Nora Bell", email: "nora.b@example.com", phone: "+44 7700 654321", ordersCount: 8, totalSpent: 1240, joinedAt: "2023-10-29", status: "active" },
  { id: "cus-107", name: "Sara Ali", email: "sara.ali@example.com", phone: "+966 56 823 2177", ordersCount: 2, totalSpent: 170, joinedAt: "2025-01-11", status: "active" },
  { id: "cus-108", name: "Priya Verma", email: "priya.v@example.com", phone: "+91 98765 20044", ordersCount: 9, totalSpent: 1615, joinedAt: "2023-09-26", status: "active" },
  { id: "cus-109", name: "Ethan Cole", email: "ethan.c@example.com", phone: "+1 415 880 1987", ordersCount: 5, totalSpent: 645, joinedAt: "2024-03-04", status: "active" },
  { id: "cus-110", name: "Zayn Malik", email: "zayn.m@example.com", phone: "+971 56 110 5900", ordersCount: 3, totalSpent: 287, joinedAt: "2024-11-13", status: "active" },
  { id: "cus-111", name: "Lina Moreno", email: "lina.m@example.com", phone: "+34 611 479 310", ordersCount: 6, totalSpent: 710, joinedAt: "2024-04-02", status: "active" },
  { id: "cus-112", name: "Amelia Clark", email: "amelia.c@example.com", phone: "+1 646 391 9552", ordersCount: 4, totalSpent: 592, joinedAt: "2023-12-20", status: "active" },
  { id: "cus-113", name: "Samir Tarek", email: "samir.t@example.com", phone: "+966 50 531 7788", ordersCount: 2, totalSpent: 213, joinedAt: "2024-08-14", status: "blocked" },
  { id: "cus-114", name: "Adda Brown", email: "adda.b@example.com", phone: "+44 7900 111222", ordersCount: 5, totalSpent: 689, joinedAt: "2024-06-21", status: "active" },
  { id: "cus-115", name: "Hassan Ali", email: "hassan.a@example.com", phone: "+966 55 902 4949", ordersCount: 3, totalSpent: 297, joinedAt: "2025-02-18", status: "active" },
  { id: "cus-116", name: "Diana Hall", email: "diana.h@example.com", phone: "+1 305 760 1198", ordersCount: 2, totalSpent: 140, joinedAt: "2024-09-30", status: "active" },
  { id: "cus-117", name: "Ari Lewis", email: "ari.l@example.com", phone: "+1 202 858 7735", ordersCount: 7, totalSpent: 928, joinedAt: "2024-01-08", status: "active" },
  { id: "cus-118", name: "Maya Ross", email: "maya.r@example.com", phone: "+44 7580 234456", ordersCount: 4, totalSpent: 480, joinedAt: "2023-11-19", status: "active" },
  { id: "cus-119", name: "Liam Young", email: "liam.y@example.com", phone: "+1 602 441 3344", ordersCount: 6, totalSpent: 877, joinedAt: "2024-05-10", status: "active" },
  { id: "cus-120", name: "David Hall", email: "david.h@example.com", phone: "+1 212 439 5110", ordersCount: 3, totalSpent: 302, joinedAt: "2025-03-21", status: "blocked" },
];
