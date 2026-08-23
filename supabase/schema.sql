-- ============================================================
-- Detallitos Accesorios - Esquema Supabase (PostgreSQL)
-- Ejecutar en el SQL Editor de tu proyecto Supabase.
-- ============================================================

-- Extensión para UUID
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. TABLAS
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  lastname text,
  phone text,
  role text not null default 'customer',
  save_carts boolean not null default true,
  notifications boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. FUNCIÓN DE ROL ADMIN
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create table if not exists public.categories (
  id serial primary key,
  slug text not null unique,
  name text not null,
  discount int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id serial primary key,
  category_id int references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  old_price numeric(10,2),
  discount int not null default 0,
  stock int not null default 0,
  image text,
  rating numeric(2,1) not null default 5,
  is_new boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id serial primary key,
  code text not null unique,
  discount int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id serial primary key,
  name text not null,
  percent int not null default 0,
  target_type text not null default 'product',
  target_id int,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text,
  customer_phone text,
  subtotal numeric(10,2) not null default 0,
  status text not null default 'pendiente',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id serial primary key,
  order_id int references public.orders(id) on delete cascade,
  product_id int references public.products(id) on delete set null,
  qty int not null default 1,
  price numeric(10,2) not null default 0
);

-- ------------------------------------------------------------
-- 3. TRIGGER: crear perfil automáticamente al registrarse
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, lastname, phone, role, save_carts, notifications)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'lastname', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'customer',
    coalesce((new.raw_user_meta_data ->> 'save_carts')::boolean, true),
    coalesce((new.raw_user_meta_data ->> 'notifications')::boolean, true)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.coupons enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- PROFILES
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_trigger" on public.profiles
  for insert with check (auth.uid() = id);

-- CATEGORIES
create policy "categories_read_all" on public.categories
  for select using (true);
create policy "categories_write_admin" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- PRODUCTS
create policy "products_read_all" on public.products
  for select using (true);
create policy "products_write_admin" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- COUPONS
create policy "coupons_read_auth" on public.coupons
  for select using (auth.role() = 'authenticated');
create policy "coupons_write_admin" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- PROMOTIONS
create policy "promotions_read_all" on public.promotions
  for select using (true);
create policy "promotions_write_admin" on public.promotions
  for all using (public.is_admin()) with check (public.is_admin());

-- ORDERS
create policy "orders_insert_owner" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "orders_select_owner_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_update_admin" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- ORDER ITEMS
create policy "items_insert_owner" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders
      where orders.id = order_id and orders.user_id = auth.uid()
    )
  );
create policy "items_select_owner_or_admin" on public.order_items
  for select using (public.is_admin() or
    exists (
      select 1 from public.orders
      where orders.id = order_id and orders.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 5. DATOS INICIALES
-- ------------------------------------------------------------
insert into public.categories (slug, name) values
  ('collares', 'Collares'),
  ('pulseras', 'Pulseras'),
  ('anillos', 'Anillos'),
  ('aretes', 'Aretes'),
  ('cabello', 'Accesorios para el cabello'),
  ('personalizados', 'Regalos Personalizados')
on conflict (slug) do nothing;

insert into public.coupons (code, discount, active) values
  ('BIENVENIDA', 10, true)
on conflict (code) do nothing;
