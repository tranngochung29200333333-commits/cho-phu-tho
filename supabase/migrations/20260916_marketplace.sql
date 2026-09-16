-- Chợ Phú Thọ - marketplace/dịch vụ migration
-- Chạy 1 lần trong Supabase SQL Editor trước khi bật đầy đủ tính năng mới.

alter table public.listings
    add column if not exists category text default 'Khác',
    add column if not exists subcategory text,
    add column if not exists contact_phone text,
    add column if not exists contact_zalo text,
    add column if not exists latitude double precision,
    add column if not exists longitude double precision,
    add column if not exists view_count integer not null default 0;

alter table public.listing_images
    add column if not exists sort_order integer not null default 0;

create table if not exists public.favorites (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    listing_id uuid not null references public.listings(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique(user_id, listing_id)
);

create table if not exists public.listing_reports (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.listings(id) on delete cascade,
    reporter_id uuid references auth.users(id) on delete set null,
    reason text not null,
    details text,
    created_at timestamptz not null default now(),
    status text not null default 'new'
        check (status in ('new','reviewed','resolved','rejected'))
);

create index if not exists listings_category_idx on public.listings(category);
create index if not exists listings_subcategory_idx on public.listings(subcategory);
create index if not exists listings_location_idx on public.listings(location);
create index if not exists listings_created_at_idx on public.listings(created_at desc);
create index if not exists favorites_user_idx on public.favorites(user_id);
create index if not exists favorites_listing_idx on public.favorites(listing_id);
create index if not exists reports_listing_idx on public.listing_reports(listing_id);

alter table public.favorites enable row level security;
alter table public.listing_reports enable row level security;

create policy if not exists "Users can read own favorites"
on public.favorites for select to authenticated
using (user_id = auth.uid());

create policy if not exists "Users can add own favorites"
on public.favorites for insert to authenticated
with check (user_id = auth.uid());

create policy if not exists "Users can delete own favorites"
on public.favorites for delete to authenticated
using (user_id = auth.uid());

create policy if not exists "Users can create reports"
on public.listing_reports for insert to authenticated
with check (reporter_id = auth.uid());

create policy if not exists "Users can read own reports"
on public.listing_reports for select to authenticated
using (reporter_id = auth.uid());

-- Bucket ảnh công khai để hiển thị trên website.
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

create policy if not exists "Public can read listing images"
on storage.objects for select
using (bucket_id = 'listing-images');

create policy if not exists "Authenticated users can upload listing images"
on storage.objects for insert to authenticated
with check (bucket_id = 'listing-images');

create policy if not exists "Users can update their listing images"
on storage.objects for update to authenticated
using (bucket_id = 'listing-images' and owner_id = auth.uid())
with check (bucket_id = 'listing-images');

create policy if not exists "Users can delete their listing images"
on storage.objects for delete to authenticated
using (bucket_id = 'listing-images' and owner_id = auth.uid());
