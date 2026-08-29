"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  ArrowUpDown,
  MapPin,
  ExternalLink,
  PlayCircle,
  Star,
  Quote,
  Calendar,
  Clock,
  Layers,
  User,
  ArrowRight,
  Flame,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { PhysicalClass } from "@/types/physical-class";
import EmptyState from "@/components/offline-classes/EmptyState";
import CountdownBanner from "@/components/offline-classes/CountdownBanner";
import NepaliDate from "nepali-date-converter";
import { createClient } from "@supabase/supabase-js";

type SortOption = "soonest" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortOption, string> = {
  soonest: "Starting Soonest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
};

const TOKENS = {
  ink: "#1B1B18",
  paper: "#FAF7F0",
  classroomBlue: "#2E4057",
  chalkOrange: "#E8622C",
  signYellow: "#F4B942",
};

/* ------------------------------------------------------------------ */
/* DATE HELPERS                                                       */
/* ------------------------------------------------------------------ */

function formatBsDateShort(dateStr: string | null): string | null {
  if (!dateStr) return null;

  try {
    const bs = new NepaliDate(new Date(dateStr));
    return bs.format("DD MMMM YYYY", "np");
  } catch {
    return null;
  }
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "TBA";

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return "TBA";
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatNPR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "—";
  }

  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function discountPercent(
  full: number,
  discounted: number | null | undefined
): number | null {
  if (!discounted || discounted >= full || full <= 0) {
    return null;
  }

  return Math.round(((full - discounted) / full) * 100);
}

/* ------------------------------------------------------------------ */
/* COUNTDOWN                                                          */
/* ------------------------------------------------------------------ */

function useCountdown(targetDate: string | null) {
  const [remaining, setRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  } | null>(null);

  useEffect(() => {
    if (!targetDate) {
      setRemaining(null);
      return;
    }

    const target = new Date(targetDate).getTime();

    if (Number.isNaN(target)) {
      setRemaining(null);
      return;
    }

    function tick() {
      const diff = target - Date.now();

      if (diff <= 0) {
        setRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
        });

        return;
      }

      setRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
      });
    }

    tick();

    const intervalId = window.setInterval(tick, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [targetDate]);

  return remaining;
}

