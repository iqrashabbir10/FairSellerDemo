"use client";

import { useEffect, useState } from "react";
import { FileText, LockKeyhole, Store } from "lucide-react";
import { getSellerProfile } from "@/lib/api/seller";
import { ApiError, resolveApiUrl } from "@/lib/api/client";
import type { SellerProfileDto } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";

export default function SellerProfilePage() {
  const ready = useAuthGuard("Seller");
  const [profile, setProfile] = useState<SellerProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        setProfile(await getSellerProfile());
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready]);

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Account details</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Profile & Password</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0563f]/10 text-lg font-semibold text-[#f0563f]">
              {(profile?.fullName ?? "SL").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">{loading ? "Loading…" : profile?.fullName}</div>
              <div className="text-sm text-slate-500">{profile?.status}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
              <input readOnly value={profile?.fullName ?? ""} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
              <input readOnly value={profile?.phoneNumber ?? ""} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Account status</label>
              <input readOnly value={profile?.status ?? ""} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0563f]/10 text-[#f0563f]">
              <Store className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Shop & business</h2>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div>{profile?.shopName} · {profile?.shopCategory}</div>
            <p>{profile?.shopDescription}</p>
            <div>Address: {profile?.address}, {profile?.city}, {profile?.country} {profile?.postalCode}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0563f]/10 text-[#f0563f]">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Identity document</h2>
          </div>
          {profile?.documentUrl ? (
            <div className="space-y-2 text-sm text-slate-600">
              <div>Type: {profile.idType}</div>
              <div>ID number: {profile.idNumber}</div>
              <a href={resolveApiUrl(profile.documentUrl) ?? "#"} target="_blank" rel="noreferrer" className="text-[#f0563f] hover:underline">
                View uploaded document
              </a>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No identity document on file.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0563f]/10 text-[#f0563f]">
              <LockKeyhole className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
          </div>
          <p className="text-sm text-slate-500">Password changes are not yet available through the API.</p>
        </div>
      </div>
    </div>
  );
}
