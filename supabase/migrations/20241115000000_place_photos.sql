-- Photos on a place. Run this in the Supabase SQL editor after the family-map migration.
-- The bucket is private. Signed-in members of that map can read and add photos.
-- An account that is not on the map cannot select the rows or the files.

create table if not exists public.place_photos (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.family_maps (id) on delete cascade,
  place_id text not null,
  storage_path text not null unique,
  created_by uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  foreign key (map_id, place_id) references public.places (map_id, id) on delete cascade
);

create index if not exists place_photos_place_idx on public.place_photos (map_id, place_id);

create or replace function public.limit_place_photos()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.place_photos
    where map_id = new.map_id
      and place_id = new.place_id
  ) >= 10 then
    raise exception '10 photos is the limit';
  end if;
  return new;
end;
$$;

drop trigger if exists place_photos_limit on public.place_photos;
create trigger place_photos_limit
  before insert on public.place_photos
  for each row execute procedure public.limit_place_photos();

alter table public.place_photos enable row level security;

drop policy if exists "members read place photos" on public.place_photos;
create policy "members read place photos"
  on public.place_photos
  for select
  to authenticated
  using (public.is_map_member(map_id));

drop policy if exists "members add place photos" on public.place_photos;
create policy "members add place photos"
  on public.place_photos
  for insert
  to authenticated
  with check (public.is_map_member(map_id));

drop policy if exists "members remove place photos" on public.place_photos;
create policy "members remove place photos"
  on public.place_photos
  for delete
  to authenticated
  using (public.is_map_member(map_id));

grant select, insert, delete on public.place_photos to authenticated;

insert into storage.buckets (id, name, public)
values ('place-photos', 'place-photos', false)
on conflict (id) do update set public = false;

drop policy if exists "members read place photo files" on storage.objects;
create policy "members read place photo files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'place-photos'
    and public.is_map_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "members upload place photo files" on storage.objects;
create policy "members upload place photo files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'place-photos'
    and public.is_map_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "members delete place photo files" on storage.objects;
create policy "members delete place photo files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'place-photos'
    and public.is_map_member(((storage.foldername(name))[1])::uuid)
  );
