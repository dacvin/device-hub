import { queryOptions, useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';

const CODE_RE = /^DEV-(\d+)$/;

// Pure: next zero-padded DEV-### from a set of existing codes. Best-effort —
// ignores codes that don't match the DEV-### shape.
export function nextDeviceCode(codes: string[]): string {
  let max = 0;
  let width = 3;
  for (const code of codes) {
    const m = CODE_RE.exec(code.trim());
    if (!m) continue;
    const n = Number(m[1]);
    if (n > max) max = n;
    if (m[1].length > width) width = m[1].length;
  }
  const next = max + 1;
  return `DEV-${String(next).padStart(width, '0')}`;
}

export const getNextDeviceCode = async (): Promise<string> => {
  const supabase = createClient();
  // Pull recent codes; the suggestion is best-effort and always user-editable.
  const { data, error } = await supabase
    .from('devices')
    .select('code')
    .ilike('code', 'DEV-%')
    .order('code', { ascending: false })
    .limit(200);
  if (error) throw error;
  return nextDeviceCode(data.map((r) => r.code));
};

export const getNextDeviceCodeQueryOptions = () =>
  queryOptions({
    queryKey: ['devices', 'next-code'],
    queryFn: getNextDeviceCode,
    staleTime: 0,
    gcTime: 0,
  });

export const useNextDeviceCode = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...getNextDeviceCodeQueryOptions(), enabled });
