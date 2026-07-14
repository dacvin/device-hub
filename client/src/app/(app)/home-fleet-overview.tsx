'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { Activity, Archive, CalendarClock, Gauge, HardDrive, History, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useFleetStats } from '@/features/devices/api/get-fleet-stats';
import { useRecentActivities } from '@/features/devices/api/get-recent-activities';
import { STATUS_LABEL_KEY, StatusDot } from '@/features/devices/components/device-status-indicator';
import { DeviceStatuses } from '@/features/devices/constants/device';
import { cn } from '@/lib/utils';
import type { DeviceStatus } from '@/features/devices/types/device';

import { HomeDueCheck } from './home-due-check';
import { HomeFleetSkeleton } from './home-fleet-skeleton';
import { HomeGroupsDonut } from './home-groups-donut';
import { HomeNewDeviceButton } from './home-new-device-button';
import { HomeRecentActivity } from './home-recent-activity';
import { HomeStatusDonut } from './home-status-donut';

const LABEL = 'font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground';
const NUM = 'font-mono tabular-nums';

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <Card className="gap-0 py-5">
      <CardContent className="px-5">
        <div className="flex items-center justify-between">
          <span className={LABEL}>{label}</span>
          <Icon className="text-muted-foreground/60 size-4" />
        </div>
        <div className={cn(NUM, 'mt-3 text-3xl font-semibold')}>{value}</div>
        {sub && <div className="text-muted-foreground mt-1 text-sm">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('gap-0 py-0', className)}>
      <div className="flex items-center justify-between gap-2 border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon className="text-primary size-4" />
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      <CardContent className="px-5 py-4">{children}</CardContent>
    </Card>
  );
}

export function HomeFleetOverview() {
  const t = useTranslations();
  const { data: stats, isPending } = useFleetStats();
  const { data: activities } = useRecentActivities();

  if (isPending) return <HomeFleetSkeleton />;

  if (!stats || stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <div className="bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full">
          <HardDrive className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">{t('home.emptyTitle')}</h2>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">{t('home.emptyDesc')}</p>
        <div className="mt-5">
          <HomeNewDeviceButton />
        </div>
      </div>
    );
  }

  const total = stats.total;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const avg = stats.avgCondition ?? 0;
  const statusLabels = Object.fromEntries(
    DeviceStatuses.map((s) => [s, t(STATUS_LABEL_KEY[s])]),
  ) as Record<DeviceStatus, string>;

  return (
    <div className="space-y-4">
      {/* Key metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={t('home.statTotal')}
          value={String(total)}
          sub={t('home.statTotalSub', { count: stats.locationsCount })}
          icon={HardDrive}
        />
        <Kpi
          label={t('home.statCheckedOut')}
          value={String(stats.byStatus.checked_out)}
          sub={t('home.ofFleet', { percent: pct(stats.byStatus.checked_out) })}
          icon={Activity}
        />
        <Kpi
          label={t('home.statStorage')}
          value={String(stats.byStatus.storage)}
          sub={t('home.ofFleet', { percent: pct(stats.byStatus.storage) })}
          icon={Archive}
        />
        <Kpi
          label={t('home.statCondition')}
          value={`${avg}%`}
          icon={Gauge}
          sub={
            <div className="mt-1.5 space-y-1.5">
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn('h-full rounded-full', {
                    'bg-status-checked-out': avg >= 80,
                    'bg-status-repair': avg >= 50 && avg < 80,
                    'bg-status-retired': avg < 50,
                  })}
                  style={{ width: `${avg}%` }}
                />
              </div>
              <span>{t('home.statConditionSub')}</span>
            </div>
          }
        />
      </div>

      {/* Status donut + due for check */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <SectionCard title={t('home.sectionStatus')} icon={Activity} className="lg:col-span-2">
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
            <HomeStatusDonut
              byStatus={stats.byStatus}
              total={total}
              labels={statusLabels}
              totalLabel={t('devices.title').toLowerCase()}
            />
            <ul className="space-y-2.5">
              {[...DeviceStatuses]
                .sort((a, b) => stats.byStatus[b] - stats.byStatus[a])
                .map((s) => (
                  <li key={s} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <StatusDot status={s} />
                      {t(STATUS_LABEL_KEY[s])}
                    </span>
                    <span className={cn(NUM, 'font-semibold')}>{stats.byStatus[s]}</span>
                  </li>
                ))}
            </ul>
          </div>
        </SectionCard>

        <SectionCard
          title={t('home.sectionDueCheck')}
          icon={CalendarClock}
          className="lg:col-span-3"
          action={
            stats.dueCount > 0 ? (
              <Badge variant="secondary" className="text-status-retired">
                {t('home.dueCountBadge', { count: stats.dueCount })}
              </Badge>
            ) : undefined
          }
        >
          <HomeDueCheck items={stats.dueForCheck} />
        </SectionCard>
      </div>

      {/* Activity + group breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <SectionCard
          title={t('home.sectionRecent')}
          icon={History}
          className="lg:col-span-3"
          action={
            <Link
              href="/devices"
              className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              {t('home.viewAll')}
            </Link>
          }
        >
          <HomeRecentActivity items={activities ?? []} />
        </SectionCard>

        <SectionCard title={t('home.sectionGroups')} icon={Layers} className="lg:col-span-2">
          {stats.topGroups.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('home.emptyBreakdown')}</p>
          ) : (
            <HomeGroupsDonut
              groups={stats.topGroups}
              total={total}
              totalLabel={t('devices.title').toLowerCase()}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
