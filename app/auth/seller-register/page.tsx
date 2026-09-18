"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleUserRound, FileText, MapPinned, ShieldCheck, UploadCloud } from "lucide-react";
import { sellerRegister } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setSession } from "@/lib/api/session";
import type { IdentityDocumentType } from "@/lib/api/types";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".pdf"];

const steps = [
  { title: "Basic details", icon: CircleUserRound },
  { title: "Contact info", icon: MapPinned },
  { title: "Identity verification", icon: FileText },
];

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  invitationCode: string;
  shopName: string;
  shopCategory: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  idType: IdentityDocumentType;
  idNumber: string;
  identityDocument: File | null;
};

const initialData: FormData = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  termsAccepted: false,
  invitationCode: "",
  shopName: "",
  shopCategory: "Home & Living",
  address: "",
  city: "Lahore",
  country: "Pakistan",
  postalCode: "",
  idType: "CNIC",
  idNumber: "",
  identityDocument: null,
};

export default function SellerRegisterPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fileError, setFileError] = useState("");

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  const updateField = (field: keyof FormData, value: string | boolean | File | null) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
      setFileError("Only PNG, JPG or PDF files are accepted.");
      updateField("identityDocument", null);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File size must be 5MB or smaller.");
      updateField("identityDocument", null);
      return;
    }
    setFileError("");
    updateField("identityDocument", file);
  };

  const next = () => setStep((current) => Math.min(current + 1, steps.length));
  const prev = () => setStep((current) => Math.max(current - 1, 0));

  const canProceed = () => {
    if (step === 0) {
      return (
        form.fullName &&
        form.email &&
        form.phone &&
        form.password &&
        form.confirmPassword === form.password &&
        form.shopName &&
        form.shopCategory
      );
    }
    if (step === 1) {
      return form.address && form.city && form.country && form.postalCode;
    }
    return form.idNumber && form.identityDocument && !fileError && form.termsAccepted;
  };

  const handleSubmit = async () => {
    setSubmitError("");
    if (!form.identityDocument) {
      setSubmitError("Please upload your identity document.");
      return;
    }
    setSubmitting(true);
    try {
      const auth = await sellerRegister({
        fullName: form.fullName,
        phoneNumber: form.phone,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        inviteCode: form.invitationCode,
        termsAccepted: form.termsAccepted,
        shopName: form.shopName,
        shopCategory: form.shopCategory,
        shopDescription: "",
        address: form.address,
        city: form.city,
        country: form.country,
        postalCode: form.postalCode,
        idType: form.idType,
        idNumber: form.idNumber,
        identityDocument: form.identityDocument,
      });
      setSession(auth);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Unable to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f5f3] px-4 py-8">
        <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
              <CheckCircle2 className="h-10 w-10" /> 
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Application submitted</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Your seller account is under review</h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
              Thanks, {form.shopName || "your store"}. Our admin team has received your seller profile and will review your application shortly.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-[var(--brand)]/5 p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[var(--brand)]" />
              <div className="font-medium text-slate-800">Verification status</div>
            </div>
            <div className="mt-3 text-sm text-slate-600">
              Pending admin verification · We will notify you via email once approved.
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="/" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </a>
            {/* <a href="/seller/dashboard" className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
              View seller demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </a> */}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f5f3] px-4 py-8">
      <div className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Seller onboarding</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Create your seller account</h1>
          </div>
          <a href="/" className="text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-hover)]">Back to login</a>
        </div>

        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Step {step + 1} of {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[var(--brand)] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const active = index === step;
            const done = index < step;

            return (
              <div
                key={item.title}
                className={`flex items-center gap-3 rounded-2xl border p-3 ${
                  active ? "border-[var(--brand)] bg-[var(--brand)]/5" : done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-[var(--brand)] text-white" : "bg-white text-slate-600"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Step {index + 1}</div>
                  <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                </div>
              </div>
            );
          })}
        </div>

        {step === 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
              <input value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white" placeholder="Enter your full name" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white" placeholder="you@example.com" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
              <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white" placeholder="+971 55 000 0000" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white" placeholder="Create a password" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white" placeholder="Re-enter your password" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Invitation Code</label>
              <input value={form.invitationCode} onChange={(e) => updateField("invitationCode", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white" placeholder="Enter invitation code" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Shop name</label>
              <input value={form.shopName} onChange={(e) => updateField("shopName", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white" placeholder="My Store" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Shop category</label>
              <select value={form.shopCategory} onChange={(e) => updateField("shopCategory", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white">
                <option>Home & Living</option>
                <option>Electronics</option>
                <option>Fashion</option>
                <option>Beauty</option>
                <option>Sports</option>
                <option>Fitness</option>
              </select>
            </div>

           
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Business address</label>
              <input value={form.address} onChange={(e) => updateField("address", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white" placeholder="Street name, building, unit number" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">City</label>
              <input value={form.city} onChange={(e) => updateField("city", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white" placeholder="Dubai" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Country</label>
              <input value={form.country} onChange={(e) => updateField("country", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white" placeholder="Country" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Postal code</label>
              <input value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white" placeholder="00000" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Government ID type</label>
                <select value={form.idType} onChange={(e) => updateField("idType", e.target.value as IdentityDocumentType)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white">
                  <option value="CNIC">CNIC</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Other Government ID">Other Government ID</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">ID number</label>
                <input value={form.idNumber} onChange={(e) => updateField("idNumber", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white" placeholder="Enter ID number" />
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--brand)] shadow-sm ring-1 ring-slate-200">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-800">Upload ID document</div>
                  <div className="mt-1 text-sm text-slate-500">PNG, JPG, PDF max 5MB</div>
                </div>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {fileError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {fileError}
                </div>
              )}

              {form.identityDocument && !fileError && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  Selected file: {form.identityDocument.name}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.termsAccepted} onChange={(e) => updateField("termsAccepted", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]" />
              I agree to the seller terms and conditions.
            </label>

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</div>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${
              step === 0 ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canProceed()}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
                canProceed() ? "bg-[var(--brand)] hover:bg-[var(--brand-hover)]" : "cursor-not-allowed bg-slate-300"
              }`}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
                canProceed() && !submitting ? "bg-[var(--brand)] hover:bg-[var(--brand-hover)]" : "cursor-not-allowed bg-slate-300"
              }`}
            >
              {submitting ? "Submitting..." : "Submit application"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
