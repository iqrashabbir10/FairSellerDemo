"use client";

import { Grid2X2, List } from "lucide-react";
import { useEffect, useState } from "react";

export type ViewMode = "list" | "grid";

export function useResponsiveView(): [ViewMode, (value: ViewMode) => void] {
  const [view, setView] = useState<ViewMode>("list");

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    setView(media.matches ? "grid" : "list");
    const handleChange = (event: MediaQueryListEvent) => setView(event.matches ? "grid" : "list");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return [view, setView];
}

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (value: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Choose view">
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-label="List view"
        aria-pressed={value === "list"}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${value === "list" ? "bg-white text-[var(--brand)] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={value === "grid"}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${value === "grid" ? "bg-white text-[var(--brand)] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
      >
        <Grid2X2 className="h-4 w-4" />
      </button>
    </div>
  );
}