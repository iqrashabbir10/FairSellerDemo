"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { resolveApiUrl } from "@/lib/api/client";

export function ImageGalleryModal({ name, imageUrls, onClose }: { name: string; imageUrls: string[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const urls = imageUrls.map((url) => resolveApiUrl(url)).filter((url): url is string => !!url);

  if (urls.length === 0) return null;
  const current = urls[Math.min(index, urls.length - 1)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 rounded-lg p-1.5 text-white hover:bg-white/10" aria-label="Close gallery">
          <X className="h-5 w-5" />
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current} alt={`${name} photo ${index + 1}`} loading="lazy" className="max-h-[70vh] w-full rounded-2xl bg-white object-contain" />

        {urls.length > 1 && (
          <>
            <button
              onClick={() => setIndex((i) => (i - 1 + urls.length) % urls.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-700 hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % urls.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-700 hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="mt-3 flex justify-center gap-2">
              {urls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url + i}
                  src={url}
                  alt=""
                  loading="lazy"
                  onClick={() => setIndex(i)}
                  className={`h-14 w-14 cursor-pointer rounded-lg border-2 object-cover ${i === index ? "border-[var(--brand)]" : "border-transparent opacity-70"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
