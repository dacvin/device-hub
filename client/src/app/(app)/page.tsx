import { getTranslations } from 'next-intl/server';

import { PageLayout } from '@/components/app/page-layout';
import { getCurrentAppUser } from '@/lib/auth/current-user';

import { HomeFleetOverview } from './home-fleet-overview';

export default async function HomePage() {
  const [user, t] = await Promise.all([getCurrentAppUser(), getTranslations()]);
  const greeting = user ? t('home.greetingNamed', { name: user.name }) : t('home.greetingAnon');

  return (
    <PageLayout title={greeting} subtitle={t('home.subtitle')}>
      <HomeFleetOverview />
    </PageLayout>
  );
}
