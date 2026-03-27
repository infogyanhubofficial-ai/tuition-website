export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8 flex justify-center items-center">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Certificate Skeleton */}
        <div className="lg:col-span-2 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/10 p-4 animate-pulse h-[600px]"></div>
        {/* Sidebar Skeleton */}
        <div className="space-y-4">
          <div className="h-32 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/10 animate-pulse"></div>
          <div className="h-64 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/10 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}