create policy "Allow anonymous read access to service_health_logs"
on "public"."service_health_logs"
as permissive
for select
to public
using (true);


create policy "Allow authenticated users to manage service_health_logs"
on "public"."service_health_logs"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow users to insert their own profile"
on "public"."user_profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "Allow users to read their own profile"
on "public"."user_profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Allow users to update their own profile"
on "public"."user_profiles"
as permissive
for update
to public
using ((auth.uid() = id));



