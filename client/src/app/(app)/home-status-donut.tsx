'use client';

import { Label, Pie, PieChart } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DeviceStatuses } from '@/features/devices/constants/device';
import type { DeviceStatus } from '@/features/devices/types/device';

const COLOR: Record<DeviceStatus, string> = {
  'in-use': 'var(--color-status-in-use)',
  storage: 'var(--color-status-storage)',
  repair: 'var(--color-status-repair)',
  retired: 'var(--color-status-retired)',
};

export function HomeStatusDonut({
  byStatus,
  total,
  labels,
  totalLabel,
}: {
  byStatus: Record<DeviceStatus, number>;
  total: number;
  labels: Record<DeviceStatus, string>;
  totalLabel: string;
}) {
  const data = DeviceStatuses.filter((s) => byStatus[s] > 0).map((s) => ({
    status: s,
    count: byStatus[s],
    fill: COLOR[s],
  }));

  const config = Object.fromEntries(
    DeviceStatuses.map((s) => [s, { label: labels[s], color: COLOR[s] }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-[200px] w-full">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="status" hideLabel />} />
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={58} strokeWidth={4}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-semibold"
                    >
                      {total}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy + 22}
                      className="fill-muted-foreground text-xs"
                    >
                      {totalLabel}
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
