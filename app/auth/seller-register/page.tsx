"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleUserRound, Eye, EyeOff, FileText, ImageIcon, ShieldCheck, Store, UploadCloud, X } from "lucide-react";
import { sellerRegister } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { IdentityDocumentType } from "@/lib/api/types";
import { Banner, Field, inputClass } from "@/app/components/ProfileUi";
import { PhoneInput } from "@/app/components/PhoneInput";

const steps = [
  { title: "Your account", hint: "Who you are", icon: CircleUserRound },
  { title: "Your shop", hint: "About your shop", icon: Store },
  { title: "Verification", hint: "Prove it's you", icon: FileText },
];

const CATEGORIES = ["Home & Living", "Electronics", "Fashion", "Beauty", "Sports", "Fitness", "Books & Stationery", "Toys & Kids", "Other"];
const ID_TYPES: IdentityDocumentType[] = ["CNIC", "Passport", "Driving License", "Other Government ID"];

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "pdf"];

type FormState = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  inviteCode: string;
  shopName: string;
  shopCategory: string;
  idType: IdentityDocumentType;
  idNumber: string;
  termsAccepted: boolean;
};

const initialForm: FormState = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  inviteCode: "",
  shopName: "",
  shopCategory: CATEGORIES[0],
  idType: "CNIC",
  idNumber: "",
  termsAccepted: false,
};

const passwordRules = (value: string) => [
  { label: "At least 8 characters", ok: value.length >= 8 },
  { label: "An uppercase letter", ok: /[A-Z]/.test(value) },
  { label: "A lowercase letter", ok: /[a-z]/.test(value) },
  { label: "A number", ok: /\d/.test(value) },
  { label: "A symbol (e.g. ! @ # $)", ok: /[^A-Za-z0-9]/.test(value) },
];

