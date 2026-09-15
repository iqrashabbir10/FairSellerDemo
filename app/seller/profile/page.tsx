import { Camera, LockKeyhole, Save } from "lucide-react";

export default function SellerProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Account details</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Profile & Password</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0563f]/10 text-lg font-semibold text-[#f0563f]">VK</div>
              <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#f0563f] text-white shadow-sm">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">Veloura Home</div>
              <div className="text-sm text-slate-500">Aisha Khan</div>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Shop name</label>
              <input defaultValue="Veloura Home" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input defaultValue="aisha@veloura.home" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
              <input defaultValue="+971 55 111 2233" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white" />
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-[#f0563f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#dc4b34]">
              <Save className="h-4 w-4" />
              Save Profile
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0563f]/10 text-[#f0563f]">
              <LockKeyhole className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
          </div>

          <form className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Current password</label>
              <input type="password" defaultValue="password" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">New password</label>
              <input type="password" defaultValue="newpass123" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
              <input type="password" defaultValue="newpass123" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#f0563f] focus:bg-white" />
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Save className="h-4 w-4" />
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
