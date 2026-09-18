"use client";

import { Palette } from "lucide-react";
import { useEffect, useState } from "react";

const themes = [
  { name: "Coral", value: "#f0563f", hover: "#dc4b34" },
  { name: "Ocean", value: "#147d92", hover: "#0f6678" },
  { name: "Forest", value: "#2f8061", hover: "#25664d" },
  { name: "Plum", value: "#8b4f70", hover: "#713f5b" },
];

export function ThemePicker() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = themes.find((theme) => theme.value === localStorage.getItem("wayfeir-theme"));
    if (saved) {
      document.documentElement.style.setProperty("--brand", saved.value);
      document.documentElement.style.setProperty("--brand-hover", saved.hover);
    }
  }, []);

  const selectTheme = (theme: (typeof themes)[number]) => {
    document.documentElement.style.setProperty("--brand", theme.value);
    document.documentElement.style.setProperty("--brand-hover", theme.hover);
    localStorage.setItem("wayfeir-theme", theme.value);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Change theme color"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition hover:bg-white/20"
      >
        <Palette className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 flex gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          {themes.map((theme) => (
            <button
              key={theme.name}
              type="button"
              onClick={() => selectTheme(theme)}
              aria-label={`${theme.name} theme`}
              className="h-7 w-7 rounded-full border-2 border-white shadow ring-1 ring-slate-200 transition hover:scale-110"
              style={{ backgroundColor: theme.value }}
            />
          ))}
        </div>
      )}
    </div>
  );
}