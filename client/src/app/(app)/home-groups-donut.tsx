'use client';

import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { Label, Pie, PieChart } from 'recharts';

import { type ChartConfig, ChartContainer } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

// A fixed palette for the group slices; "Others" always uses the muted tone.
const PALETTE = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-primary)',
];
const OTHERS_FILL = 'var(--color-muted-foreground)';

export function HomeGroupsDonut({
  groups,
  total,
  totalLabel,
}: {
  groups: { name: string; count: number }[];
  total: number;
  totalLabel: string;
}) {
  const t = useTranslations('home');
  const router = useRouter();

  const named = groups.map((g, i) => ({ ...g, fill: PALETTE[i % PALETTE.length] }));
  const namedTotal = named.reduce((sum, g) => sum + g.count, 0);
  const othersCount = Math.max(total - namedTotal, 0);

  // Slices are shares of the WHOLE fleet — the ring fills to the total, so a
  // group's arc length reads as "% of all devices", not just relative to peers.
  const data = [
    ...named.map((g) => ({ key: g.name, label: g.name, count: g.count, fill: g.fill })),
    ...(othersCount > 0
      ? [{ key: '__others', label: t('groupOthers'), count: othersCount, fill: OTHERS_FILL }]
      : []),
  ];

  const config = Object.fromEntries(
    data.map((d) => [d.key, { label: d.label, color: d.fill }]),
  ) satisfies ChartConfig;

  const share = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const goToGroup = (name: string) => {
    router.push(`/devices?group=${encodeURIComponent(name)}`);
  };

  return (
    <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
      <ChartContainer config={config} className="mx-auto aspect-square max-h-[200px] w-full">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="key" innerRadius={58} strokeWidth={4}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
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

      <ul className="space-y-1.5">
        {named.map((g) => (
          <li key={g.name}>
            <button
              type="button"
              onClick={() => {
                goToGroup(g.name);
              }}
              className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm transition-colors"
            >
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: g.fill }}
              />
              <span className="min-w-0 flex-1 truncate">{g.name}</span>
              <span className="font-mono font-medium tracking-[-0.01em] tabular-nums">
                {g.count}
              </span>
              <span className="text-muted-foreground w-9 text-right font-mono text-xs tracking-[-0.01em] tabular-nums">
                {t('groupShare', { percent: share(g.count) })}
              </span>
            </button>
          </li>
        ))}
        {othersCount > 0 && (
          <li className={cn('flex items-center gap-2 px-1.5 py-1 text-sm')}>
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: OTHERS_FILL }}
            />
            <span className="text-muted-foreground min-w-0 flex-1 truncate">
              {t('groupOthers')}
            </span>
            <span className="text-muted-foreground font-mono font-medium tracking-[-0.01em] tabular-nums">
              {othersCount}
            </span>
            <span className="text-muted-foreground w-9 text-right font-mono text-xs tracking-[-0.01em] tabular-nums">
              {t('groupShare', { percent: share(othersCount) })}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
