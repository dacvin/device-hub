import { Card } from "@/components/ui/card";
import { Sk } from "@/components/app/skeletons";

export function MembersPageSkeleton() {
  return (
    <>
      <div className="flex items-center gap-2.5 mb-5">
        <Sk className="h-9 w-[260px] rounded-md" />
        <div className="ml-auto flex gap-2">
          <Sk className="h-9 w-24 rounded-md" />
          <Sk className="h-9 w-32 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-2 max-[880px]:grid-cols-1 gap-4 mb-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="shadow-none p-5 flex items-center gap-4">
            <Sk className="size-12 rounded-xl" />
            <div className="flex-1">
              <Sk className="h-6 w-12 mb-2" />
              <Sk className="h-3 w-48" />
            </div>
          </Card>
        ))}
      </div>
      <Card className="shadow-none py-0 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid items-center gap-4 px-5 py-3 border-b border-border last:border-b-0"
            style={{ gridTemplateColumns: "28px 1fr 80px 1fr 80px 80px" }}
          >
            <Sk className="size-4" />
            <div className="flex items-center gap-3">
              <Sk className="size-9 rounded-full" />
              <div className="flex-1">
                <Sk className="h-3 w-32 mb-1.5" />
                <Sk className="h-2.5 w-40" />
              </div>
            </div>
            <Sk className="h-5 w-16 rounded-full" />
            <Sk className="h-3 w-20" />
            <Sk className="h-5 w-16 rounded-full" />
            <Sk className="h-3 w-12" />
          </div>
        ))}
      </Card>
    </>
  );
}
