-- Enums
create type typ_inzeratu as enum ('Nabídka','Poptávka');
create type produkt as enum ('Seno','Sláma');
create type stav_inzeratu as enum ('Nové','Ověřeno','Archivováno');

-- Tabulka inzerátů
create table if not exists public.inzeraty (
  id uuid primary key default gen_random_uuid(),
  typ_inzeratu typ_inzeratu not null,
  nazev text not null,
  produkt produkt not null,
  mnozstvi_baliky int not null check (mnozstvi_baliky > 0),
  kraj text not null,
  sec text null,
  rok_sklizne text null,
  cena_za_balik int null check (cena_za_balik is null or cena_za_balik >= 0),
  popis text null,
  kontakt_jmeno text not null,
  kontakt_telefon text not null,
  kontakt_email text not null,
  fotky jsonb[] null,
  status stav_inzeratu not null default 'Nové',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

-- Indexy
create index if not exists idx_inzeraty_status_produkt on public.inzeraty (status, produkt);
create index if not exists idx_inzeraty_kraj on public.inzeraty (kraj);
create index if not exists idx_inzeraty_created_desc on public.inzeraty (created_at desc);

-- Tokeny
create table if not exists public.confirm_tokens (
  token uuid primary key default gen_random_uuid(),
  inzerat_id uuid not null references public.inzeraty(id) on delete cascade,
  email text not null,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

-- RLS
alter table public.inzeraty enable row level security;
alter table public.confirm_tokens enable row level security;

-- SELECT: anon smí vidět jen Ověřeno a neexpirované
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'anon_select_verified') then
    create policy anon_select_verified on public.inzeraty
      for select to anon
      using (status = 'Ověřeno' and now() < expires_at);
  end if;
end $$;

-- INSERT: anon smí vkládat nové
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'anon_insert_new') then
    create policy anon_insert_new on public.inzeraty
      for insert to anon
      with check (true);
  end if;
end $$;

-- confirm_tokens bez policies pro anon/authenticated (jen service role)