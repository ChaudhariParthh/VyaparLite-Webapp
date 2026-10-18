create type public.txn_type as enum ('income','expense');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique,
  name text not null check (char_length(trim(name)) between 1 and 120),
  business_type text not null default 'Retail Shop' check (char_length(business_type) <= 60),
  currency text not null default 'INR' check (currency = 'INR'),
  timezone text not null default 'Asia/Kolkata' check (char_length(timezone) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.businesses to authenticated;
grant all on public.businesses to service_role;
alter table public.businesses enable row level security;
create policy "own biz select" on public.businesses for select to authenticated using (owner_id = auth.uid());
create policy "own biz insert" on public.businesses for insert to authenticated with check (owner_id = auth.uid());
create policy "own biz update" on public.businesses for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function public.owns_business(_bid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.businesses where id = _bid and owner_id = auth.uid())
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  type public.txn_type not null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id, type)
);
create unique index categories_unique_name on public.categories (business_id, type, lower(name));
grant select, insert, update on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "cat select" on public.categories for select to authenticated using (public.owns_business(business_id));
create policy "cat insert" on public.categories for insert to authenticated with check (public.owns_business(business_id));
create policy "cat update" on public.categories for update to authenticated using (public.owns_business(business_id)) with check (public.owns_business(business_id));

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_by uuid not null default auth.uid(),
  type public.txn_type not null,
  amount numeric(12,2) not null check (amount > 0),
  description text not null check (char_length(trim(description)) between 1 and 200),
  category_id uuid not null,
  transaction_date date not null,
  payment_method text check (payment_method in ('cash','upi','bank_transfer','card','other')),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, category_id, type) references public.categories(business_id, id, type)
);
create index txn_biz_date on public.transactions (business_id, transaction_date desc);
create index txn_biz_cat on public.transactions (business_id, category_id);
create index txn_biz_type on public.transactions (business_id, type);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "txn select" on public.transactions for select to authenticated using (public.owns_business(business_id));
create policy "txn insert" on public.transactions for insert to authenticated with check (public.owns_business(business_id) and created_by = auth.uid());
create policy "txn update" on public.transactions for update to authenticated using (public.owns_business(business_id)) with check (public.owns_business(business_id) and created_by = auth.uid());
create policy "txn delete" on public.transactions for delete to authenticated using (public.owns_business(business_id));

-- immutable ownership fields + updated_at
create or replace function public.touch_updated() returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if tg_table_name = 'businesses' then new.owner_id := old.owner_id; end if;
  if tg_table_name in ('categories','transactions') then new.business_id := old.business_id; end if;
  if tg_table_name = 'transactions' then new.created_by := old.created_by; end if;
  if tg_table_name = 'categories' then new.type := old.type; end if;
  return new;
end $$;
create trigger t_prof before update on public.profiles for each row execute function public.touch_updated();
create trigger t_biz before update on public.businesses for each row execute function public.touch_updated();
create trigger t_cat before update on public.categories for each row execute function public.touch_updated();
create trigger t_txn before update on public.transactions for each row execute function public.touch_updated();

-- default categories on business creation
create or replace function public.seed_categories() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.categories (business_id, name, type) values
    (new.id,'Sales','income'),(new.id,'Service Income','income'),(new.id,'Other Income','income'),
    (new.id,'Stock/Inventory','expense'),(new.id,'Rent','expense'),(new.id,'Utilities','expense'),
    (new.id,'Transport','expense'),(new.id,'Salaries','expense'),(new.id,'Marketing','expense'),
    (new.id,'Repairs','expense'),(new.id,'Other Expenses','expense')
  on conflict do nothing;
  return new;
end $$;
create trigger t_seed after insert on public.businesses for each row execute function public.seed_categories();

-- profile on signup
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

revoke execute on function public.seed_categories() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;