function CountdownChip({
  targetDate,
}: {
  targetDate: string | null;
}) {
  const remaining = useCountdown(targetDate);

  if (!remaining || remaining.expired) {
    return null;
  }

  return (
    <div className="mt-1 flex items-center gap-1 font-mono text-[10px] font-semibold text-[var(--chalk-orange)]">
      <span>{String(remaining.days).padStart(2, "0")}d</span>

      <span className="text-[var(--ink)]/30">:</span>

      <span>{String(remaining.hours).padStart(2, "0")}h</span>

      <span className="text-[var(--ink)]/30">:</span>

      <span>{String(remaining.minutes).padStart(2, "0")}m</span>

      <span className="text-[var(--ink)]/30">:</span>

      <span>{String(remaining.seconds).padStart(2, "0")}s</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* YOUTUBE HELPERS                                                    */
/* ------------------------------------------------------------------ */

function getYouTubeVideoId(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname === "youtu.be") {
      return parsedUrl.pathname.slice(1).split("/")[0] || null;
    }

    if (
      parsedUrl.hostname.includes("youtube.com") ||
      parsedUrl.hostname.includes("youtube-nocookie.com")
    ) {
      const queryId = parsedUrl.searchParams.get("v");

      if (queryId) {
        return queryId;
      }

      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

      const embedIndex = pathParts.indexOf("embed");

      if (embedIndex !== -1 && pathParts[embedIndex + 1]) {
        return pathParts[embedIndex + 1];
      }

      const shortIndex = pathParts.indexOf("shorts");

      if (shortIndex !== -1 && pathParts[shortIndex + 1]) {
        return pathParts[shortIndex + 1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

function getYouTubeEmbedUrl(url: string | null): string | null {
  const id = getYouTubeVideoId(url);

  return id
    ? `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`
    : null;
}

/* ------------------------------------------------------------------ */
/* CONSTANT URLs                                                       */
/* ------------------------------------------------------------------ */

const MAPS_URL =
  "https://www.google.com/maps/place/Gyan+Hub+Pvt.+Ltd/@27.6920528,85.3336796,17z/data=!3m1!4b1!4m6!3m5!1s0x39eb1990925a6f83:0xaec6838aa0bdb23d!8m2!3d27.6920528!4d85.3362545!16s%2Fg%2F11nqx_l7r9?entry=ttu";

const PARKING_VIDEO_URL = "https://youtu.be/KVTGqQwRCGY";

const TESTIMONIAL_VIDEO_URL = "https://youtu.be/PwdQvIij--A";

/* ------------------------------------------------------------------ */
/* GLIMPSE STRIP                                                       */
/* ------------------------------------------------------------------ */

const GLIMPSE_PHOTOS = [
  {
    url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Certificate_Distribution_First_Batch.webp",
    caption: "E-bidding Course Certificate Distribution - Batch 01",
  },
  {
    url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Happy_Faces_With_GyanHub.webp",
    caption: "Happy Faces with GyanHub",
  },
  {
    url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/E-Certificate.webp",
    caption: "e-Certificates of GyanHub",
  },
  {
    url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Batch_3_Teaching.webp",
    caption: "Physical Class",
  },
  {
    url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Batch_2_teaching.webp",
    caption: "E-bidding - Batch 02",
  },
  {
    url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Batch_3_Orientation.webp",
    caption: "Orientation Day",
  },
  {
    url: "https://zuktarghyexwodqnnxlu.supabase.co/storage/v1/object/public/others/Certificate_Distribution_Shrawan_batch.webp",
    caption: "Individual Certificate Distribution",
  },
];

function GlimpseMarquee() {
  const looped = [...GLIMPSE_PHOTOS, ...GLIMPSE_PHOTOS];

  return (
    <div className="relative w-full overflow-hidden border-b border-[var(--ink)]/10 bg-white py-6">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between px-4 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--classroom-blue)]">
          See past batches in action
        </h2>

        <span className="hidden font-mono text-[11px] text-[var(--ink)]/40 sm:block">
          {GLIMPSE_PHOTOS.length} photos · live from the classroom
        </span>
      </div>

      <div className="gh-marquee-mask">
        <div className="gh-marquee-track">
          {looped.map((photo, index) => (
            <div
              key={`${photo.url}-${index}`}
              className="relative h-52 w-72 shrink-0 overflow-hidden rounded-xl border border-[var(--ink)]/8 shadow-sm"
            >
              <img
                src={photo.url}
                alt={photo.caption}
                className="h-full w-full object-cover"
                loading="lazy"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-white">
                  {photo.caption}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .gh-marquee-mask {
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0,
            #000 5%,
            #000 95%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0,
            #000 5%,
            #000 95%,
            transparent 100%
          );
        }

        .gh-marquee-track {
          display: flex;
          gap: 1.25rem;
          width: max-content;
          padding: 0 1.25rem;
          animation: gh-scroll 40s linear infinite;
        }

        .gh-marquee-track:hover {
          animation-play-state: paused;
        }

        @keyframes gh-scroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .gh-marquee-track {
            animation: none;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* COURSE CARD                                                         */
/* ------------------------------------------------------------------ */

function CourseCard({
  cls,
  index,
}: {
  cls: PhysicalClass;
  index: number;
}) {
  const fullPrice = cls.price;
  const finalPrice = cls.discount_price ?? cls.price;

  const percentage = discountPercent(
    fullPrice,
    cls.discount_price
  );

  const seatsLeft = Math.max(
    (cls.max_seats ?? 30) - (cls.enrolled_count ?? 0),
    0
  );

  const isFillingFast = seatsLeft > 0 && seatsLeft <= 5;
  const isFull = seatsLeft <= 0;

  const instructorDescription = cls.instructor_name
    ? `Learn directly from ${cls.instructor_name} through practical, classroom-based sessions.`
    : "Practical, classroom-based training designed to build job-ready skills.";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.3,
        delay: index * 0.04,
      }}
      whileHover={{ y: -6 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--ink)]/10 bg-white shadow-[0_2px_10px_-4px_rgba(27,27,24,0.12)] transition-shadow duration-300 hover:shadow-[0_20px_40px_-12px_rgba(46,64,87,0.35)]"
    >
      {/* Image */}
      <div className="relative h-40 w-full overflow-hidden bg-[var(--classroom-blue)]">
        {cls.course_image_url ? (
          <img
            src={cls.course_image_url}
            alt={cls.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="h-full w-full bg-cover bg-center opacity-40 grayscale"
            style={{
              backgroundImage: `url("https://picsum.photos/seed/${cls.id}/640/400")`,
            }}
            aria-hidden
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[var(--classroom-blue)] via-[var(--classroom-blue)]/10 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-2.5">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/80">
            {cls.course_code ?? "GH-000"}
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${
              isFull
                ? "bg-white/20 text-white/70"
                : isFillingFast
                ? "bg-[var(--chalk-orange)] text-white"
                : "bg-[var(--sign-yellow)] text-[var(--ink)]"
            }`}
          >
            {isFull ? (
              "Full"
            ) : isFillingFast ? (
              <>
                <Flame size={10} />
                Filling Fast
              </>
            ) : (
              "Open"
            )}
          </span>
        </div>

        {percentage !== null && (
          <div className="pointer-events-none absolute right-3 top-11 z-10">
            <div className="rotate-3 rounded-md bg-[var(--chalk-orange)] px-2.5 py-1 shadow-md">
              <span className="font-mono text-[11px] font-extrabold text-white">
                SAVE {percentage}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-bold leading-snug text-[var(--ink)] transition-colors group-hover:text-[var(--chalk-orange)]">
          {cls.title}
        </h3>

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-2 font-mono">
          <span className="text-2xl font-extrabold text-[var(--ink)]">
            {formatNPR(finalPrice)}
          </span>

          {cls.discount_price !== null &&
            cls.discount_price !== undefined && (
              <span className="text-sm text-[var(--ink)]/35 line-through">
                {formatNPR(fullPrice)}
              </span>
            )}
        </div>

        {/* Course details */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {/* Start date */}
          <div className="flex items-center gap-2 rounded-lg bg-[var(--paper)] px-2.5 py-2">
            <Calendar
              size={14}
              className="mt-0.5 shrink-0 text-[var(--classroom-blue)]"
            />

            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-wide text-[var(--ink)]/40">
                Starts
              </p>

              <p className="truncate text-xs font-semibold text-[var(--ink)]">
                {formatDateShort(cls.start_date)}
              </p>

              {formatBsDateShort(cls.start_date) && (
                <p className="truncate text-[10px] text-[var(--ink)]/50">
                  {formatBsDateShort(cls.start_date)}
                </p>
              )}

              <CountdownChip targetDate={cls.start_date} />
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 rounded-lg bg-[var(--paper)] px-2.5 py-2">
            <Layers
              size={14}
              className="shrink-0 text-[var(--classroom-blue)]"
            />

            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-wide text-[var(--ink)]/40">
                Duration
              </p>

              <p className="truncate text-xs font-semibold text-[var(--ink)]">
                {cls.duration_weeks
                  ? `${cls.duration_weeks} weeks`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Timing */}
          <div className="flex items-center gap-2 rounded-lg bg-[var(--paper)] px-2.5 py-2">
            <Clock
              size={14}
              className="shrink-0 text-[var(--classroom-blue)]"
            />

            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-wide text-[var(--ink)]/40">
                Timing
              </p>

              <p className="truncate text-xs font-semibold text-[var(--ink)]">
                {cls.timing || "TBA"}
              </p>
            </div>
          </div>
        </div>

        {/* Instructor */}
        <div className="mt-3 flex items-start gap-3 rounded-lg bg-[var(--paper)] px-3 py-2.5">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--classroom-blue)]">
            {cls.instructor_image_url ? (
              <img
                src={cls.instructor_image_url}
                alt={cls.instructor_name ?? "Instructor"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User size={16} className="text-white/70" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[var(--ink)]">
              {cls.instructor_name || "Instructor TBA"}
            </p>

            <p
              className="mt-0.5 text-[11px] leading-snug text-[var(--ink)]/60"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {instructorDescription}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-dashed border-[var(--ink)]/10 pt-4">
          <span
            className={`font-mono text-xs font-semibold ${
              isFillingFast
                ? "text-[var(--chalk-orange)]"
                : "text-[var(--ink)]/50"
            }`}
          >
            {isFull ? "Waitlist open" : `${seatsLeft} seats left`}
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ink)] px-3.5 py-2 text-xs font-bold text-white transition-colors group-hover:bg-[var(--chalk-orange)]">
            Detailed Course Info
            <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* REVIEWS                                                             */
/* ------------------------------------------------------------------ */

export type DbReview = {
  id: string;
  name: string | null;
  overall_rating: number | null;
  testimonial: string | null;
  course_name?: string | null;
};

type ReviewQueryRow = {
  id: string;
  name: string | null;
  overall_rating: number | null;
  testimonial: string | null;
  syllabi_v2:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
};

function processReviews(data: ReviewQueryRow[]): DbReview[] {
  const byRating = data.reduce(
    (acc, review) => {
      const rating = review.overall_rating ?? 0;

      if (!acc[rating]) {
        acc[rating] = [];
      }

      const syllabus = review.syllabi_v2;

      const courseTitle = Array.isArray(syllabus)
        ? syllabus[0]?.name ?? null
        : syllabus?.name ?? null;

      acc[rating].push({
        id: review.id,
        name: review.name,
        overall_rating: review.overall_rating,
        testimonial: review.testimonial,
        course_name: courseTitle,
      });

      return acc;
    },
    {} as Record<number, DbReview[]>
  );

  const sortedRatings = Object.keys(byRating)
    .map(Number)
    .sort((a, b) => b - a);

  const finalReviews: DbReview[] = [];

  for (const rating of sortedRatings) {
    const group = [...byRating[rating]];

    group.sort(() => Math.random() - 0.5);

    finalReviews.push(...group);
  }

  return finalReviews.slice(0, 15);
}

function ReviewsMarquee({
  reviews,
}: {
  reviews: DbReview[];
}) {
  if (!reviews.length) {
    return null;
  }

  const looped = [...reviews, ...reviews];

  return (
    <div className="relative overflow-hidden">
      <div className="gh-review-mask">
        <div className="gh-review-track">
          {looped.map((review, index) => {
            const rating = Math.min(
              Math.max(review.overall_rating ?? 5, 1),
              5
            );

            return (
              <div
                key={`${review.id}-${index}`}
                className="w-[320px] shrink-0 rounded-xl border border-[var(--ink)]/5 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex text-[var(--sign-yellow)]">
                  {Array.from({ length: rating }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      size={14}
                      fill="currentColor"
                    />
                  ))}
                </div>

                <p className="relative font-serif italic leading-relaxed text-[var(--ink)]/90">
                  <Quote
                    size={20}
                    className="absolute -left-1 -top-1 -z-10 text-[var(--ink)]/10"
                  />

                  &ldquo;
                  {review.testimonial || "Great learning experience."}
                  &rdquo;
                </p>

                <p className="mt-4 font-mono text-xs font-semibold uppercase text-[var(--classroom-blue)]">
                  — {review.name || "Student"}

                  <span className="px-2 text-[var(--ink)]/40">
                    |
                  </span>

                  {review.course_name || "Course"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .gh-review-mask {
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0,
            #000 4%,
            #000 96%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0,
            #000 4%,
            #000 96%,
            transparent 100%
          );
        }

        .gh-review-track {
          display: flex;
          gap: 1.5rem;
          width: max-content;
          padding: 0 1.5rem;
          animation: gh-review-scroll 55s linear infinite;
        }

        .gh-review-track:hover {
          animation-play-state: paused;
        }

        @keyframes gh-review-scroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .gh-review-track {
            animation: none;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TESTIMONIAL VIDEO                                                   */
/* ------------------------------------------------------------------ */

function TestimonialVideoCard({
  url,
  onClick,
}: {
  url: string;
  onClick: (title: string) => void;
}) {
  const [meta, setMeta] = useState<{
    title: string;
    thumbnail: string;
  } | null>(null);

  const videoId = useMemo(
    () => getYouTubeVideoId(url),
    [url]
  );

  useEffect(() => {
    if (!url) {
      return;
    }

    let mounted = true;

    const fetchMetadata = async () => {
      try {
        const response = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(
            url
          )}&format=json`
        );

        if (!response.ok) {
          throw new Error("Failed to load YouTube metadata");
        }

        const data = await response.json();

        if (mounted) {
          setMeta({
            title: data.title || "Student Testimonial",
            thumbnail:
              data.thumbnail_url ||
              (videoId
                ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                : ""),
          });
        }
      } catch {
        if (mounted && videoId) {
          setMeta({
            title: "Student Testimonial",
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          });
        }
      }
    };

    fetchMetadata();

    return () => {
      mounted = false;
    };
  }, [url, videoId]);

  const displayTitle =
    meta?.title || "Student Testimonial";

  const displayThumb =
    meta?.thumbnail ||
    (videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : "https://picsum.photos/seed/testimonial-vid/1200/675");

  return (
    <div
      onClick={() => onClick(displayTitle)}
      className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-black shadow-md"
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(displayTitle);
        }
      }}
    >
      <img
        src={displayThumb}
        alt={displayTitle}
        className="h-full w-full object-cover opacity-80 transition group-hover:scale-105 group-hover:opacity-60"
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <PlayCircle
          size={72}
          strokeWidth={1.5}
          className="text-white drop-shadow-lg"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-16">
        <p className="line-clamp-2 font-semibold text-white sm:text-lg">
          {displayTitle}
        </p>

        <p className="mt-1 text-sm text-white/80">
          Play Video
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* VIDEO MODAL                                                         */
/* ------------------------------------------------------------------ */

function VideoModal({
  videoUrl,
  title,
  onClose,
}: {
  videoUrl: string;
  title: string;
  onClose: () => void;
}) {
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  if (!embedUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black"
          aria-label="Close video"
        >
          ✕
        </button>

        <iframe
          src={embedUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function enrollHref(cls: PhysicalClass): string {
  const identifier = cls.course_code || cls.id;

  return `/offline-class/${encodeURIComponent(identifier)}`;
}

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

export default function OfflineClassesPage() {
  const [classes, setClasses] = useState<PhysicalClass[]>([]);
  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] =
    useState<SortOption>("soonest");

  const [activeVideo, setActiveVideo] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const fetchClassesAndReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      /* ------------------------------------------------------------ */
      /* FETCH PHYSICAL CLASSES                                       */
      /* ------------------------------------------------------------ */

      const classesResponse = await fetch(
        "/api/physicalcourses",
        {
          cache: "no-store",
        }
      );

      if (!classesResponse.ok) {
        const errorData = await classesResponse
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.error ||
            `Classes request failed with status ${classesResponse.status}`
        );
      }

      const classesData = await classesResponse.json();

      if (!Array.isArray(classesData)) {
        throw new Error(
          "Physical courses API did not return an array."
        );
      }

      setClasses(classesData);

      /* ------------------------------------------------------------ */
      /* FETCH APPROVED REVIEWS                                       */
      /* ------------------------------------------------------------ */

      const {
        data: reviewsData,
        error: reviewsError,
      } = await supabase
        .from("reviews")
        .select(`
          id,
          name,
          overall_rating,
          testimonial,
          syllabi_v2 (
            name
          )
        `)
        .not("testimonial", "is", null)
        .not("name", "is", null)
        .eq("status", "approved")
        .order("overall_rating", {
          ascending: false,
        });

      if (reviewsError) {
        console.error(
          "Failed to load reviews:",
          reviewsError.message,
          reviewsError.details,
          reviewsError.hint
        );

        setReviews([]);
      } else if (reviewsData) {
        setReviews(
          processReviews(
            reviewsData as unknown as ReviewQueryRow[]
          )
        );
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error(
        "Failed to load page data:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Couldn't load the requested data."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchClassesAndReviews();
  }, [fetchClassesAndReviews]);

  /* -------------------------------------------------------------- */
  /* NEXT UPCOMING BATCH                                            */
  /* -------------------------------------------------------------- */

  const nextUpcoming = useMemo(() => {
    const now = new Date();

    const upcoming = classes
      .filter(
        (course) =>
          course.is_active &&
          new Date(course.start_date) > now
      )
      .sort(
        (a, b) =>
          new Date(a.start_date).getTime() -
          new Date(b.start_date).getTime()
      );

    return upcoming[0] ?? null;
  }, [classes]);

  /* -------------------------------------------------------------- */
  /* SEARCH + SORT                                                   */
  /* -------------------------------------------------------------- */

  const visibleClasses = useMemo(() => {
    let list = [...classes];

    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery) {
      list = list.filter((course) => {
        return (
          course.title
            .toLowerCase()
            .includes(normalizedQuery) ||
          Boolean(
            course.course_code
              ?.toLowerCase()
              .includes(normalizedQuery)
          ) ||
          Boolean(
            course.instructor_name
              ?.toLowerCase()
              .includes(normalizedQuery)
          )
        );
      });
    }

    const effectivePrice = (course: PhysicalClass) =>
      course.discount_price ?? course.price;

    switch (sortBy) {
      case "price-asc":
        list.sort(
          (a, b) =>
            effectivePrice(a) -
            effectivePrice(b)
        );
        break;

      case "price-desc":
        list.sort(
          (a, b) =>
            effectivePrice(b) -
            effectivePrice(a)
        );
        break;

      case "soonest":
      default:
        list.sort(
          (a, b) =>
            new Date(a.start_date).getTime() -
            new Date(b.start_date).getTime()
        );
        break;
    }

    return list;
  }, [classes, query, sortBy]);

  /* -------------------------------------------------------------- */
  /* STYLES                                                          */
  /* -------------------------------------------------------------- */

  const pageStyle = {
    backgroundColor: TOKENS.paper,
    "--ink": TOKENS.ink,
    "--paper": TOKENS.paper,
    "--classroom-blue": TOKENS.classroomBlue,
    "--chalk-orange": TOKENS.chalkOrange,
    "--sign-yellow": TOKENS.signYellow,
  } as CSSProperties;

  return (
    <div
      className="min-h-screen text-[var(--ink)]"
      style={pageStyle}
    >
      <CountdownBanner nextClass={nextUpcoming} />

      {/* ---------------------------------------------------------- */}
      {/* HERO                                                       */}
      {/* ---------------------------------------------------------- */}

      <div className="relative overflow-hidden border-b border-[var(--classroom-blue)]/20 bg-[var(--classroom-blue)]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-multiply grayscale"
          style={{
            backgroundImage:
              'url("https://picsum.photos/seed/classroom/1920/1080")',
          }}
          aria-hidden
        />

        <div
          className="absolute inset-0 bg-[var(--classroom-blue)] opacity-60 mix-blend-color"
          aria-hidden
        />

        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--chalk-orange)]/40 bg-[var(--chalk-orange)]/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-[var(--chalk-orange)]">
            <MapPin size={13} className="shrink-0" />
            <span>Near Eyeplex Mall, New Baneshwor</span>
          </div>

          <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-6xl">
            कक्षाकोठा तालिम
            <br />
            <span className="text-[var(--chalk-orange)]">
              Physical Courses
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm font-medium text-white/90 sm:text-lg">
            प्रत्यक्ष कक्षाकोठामा सिक्नुहोस्, विज्ञबाट सिकेर आफ्नो
            सीप निखार्नुहोस्। नयाँ बानेश्वर केन्द्रमा सञ्चालन हुने
            आगामी ब्याचमा आफ्नो सिट आजै सुरक्षित गर्नुहोस्।
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-mono text-xs font-medium uppercase tracking-wide text-white backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--sign-yellow)]" />

              {classes.filter((course) => course.is_active).length}{" "}
              ब्याचमा भर्ना खुला छ
            </div>

            {nextUpcoming && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 font-mono text-xs font-medium text-white/90 backdrop-blur-sm">
                <Clock size={13} />

                <span>अर्को ब्याच सुरु हुन बाँकी:</span>

                <CountdownChip
                  targetDate={nextUpcoming.start_date}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <GlimpseMarquee />

      {/* ---------------------------------------------------------- */}
      {/* FILTER BAR                                                 */}
      {/* ---------------------------------------------------------- */}

      <div className="sticky top-0 z-30 border-b border-[var(--ink)]/10 bg-[var(--paper)]/95 py-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-xs uppercase tracking-wide text-[var(--ink)]/50">
            {visibleClasses.length} batch
            {visibleClasses.length !== 1 && "es"} open
          </p>

          <div className="flex flex-1 justify-end gap-3 sm:max-w-md">
            <div className="relative w-full max-w-xs">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/50"
              />

              <input
                type="text"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search batches..."
                className="w-full rounded-md border border-[var(--ink)]/20 bg-white py-2 pl-9 pr-4 text-sm outline-none transition focus:border-[var(--chalk-orange)] focus:ring-1 focus:ring-[var(--chalk-orange)]"
              />
            </div>

            <div className="relative w-40 shrink-0">
              <ArrowUpDown
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/50"
              />

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as SortOption
                  )
                }
                className="w-full appearance-none rounded-md border border-[var(--ink)]/20 bg-white py-2 pl-9 pr-4 font-mono text-sm outline-none transition focus:border-[var(--chalk-orange)] focus:ring-1 focus:ring-[var(--chalk-orange)]"
              >
                {(
                  Object.keys(
                    SORT_LABELS
                  ) as SortOption[]
                ).map((option) => (
                  <option key={option} value={option}>
                    {SORT_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* BATCH GRID                                                  */}
      {/* ---------------------------------------------------------- */}

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[420px] animate-pulse rounded-2xl bg-[var(--classroom-blue)]/10"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-xl border border-rose-200 bg-rose-50 px-6 py-10 text-center text-sm text-rose-700">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => void fetchClassesAndReviews()}
              className="mt-4 block w-full rounded-md bg-rose-600 py-2 font-semibold text-white transition hover:bg-rose-700"
            >
              Try Again
            </button>
          </div>
        ) : visibleClasses.length === 0 ? (
          <div className="mx-auto max-w-md text-center">
            <EmptyState
              onRefresh={() =>
                void fetchClassesAndReviews()
              }
            />

            <p className="mt-4 text-sm text-[var(--ink)]/60">
              No batches open right now. Message us on
              WhatsApp for the next intake date.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {visibleClasses.map((course, index) => (
                <Link
                  key={course.id}
                  href={enrollHref(course)}
                  aria-label={`Reserve a seat for ${course.title}`}
                  className="flex h-full flex-col rounded-2xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chalk-orange)] focus-visible:ring-offset-2"
                >
                  <CourseCard
                    cls={course}
                    index={index}
                  />
                </Link>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* LOCATION & PARKING                                         */}
      {/* ---------------------------------------------------------- */}

      <div className="border-t border-[var(--ink)]/10 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="mb-4 font-serif text-3xl font-semibold text-[var(--ink)]">
                Finding Our Centre
              </h2>

              <p className="mb-8 text-[var(--ink)]/80">
                We are located right near Eyeplex Mall in
                New Baneshwor. Easy to reach via public
                transit, with dedicated on-site parking for
                two-wheelers.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2 rounded-md bg-[var(--classroom-blue)] px-6 py-3 font-semibold transition hover:bg-[var(--classroom-blue)]/90"
                  style={{ color: "#FFFFFF" }}
                >
                  <MapPin size={18} color="#FFFFFF" />

                  <span style={{ color: "#FFFFFF" }}>
                    Open in Google Maps
                  </span>

                  <ExternalLink
                    size={14}
                    color="#FFFFFF"
                    className="transition group-hover:translate-x-0.5"
                  />
                </a>

                <button
                  type="button"
                  onClick={() =>
                    setActiveVideo({
                      url: PARKING_VIDEO_URL,
                      title: "Parking Guide",
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--ink)]/20 bg-[var(--paper)] px-6 py-3 font-semibold text-[var(--ink)] transition hover:border-[var(--chalk-orange)] hover:text-[var(--chalk-orange)]"
                >
                  <PlayCircle size={18} />
                  Watch Parking Guide
                </button>
              </div>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-200 shadow-inner">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d14130.826620579247!2d85.3362545!3d27.6920528!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1990925a6f83%3A0xaec6838aa0bdb23d!2sGyan%20Hub%20Pvt.%20Ltd!5e0!3m2!1sen!2snp!4v1700000000000!5m2!1sen!2snp"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="GyanHub Location Map"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* REVIEWS                                                     */}
      {/* ---------------------------------------------------------- */}

      <div className="bg-[var(--paper)] py-16">
        <div className="mx-auto mb-10 max-w-6xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-semibold text-[var(--ink)]">
            Hear from Past Students
          </h2>

          <p className="mt-2 text-[var(--ink)]/70">
            Genuine experiences from our physical classroom
            batches.
          </p>
        </div>

        <div className="mx-auto mb-8 max-w-4xl px-4 sm:px-6">
          <TestimonialVideoCard
            url={TESTIMONIAL_VIDEO_URL}
            onClick={(title) =>
              setActiveVideo({
                url: TESTIMONIAL_VIDEO_URL,
                title,
              })
            }
          />
        </div>

        {reviews.length > 0 && (
          <ReviewsMarquee reviews={reviews} />
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* VIDEO MODAL                                                  */}
      {/* ---------------------------------------------------------- */}

      <AnimatePresence>
        {activeVideo && (
          <VideoModal
            videoUrl={activeVideo.url}
            title={activeVideo.title}
            onClose={() => setActiveVideo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}