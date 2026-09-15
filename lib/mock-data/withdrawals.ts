export type WithdrawalStatus = "Pending" | "Approved" | "Rejected" | "Paid";

export type WithdrawalRequest = {
  id: string;
  seller: string;
  shopName: string;
  amount: number;
  account: string;
  requestedAt: string;
  status: WithdrawalStatus;
};

export const withdrawals: WithdrawalRequest[] = [
  { id: "wd-101", seller: "Aisha Khan", shopName: "Veloura Home", amount: 2550, account: "UAE - Emirates NBD • 100234567890", requestedAt: "2025-09-08", status: "Pending" },
  { id: "wd-102", seller: "Rami Haddad", shopName: "Luma Elec", amount: 4180, account: "KSA - Al Rajhi • 895421100223", requestedAt: "2025-09-10", status: "Approved" },
  { id: "wd-103", seller: "Mina Hassan", shopName: "Petalora", amount: 1880, account: "UAE - ADCB • 9912344550", requestedAt: "2025-09-05", status: "Paid" },
  { id: "wd-104", seller: "Leo Martin", shopName: "Stride Gear", amount: 2960, account: "US - Chase • 22201987654", requestedAt: "2025-09-03", status: "Pending" },
  { id: "wd-105", seller: "Tania Ortiz", shopName: "Meridian Wear", amount: 4125, account: "ES - BBVA • 6789401123", requestedAt: "2025-09-12", status: "Approved" },
  { id: "wd-106", seller: "Omar Farouk", shopName: "North Peak", amount: 2300, account: "PK - Meezan • 1123098224", requestedAt: "2025-09-11", status: "Rejected" },
  { id: "wd-107", seller: "Daniel Brooks", shopName: "Bloomcraft", amount: 3540, account: "US - Bank of America • 4402139812", requestedAt: "2025-09-09", status: "Paid" },
  { id: "wd-108", seller: "Khalid Rahman", shopName: "Vivid Lab", amount: 1770, account: "OM - MCB • 3319987261", requestedAt: "2025-09-07", status: "Pending" },
  { id: "wd-109", seller: "Junaid Patel", shopName: "Oak Jewels", amount: 1500, account: "UK - HSBC • 53900214561", requestedAt: "2025-09-04", status: "Rejected" },
  { id: "wd-110", seller: "Huda Nasser", shopName: "Vanta Essentials", amount: 960, account: "QA - QNB • 5542009876", requestedAt: "2025-09-06", status: "Pending" },
];
