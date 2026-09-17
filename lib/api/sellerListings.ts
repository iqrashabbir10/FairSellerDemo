// Local persistence for a seller's own listings (no dedicated "list my listings" backend
// endpoint exists yet, so successful adds/updates from POST /api/seller/products are cached
// here, keyed per signed-in seller, and merged into the My Listings page).
import type { SellerProductDto } from "./types";
import { getSession } from "./session";

function storageKey() {
  const session = getSession();
  return `wayfeir-my-listings:${session?.userId ?? "anonymous"}`;
}

export function getMyListings(): SellerProductDto[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(storageKey());
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SellerProductDto[];
  } catch {
    return [];
  }
}

export function saveListing(listing: SellerProductDto) {
  const existing = getMyListings();
  const index = existing.findIndex((item) => item.productId === listing.productId);
  if (index >= 0) {
    existing[index] = listing;
  } else {
    existing.push(listing);
  }
  window.localStorage.setItem(storageKey(), JSON.stringify(existing));
}
