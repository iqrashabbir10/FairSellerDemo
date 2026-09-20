"use client";

import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "600", "700", "800"], display: "swap" });

/* ----------------------------------------------------------------------------------------------
 * Sample data
 * -------------------------------------------------------------------------------------------- */

interface Product {
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
}

// Real product photos from the dummyjson demo catalogue (cdn.dummyjson.com).
const p = (name: string, price: number, path: string, oldPrice?: number): Product => ({
  name,
  price,
  oldPrice,
  image: `https://cdn.dummyjson.com/product-images/${path}/thumbnail.webp`,
});

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

const RECOMMENDED: Product = p("Tissot T1601103304600", 264.94, "mens-watches/rolex-cellini-date-black-dial", 274.94);

const LIST_PRODUCTS: Product[] = [
    p("Asus Zenbook Pro Dual Screen Laptop", 1599.47, "laptops/asus-zenbook-pro-dual-screen-laptop", 1799.99),
    p("Longines Master Collection", 1499.99, "mens-watches/longines-master-collection"),
    p("Heshe Women's Leather Bag", 129.99, "womens-bags/heshe-women's-leather-bag"),
    p("Beats Flex Wireless Earphones", 45.99, "mobile-accessories/beats-flex-wireless-earphones", 49.99),
  ];

const LATEST: Product[] = [
    p("Apple MacBook Pro 14 Inch Space Grey", 1839.99, "laptops/apple-macbook-pro-14-inch-space-grey", 1999.99),
    p("Apple Airpods", 129.99, "mobile-accessories/apple-airpods"),
    p("Rolex Cellini Date Black Dial", 8999.99, "mens-watches/rolex-cellini-date-black-dial"),
    p("Black Women's Gown", 116.37, "womens-dresses/black-women's-gown", 129.99),
  ];

const CATEGORY_TILES = [
  { label: "Home", icon: "🏠", bg: "bg-[#FFE9EF]" },
  { label: "Sports", icon: "⚽", bg: "bg-[#E4F6E8]" },
  { label: "Mobile Phones", icon: "📱", bg: "bg-[#E6EEFF]" },
  { label: "Electronics", icon: "💻", bg: "bg-[#FFF3D6]" },
  { label: "Fashion", icon: "👗", bg: "bg-[#F3E8FF]" },
  { label: "Bags", icon: "👜", bg: "bg-[#FFE8DA]" },
  { label: "Automotive", icon: "🚗", bg: "bg-[#E0F4F8]" },
  { label: "Groceries", icon: "🛒", bg: "bg-[#EAF7D9]" },
];

