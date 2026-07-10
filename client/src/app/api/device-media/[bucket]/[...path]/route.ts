import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const ALLOWED_BUCKETS = new Set(['device-photos', 'device-documents']);

// Auth-gated proxy for private storage objects: <img>/downloads send the session
// cookie, we verify it, then stream the object. Stable same-origin URL (no signing,
// no expiry) that only authenticated users can read.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bucket: string; path: string[] }> },
) {
  const { bucket, path } = await params;
  if (!ALLOWED_BUCKETS.has(bucket)) return new NextResponse('Not found', { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data, error } = await supabase.storage.from(bucket).download(path.join('/'));
  if (error) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(data, {
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
