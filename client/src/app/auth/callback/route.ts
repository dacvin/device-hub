import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/overview";

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    url.pathname = "/login";
    url.search = "?error=oauth";
    return NextResponse.redirect(url);
  }

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email;

  // If an invited row exists with this email under a different id (created
  // via the invite flow before this user signed up), delete it so the upsert
  // below can claim the email under the real auth.uid().
  const { data: existing } = await supabase
    .from("member")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();
  if (existing && existing.id !== user.id) {
    await supabase.from("member").delete().eq("id", existing.id);
  }

  const { error: upsertError } = await supabase
    .from("member")
    .upsert(
      {
        id: user.id,
        email: user.email,
        name,
        status: "active",
        last_active_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  if (upsertError) {
    console.error("member upsert failed", upsertError);
    // Continue — RLS will surface the issue on the next page.
  }

  url.pathname = next.startsWith("/") ? next : "/overview";
  url.search = "";
  return NextResponse.redirect(url);
}