const CATEGORY_SECTIONS: { title: string; items: Product[] }[] = [
  {
    title: "Men Clothing & Fashion",
    items: [
      p("Blue & Black Check Shirt", 29.99, "mens-shirts/blue-&-black-check-shirt"),
      p("Gigabyte Aorus Men Tshirt", 22.99, "mens-shirts/gigabyte-aorus-men-tshirt", 24.99),
      p("Man Plaid Shirt", 34.99, "mens-shirts/man-plaid-shirt"),
      p("Nike Air Jordan 1 Red And Black", 149.99, "mens-shoes/nike-air-jordan-1-red-and-black"),
    ],
  },
  {
    title: "Bags",
    items: [
      p("Blue Women's Handbag", 49.99, "womens-bags/blue-women's-handbag"),
      p("Heshe Women's Leather Bag", 129.99, "womens-bags/heshe-women's-leather-bag"),
      p("Prada Women Bag", 515.45, "womens-bags/prada-women-bag", 599.99),
      p("White Faux Leather Backpack", 39.99, "womens-bags/white-faux-leather-backpack"),
    ],
  },
  {
    title: "Women Clothing & Fashion",
    items: [
      p("Black Women's Gown", 116.37, "womens-dresses/black-women's-gown", 129.99),
      p("Corset Leather With Skirt", 89.99, "womens-dresses/corset-leather-with-skirt"),
      p("Corset With Black Skirt", 79.99, "womens-dresses/corset-with-black-skirt"),
      p("Blue Frock", 29.99, "tops/blue-frock"),
    ],
  },
  {
    title: "Electronics",
    items: [
      p("Apple MacBook Pro 14 Inch Space Grey", 1999.99, "laptops/apple-macbook-pro-14-inch-space-grey"),
      p("Asus Zenbook Pro Dual Screen Laptop", 1599.47, "laptops/asus-zenbook-pro-dual-screen-laptop", 1799.99),
      p("iPhone 5s", 199.99, "smartphones/iphone-5s"),
      p("iPhone 13 Pro", 1099.99, "smartphones/iphone-13-pro"),
    ],
  },
  {
    title: "Musical",
    items: [
      p("Apple Airpods", 129.99, "mobile-accessories/apple-airpods"),
      p("Apple AirPods Max Silver", 549.99, "mobile-accessories/apple-airpods-max-silver"),
      p("Beats Flex Wireless Earphones", 45.99, "mobile-accessories/beats-flex-wireless-earphones", 49.99),
      p("Apple HomePod Mini Cosmic Grey", 99.99, "mobile-accessories/apple-homepod-mini-cosmic-grey"),
    ],
  },
  {
    title: "Beauty, Health & Hair",
    items: [
      p("Essence Mascara Lash Princess", 9.99, "beauty/essence-mascara-lash-princess"),
      p("Eyeshadow Palette with Mirror", 16.35, "beauty/eyeshadow-palette-with-mirror", 19.99),
      p("Powder Canister", 14.99, "beauty/powder-canister"),
      p("Calvin Klein CK One", 49.99, "fragrances/calvin-klein-ck-one"),
    ],
  },
  {
    title: "Sports",
    items: [
      p("Football", 17.99, "sports-accessories/football"),
      p("Basketball", 13.79, "sports-accessories/basketball", 14.99),
      p("Cricket Bat", 29.99, "sports-accessories/cricket-bat"),
      p("Tennis Racket", 49.99, "sports-accessories/tennis-racket"),
    ],
  },
];

const BRANDS = [
  { name: "Nike", type: "Clothing" },
  { name: "Levi's", type: "Clothing" },
  { name: "Ralph Lauren", type: "Clothing" },
  { name: "Calvin Klein", type: "Clothing" },
  { name: "Under Armour", type: "Clothing" },
  { name: "Gap", type: "Clothing" },
  { name: "Apple", type: "Electronics" },
  { name: "Dell", type: "Electronics" },
  { name: "HP", type: "Electronics" },
  { name: "Microsoft", type: "Electronics" },
  { name: "Bose", type: "Audio" },
  { name: "Amazon", type: "Devices" },
];

const SLIDES = [
  { kicker: "Mega Sale", title: "Up to 40% off electronics", cta: "Shop deals", gradient: "from-[#E6302D] to-[#FF7A45]" },
  { kicker: "New Season", title: "Fresh fashion just landed", cta: "Explore now", gradient: "from-[#C92320] to-[#F0603A]" },
  { kicker: "Free Delivery", title: "On every order over $50", cta: "Start shopping", gradient: "from-[#E6302D] to-[#FFA24C]" },
];

const QUICK_LINKS = ["Profile Info", "Featured Products", "Best Selling Product", "Latest Products", "Top Rated Product", "Track Order"];
const OTHER_LINKS = ["About Us", "Terms And Conditions", "Privacy Policy", "Refund Policy", "Return Policy", "Cancellation Policy"];

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6302D] focus-visible:ring-offset-2";

/* ----------------------------------------------------------------------------------------------
 * Icons
 * -------------------------------------------------------------------------------------------- */

interface IconProps {
  className?: string;
}

const svgProps = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const SearchIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...svgProps}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const LockIcon = ({ className = "h-6 w-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...svgProps}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    <circle cx="12" cy="16" r="1" />
  </svg>
);
const ArrowRightIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...svgProps}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);
const TruckIcon = ({ className = "h-7 w-7" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...svgProps}>
    <path d="M14 17V5H2v12h3" />
    <path d="M14 8h4l4 4v5h-3" />
    <circle cx="7.5" cy="17.5" r="2" />
    <circle cx="17.5" cy="17.5" r="2" />
  </svg>
);
const ShieldIcon = ({ className = "h-7 w-7" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...svgProps}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const TrophyIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...svgProps}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);
const StarIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
  </svg>
);

