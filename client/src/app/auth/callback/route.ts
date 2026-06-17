import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

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

  // Link the auth.users row to the invited public.users row by email.
  // If an invited row exists, fill in auth_user_id + flip to active. If no
  // row exists yet, create one (self-signup not via invite).
  const { data: existing } = await supabase
    .from("users")
    .select("id, auth_user_id")
    .eq("email", user.email)
    .maybeSingle();

  if (existing) {
    if (existing.auth_user_id !== user.id) {
      await supabase
        .from("users")
        .update({
          auth_user_id: user.id,
          status: "active",
          last_active_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    }
  } else {
    await supabase.from("users").insert({
      auth_user_id: user.id,
      email: user.email,
      name,
      role: "member",
      status: "active",
      last_active_at: new Date().toISOString(),
    });
  }

  url.pathname = next.startsWith("/") ? next : "/";
  url.search = "";
  return NextResponse.redirect(url);
}
