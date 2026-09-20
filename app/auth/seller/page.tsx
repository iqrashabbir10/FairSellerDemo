import { redirect } from "next/navigation";

// Older shared links pointed here; the seller flow now starts at the registration form.
export default async function SellerLinkRedirect({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams;
  redirect(invite ? `/auth/seller-register?invite=${encodeURIComponent(invite)}` : "/auth/seller-register");
}
