import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KANBAN_COLUMNS } from "@/lib/tracker-utils";

export function TrackerKanbanSkeleton() {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[1080px] grid-cols-6 gap-4">
        {KANBAN_COLUMNS.map((column) => (
          <div
            key={column.status}
            className={`flex min-h-[420px] flex-col rounded-xl border-2 ${column.borderClass}`}
          >
            <div className="flex items-center justify-between border-b border-inherit px-3 py-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            <div className="space-y-3 overflow-y-auto p-3">
              {[0, 1].map((i) => (
                <Card key={i} className="border-slate-200 shadow-sm">
                  <CardHeader className="space-y-2 p-3 pb-2">
                    <div className="flex gap-2">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3 pt-0">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
