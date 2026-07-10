create or replace view "public"."device_loan_status"
with (security_invoker=on) as  SELECT d.id AS device_id,
    d.quantity AS total,
    (COALESCE(sum((c.quantity - COALESCE(ci.taken, (0)::bigint))), (0)::numeric))::integer AS on_loan,
    (((d.quantity)::numeric - COALESCE(sum((c.quantity - COALESCE(ci.taken, (0)::bigint))), (0)::numeric)))::integer AS available,
    COALESCE(bool_or(((c.expected_return_date < CURRENT_DATE) AND ((c.quantity - COALESCE(ci.taken, (0)::bigint)) > 0))), false) AS has_overdue,
    (count(c.id) FILTER (WHERE ((c.quantity - COALESCE(ci.taken, (0)::bigint)) > 0)))::integer AS active_checkouts
   FROM ((public.devices d
     LEFT JOIN public.checkouts c ON ((c.device_id = d.id)))
     LEFT JOIN ( SELECT checkins.checkout_id,
            sum(checkins.quantity) AS taken
           FROM public.checkins
          GROUP BY checkins.checkout_id) ci ON ((ci.checkout_id = c.id)))
  GROUP BY d.id, d.quantity;

revoke all on "public"."device_loan_status" from anon;

grant select on "public"."device_loan_status" to authenticated;

grant select on "public"."device_loan_status" to service_role;


