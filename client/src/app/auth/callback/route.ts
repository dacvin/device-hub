import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/devices";

  if (!code) {
    url.pathname = "/login";
    url.search = "?error=oauth";
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    url.pathname = "/login";
    url.search = "?error=oauth";
    return NextResponse.redirect(url);
  }

  url.pathname = next.startsWith("/") ? next : "/devices";
  url.search = "";
  return NextResponse.redirect(url);
}
