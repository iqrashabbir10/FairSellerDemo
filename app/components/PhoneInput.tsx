"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { AsYouType, getCountries, getCountryCallingCode, getExampleNumber, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import { Check, ChevronDown, Globe, Search } from "lucide-react";

// Flags are SVGs from country-flag-icons; the module is large, so it is loaded lazily and shared.
type FlagComponent = ComponentType<{ className?: string; title?: string }>;
let flagsModule: Promise<Record<string, FlagComponent>> | null = null;
const loadFlags = () => (flagsModule ??= import("country-flag-icons/react/3x2").then((mod) => mod as unknown as Record<string, FlagComponent>));

function Flag({ code, className = "h-4 w-6" }: { code: CountryCode; className?: string }) {
  const [flags, setFlags] = useState<Record<string, FlagComponent> | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadFlags().then((mod) => !cancelled && setFlags(mod));
    return () => {
      cancelled = true;
    };
  }, []);
  const Component = flags?.[code];
  return Component ? <Component className={`${className} rounded-[3px] shadow-sm ring-1 ring-black/10`} /> : <span className={`${className} inline-block rounded-[3px] bg-slate-200`} />;
}

interface CountryOption {
  code: CountryCode;
  name: string;
  dial: string;
}

function buildCountries(exclude: readonly CountryCode[]): CountryOption[] {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([typeof navigator !== "undefined" ? navigator.language : "en"], { type: "region" });
  } catch {
    names = null;
  }
  return getCountries()
    .filter((code) => !exclude.includes(code))
    .map((code) => ({ code, name: names?.of(code) ?? code, dial: `+${getCountryCallingCode(code)}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const exampleFor = (country: CountryCode) => getExampleNumber(country, examples)?.formatNational() ?? "";

/**
 * International phone field: a country picker (flag + dial code) and a number box that formats as you type
 * for the chosen country. Emits the number in E.164 (e.g. +923001234567) plus whether it is a valid number.
 */
export function PhoneInput({
  id,
  defaultCountry = "US",
  excludeCountries,
  onChange,
  invalid = false,
}: {
  id?: string;
  defaultCountry?: CountryCode;
  /** Countries that are left out of the picker entirely. */
  excludeCountries?: readonly CountryCode[];
  onChange: (e164: string, valid: boolean) => void;
  invalid?: boolean;
}) {
  // Callers usually pass an inline array, so key the memo on its contents rather than its identity.
  const excludeKey = (excludeCountries ?? []).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const countries = useMemo(() => buildCountries(excludeCountries ?? []), [excludeKey]);
  const [country, setCountry] = useState<CountryCode>(defaultCountry);
  const [display, setDisplay] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const previousDigits = useRef("");

  const selected = countries.find((c) => c.code === country);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase().replace(/^\+/, "");
    if (!term) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(term) || c.dial.slice(1).startsWith(term) || c.code.toLowerCase() === term);
  }, [countries, query]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setHighlight(Math.max(0, filtered.findIndex((c) => c.code === country)));
  }, [open, query, filtered, country]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`)?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const emit = (raw: string, forCountry: CountryCode) => {
    const parsed = parsePhoneNumberFromString(raw, forCountry);
    onChange(parsed?.number ?? "", !!parsed?.isValid());
  };

  const format = (raw: string, forCountry: CountryCode) => {
    if (raw.startsWith("+")) {
      const typer = new AsYouType();
      const text = typer.input(raw);
      return { text, country: typer.getNumber()?.country ?? typer.getCountry() };
    }
    return { text: new AsYouType(forCountry).input(raw), country: forCountry };
  };

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    let raw = event.target.value.replace(/[^\d+]/g, "");
    // Deleting only a separator (space, bracket, dash) would re-format back to the same text and get stuck,
    // so treat that as deleting the last digit instead.
    if (event.target.value.length < display.length && raw === previousDigits.current) raw = raw.slice(0, -1);
    if (raw.replace(/\D/g, "").length > 15) return;
    const { text, country: detected } = format(raw, country);
    previousDigits.current = raw;
    setDisplay(text);
    // Pasting "+44…" switches the flag to that country.
    const nextCountry = raw.startsWith("+") && detected ? detected : country;
    if (nextCountry !== country) setCountry(nextCountry);
    emit(raw, nextCountry);
  };

  const chooseCountry = (next: CountryCode) => {
    setCountry(next);
    setOpen(false);
    setQuery("");
    // Re-format whatever was typed for the new country.
    const digits = previousDigits.current.replace(/^\+/, "");
    const { text } = format(digits, next);
    setDisplay(text);
    previousDigits.current = digits;
    emit(digits, next);
  };

  const onListKey = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = filtered[highlight];
      if (target) chooseCountry(target.code);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`flex items-stretch rounded-xl border bg-slate-50 transition focus-within:bg-white focus-within:ring-4 ${
          invalid ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100" : "border-slate-200 focus-within:border-[var(--brand)] focus-within:ring-[var(--brand)]/10"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={`Country: ${selected?.name ?? country}, dial code ${selected?.dial ?? ""}. Change country`}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="flex shrink-0 items-center gap-2 rounded-l-xl border-r border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-100"
        >
          <Flag code={country} />
          <span className="font-medium tabular-nums">{selected?.dial}</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
        </button>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={display}
          onChange={handleInput}
          placeholder={exampleFor(country) || "Phone number"}
          aria-invalid={invalid}
          className="min-w-0 flex-1 rounded-r-xl bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-auto sm:w-80" onKeyDown={onListKey}>
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              aria-label="Search countries"
              className="w-full rounded-xl bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:bg-white"
            />
          </div>
          <ul ref={listRef} role="listbox" aria-label="Countries" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="flex items-center gap-2 px-4 py-6 text-sm text-slate-500"><Globe className="h-4 w-4" />No matching country</li>
            ) : (
              filtered.map((option, index) => (
                <li key={option.code} data-index={index} role="option" aria-selected={option.code === country}>
                  <button
                    type="button"
                    onClick={() => chooseCountry(option.code)}
                    onMouseEnter={() => setHighlight(index)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${index === highlight ? "bg-slate-100" : ""}`}
                  >
                    <Flag code={option.code} />
                    <span className="min-w-0 flex-1 truncate text-slate-800">{option.name}</span>
                    <span className="tabular-nums text-slate-500">{option.dial}</span>
                    {option.code === country && <Check className="h-4 w-4 text-[var(--brand)]" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
