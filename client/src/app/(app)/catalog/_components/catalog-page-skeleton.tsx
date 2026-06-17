import { Card } from "@/components/ui/card";
import { Sk } from "@/components/app/skeletons";

export function CatalogPageSkeleton() {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <Sk className="h-9 w-[260px] rounded-md" />
        <Sk className="h-3 w-48" />
        <div className="ml-auto flex items-center gap-2">
          <Sk className="h-9 w-24 rounded-md" />
          <Sk className="h-9 w-32 rounded-md" />
        </div>
      </div>
      <Card className="shadow-none py-0 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid items-center gap-4 px-5 py-3 border-b border-border last:border-b-0"
            style={{ gridTemplateColumns: "28px 1fr 1fr 1fr 80px" }}
          >
            <Sk className="size-4" />
            <Sk className="h-3" />
            <Sk className="h-3" />
            <Sk className="h-3" />
            <div className="flex gap-1 justify-end">
              <Sk className="size-6" />
              <Sk className="size-6" />
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
