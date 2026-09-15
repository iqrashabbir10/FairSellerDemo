export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
};

export const recentActivity: ActivityItem[] = [
  { id: "act-101", title: "New seller registration", detail: "Veloura Home submitted business verification", time: "12 mins ago" },
  { id: "act-102", title: "Withdrawal request", detail: "North Peak requested a payout of $2,300", time: "41 mins ago" },
  { id: "act-103", title: "New order received", detail: "Order ORD-4212 was placed via Stride Gear", time: "1 hour ago" },
  { id: "act-104", title: "Seller approved", detail: "Bloomcraft was approved for marketplace access", time: "Today" },
];
