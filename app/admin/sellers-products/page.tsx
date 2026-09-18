"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, Trash2 } from "lucide-react";
import { getAdminSellers, getSellerProducts } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { AdminSellerDto, SellerProductDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

type CartLine = SellerProductDto & { cartQuantity: number };

export default function SellersProductsPage() {
  const ready = useAuthGuard("Admin");
  const [sellers, setSellers] = useState<AdminSellerDto[]>([]);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [sellersError, setSellersError] = useState("");
  const [selectedSellerId, setSelectedSellerId] = useState("");

  const [products, setProducts] = useState<SellerProductDto[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");

  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderMessage, setOrderMessage] = useState("");

  useEffect(() => {
    if (!ready) return;
    (async () => {
      setSellersLoading(true);
      setSellersError("");
      try {
        const result = await getAdminSellers({ pageSize: 200 });
        setSellers(result.items);
      } catch (err) {
        setSellersError(err instanceof ApiError ? err.message : "Failed to load sellers.");
      } finally {
        setSellersLoading(false);
      }
    })();
  }, [ready]);

  useEffect(() => {
    if (!selectedSellerId) {
      setProducts([]);
      return;
    }
    (async () => {
      setProductsLoading(true);
      setProductsError("");
      try {
        const result = await getSellerProducts(selectedSellerId, 1, 100);
        setProducts(result.items);
      } catch (err) {
        setProductsError(err instanceof ApiError ? err.message : "Failed to load this seller's products.");
      } finally {
        setProductsLoading(false);
      }
    })();
  }, [selectedSellerId]);

  useEffect(() => {
    setCart([]);
    setOrderMessage("");
  }, [selectedSellerId]);

  const total = useMemo(() => cart.reduce((sum, line) => sum + line.sellingPrice * line.cartQuantity, 0), [cart]);

  if (!ready) return null;

  const addToCart = (product: SellerProductDto) => {
    setOrderMessage("");
    setCart((current) => {
      const existing = current.find((line) => line.id === product.id);
      if (existing) {
        return current.map((line) => (line.id === product.id ? { ...line, cartQuantity: Math.min(line.cartQuantity + 1, product.quantity) } : line));
      }
      return [...current, { ...product, cartQuantity: 1 }];
    });
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    setCart((current) => current.map((line) => (line.id === id ? { ...line, cartQuantity: Math.max(1, Math.min(quantity, line.quantity)) } : line)));
  };

  const removeFromCart = (id: string) => {
    setCart((current) => current.filter((line) => line.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setOrderMessage("");
  };

  const submitOrder = () => {
    if (cart.length === 0) return;
    // No order-creation endpoint exists in the API spec yet; record the intent locally as a demo confirmation.
    setOrderMessage(`Order recorded for ${cart.length} product${cart.length > 1 ? "s" : ""} totaling $${total.toFixed(2)}.`);
    setCart([]);
  };

  const selectedSeller = sellers.find((seller) => seller.id === selectedSellerId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Seller listings</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Sellers Products</h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-slate-700">Select seller</label>
        {sellersError && <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{sellersError}</div>}
        <select
          value={selectedSellerId}
          onChange={(e) => setSelectedSellerId(e.target.value)}
          disabled={sellersLoading}
          className="w-full max-w-lg rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white"
        >
          <option value="">{sellersLoading ? "Loading sellers…" : "Choose a seller"}</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.fullName} · {seller.email}
            </option>
          ))}
        </select>
      </div>

      {!selectedSellerId ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          Select a seller above to view their product listings.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
              {selectedSeller?.fullName}&apos;s products
            </div>
            {productsError && <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{productsError}</div>}
            {productsLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading products…</div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">This seller has no product listings.</div>
            ) : (
              <div className="max-h-[26rem] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium text-right">Price</th>
                      <th className="px-4 py-3 font-medium text-right">Qty</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-slate-200 last:border-b-0">
                        <td className="px-4 py-3 font-medium text-slate-800">{product.productName}</td>
                        <td className="px-4 py-3 text-right text-slate-600">${product.sellingPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{product.quantity}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => addToCart(product)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-hover)]"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Add to cart
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">Cart</div>

            {cart.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No products added yet.</div>
            ) : (
              <div className="max-h-[13rem] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <tbody>
                    {cart.map((line) => (
                      <tr key={line.id} className="border-b border-slate-200 last:border-b-0">
                        <td className="px-4 py-3 font-medium text-slate-800">{line.productName}</td>
                        <td className="px-2 py-3">
                          <input
                            type="number"
                            min={1}
                            max={line.quantity}
                            value={line.cartQuantity}
                            onChange={(e) => updateCartQuantity(line.id, Number(e.target.value))}
                            className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-[var(--brand)]"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">${(line.sellingPrice * line.cartQuantity).toFixed(2)}</td>
                        <td className="px-2 py-3 text-right">
                          <button onClick={() => removeFromCart(line.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600" aria-label="Remove from cart">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-auto space-y-3 border-t border-slate-200 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {orderMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{orderMessage}</div>}

              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear cart
                </button>
                <button
                  onClick={submitOrder}
                  disabled={cart.length === 0}
                  className="flex-1 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

