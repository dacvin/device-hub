import { Card } from "@/components/ui/card";
import { Sk } from "@/components/app/skeletons";

export function DeviceListSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between mt-3.5">
        <Sk className="h-3 w-32" />
        <Sk className="h-9 w-32 rounded-md" />
      </div>
      <div className="mt-4 pb-32">
        <Card className="shadow-none py-0 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[880px]">
              <div
                className="grid items-center gap-4 px-5 py-3 border-b border-border"
                style={{
                  gridTemplateColumns: "28px 26px 80px 1fr 1fr 1fr 1fr 1fr 60px",
                }}
              >
                <Sk className="size-4" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <Sk key={i} className="h-3" />
                ))}
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="grid items-center gap-4 px-5 py-[14px] border-b border-border last:border-b-0"
                  style={{
                    gridTemplateColumns: "28px 26px 80px 1fr 1fr 1fr 1fr 1fr 60px",
                  }}
                >
                  <Sk className="size-4" />
                  <Sk className="size-[26px] rounded-[7px]" />
                  <Sk className="h-3" />
                  <Sk className="h-3" />
                  <Sk className="h-5 w-16 rounded-full" />
                  <Sk className="h-3" />
                  <Sk className="h-5 w-16 rounded-full" />
                  <Sk className="h-3" />
                  <Sk className="h-3 w-6 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
