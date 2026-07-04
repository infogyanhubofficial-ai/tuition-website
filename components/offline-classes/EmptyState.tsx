"use client";

import { CalendarX, RotateCw } from "lucide-react";

interface EmptyStateProps {
  onRefresh: () => void;
}

export default function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed border-[#221F1C]/15 bg-white/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#221F1C]/5">
        <CalendarX size={26} className="text-[#221F1C]/40" />
      </div>
      <h3 className="mb-2 font-serif text-xl font-semibold text-[#221F1C]">
        No Classes Available at this Location
      </h3>
      <p className="mb-6 text-sm leading-relaxed text-neutral-500">
        There are currently no classroom batches available at the New
        Baneshwor office. Please check back later or refresh to view the
        latest schedule.
      </p>
      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center gap-2 rounded-full bg-[#221F1C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#221F1C]/85"
      >
        <RotateCw size={14} />
        Refresh Schedule
      </button>
    </div>
  );
}