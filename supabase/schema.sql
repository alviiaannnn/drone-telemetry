-- Jalankan di Supabase SQL Editor.
create table if not exists public.telemetry (
  id bigint generated always as identity primary key,
  device_id text not null,
  ax float8 not null, ay float8 not null, az float8 not null,
  gx float8 not null, gy float8 not null, gz float8 not null,
  temp float8 not null,
  pressure float8 not null,
  altitude float8 not null,
  battery int not null check (battery between 0 and 100),
  lat float8 not null,
  lon float8 not null,
  created_at timestamptz not null default now()
);

create index if not exists telemetry_device_created_idx
  on public.telemetry (device_id, created_at desc);

-- RLS: publik hanya boleh baca. Tanpa policy insert = hanya service role (bypass RLS) yang bisa menulis.
alter table public.telemetry enable row level security;

drop policy if exists "public read" on public.telemetry;
create policy "public read" on public.telemetry
  for select to anon, authenticated using (true);

-- Realtime
alter publication supabase_realtime add table public.telemetry;
