"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Flame } from "lucide-react";
import type { PhysicalClass } from "@/types/physical-class";

interface CountdownBannerProps {
  nextClass: PhysicalClass | null;
}

function useCountdown(targetDate: string | undefined) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetDate) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return useMemo(() => {
    if (!targetDate) return null;
    const diff = new Date(targetDate).getTime() - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, started: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, started: false };
  }, [targetDate, now]);
}

export default function CountdownBanner({ nextClass }: CountdownBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const countdown = useCountdown(nextClass?.start_date);

  if (!nextClass || dismissed || !countdown || countdown.started) return null;
  // Only surface the banner when a batch is genuinely imminent.
  if (countdown.days > 7) return null;

  const units: Array<[string, number]> = [
    ["Days", countdown.days],
    ["Hrs", countdown.hours],
    ["Min", countdown.minutes],
    ["Sec", countdown.seconds],
  ];

  return (
    <div className="relative z-30 bg-[#221F1C] text-[#FAF7F3]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-2.5 text-sm sm:justify-between">
        <div className="flex items-center gap-2 font-medium">
          <Flame size={16} className="shrink-0 text-[#E2932E]" />
          <span className="truncate">
            <span className="text-[#E2932E]">Seats filling fast —</span>{" "}
            <span className="hidden sm:inline">{nextClass.title} starts soon</span>
            <span className="sm:hidden">Next batch starts soon</span>
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          {units.map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-1">
              <span className="text-base font-semibold tabular-nums">
                {String(value).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-[#FAF7F3]/60">
                {label}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="rounded-full p-1 text-[#FAF7F3]/60 transition hover:bg-white/10 hover:text-[#FAF7F3]"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}