const formatBytes = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`);

function fileProblem(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) return "Please upload a PNG, JPG or PDF file.";
  if (file.size === 0) return "That file appears to be empty.";
  if (file.size > MAX_FILE_BYTES) return `That file is ${formatBytes(file.size)} — the limit is 5 MB.`;
  return null;
}

type Errors = Partial<Record<keyof FormState | "file", string>>;

function validateStep(step: number, form: FormState, file: File | null, phoneValid: boolean): Errors {
  const errors: Errors = {};
  if (step === 0) {
    if (!form.fullName.trim()) errors.fullName = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address, like you@example.com.";
    if (!phoneValid) errors.phoneNumber = "Enter a valid phone number for the selected country.";
    if (!passwordRules(form.password).every((r) => r.ok)) errors.password = "Your password doesn't meet all the requirements yet.";
    if (form.confirmPassword !== form.password) errors.confirmPassword = "The two passwords don't match.";
  }
  if (step === 1) {
    if (!form.shopName.trim()) errors.shopName = "Give your shop a name.";
  }
  if (step === 2) {
    if (!form.idNumber.trim()) errors.idNumber = "Enter your ID number.";
    if (!file) errors.file = "Please upload a photo or scan of your ID.";
    else {
      const problem = fileProblem(file);
      if (problem) errors.file = problem;
    }
    if (!form.termsAccepted) errors.termsAccepted = "Please accept the terms to continue.";
  }
  return errors;
}

// Points the user back at the step that a server-side error belongs to.
function stepForServerError(message: string) {
  if (/e-?mail|invite|password|phone|full name/i.test(message)) return 0;
  if (/shop/i.test(message)) return 1;
  return 2;
}

export default function SellerRegisterPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const progress = ((step + 1) / steps.length) * 100;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
    if (serverErrors.length) setServerErrors([]);
  };

  const chooseFile = (candidate: File | null | undefined) => {
    if (!candidate) return;
    if (filePreview) URL.revokeObjectURL(filePreview);
    const problem = fileProblem(candidate);
    if (problem) {
      setFile(null);
      setFilePreview(null);
      setErrors((current) => ({ ...current, file: problem }));
      return;
    }
    setFile(candidate);
    setFilePreview(candidate.type.startsWith("image/") ? URL.createObjectURL(candidate) : null);
    setErrors((current) => ({ ...current, file: undefined }));
  };

  const removeFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const next = () => {
    const found = validateStep(step, form, file, phoneValid);
    setErrors(found);
    if (Object.keys(found).length === 0) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const submit = async () => {
    const found = validateStep(2, form, file, phoneValid);
    setErrors(found);
    if (Object.keys(found).length > 0 || !file || submitting) return;

    setSubmitting(true);
    setServerErrors([]);
    try {
      // The API also returns tokens, but a brand-new seller is Pending — we don't sign them in.
      await sellerRegister({
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        inviteCode: form.inviteCode.trim(),
        termsAccepted: form.termsAccepted,
        shopName: form.shopName.trim(),
        shopCategory: form.shopCategory,
        idType: form.idType,
        idNumber: form.idNumber.trim(),
        identityDocument: file,
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        const messages = err.errors.length > 0 ? err.errors : [err.message];
        setServerErrors(messages);
        setStep(stepForServerError(messages.join(" ")));
      } else {
        setServerErrors(["We couldn't submit your application. Please try again."]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f5f3] px-4 py-8">
        <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Application submitted</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Thanks — your application is in review</h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
              We&apos;ve received the details for <span className="font-medium text-slate-800">{form.shopName}</span>. Our team will verify your ID and approve your account.
            </p>
          </div>

          <ol className="mt-8 space-y-3 rounded-2xl border border-slate-200 bg-[color-mix(in_srgb,var(--brand)_8%,white)] p-5 text-sm text-slate-700">
            <li className="flex items-start gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" /></span><span><span className="font-medium">Application received</span> — done.</span></li>
            <li className="flex items-start gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">2</span><span><span className="font-medium">Admin verification</span> — in progress. This can take a little while.</span></li>
            <li className="flex items-start gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">3</span><span><span className="font-medium">Start selling</span> — sign in with <span className="break-all font-medium">{form.email}</span> once you&apos;re approved.</span></li>
          </ol>

          <div className="mt-8 flex justify-center">
            <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const rules = passwordRules(form.password);
  const type = showPassword ? "text" : "password";
  const ring = (key: keyof Errors) => (errors[key] ? "!border-red-300" : "");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f5f3] px-4 py-8">
      <div className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Seller onboarding</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Create your seller account</h1>
          </div>
          <Link href="/" className="shrink-0 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-hover)]">Back to login</Link>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Step {step + 1} of {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[var(--brand)] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <ol className="mb-8 grid gap-3 sm:grid-cols-3">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const active = index === step;
            const done = index < step;
            return (
              <li key={item.title} aria-current={active ? "step" : undefined} className={`flex items-center gap-3 rounded-2xl border p-3 ${active ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_8%,white)]" : done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-[var(--brand)] text-white" : done ? "bg-emerald-500 text-white" : "bg-white text-slate-600"}`}>
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.hint}</div>
                </div>
              </li>
            );
          })}
        </ol>

        {serverErrors.length > 0 && (
          <div className="mb-6">
            <Banner tone="error" onClose={() => setServerErrors([])}>
              <span>
                {serverErrors.length === 1 ? serverErrors[0] : "Please fix the following:"}
                {serverErrors.length > 1 && (
                  <ul className="mt-1 list-disc pl-5">
                    {serverErrors.map((message) => <li key={message}>{message}</li>)}
                  </ul>
                )}
              </span>
            </Banner>
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (step < steps.length - 1) next();
            else submit();
          }}
          noValidate
        >
          {step === 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full name" error={errors.fullName}>
                <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} autoComplete="name" placeholder="As shown on your ID" className={`${inputClass} ${ring("fullName")}`} />
              </Field>
              <Field label="Email" error={errors.email} hint="You'll use this to sign in.">
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" placeholder="you@example.com" className={`${inputClass} ${ring("email")}`} />
              </Field>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">Phone number</label>
                <PhoneInput
                  id="phone"
                  invalid={!!errors.phoneNumber}
                  onChange={(e164, valid) => {
                    setPhoneValid(valid);
                    update("phoneNumber", e164);
                  }}
                />
                {errors.phoneNumber ? (
                  <span className="mt-1 block text-xs text-red-600">{errors.phoneNumber}</span>
                ) : (
                  <span className="mt-1 block text-xs text-slate-400">Pick your country, then type your number — we&apos;ll format it for you.</span>
                )}
              </div>
              <Field label="Invitation code (optional)" hint="Have one from us? Enter it here.">
                <input value={form.inviteCode} onChange={(e) => update("inviteCode", e.target.value)} placeholder="e.g. WELCOME-2026" className={inputClass} />
              </Field>

              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <input type={type} value={form.password} onChange={(e) => update("password", e.target.value)} autoComplete="new-password" placeholder="Create a password" className={`${inputClass} pr-10 ${ring("password")}`} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600" aria-label={showPassword ? "Hide passwords" : "Show passwords"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm password" error={errors.confirmPassword}>
                <input type={type} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} autoComplete="new-password" placeholder="Type it again" className={`${inputClass} ${ring("confirmPassword")}`} />
              </Field>

              {form.password.length > 0 && (
                <ul className="grid gap-1 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-2 md:col-span-2 lg:grid-cols-3">
                  {rules.map((rule) => (
                    <li key={rule.label} className={`flex items-center gap-1.5 ${rule.ok ? "text-emerald-600" : "text-slate-500"}`}>
                      <Check className={`h-3.5 w-3.5 ${rule.ok ? "" : "opacity-30"}`} />
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Shop name" error={errors.shopName}>
                <input value={form.shopName} onChange={(e) => update("shopName", e.target.value)} placeholder="My Store" className={`${inputClass} ${ring("shopName")}`} />
              </Field>
              <Field label="Shop category">
                <select value={form.shopCategory} onChange={(e) => update("shopCategory", e.target.value)} className={inputClass}>
                  {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Government ID type">
                  <select value={form.idType} onChange={(e) => update("idType", e.target.value as IdentityDocumentType)} className={inputClass}>
                    {ID_TYPES.map((idType) => <option key={idType}>{idType}</option>)}
                  </select>
                </Field>
                <Field label="ID number" error={errors.idNumber}>
                  <input value={form.idNumber} onChange={(e) => update("idNumber", e.target.value)} placeholder="Enter the number on your ID" className={`${inputClass} ${ring("idNumber")}`} />
                </Field>
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">ID document</span>
                {file ? (
                  <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    {filePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={filePreview} alt="ID preview" className="h-16 w-24 shrink-0 rounded-lg border border-emerald-200 bg-white object-cover" />
                    ) : (
                      <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-600"><FileText className="h-6 w-6" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-emerald-800">{file.name}</div>
                      <div className="text-xs text-emerald-700">{formatBytes(file.size)} · ready to upload</div>
                    </div>
                    <button type="button" onClick={removeFile} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-100" aria-label="Remove file"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); chooseFile(e.dataTransfer.files?.[0]); }}
                    className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_8%,white)]" : errors.file ? "border-red-300 bg-red-50/40" : "border-slate-300 bg-slate-50"}`}
                  >
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center gap-3">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--brand)] shadow-sm ring-1 ring-slate-200"><UploadCloud className="h-6 w-6" /></span>
                      <span>
                        <span className="block text-base font-semibold text-slate-800">Upload a photo or scan of your ID</span>
                        <span className="mt-1 block text-sm text-slate-500">Drag &amp; drop, or <span className="font-medium text-[var(--brand)]">browse</span> · PNG, JPG or PDF · max 5 MB</span>
                      </span>
                    </button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden" onChange={(e) => chooseFile(e.target.files?.[0])} />
                {errors.file && <p className="mt-1 text-xs text-red-600">{errors.file}</p>}
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><ImageIcon className="h-3.5 w-3.5" />Make sure all four corners are visible and the text is readable.</p>
              </div>

              <div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <input type="checkbox" checked={form.termsAccepted} onChange={(e) => update("termsAccepted", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
                  <span>I confirm the details above are accurate and I agree to the marketplace terms and seller policies.</span>
                </label>
                {errors.termsAccepted && <p className="mt-1 text-xs text-red-600">{errors.termsAccepted}</p>}
              </div>

              <p className="flex items-start gap-2 rounded-xl bg-[color-mix(in_srgb,var(--brand)_8%,white)] px-4 py-3 text-xs text-slate-600"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" />Your ID is only used to verify your identity and is visible to our admin team only.</p>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => { setErrors({}); setStep((s) => Math.max(s - 1, 0)); }}
              disabled={step === 0 || submitting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            {step < steps.length - 1 ? (
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">
                {submitting ? "Submitting…" : "Submit application"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
            )}
          </div>
        </form>

        {step === 0 && (
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account? <Link href="/" className="font-medium text-[var(--brand)] hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </main>
  );
}
