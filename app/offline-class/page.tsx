"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ArrowUpDown, MapPin, ExternalLink } from "lucide-react";
import type { PhysicalClass } from "@/types/physical-class";
import ClassCard from "@/components/offline-classes/ClassCard";
import EmptyState from "@/components/offline-classes/EmptyState";
import CountdownBanner from "@/components/offline-classes/CountdownBanner";

type SortOption = "soonest" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortOption, string> = {
  soonest: "Starting Soonest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
};

const BRAND = {
  navy: "#1E2E6B",
  navyDeep: "#152252",
  orange: "#F5821F",
};

const MAPS_URL =
  "https://www.google.com/maps/place/Gyan+Hub+Pvt.+Ltd/@27.6920528,85.3336796,17z/data=!3m1!4b1!4m6!3m5!1s0x39eb1990925a6f83:0xaec6838aa0bdb23d!8m2!3d27.6920528!4d85.3362545!16s%2Fg%2F11nqx_l7r9?entry=ttu&g_ep=EgoyMDI2MDYyOS4wIKXMDSoASAFQAw%3D%3D";

function enrollHref(cls: PhysicalClass): string {
  const identifier = cls.course_code || cls.id;
  return `/offline-class/${encodeURIComponent(identifier)}`;
}

export default function OfflineClassesPage() {
  const [classes, setClasses] = useState<PhysicalClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("soonest");

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/physicalcourses", { cache: "no-store" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("API did not return an array.");
      setClasses(data);
    } catch (err) {
      console.error("Failed to load physical courses:", err);
      setError(err instanceof Error ? err.message : "Couldn't load the class schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const professionalClasses = useMemo(
    () => classes.filter((c) => c.category === "Professional Training"),
    [classes]
  );

  const nextUpcoming = useMemo(() => {
    const now = new Date();
    const upcoming = professionalClasses
      .filter((c) => c.is_active && new Date(c.start_date) > now)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    return upcoming[0] ?? null;
  }, [professionalClasses]);

  const visibleClasses = useMemo(() => {
    let list = professionalClasses;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.course_code && c.course_code.toLowerCase().includes(q)) ||
          (c.instructor_name ?? "").toLowerCase().includes(q)
      );
    }
    const effectivePrice = (c: PhysicalClass) => c.discount_price ?? c.price;
    switch (sortBy) {
      case "price-asc":
        list = [...list].sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case "price-desc":
        list = [...list].sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case "soonest":
      default:
        list = [...list].sort(
          (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
        break;
    }
    return list;
  }, [professionalClasses, query, sortBy]);

  return (
    <div
      className="min-h-screen bg-[#F7F8FC]"
      style={{
        ["--accent" as string]: BRAND.orange,
        ["--primary" as string]: BRAND.navy,
      }}
    >
      <CountdownBanner nextClass={nextUpcoming} />

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-[#1E2E6B]/8 bg-gradient-to-br from-[#152252] via-[#1E2E6B] to-[#1E2E6B]">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: BRAND.orange }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          
          {/* UPDATED: Explicitly setting the styles directly on the span and passing 
            the color props into the Lucide icons so Tailwind cannot override it.
          */}
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#F5821F]/40 bg-[#F5821F]/10 px-3 py-1 font-mono text-xs uppercase tracking-widest transition hover:border-[#F5821F] hover:bg-[#F5821F]/20"
            style={{ color: BRAND.orange }}
          >
            <MapPin size={13} className="shrink-0" color={BRAND.orange} />
            <span style={{ color: BRAND.orange }}>Near Eyeplex Mall, New Baneshwor</span>
            <ExternalLink size={11} className="shrink-0 opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" color={BRAND.orange} />
          </a>
          
          <h1 className="font-serif text-3xl font-semibold leading-tight text-white sm:text-5xl">
            Classroom Training Schedule<br />
            <span style={{ color: BRAND.orange }}>New Baneshwor</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-white/80 sm:text-base">
            Walk-in and reserve a seat for our upcoming professional training batches, taught on-campus at our New Baneshwor centre.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND.orange }} />
              {professionalClasses.length} Professional Training Batch{professionalClasses.length !== 1 && "es"}
            </div>
            
            {/* UPDATED: Applied bulletproof inline colors here too for consistency */}
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide shadow-lg shadow-black/20 transition hover:brightness-110 active:scale-[0.98]"
              style={{ background: BRAND.orange, color: BRAND.navyDeep }}
            >
              <MapPin size={14} className="shrink-0" color={BRAND.navyDeep} />
              <span style={{ color: BRAND.navyDeep }}>Get Directions</span>
              <ExternalLink size={12} className="shrink-0 transition group-hover:translate-x-0.5" color={BRAND.navyDeep} />
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search professional training…"
              className="w-full rounded-full border border-[#1E2E6B]/12 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-[color:var(--accent)] focus:ring-1 focus:ring-[color:var(--accent)]"
            />
          </div>
          <div className="relative w-full sm:w-56">
            <ArrowUpDown size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full appearance-none rounded-full border border-[#1E2E6B]/12 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-[color:var(--accent)] focus:ring-1 focus:ring-[color:var(--accent)]"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <option key={opt} value={opt}>{SORT_LABELS[opt]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[520px] animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center text-sm text-rose-700">
            {error}
            <button
              onClick={fetchClasses}
              className="mt-4 block w-full rounded-full bg-rose-600 py-2 font-semibold text-white transition hover:bg-rose-700"
            >
              Try Again
            </button>
          </div>
        ) : visibleClasses.length === 0 ? (
          <EmptyState onRefresh={fetchClasses} />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleClasses.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="flex h-full flex-col" 
                >
                  <Link
                    href={enrollHref(cls)}
                    aria-label={`Reserve a seat for ${cls.title}`}
                    className="flex h-full flex-col block rounded-2xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2"
                  >
                    <ClassCard cls={cls} />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}