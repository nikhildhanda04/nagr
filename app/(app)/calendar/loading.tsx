import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-8 w-48" />
      <Skeleton className="mt-4 h-[440px] w-full rounded-2xl" />
    </div>
  );
}
