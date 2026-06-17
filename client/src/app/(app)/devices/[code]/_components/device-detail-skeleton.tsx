import { Card } from "@/components/ui/card";
import { Sk } from "@/components/app/skeletons";

export function DeviceDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Sk className="h-3 w-32" />
      <div className="flex items-start gap-4">
        <Sk className="size-14 rounded-xl" />
        <div className="flex-1">
          <Sk className="h-6 w-64 mb-2" />
          <Sk className="h-3 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Sk className="h-9 w-28 rounded-md" />
          <Sk className="size-9 rounded-md" />
          <Sk className="h-9 w-28 rounded-md" />
        </div>
      </div>
      <div className="grid gap-5 items-start grid-cols-1 min-[1080px]:[grid-template-columns:minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-5 min-w-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="shadow-none gap-0 px-5 py-5">
              <Sk className="h-3 w-32 mb-4" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                {Array.from({ length: 6 }).map((__, j) => (
                  <div key={j}>
                    <Sk className="h-2.5 w-20 mb-2" />
                    <Sk className="h-3 w-32" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-5">
          <Card className="shadow-none gap-0 py-5 px-5">
            <Sk className="h-3 w-20 mb-3" />
            <div className="flex items-center gap-4">
              <Sk className="size-24 rounded-full" />
              <div className="flex-1">
                <Sk className="h-3 w-24 mb-1.5" />
                <Sk className="h-3 w-32" />
              </div>
            </div>
          </Card>
          <Card className="shadow-none gap-0 py-5 px-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <Sk className="size-7 rounded-md" />
                <div className="flex-1">
                  <Sk className="h-2.5 w-16 mb-1.5" />
                  <Sk className="h-3 w-32" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
