"use client";

import { useEffect, useState } from "react";
import { Ban, CheckCircle2, Crown, Eye, EyeOff, Plus, Power, PowerOff, Search, ShieldCheck, Store, UserRoundCheck, X } from "lucide-react";
import { Pagination } from "@/app/components/Pagination";
import { ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/api/session";
import type { LoginStatusDto, ManagedUserDto, PagedResult, UserRole } from "@/lib/api/types";
import { useAuthGuard } from "@/lib/api/useAuthGuard";
import { createManagedUser, getManagedUsers, setUserBlocked } from "@/lib/api/users";
import { getLoginSwitch, setLoginsDisabled } from "@/lib/api/settings";

type RoleFilter = "" | UserRole;

const FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "", label: "All users" },
  { value: "SuperUser", label: "Super users" },
  { value: "Admin", label: "Admins" },
  { value: "Seller", label: "Sellers" },
];

const ROLE_STYLE: Record<UserRole, { label: string; badge: string; icon: typeof Crown }> = {
  SuperUser: { label: "Super User", badge: "bg-purple-50 text-purple-700", icon: Crown },
  Admin: { label: "Admin", badge: "bg-blue-50 text-blue-700", icon: ShieldCheck },
  Seller: { label: "Seller", badge: "bg-amber-50 text-amber-700", icon: Store },
};

const initials = (name: string) => name.split(/\s+|@/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] focus:bg-white";

function AddUserDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (user: ManagedUserDto) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"Admin" | "SuperUser">("Admin");
  const [mustChange, setMustChange] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSave = fullName.trim().length > 0 && emailOk && password.length >= 8 && !saving;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const user = await createManagedUser({ fullName: fullName.trim(), email: email.trim(), password, role, mustChangePassword: mustChange });
      onCreated(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.errors[0] ?? err.message : "We couldn't create this user. Please try again.");
      setSaving(false);
    }
  };

  const roleCard = (value: "Admin" | "SuperUser", title: string, hint: string, Icon: typeof Crown) => {
    const selected = role === value;
    return (
      <button
        type="button"
        onClick={() => setRole(value)}
        aria-pressed={selected}
        className={`rounded-xl border p-3 text-left transition ${selected ? "border-[var(--brand)] bg-[var(--brand)]/5 ring-1 ring-[var(--brand)]" : "border-slate-200 hover:bg-slate-50"}`}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Icon className="h-4 w-4 text-[var(--brand)]" />{title}</span>
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={saving ? undefined : onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" aria-label="Add user">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]"><Plus className="h-5 w-5" /></div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Add a user</h2>
            <p className="mt-1 text-sm text-slate-500">They can sign in right away with the email and password you set here.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus maxLength={150} className={fieldClass} placeholder="e.g. Sara Khan" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Email <span className="font-normal text-slate-400">(the username they sign in with)</span></span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" className={fieldClass} placeholder="name@example.com" />
            {email.length > 0 && !emailOk && <span className="mt-1 block text-xs text-red-600">Enter a valid email address.</span>}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={`${fieldClass} pr-10`} placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <span className={`mt-1 block text-xs ${password.length === 0 || password.length >= 8 ? "text-slate-400" : "text-red-600"}`}>At least 8 characters. Share it with them privately.</span>
          </label>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Role</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {roleCard("Admin", "Admin", "Runs the marketplace: products, orders, sellers, chat.", ShieldCheck)}
              {roleCard("SuperUser", "Super User", "Everything an admin does, plus managing users.", Crown)}
            </div>
          </div>

          <label className="flex items-start gap-2.5 text-sm text-slate-600">
            <input type="checkbox" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[var(--brand)]" />
            <span>Ask them to choose their own password the first time they sign in</span>
          </label>
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={!canSave} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">
            {saving ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>
    </div>
  );
}

function BlockDialog({ user, blocked, saving, error, onCancel, onConfirm }: { user: ManagedUserDto; blocked: boolean; saving: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={saving ? undefined : onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${blocked ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
          {blocked ? <Ban className="h-5 w-5" /> : <UserRoundCheck className="h-5 w-5" />}
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">{blocked ? "Block" : "Unblock"} {user.name}?</h2>
        <p className="mt-2 text-sm text-slate-600">
          {blocked
            ? "They won't be able to sign in, and anyone signed in with this account is signed out within a few seconds."
            : "They'll be able to sign in again with their existing password."}
        </p>
        <p className="mt-1 break-all text-xs text-slate-400">{user.email}</p>
        {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={saving} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${blocked ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
            {saving ? "Saving…" : blocked ? "Block user" : "Unblock user"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Confirm turning sign-in off (with the message people will see) or back on.
function LoginSwitchDialog({
  turningOff,
  saving,
  error,
  onCancel,
  onConfirm,
}: {
  turningOff: boolean;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (message: string) => void;
}) {
  const [message, setMessage] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={saving ? undefined : onCancel}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${turningOff ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
          {turningOff ? <PowerOff className="h-5 w-5" /> : <Power className="h-5 w-5" />}
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">{turningOff ? "Disable all logins?" : "Turn logins back on?"}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {turningOff
            ? "Nobody can sign in, and everyone who is signed in right now — admins and sellers — is signed out within about 15 seconds. Super users are not affected, so you can turn it back on."
            : "Admins and sellers will be able to sign in again straight away."}
        </p>

        {turningOff && (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Message shown to people <span className="font-normal text-slate-400">(optional)</span></span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={300} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:bg-white" placeholder="e.g. We're upgrading the system. Back at 6 PM." />
          </label>
        )}

        {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button onClick={() => onConfirm(message.trim())} disabled={saving} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${turningOff ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
            {saving ? "Saving…" : turningOff ? "Disable all logins" : "Turn logins on"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const ready = useAuthGuard("SuperUser");
  const meId = getSession()?.userId;

  const [result, setResult] = useState<PagedResult<ManagedUserDto> | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [loginStatus, setLoginStatus] = useState<LoginStatusDto | null>(null);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [switchSaving, setSwitchSaving] = useState(false);
  const [switchError, setSwitchError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [pending, setPending] = useState<{ user: ManagedUserDto; blocked: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!ready) return;
    getLoginSwitch().then(setLoginStatus).catch(() => {});
  }, [ready]);

  const confirmSwitch = async (message: string) => {
    if (!loginStatus) return;
    setSwitchSaving(true);
    setSwitchError("");
    try {
      const turningOff = !loginStatus.loginsDisabled;
      const next = await setLoginsDisabled(turningOff, message);
      setLoginStatus(next);
      setNotice(turningOff ? "All logins are disabled. Everyone except super users will be signed out shortly." : "Logins are back on.");
      setSwitchOpen(false);
    } catch (err) {
      setSwitchError(err instanceof ApiError ? err.errors[0] ?? err.message : "Couldn't change the setting. Please try again.");
    } finally {
      setSwitchSaving(false);
    }
  };

  // Debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getManagedUsers({ page, pageSize, search, role: roleFilter })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load users.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, page, pageSize, search, roleFilter, reload]);

  const confirmBlock = async () => {
    if (!pending) return;
    setSaving(true);
    setSaveError("");
    try {
      const updated = await setUserBlocked(pending.user.id, pending.blocked);
      setResult((current) => (current ? { ...current, items: current.items.map((u) => (u.id === updated.id ? updated : u)) } : current));
      setNotice(`${updated.name} was ${updated.isBlocked ? "blocked" : "unblocked"}.`);
      setPending(null);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.errors[0] ?? err.message : "Couldn't update this user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return null;

  const users = result?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Super user</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Users</h1>
        </div>
        <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)]">
          <Plus className="h-4 w-4" />
          Add user
        </button>
      </div>

      {loginStatus && (
        <section
          className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm ${loginStatus.loginsDisabled ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}
          aria-label="Login access"
        >
          <div className="flex items-start gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${loginStatus.loginsDisabled ? "bg-red-100 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
              {loginStatus.loginsDisabled ? <PowerOff className="h-5 w-5" /> : <Power className="h-5 w-5" />}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">Login access</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${loginStatus.loginsDisabled ? "bg-red-100 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {loginStatus.loginsDisabled ? "All logins disabled" : "Logins are on"}
                </span>
              </div>
              <p className="mt-0.5 max-w-xl text-sm text-slate-600">
                {loginStatus.loginsDisabled
                  ? `Admins and sellers can't sign in and were signed out. Super users are not affected. Message shown: “${loginStatus.message}”`
                  : "Switch every sign-in off for a while, for example during maintenance. Everyone who is signed in is signed out automatically."}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSwitchError("");
              setSwitchOpen(true);
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${loginStatus.loginsDisabled ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {loginStatus.loginsDisabled ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
            {loginStatus.loginsDisabled ? "Turn logins back on" : "Disable all logins"}
          </button>
        </section>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search users"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[var(--brand)] focus:bg-white"
              placeholder="Search by name or email"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by role">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => {
                  setRoleFilter(f.value);
                  setPage(1);
                }}
                aria-pressed={roleFilter === f.value}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${roleFilter === f.value ? "bg-[var(--brand)] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss" className="text-emerald-700/70 hover:text-emerald-800">×</button>
        </div>
      )}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading users…</div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          {search || roleFilter ? "No users match your search." : "No users yet."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Sign-in</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const style = ROLE_STYLE[user.role] ?? ROLE_STYLE.Admin;
                  const RoleIcon = style.icon;
                  const isMe = user.id === meId;
                  return (
                    <tr key={user.id} className="border-b border-slate-200 last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-sm font-semibold text-[var(--brand)]">{initials(user.name)}</span>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-slate-900">{user.name}{isMe && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">You</span>}</div>
                            <div className="truncate text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.badge}`}>
                          <RoleIcon className="h-3.5 w-3.5" />
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${user.isBlocked ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.isBlocked ? "bg-red-500" : "bg-emerald-500"}`} />
                          {user.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isMe ? (
                          <span className="text-xs text-slate-400">Your account</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSaveError("");
                              setPending({ user, blocked: !user.isBlocked });
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${user.isBlocked ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-red-200 text-red-700 hover:bg-red-50"}`}
                          >
                            {user.isBlocked ? <UserRoundCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                            {user.isBlocked ? "Unblock" : "Block"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && result.totalCount > 0 && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          totalCount={result.totalCount}
          pageSize={pageSize}
          onChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

      {addOpen && (
        <AddUserDialog
          onClose={() => setAddOpen(false)}
          onCreated={(user) => {
            setAddOpen(false);
            setNotice(`${user.name} was added as ${ROLE_STYLE[user.role]?.label ?? user.role}. They can sign in with ${user.email}.`);
            setPage(1);
            setReload((n) => n + 1);
          }}
        />
      )}

      {switchOpen && loginStatus && (
        <LoginSwitchDialog turningOff={!loginStatus.loginsDisabled} saving={switchSaving} error={switchError} onCancel={() => setSwitchOpen(false)} onConfirm={confirmSwitch} />
      )}

      {pending && (
        <BlockDialog user={pending.user} blocked={pending.blocked} saving={saving} error={saveError} onCancel={() => setPending(null)} onConfirm={confirmBlock} />
      )}
    </div>
  );
}