/* ----------------------------------------------------------------------------------------------
 * Small building blocks
 * -------------------------------------------------------------------------------------------- */

// Fades a block in the first time it scrolls into view. Reduced-motion users get it immediately (see CSS).
function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`ez-reveal ${shown ? "ez-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

// Product image with a soft gradient + initial when the picture can't be loaded.
function ProductImage({ name, src, sizes, className = "" }: { name: string; src: string; sizes: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FDECEE] to-[#E6EEFF] text-3xl font-bold text-[#E6302D] ${className}`} role="img" aria-label={name}>
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return <Image src={src} alt={name} fill sizes={sizes} className={`object-contain ${className}`} onError={() => setFailed(true)} />;
}

const discountLabel = (product: Product) => (product.oldPrice ? `-${money(product.oldPrice - product.price)}` : null);

function SectionTitle({ title, icon, href = "#" }: { title: string; icon?: ReactNode; href?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-[#1E2230]">
          {icon}
          {title}
        </h2>
        <span className="mt-1.5 block h-[3px] w-10 rounded-full bg-[#E6302D]" aria-hidden="true" />
      </div>
      <Link href={href} className={`shrink-0 rounded text-sm font-semibold text-[#E6302D] hover:text-[#C92320] ${FOCUS}`}>
        View All &gt;
      </Link>
    </div>
  );
}

function CategoryHeading({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-[#1E2230]">{title}</h2>
      <Link href="#" className={`shrink-0 rounded text-sm font-semibold text-[#E6302D] hover:text-[#C92320] ${FOCUS}`}>
        View All &gt;
      </Link>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const badge = discountLabel(product);
  return (
    <Link
      href="#"
      className={`group block overflow-hidden rounded-lg border border-[#E6E9F2] bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${FOCUS}`}
    >
      <div className="relative aspect-square overflow-hidden bg-white p-2">
        <div className="relative h-full w-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <ProductImage name={product.name} src={product.image} sizes="(min-width:1280px) 300px, (min-width:640px) 24vw, 46vw" />
        </div>
        {badge && <span className="absolute left-2 top-2 rounded bg-[#E6302D] px-2 py-0.5 text-xs font-bold text-white">{badge}</span>}
      </div>
      <div className="border-t border-[#E6E9F2] px-3 pb-3 pt-2.5 text-center">
        <h3 className="truncate text-sm font-semibold text-[#1E2230]" title={product.name}>
          {product.name}
        </h3>
        <p className="mt-1 flex items-baseline justify-center gap-2">
          {product.oldPrice && <span className="text-xs text-[#6B7280] line-through">{money(product.oldPrice)}</span>}
          <span className="text-base font-bold text-[#1E2230]">{money(product.price)}</span>
        </p>
      </div>
    </Link>
  );
}

function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((product) => (
        <ProductCard key={product.name} product={product} />
      ))}
    </div>
  );
}

function ListCard({ product, badge }: { product: Product; badge?: string }) {
  return (
    <Link
      href="#"
      className={`group flex min-w-[268px] snap-start items-center gap-3 rounded-lg border border-[#E6E9F2] bg-white p-3 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-w-0 ${FOCUS}`}
    >
      <div className="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-lg bg-[#FDECEE]">
        <div className="relative h-full w-full p-1.5 transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <ProductImage name={product.name} src={product.image} sizes="90px" />
        </div>
        {badge && <span className="absolute left-0 top-0 rounded-br-lg bg-[#E6302D] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">{badge}</span>}
      </div>
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#1E2230]">{product.name}</h3>
        <p className="mt-1.5 text-base font-bold text-[#E6302D]">{money(product.price)}</p>
      </div>
    </Link>
  );
}

