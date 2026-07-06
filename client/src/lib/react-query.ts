import { environmentManager, QueryClient } from '@tanstack/react-query';
import type { DefaultOptions, UseMutationOptions } from '@tanstack/react-query';

export const queryConfig = {
  queries: {
    // throwOnError: true,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60,
  },
} satisfies DefaultOptions;

function makeQueryClient() {
  return new QueryClient({ defaultOptions: queryConfig });
}

let browserQueryClient: QueryClient | undefined = undefined;

// Server/browser-aware client so Server Components can prefetch + hydrate
// (TanStack "Advanced SSR"). Browser reuses a singleton across renders.
export function getQueryClient() {
  if (environmentManager.isServer()) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export type ApiFnReturnType<FnType extends (...args: never[]) => Promise<unknown>> = Awaited<
  ReturnType<FnType>
>;

export type QueryConfig<T extends (...args: never[]) => unknown> = Omit<
  ReturnType<T>,
  'queryKey' | 'queryFn'
>;

export type MutationConfig<MutationFnType extends (...args: never[]) => Promise<unknown>> =
  UseMutationOptions<ApiFnReturnType<MutationFnType>, Error, Parameters<MutationFnType>[0]>;
