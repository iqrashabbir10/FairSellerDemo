"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LoginScreen } from "@/app/components/LoginScreen";

// The link an admin shares with a seller: /auth/seller (optionally ?invite=CODE).
function SellerPortal() {
  const invite = useSearchParams().get("invite") ?? undefined;
  return <LoginScreen variant="seller" inviteCode={invite} />;
}

export default function SellerPortalPage() {
  return (
    <Suspense fallback={null}>
      <SellerPortal />
    </Suspense>
  );
}
