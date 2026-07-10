import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const ALLOWED_BUCKETS = new Set(['device-photos', 'device-documents', 'checkout-photos']);

// Raster image types safe to serve inline for the photos buckets. Anything else
// (incl. SVG/HTML) is served as an opaque download to avoid same-origin XSS.
const INLINE_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const INLINE_IMAGE_BUCKETS = new Set(['device-photos', 'checkout-photos']);

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

  const inlineImage = INLINE_IMAGE_BUCKETS.has(bucket) && INLINE_IMAGE_TYPES.has(data.type);
  const headers: Record<string, string> = {
    'Content-Type': inlineImage ? data.type : 'application/octet-stream',
    'Cache-Control': 'private, max-age=3600',
    // Neutralize same-origin XSS from user uploads: never sniff, never execute.
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  };
  if (!inlineImage) headers['Content-Disposition'] = 'attachment';

  return new NextResponse(data, { headers });
}
