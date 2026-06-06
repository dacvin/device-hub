import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/locales";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const candidate = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(candidate) ? candidate : DEFAULT_LOCALE;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return { locale, messages };
});
