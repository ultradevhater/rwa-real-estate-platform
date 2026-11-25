import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse bg-[#EAE5DA] rounded ${className}`} />;
}

export function TableRowsSkeleton({
  rows = 5,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-[#1B2A24]/8 last:border-0">
          {Array.from({ length: cols }).map((__, cIdx) => (
            <td key={cIdx} className="py-3.5 px-4">
              <Skeleton
                className={`h-4 ${
                  cIdx === 0
                    ? "w-36"
                    : cIdx === cols - 1
                    ? "w-20 ml-auto"
                    : "w-24"
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function AssetGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xs overflow-hidden flex flex-col"
        >
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="p-5 space-y-3.5 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3.5 w-1/2" />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-10 w-full rounded-xl mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppShellSkeleton() {
  return (
    <div className="min-h-screen flex bg-[#F4F1EA]">
      <div className="w-[264px] shrink-0 bg-[#1B2A24] p-4 space-y-4 hidden md:block">
        <Skeleton className="h-9 w-40 bg-[#F4F1EA]/10" />
        <div className="space-y-2 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full bg-[#F4F1EA]/10 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-14 bg-[#F4F1EA] border-b border-[#1B2A24]/10 px-6 flex items-center justify-between">
          <Skeleton className="h-4 w-56" />
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-24 rounded-xl" />
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-8 w-32 rounded-xl" />
          </div>
        </div>
        <div className="p-6 max-w-[1420px] w-full mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
