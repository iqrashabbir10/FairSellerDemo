"use client";

import { Check, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { THEMES, THEME_STORAGE_KEY, applyTheme, savedTheme, type Theme } from "@/lib/themes";

export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Theme>(THEMES[0]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const theme = savedTheme();
    setCurrent(theme);
    applyTheme(theme);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectTheme = (theme: Theme) => {
    applyTheme(theme);
    setCurrent(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.value);
    } catch {
      // storage blocked — the colour still applies for this session
    }
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Change theme color"
        aria-expanded={open}
        title="Theme color"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition hover:bg-white/20"
      >
        <Palette className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl">
          <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Theme color</div>
          <div className="grid grid-cols-1 gap-1">
            {THEMES.map((theme) => {
              const active = theme.value === current.value;
              return (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => selectTheme(theme)}
                  aria-pressed={active}
                  className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition hover:bg-slate-50 ${active ? "bg-slate-50 font-semibold" : ""}`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-white shadow ring-1 ring-slate-200" style={{ backgroundColor: theme.value }}>
                    {active && <Check className="h-4 w-4" />}
                  </span>
                  {theme.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
