"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, Lock, LockKeyhole, Mail, Save, Star, Store, UserRound } from "lucide-react";
import { SellerRatingCard, SellerRatingSummary } from "@/app/components/SellerRating";
import { getSellerProfile, updateSellerProfile } from "@/lib/api/seller";
import { ApiError } from "@/lib/api/client";
import type { SellerProfileDto, SellerStatus } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";
import { useCurrentUser } from "@/lib/api/useCurrentUser";
import { Banner, Card, ChangePasswordForm, Field, inputClass } from "@/app/components/ProfileUi";

const readOnlyClass = "w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500";

const STATUS_INFO: Record<SellerStatus, { tone: string; hint: string }> = {
  Approved: { tone: "bg-emerald-50 text-emerald-700", hint: "Your account is active — you can list products and take orders." },
  Pending: { tone: "bg-amber-50 text-amber-700", hint: "Your application is being reviewed. We'll unlock everything once it's approved." },
  Rejected: { tone: "bg-red-50 text-red-700", hint: "Your application wasn't approved. Please contact support for details." },
  Frozen: { tone: "bg-slate-100 text-slate-600", hint: "Your account is temporarily frozen. Please contact support." },
};

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "S";

function ProfileForm({ profile, onSaved }: { profile: SellerProfileDto; onSaved: (next: SellerProfileDto) => void }) {
  const initial = useMemo(
    () => ({
      phoneNumber: profile.phoneNumber ?? "",
    }),
    [profile],
  );
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = (key: keyof typeof initial) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const dirty = (Object.keys(initial) as (keyof typeof initial)[]).some((key) => form[key].trim() !== initial[key]);
  const errors = {
    phoneNumber: form.phoneNumber.trim().length < 7 ? "Enter a valid phone number." : "",
  };
  const valid = !Object.values(errors).some(Boolean);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dirty || !valid || saving) return;
    setSaving(true);
    setError("");
    try {
      const next = await updateSellerProfile({ phoneNumber: form.phoneNumber.trim() });
      onSaved(next);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.errors[0] ?? err.message : "We couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <Banner tone="error" onClose={() => setError("")}>{error}</Banner>}
      {saved && <Banner tone="success" onClose={() => setSaved(false)}>Your details were saved.</Banner>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" hint="Verified by our team. Contact support to change it.">
          <div className="relative">
            <input readOnly value={profile.fullName} className={`${readOnlyClass} pr-9`} />
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </Field>
        <Field label="Phone number" error={form.phoneNumber !== initial.phoneNumber ? errors.phoneNumber : ""}>
          <input value={form.phoneNumber} onChange={set("phoneNumber")} inputMode="tel" autoComplete="tel" className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Shop name" hint="Verified by our team.">
          <div className="relative">
            <input readOnly value={profile.shopName} className={`${readOnlyClass} pr-9`} />
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </Field>
        <Field label="Category">
          <div className="relative">
            <input readOnly value={profile.shopCategory} className={`${readOnlyClass} pr-9`} />
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
        {dirty && <span className="mr-auto text-xs text-amber-600">You have unsaved changes</span>}
        <button
          type="button"
          onClick={() => {
            setForm(initial);
            setError("");
          }}
          disabled={!dirty || saving}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={!dirty || !valid || saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export default function SellerProfilePage() {
  const ready = useAuthGuard("Seller");
  const email = useCurrentUser("Seller");
  const [profile, setProfile] = useState<SellerProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getSellerProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "We couldn't load your profile. Please refresh the page.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready) return null;

  const status = profile ? STATUS_INFO[profile.status] : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Account details</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Profile & Password</h1>
      </div>

      {error && <Banner tone="error">{error}</Banner>}

      {loading ? (
        <div className="space-y-4" aria-hidden>
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
            <div className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
          </div>
        </div>
      ) : profile && status ? (
        <>
          <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-xl font-semibold text-[var(--brand)]">{initials(profile.fullName)}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-semibold text-slate-900">{profile.fullName}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.tone}`}>{profile.status}</span>
                <SellerRatingSummary rating={profile.rating} creditScore={profile.creditScore} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{email}</span>
                <span className="inline-flex items-center gap-1.5"><Store className="h-3.5 w-3.5" />{profile.shopName}</span>
                <span>Member since {new Date(profile.createdAtUtc).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
              </div>
            </div>
            <p className="flex w-full items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              {status.hint}
            </p>
          </section>

          <Card icon={<Star className="h-4 w-4" />} title="Your rating & credit score" hint="Assigned by our team based on your account activity.">
            <SellerRatingCard rating={profile.rating} creditScore={profile.creditScore} />
          </Card>

          <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Card icon={<UserRound className="h-4 w-4" />} title="Contact & shop details" hint="Keep your phone number up to date so our team can reach you.">
              <ProfileForm profile={profile} onSaved={setProfile} />
            </Card>

            <div className="space-y-6">
              <Card icon={<LockKeyhole className="h-4 w-4" />} title="Change password" hint="Use a strong password you don't use anywhere else.">
                <ChangePasswordForm />
              </Card>

            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
