import { Card } from "@/components/ui/card";
import { Sk } from "@/components/app/skeletons";

export function DeviceFormSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Sk className="h-3 w-32" />
      <div
        className="grid gap-8 items-start"
        style={{ gridTemplateColumns: "220px minmax(0, 1fr)" }}
      >
        <aside className="hidden min-[1000px]:flex flex-col gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Sk key={i} className="h-9 rounded-md" />
          ))}
        </aside>
        <div className="flex flex-col gap-5 min-w-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-none py-0">
              <div className="px-5 pt-5 pb-3">
                <Sk className="h-3 w-32" />
              </div>
              <div className="px-5 pb-5 grid gap-5 md:grid-cols-2">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={j}>
                    <Sk className="h-3 w-24 mb-2" />
                    <Sk className="h-9 rounded-md" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
