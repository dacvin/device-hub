
  create policy "member_self_claim_delete"
  on "public"."member"
  as permissive
  for delete
  to public
using ((email = ( SELECT (auth.jwt() ->> 'email'::text))));



  create policy "member_self_insert"
  on "public"."member"
  as permissive
  for insert
  to public
with check ((id = auth.uid()));



