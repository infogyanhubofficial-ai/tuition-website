import Image from "next/image";
import { MapPin, Calendar, Clock, Hourglass } from "lucide-react";
import type { PhysicalClass } from "@/types/physical-class";

export default function ClassCard({ cls }: { cls: PhysicalClass }) {
  // Calculate remaining seats for the progress bar
  const maxSeats = cls.max_seats ?? 30;
  const enrolled = cls.enrolled_count ?? 0;
  const seatsLeft = Math.max(0, maxSeats - enrolled);
  const progressPercent = Math.min(100, (enrolled / maxSeats) * 100);

  // Calculate discount
  const hasDiscount = cls.discount_price && cls.discount_price < cls.price;
  const discountPercent = hasDiscount 
    ? Math.round(((cls.price - cls.discount_price!) / cls.price) * 100) 
    : 0;

  // Calculate days until class starts
  const getDaysUntil = () => {
    if (!cls.start_date) return null;
    const start = new Date(cls.start_date);
    const now = new Date();
    // Reset times to compare pure dates
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : null;
  };
  const daysUntil = getDaysUntil();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.05)] transition-shadow hover:shadow-lg">
      
      {/* Image Banner */}
      <div className="relative flex aspect-[16/9] w-full items-center justify-center border-b border-gray-100 bg-[#F7F8FC]">
        {cls.course_image_url && (
          <Image
            src={cls.course_image_url}
            alt={cls.title}
            fill
            className="object-contain p-2" 
          />
        )}
        
        {/* Category Badge - Top Left */}
        <div className="absolute left-2.5 top-2.5 z-10 rounded-full border border-gray-100 bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#F5821F] shadow-sm backdrop-blur-sm">
          {cls.category}
        </div>

        {/* UPDATED: Countdown Badge - Top Right */}
        {daysUntil !== null && (
          <div className="absolute right-2.5 top-2.5 z-10 rounded-full border border-orange-200 bg-[#FFF0E5]/95 px-2.5 py-1 text-[11px] font-bold text-[#F5821F] shadow-sm backdrop-blur-sm">
            Starts in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="flex flex-1 flex-col p-5">
        
        {/* Header Info */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#F5821F]">
            {cls.course_code}
          </span>
          <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-tight text-neutral-900">
            {cls.title}
          </h3>
          
          {/* Instructor */}
          <div className="mt-4 flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-200 bg-gray-100 shrink-0">
              {cls.instructor_image_url ? (
                <Image 
                  src={cls.instructor_image_url} 
                  alt={cls.instructor_name || "Instructor"} 
                  fill 
                  className="object-cover" 
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#1E2E6B] text-xs font-bold text-white">
                  {cls.instructor_name?.charAt(0) || "I"}
                </div>
              )}
            </div>
            <div className="text-sm">
              <p className="text-xs text-neutral-500">Instructor</p>
              <p className="font-semibold text-neutral-900 line-clamp-1">{cls.instructor_name}</p>
            </div>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="mt-5 grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-neutral-600">
          {/* UPDATED: Changed items-center to items-start, removed truncate, added line-clamp-2 for wrapping */}
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-neutral-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-tight">{cls.location || "TBD"}</span>
          </div>
          <div className="flex items-start gap-2">
            <Clock size={14} className="text-neutral-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-tight">{cls.timing || "TBD"}</span>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={14} className="text-neutral-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-tight">
              {cls.start_date ? new Date(cls.start_date).toLocaleDateString() : "TBD"}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Hourglass size={14} className="text-neutral-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-tight">{cls.duration_weeks} weeks</span>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-auto pt-6">
          
          {/* Enrollment Progress */}
          <div className="mb-4">
            <div className="mb-1.5 flex justify-between text-xs font-medium">
              <span className="text-neutral-500">{enrolled}/{maxSeats} enrolled</span>
              <span className="text-[#00B074]">{seatsLeft} seats left</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div 
                className="h-full rounded-full bg-[#00B074] transition-all" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mb-4 border-t border-dashed border-gray-200" />

          {/* Pricing & CTA */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-xl font-bold text-neutral-900">
                  Rs. {cls.discount_price?.toLocaleString() ?? cls.price.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-neutral-400 line-through">
                    Rs. {cls.price.toLocaleString()}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <p className="mt-0.5 text-xs font-bold text-[#00B074]">
                  Save {discountPercent}%
                </p>
              )}
            </div>
            
            <span className="rounded-full bg-[#F5821F] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#d97016] shrink-0">
              Reserve Seat
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}