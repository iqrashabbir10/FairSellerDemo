"use client";

import { useState } from "react";
import { resolveApiUrl } from "@/lib/api/client";
import { ProductImage } from "./ProductImage";
import { ImageGalleryModal } from "./ImageGalleryModal";

// Shared thumbnail for anything backed by imageUrls: shows the first photo, falls back to the
// placeholder on empty/broken images, and opens a lightbox gallery when there are photos to view.
export function ProductThumbnail({
  name,
  imageUrls,
  className = "h-28 w-full",
  bare = false,
}: {
  name: string;
  imageUrls?: string[];
  className?: string;
  bare?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const validUrls = (imageUrls ?? []).filter(Boolean);
  const hasImage = validUrls.length > 0 && !broken;
  const firstUrl = hasImage ? resolveApiUrl(validUrls[0]) : null;

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          if (!hasImage) return;
          event.stopPropagation();
          setGalleryOpen(true);
        }}
        className={`relative block overflow-hidden rounded-xl ${bare ? "" : "mb-4"} ${className} ${hasImage ? "cursor-zoom-in" : "cursor-default"}`}
        aria-label={hasImage ? `View ${name} photos` : name}
      >
        {hasImage && firstUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={firstUrl} alt={name} loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
        ) : (
          <ProductImage name={name} className="h-full w-full" bare />
        )}
      </button>
      {galleryOpen && hasImage && <ImageGalleryModal name={name} imageUrls={validUrls} onClose={() => setGalleryOpen(false)} />}
    </>
  );
}
