"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Minus, Package, Plus, Search, ShoppingCart, Store, Trash2 } from "lucide-react";
import { getAdminSellers, getSellerProducts } from "@/lib/api/admin";
import { createOrder } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import type { AdminSellerDto, SellerProductDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";
import { ProductThumbnail } from "@/app/components/ProductThumbnail";
import { Pagination } from "@/app/components/Pagination";

type CartLine = SellerProductDto & { cartQuantity: number };

const money = (value: number) => `$${value.toFixed(2)}`;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "S";

const statusStyles: Record<string, string> = {
  Approved: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Rejected: "bg-red-50 text-red-700",
  Frozen: "bg-slate-100 text-slate-600",
};

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Select seller", "Add products", "Review & order"];
  return (
    <ol className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-3 sm:p-4">
      {steps.map((label, index) => {
        const number = index + 1;
        const done = number < step;
        const active = number === step;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                done ? "bg-emerald-500 text-white" : active ? "bg-[var(--brand)] text-white shadow-sm" : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : number}
            </span>
            <span className={`text-sm font-medium ${active ? "text-slate-900" : done ? "text-slate-600" : "text-slate-400"}`}>{label}</span>
            {number < steps.length && <span className="hidden h-px w-8 bg-slate-200 sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}

export default function SellersProductsPage() {
  const ready = useAuthGuard("Admin");
  const [sellers, setSellers] = useState<AdminSellerDto[]>([]);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [sellersError, setSellersError] = useState("");
  const [sellerSearch, setSellerSearch] = useState("");
  const [selectedSellerId, setSelectedSellerId] = useState("");

  const [products, setProducts] = useState<SellerProductDto[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productsPage, setProductsPage] = useState(1);
  const [productsPageSize, setProductsPageSize] = useState(10);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderError, setOrderError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      setSellersLoading(true);
      setSellersError("");
      try {
        // Only approved (active) sellers can have orders placed for them.
        const result = await getAdminSellers({ status: "Approved", pageSize: 200 });
        setSellers(result.items);
      } catch (err) {
        setSellersError(err instanceof ApiError ? err.message : "Failed to load sellers.");
      } finally {
        setSellersLoading(false);
      }
    })();
  }, [ready]);

  useEffect(() => {
    if (!selectedSellerId) return;
    let cancelled = false;
    (async () => {
      setProductsLoading(true);
      setProductsError("");
      try {
        const first = await getSellerProducts(selectedSellerId, 1, 100);
        const items = [...first.items];
        for (let page = 2; page <= first.totalPages; page++) {
          items.push(...(await getSellerProducts(selectedSellerId, page, 100)).items);
        }
        if (!cancelled) setProducts(items);
      } catch (err) {
        if (!cancelled) setProductsError(err instanceof ApiError ? err.message : "Failed to load this seller's products.");
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSellerId]);

  const selectedSeller = sellers.find((seller) => seller.id === selectedSellerId);
  const step: 1 | 2 | 3 = !selectedSellerId ? 1 : cart.length === 0 ? 2 : 3;

  const filteredSellers = useMemo(() => {
    const term = sellerSearch.trim().toLowerCase();
    return sellers.filter((s) => !term || [s.fullName, s.shopName, s.email].some((v) => v?.toLowerCase().includes(term)));
  }, [sellers, sellerSearch]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return products.filter((p) => !term || p.productName.toLowerCase().includes(term));
  }, [products, productSearch]);

  const totalProductsPages = Math.max(1, Math.ceil(filteredProducts.length / productsPageSize));
  const currentProductsPage = Math.min(productsPage, totalProductsPages);
  const pagedProducts = filteredProducts.slice((currentProductsPage - 1) * productsPageSize, currentProductsPage * productsPageSize);

  const cartQuantityTotal = useMemo(() => cart.reduce((sum, line) => sum + line.cartQuantity, 0), [cart]);
  const cartBaseTotal = useMemo(() => cart.reduce((sum, line) => sum + line.supplierCost * line.cartQuantity, 0), [cart]);
  const cartSellerTotal = useMemo(() => cart.reduce((sum, line) => sum + line.sellingPrice * line.cartQuantity, 0), [cart]);
  // What the seller keeps from this order: seller price minus base price, per unit.
  const cartEarnings = cartSellerTotal - cartBaseTotal;

  if (!ready) return null;

  const chooseSeller = (id: string) => {
    setSelectedSellerId(id);
    setProducts([]);
    setCart([]);
    setOrderMessage("");
    setOrderError("");
    setProductSearch("");
    setProductsPage(1);
  };

  const changeSeller = () => chooseSeller("");

  const setLineQuantity = (product: SellerProductDto, quantity: number) => {
    setOrderMessage("");
    setCart((current) => {
      if (quantity <= 0) return current.filter((line) => line.id !== product.id);
      const clamped = Math.min(quantity, product.quantity);
      if (current.some((line) => line.id === product.id)) {
        return current.map((line) => (line.id === product.id ? { ...line, cartQuantity: clamped } : line));
      }
      return [...current, { ...product, cartQuantity: clamped }];
    });
  };

  const cartQuantityFor = (id: string) => cart.find((line) => line.id === id)?.cartQuantity ?? 0;

  const clearCart = () => {
    setCart([]);
    setOrderError("");
  };

  const submitOrder = async () => {
    if (cart.length === 0 || !selectedSellerId) return;
    setSubmittingOrder(true);
    setOrderError("");
    setOrderMessage("");
    try {
      const orders = await createOrder({
        sellerId: selectedSellerId,
        customer: { name: null, phone: null, email: null, address: null, location: null },
        items: cart.map((line) => ({
          sellerProductId: line.id,
          productId: line.productId,
          quantity: line.cartQuantity,
        })),
      });
      const orderNumbers = orders.map((order) => order.orderNumber).join(", ");
      setOrderMessage(`Order${orders.length > 1 ? "s" : ""} created: ${orderNumbers}`);
      setCart([]);
    } catch (err) {
      setOrderError(err instanceof ApiError ? err.errors[0] ?? err.message : "Failed to create order.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Seller listings</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Sellers Products</h1>
      </div>

      <Stepper step={step} />

      {!selectedSellerId ? (
        <section className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={sellerSearch}
              onChange={(e) => setSellerSearch(e.target.value)}
              placeholder="Search sellers by name, shop or email"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[var(--brand)]"
            />
          </div>
          {sellersError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{sellersError}</div>}
          {sellersLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading sellers…</div>
          ) : filteredSellers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No active sellers found.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSellers.map((seller) => (
                <button
                  key={seller.id}
                  onClick={() => chooseSeller(seller.id)}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--brand)]/40 hover:shadow-lg"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-base font-semibold text-[var(--brand)]">
                    {initials(seller.shopName || seller.fullName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{seller.shopName || seller.fullName}</span>
                    <span className="block truncate text-sm text-slate-500">{seller.fullName}</span>
                    <span className="block truncate text-xs text-slate-400">{seller.email}</span>
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[seller.status] ?? "bg-slate-100 text-slate-600"}`}>{seller.status}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand)]/10 text-sm font-semibold text-[var(--brand)]">
                  {initials(selectedSeller?.shopName || selectedSeller?.fullName || "S")}
                </span>
                <div>
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <Store className="h-4 w-4 text-slate-400" />
                    {selectedSeller?.shopName || selectedSeller?.fullName}
                  </div>
                  <div className="text-sm text-slate-500">{selectedSeller?.email}</div>
                </div>
              </div>
              <button onClick={changeSeller} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <ArrowLeft className="h-4 w-4" />
                Change seller
              </button>
            </div>

            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setProductsPage(1);
                }}
                placeholder="Search products"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[var(--brand)]"
              />
            </div>

            {productsError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{productsError}</div>}

            {productsLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading products…</div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                {products.length === 0 ? "This seller has no product listings." : "No products match your search."}
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {pagedProducts.map((product) => {
                    const inCart = cartQuantityFor(product.id);
                    return (
                      <article key={product.id} className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-200 hover:shadow-lg ${inCart ? "border-[var(--brand)]/50" : "border-slate-200"}`}>
                        <ProductThumbnail name={product.productName} imageUrls={product.imageUrls} className="aspect-[4/3] w-full !rounded-none" bare />
                        <div className="flex flex-1 flex-col gap-3 p-4">
                          <div>
                            <h3 className="line-clamp-1 font-semibold text-slate-900">{product.productName}</h3>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                              <Package className="h-3.5 w-3.5" />
                              {product.quantity} listed
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl bg-slate-50 px-3 py-2">
                              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Base Price</div>
                              <div className="text-sm font-semibold text-slate-800">{money(product.supplierCost)}</div>
                            </div>
                            <div className="rounded-xl bg-[var(--brand)]/10 px-3 py-2">
                              <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--brand)]/80">Seller Price</div>
                              <div className="text-sm font-semibold text-[var(--brand)]">{money(product.sellingPrice)}</div>
                            </div>
                          </div>
                          <div className="mt-auto">
                            {inCart ? (
                              <div className="flex items-center justify-between rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-1">
                                <button onClick={() => setLineQuantity(product, inCart - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--brand)] hover:bg-white" aria-label="Decrease quantity">
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="text-sm font-semibold text-slate-900">{inCart} in cart</span>
                                <button onClick={() => setLineQuantity(product, inCart + 1)} disabled={inCart >= product.quantity} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--brand)] hover:bg-white disabled:opacity-40" aria-label="Increase quantity">
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setLineQuantity(product, 1)}
                                disabled={product.quantity <= 0}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)] disabled:opacity-50"
                              >
                                <ShoppingCart className="h-4 w-4" />
                                Add to cart
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <Pagination
                  page={currentProductsPage}
                  totalPages={totalProductsPages}
                  totalCount={filteredProducts.length}
                  pageSize={productsPageSize}
                  onChange={setProductsPage}
                  onPageSizeChange={(size) => {
                    setProductsPageSize(size);
                    setProductsPage(1);
                  }}
                />
              </>
            )}
          </section>

          <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-24">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <ShoppingCart className="h-4 w-4 text-[var(--brand)]" />
                Cart
                {cart.length > 0 && <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-xs font-semibold text-white">{cartQuantityTotal}</span>}
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} disabled={submittingOrder} className="text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-50">
                  Clear all
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-slate-500">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <ShoppingCart className="h-5 w-5" />
                </span>
                Your cart is empty. Add products from the list.
              </div>
            ) : (
              <ul className="max-h-[24rem] divide-y divide-slate-100 overflow-y-auto">
                {cart.map((line) => (
                  <li key={line.id} className="flex items-center gap-3 px-4 py-3">
                    <ProductThumbnail name={line.productName} imageUrls={line.imageUrls} className="h-12 w-12 shrink-0" bare />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-900">{line.productName}</div>
                      <div className="mt-1 flex items-center gap-1">
                        <button onClick={() => setLineQuantity(line, line.cartQuantity - 1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Decrease quantity">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-medium">{line.cartQuantity}</span>
                        <button onClick={() => setLineQuantity(line, line.cartQuantity + 1)} disabled={line.cartQuantity >= line.quantity} className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40" aria-label="Increase quantity">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">{money(line.sellingPrice * line.cartQuantity)}</div>
                      <div className="text-xs text-slate-400">base {money(line.supplierCost * line.cartQuantity)}</div>
                      <div className="text-xs font-medium text-emerald-600">earns {money((line.sellingPrice - line.supplierCost) * line.cartQuantity)}</div>
                    </div>
                    <button onClick={() => setLineQuantity(line, 0)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600" aria-label="Remove from cart">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-3 border-t border-slate-200 p-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Products</span>
                  <span className="font-medium text-slate-900">{cart.length}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total quantity</span>
                  <span className="font-medium text-slate-900">{cartQuantityTotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Base Price total</span>
                  <span className="font-medium text-slate-900">{money(cartBaseTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Seller Price total</span>
                  <span className="font-medium text-slate-900">{money(cartSellerTotal)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>{money(cartSellerTotal)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700">
                <span>Seller earns</span>
                <span>{money(cartEarnings)}</span>
              </div>

              {orderMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{orderMessage}</div>}
              {orderError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{orderError}</div>}

              <button
                onClick={submitOrder}
                disabled={cart.length === 0 || submittingOrder}
                className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingOrder ? "Submitting…" : "Submit order"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
