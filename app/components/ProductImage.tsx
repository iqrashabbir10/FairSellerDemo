"use client";

import { Package } from "lucide-react";

// Backend ProductDto has no imageUrl yet, so render a deterministic placeholder
// (stable gradient + initials) instead of a plain gray box.
const PALETTES = [
  ["#fde2dd", "var(--brand)"],
  ["#dbeeff", "#147d92"],
  ["#dcf3e6", "#2f8061"],
  ["#f2e2ec", "#8b4f70"],
  ["#fef3c7", "#b45309"],
];

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % PALETTES.length;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export function ProductImage({ name, className = "h-28", bare = false }: { name: string; className?: string; bare?: boolean }) {
  const [from, to] = paletteFor(name);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={`relative ${bare ? "" : "mb-4"} flex items-center justify-center overflow-hidden rounded-xl ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to}22)` }}
    >
      <Package className="h-8 w-8" style={{ color: to }} strokeWidth={1.5} />
      <span className="absolute bottom-1.5 right-2 text-xs font-semibold" style={{ color: to }}>
        {initials}
      </span>
    </div>
  );
}
