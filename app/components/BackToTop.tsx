"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 360);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className="fixed bottom-5 right-5 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f0563f] text-white shadow-lg transition hover:bg-[#dc4b34] lg:hidden"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}