function ListSection({ title, icon, items, badge }: { title: string; icon?: ReactNode; items: Product[]; badge?: string }) {
  return (
    <section className="bg-white" aria-label={title}>
      <Reveal className="mx-auto max-w-[1280px] px-4 py-5">
        <SectionTitle title={title} icon={icon} />
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {items.map((product) => (
            <ListCard key={product.name} product={product} badge={badge} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ----------------------------------------------------------------------------------------------
 * Header
 * -------------------------------------------------------------------------------------------- */

function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${scrolled ? "shadow-md" : "shadow-none"}`}>
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-3">
        <Link href="/store" className={`shrink-0 rounded text-2xl font-extrabold tracking-tight text-[#E6302D] ${FOCUS}`} aria-label="WayFair home">
          Way<span className="text-[#1E2230]">Fair</span>
        </Link>

        <form role="search" onSubmit={(event) => event.preventDefault()} className="relative min-w-0 flex-1">
          <label htmlFor="ez-search" className="sr-only">
            Search products
          </label>
          <input
            id="ez-search"
            type="search"
            placeholder="Search products, brands and more"
            className="h-11 w-full rounded-full border border-[#E6E9F2] bg-[#EDF0F9] pl-4 pr-12 text-sm text-[#1E2230] outline-none transition placeholder:text-[#6B7280] focus:border-[#E6302D] focus:bg-white focus:ring-2 focus:ring-[#E6302D]/20"
          />
          <button type="submit" aria-label="Search" className={`absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#E6302D] text-white transition hover:bg-[#C92320] ${FOCUS}`}>
            <SearchIcon className="h-4 w-4" />
          </button>
        </form>

      </div>
    </header>
  );
}

/* ----------------------------------------------------------------------------------------------
 * Hero slider
 * -------------------------------------------------------------------------------------------- */

function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion]);

  const go = (next: number) => setIndex((next + SLIDES.length) % SLIDES.length);

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStart.current = event.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    setPaused(false);
    if (start === null) return;
    const delta = event.changedTouches[0].clientX - start;
    if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1));
  };

  return (
    <section aria-roledescription="carousel" aria-label="Promotions" className="bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-3">
        <div
          className="relative overflow-hidden rounded-lg"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${index * 100}%)` }}>
            {SLIDES.map((slide, i) => (
              <div key={slide.title} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`} aria-hidden={i !== index} className={`relative min-h-[170px] w-full shrink-0 bg-gradient-to-br ${slide.gradient} p-6 text-white sm:min-h-[240px] sm:p-10 lg:min-h-[300px]`}>
                <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-16 right-16 h-40 w-40 rounded-full bg-white/10" aria-hidden="true" />
                <div className="relative max-w-md">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/85">{slide.kicker}</p>
                  <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-4xl">{slide.title}</h2>
                  <Link href="#" tabIndex={i === index ? 0 : -1} className="mt-4 inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-bold text-[#E6302D] transition hover:bg-[#FDECEE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#E6302D]">
                    {slide.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {SLIDES.map((slide, i) => (
              <button key={slide.title} type="button" onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} aria-current={i === index} className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${i === index ? "w-6 bg-white" : "w-2 bg-white/50"}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// A friendly call-to-action under the slider that leads sellers and admins to the login page.
function LoginTile() {
  const perks = ["Manage your products", "Track your orders", "Withdraw your earnings"];
  return (
    <section className="bg-white" aria-label="Sign in">
      <Reveal className="mx-auto max-w-[1280px] px-4 py-5">
        <div className="relative overflow-hidden rounded-2xl border border-[#F3C9C7] bg-gradient-to-br from-[#FFF4F2] via-white to-[#FDECEE] p-5 shadow-sm sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#E6302D]/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-14 right-24 h-36 w-36 rounded-full bg-[#FF7A45]/10" aria-hidden="true" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E6302D] to-[#FF7A45] text-white shadow-lg shadow-[#E6302D]/30">
                <LockIcon className="h-7 w-7" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E6302D]">Sellers &amp; admins</p>
                <h2 className="mt-1 text-xl font-extrabold leading-tight text-[#1E2230] sm:text-2xl">Already selling with WayFair?</h2>
                <p className="mt-1 max-w-xl text-sm text-[#6B7280]">Sign in to your account to pick up where you left off.</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {perks.map((perk) => (
                    <li key={perk} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1E2230] ring-1 ring-[#E6E9F2]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E6302D]" aria-hidden="true" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
              <Link
                href="/"
                className={`group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#E6302D] px-8 text-base font-bold text-white shadow-lg shadow-[#E6302D]/25 transition hover:bg-[#C92320] active:scale-95 motion-reduce:transition-none ${FOCUS}`}
              >
                Login
                <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
              </Link>
              <p className="text-center text-xs text-[#6B7280] sm:text-right">
                New here?{" "}
                <Link href="/auth/seller-register" className={`rounded font-semibold text-[#E6302D] hover:underline ${FOCUS}`}>
                  Register your store
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ----------------------------------------------------------------------------------------------
 * Page
 * -------------------------------------------------------------------------------------------- */

export default function StorePage() {
  const bestSelling = [LIST_PRODUCTS[1], LIST_PRODUCTS[3], LIST_PRODUCTS[0], LIST_PRODUCTS[2]];
  const recommendedBadge = discountLabel(RECOMMENDED);

  return (
    <div className={`${openSans.className} min-h-screen overflow-x-clip bg-[#EDF0F9] text-[#1E2230]`}>
      <Header />

      <main className="space-y-2.5 pb-2.5">
        <HeroSlider />

        <LoginTile />

        {/* Categories */}
        <section className="bg-white" aria-label="Shop by category">
          <Reveal className="mx-auto max-w-[1280px] px-4 py-5">
            <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:justify-between sm:px-0 [&::-webkit-scrollbar]:hidden">
              {CATEGORY_TILES.map((tile) => (
                <li key={tile.label} className="shrink-0">
                  <Link href="#" className={`group flex w-[72px] flex-col items-center gap-2 rounded-lg text-center ${FOCUS}`}>
                    <span className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md group-active:scale-95 motion-reduce:transition-none ${tile.bg}`} aria-hidden="true">
                      {tile.icon}
                    </span>
                    <span className="text-xs font-semibold leading-tight text-[#1E2230]">{tile.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* Recommended product */}
        <section className="bg-white" aria-label="Recommended product">
          <Reveal className="mx-auto max-w-[1280px] px-4 py-5">
            <div className="mx-auto max-w-md rounded-lg border border-[#B9D2F2] p-5 text-center">
              <h2 className="text-base font-extrabold uppercase tracking-wide text-[#E6302D]">Recommended Product</h2>
              <div className="relative mx-auto mt-4 aspect-square w-full max-w-[280px]">
                <ProductImage name={RECOMMENDED.name} src={RECOMMENDED.image} sizes="280px" />
                {recommendedBadge && <span className="absolute left-0 top-0 rounded bg-[#E6302D] px-2.5 py-1 text-sm font-bold text-white">{recommendedBadge}</span>}
              </div>
              <h3 className="mt-4 text-base font-semibold">{RECOMMENDED.name}</h3>
              <p className="mt-1 flex items-baseline justify-center gap-2">
                {RECOMMENDED.oldPrice && <span className="text-sm text-[#6B7280] line-through">{money(RECOMMENDED.oldPrice)}</span>}
                <span className="text-xl font-extrabold">{money(RECOMMENDED.price)}</span>
              </p>
              <button type="button" className={`mt-4 inline-flex h-11 min-w-44 items-center justify-center rounded-full bg-[#E6302D] px-6 text-sm font-bold text-white transition hover:bg-[#C92320] active:scale-95 motion-reduce:transition-none ${FOCUS}`}>
                Grab This Deal
              </button>
            </div>
          </Reveal>
        </section>

        {/* Latest products */}
        <section className="bg-white" aria-label="Latest products">
          <Reveal className="mx-auto max-w-[1280px] px-4 py-5">
            <SectionTitle title="Latest Products" />
            <ProductGrid items={LATEST} />
          </Reveal>
        </section>

        <ListSection title="Best Sellings" icon={<span className="text-[#F5B301]"><TrophyIcon /></span>} items={bestSelling} />

        {/* Home decor banner */}
        <section className="bg-white" aria-label="Home décor promotion">
          <Reveal className="mx-auto max-w-[1280px] px-4 py-5">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F6E7CB] via-[#EBCB8B] to-[#D9A441] p-6 sm:p-10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/30" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-[#B8862B]/20" aria-hidden="true" />
              <div className="pointer-events-none absolute bottom-4 right-6 hidden h-24 w-24 rotate-12 rounded-2xl border-4 border-white/50 sm:block" aria-hidden="true" />
              <div className="relative max-w-lg">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[#7A5A12]">
                  <span className="text-[#F5B301]"><StarIcon /></span> 4.5 rated by shoppers
                </span>
                <h2 className="mt-3 text-2xl font-extrabold leading-tight text-[#3A2A08] sm:text-3xl">WayFair Home Décor - Upgrade Your Space with Style</h2>
                <Link href="#" className={`mt-5 inline-flex h-11 items-center rounded-full bg-[#3A2A08] px-6 text-sm font-bold text-white transition hover:bg-black active:scale-95 motion-reduce:transition-none ${FOCUS}`}>
                  Shop now
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Brands */}
        <section className="bg-white" aria-label="Popular brands">
          <Reveal className="mx-auto max-w-[1280px] px-4 py-5">
            <h2 className="mb-4 text-xl font-bold">Top Brands</h2>
            <div className="ez-marquee-wrap overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
              <ul className="ez-marquee flex w-max gap-4">
                {[...BRANDS, ...BRANDS].map((brand, i) => (
                  <li
                    key={`${brand.name}-${i}`}
                    aria-hidden={i >= BRANDS.length}
                    className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border border-[#E6E9F2] bg-white px-2 text-center shadow-sm"
                  >
                    <span className="text-[11px] font-extrabold uppercase leading-tight tracking-wide text-[#1E2230]">{brand.name}</span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[#6B7280]">{brand.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>

        {/* Category sections */}
        {CATEGORY_SECTIONS.map((section) => (
          <section key={section.title} className="bg-white" aria-label={section.title}>
            <Reveal className="mx-auto max-w-[1280px] px-4 py-5">
              <CategoryHeading title={section.title} />
              <ProductGrid items={section.items} />
            </Reveal>
          </section>
        ))}

        {/* Trust strip */}
        <section className="bg-white" aria-label="Our promises">
          <Reveal className="mx-auto grid max-w-[1280px] gap-4 px-4 py-5 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-lg bg-[#FDECEE] p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#E6302D]"><TruckIcon /></span>
              <div>
                <h3 className="font-bold">Fast Delivery</h3>
                <p className="text-sm text-[#6B7280]">all across the country</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg bg-[#FDECEE] p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#E6302D]"><ShieldIcon /></span>
              <div>
                <h3 className="font-bold">Safe Payment</h3>
                <p className="text-sm text-[#6B7280]">100% protected checkout</p>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#E6302D] text-white">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5">
            <span className="inline-block rounded-lg bg-gradient-to-br from-white to-[#FFD9D6] px-4 py-2 text-xl font-extrabold tracking-widest text-[#E6302D]">WAYFAIR</span>
            <div>
              <Link href="/auth/seller-register" className={`inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-[#E6302D] transition hover:bg-[#FDECEE] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#E6302D]`}>
                Register Your store
              </Link>
            </div>
          </div>

          <nav aria-label="Quick links">
            <h3 className="text-sm font-extrabold uppercase tracking-wide">Quick Links</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {QUICK_LINKS.map((label) => (
                <li key={label}><Link href="#" className="rounded text-white/90 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{label}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Other links">
            <h3 className="text-sm font-extrabold uppercase tracking-wide">Other</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {OTHER_LINKS.map((label) => (
                <li key={label}><Link href="#" className="rounded text-white/90 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{label}</Link></li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide">Start A Conversation</h3>
            <address className="mt-3 space-y-2 text-sm not-italic text-white/90">
             <p><a href="mailto:supportwayfair@gmail.com" className="rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">supportwayfair@gmail.com</a></p>
              <p><Link href="#" className="rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Support ticket</Link></p>
              <p>123 Main St, New York, NY 10001, USA</p>
            </address>
          </div>
        </div>
        <div className="border-t border-white/20 px-4 py-4 text-center text-xs text-white/85">Copyright: WayFair@{new Date().getFullYear()}</div>
      </footer>

      <style jsx global>{`
        .ez-reveal {
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .ez-reveal.ez-visible {
          opacity: 1;
          transform: none;
        }
        @keyframes ez-marquee {
          to {
            transform: translateX(calc(-50% - 0.5rem));
          }
        }
        .ez-marquee {
          animation: ez-marquee 36s linear infinite;
        }
        .ez-marquee-wrap:hover .ez-marquee {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .ez-reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
          .ez-marquee {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
