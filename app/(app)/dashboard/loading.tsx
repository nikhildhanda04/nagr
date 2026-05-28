import { Skeleton, RowsSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-28" />
      <Skeleton className="mt-6 h-14 w-full rounded-2xl" />
      <div className="mt-8 space-y-3">
        <Skeleton className="h-3 w-20" />
        <RowsSkeleton count={4} />
      </div>
    </div>
  );
}
