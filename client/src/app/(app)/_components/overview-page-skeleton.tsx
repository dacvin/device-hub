import { Card } from "@/components/ui/card";
import { Sk } from "@/components/app/skeletons";

export function OverviewPageSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4 max-[1080px]:grid-cols-2 max-[640px]:grid-cols-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5 flex flex-col gap-3 shadow-none">
            <div className="flex items-center justify-between">
              <Sk className="h-3 w-20" />
              <Sk className="size-[34px] rounded-[9px]" />
            </div>
            <Sk className="h-7 w-16" />
            <Sk className="h-3 w-32" />
          </Card>
        ))}
      </div>
      <div className="grid gap-5 items-start grid-cols-1 min-[1080px]:[grid-template-columns:minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5 min-w-0">
          <Card className="shadow-none gap-0 px-5 py-5">
            <Sk className="h-4 w-32 mb-2" />
            <Sk className="h-3 w-48 mb-5" />
            <Sk className="h-3 w-full rounded-full mb-4" />
            <div className="grid grid-cols-2 gap-x-[18px] gap-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Sk key={i} className="h-3" />
              ))}
            </div>
          </Card>
          <Card className="shadow-none gap-0 px-5 py-5">
            <Sk className="h-4 w-40 mb-2" />
            <Sk className="h-3 w-32 mb-5" />
            <div className="flex flex-col gap-3.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="grid items-center gap-3"
                  style={{ gridTemplateColumns: "116px 1fr auto" }}
                >
                  <div className="flex items-center gap-2.5">
                    <Sk className="size-[26px] rounded-[7px]" />
                    <Sk className="h-3 w-16" />
                  </div>
                  <Sk className="h-2 rounded-full" />
                  <Sk className="h-3 w-12" />
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-5">
          <Card className="shadow-none gap-0 py-5">
            <div className="px-5">
              <Sk className="h-4 w-36 mb-2" />
              <Sk className="h-3 w-44 mb-3" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-3 border-t border-border"
              >
                <Sk className="size-[34px] rounded-[9px]" />
                <div className="flex-1">
                  <Sk className="h-3 w-32 mb-1.5" />
                  <Sk className="h-3 w-20" />
                </div>
                <Sk className="size-[26px] rounded-full" />
              </div>
            ))}
          </Card>
          <Card className="shadow-none gap-0 px-5 py-5">
            <Sk className="h-4 w-32 mb-3" />
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Sk className="size-3 rounded-full mt-1" />
                  <div className="flex-1">
                    <Sk className="h-3 w-full mb-1" />
                    <Sk className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
