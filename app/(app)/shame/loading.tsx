import { Skeleton, RowsSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-3 h-9 w-32" />
      <div className="mt-6">
        <RowsSkeleton count={4} />
      </div>
    </div>
  );
}
