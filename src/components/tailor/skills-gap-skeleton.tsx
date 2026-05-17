import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SkillsGapSkeleton() {
  return (
    <Card className="border-2 border-violet-200/80 shadow-sm">
      <CardHeader>
        <Skeleton className="h-7 w-56" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start">
          <Skeleton className="size-44 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {[0, 1, 2].map((column) => (
            <div
              key={column}
              className="col-span-12 space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:col-span-4"
            >
              <Skeleton className="h-5 w-32" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
