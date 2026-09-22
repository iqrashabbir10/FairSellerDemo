import Image from "next/image";

const SIZES = {
  sm: { box: 32, text: "text-base" },
  md: { box: 40, text: "text-lg" },
  lg: { box: 56, text: "text-2xl" },
} as const;

const SRC = {
  brand: "/brand/logo-mark-transparent.png",
  white: "/brand/logo-mark-white.png",
} as const;

/**
 * The WayFair mark, transparent background. Pass tone="white" on saturated/dark surfaces (the
 * purple header bar, the red store footer) where the brand-purple mark would lose contrast against
 * a similarly-toned background — everywhere else the default brand tone has full contrast on its own.
 */
export function Logo({
  size = "md",
  tone = "brand",
  withWordmark = true,
  className = "",
  wordmarkClassName = "",
}: {
  size?: keyof typeof SIZES;
  tone?: keyof typeof SRC;
  withWordmark?: boolean;
  className?: string;
  /** Extra classes on the wordmark span only — e.g. "hidden sm:inline" to drop it on the tightest headers. */
  wordmarkClassName?: string;
}) {
  const { box, text } = SIZES[size];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* unoptimized: a tiny, fixed-size local icon — one plain request beats next/image's responsive
          srcset picking a variant the browser then fails to swap in at small sizes/DPR>1. */}
      <Image
        src={SRC[tone]}
        alt=""
        width={box}
        height={box}
        style={{ width: box, height: box }}
        className="shrink-0 object-contain"
        priority
        unoptimized
      />
      {withWordmark && <span className={`font-semibold tracking-tight text-inherit ${text} ${wordmarkClassName}`}>WayFair</span>}
    </span>
  );
}
