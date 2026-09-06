-- ============================================================
-- Detallitos Accesorios - Esquema Supabase (PostgreSQL)
-- Ejecutar en el SQL Editor de tu proyecto Supabase.
-- ============================================================

-- ExtensiÃ³n para UUID
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
-- 2. FUNCIÃ“N DE ROL ADMIN
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
-- 3. TRIGGER: crear perfil automÃ¡ticamente al registrarse
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
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_insert_trigger" on public.profiles;
create policy "profiles_insert_trigger" on public.profiles
  for insert with check (auth.uid() = id);

-- CATEGORIES
drop policy if exists "categories_read_all" on public.categories;
create policy "categories_read_all" on public.categories
  for select using (true);
drop policy if exists "categories_write_admin" on public.categories;
create policy "categories_write_admin" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- PRODUCTS
drop policy if exists "products_read_all" on public.products;
create policy "products_read_all" on public.products
  for select using (true);
drop policy if exists "products_write_admin" on public.products;
create policy "products_write_admin" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- COUPONS
drop policy if exists "coupons_read_auth" on public.coupons;
create policy "coupons_read_auth" on public.coupons
  for select using (auth.role() = 'authenticated');
drop policy if exists "coupons_write_admin" on public.coupons;
create policy "coupons_write_admin" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- PROMOTIONS
drop policy if exists "promotions_read_all" on public.promotions;
create policy "promotions_read_all" on public.promotions
  for select using (true);
drop policy if exists "promotions_write_admin" on public.promotions;
create policy "promotions_write_admin" on public.promotions
  for all using (public.is_admin()) with check (public.is_admin());

-- ORDERS
drop policy if exists "orders_insert_owner" on public.orders;
create policy "orders_insert_owner" on public.orders
  for insert with check (auth.uid() = user_id);
drop policy if exists "orders_select_owner_or_admin" on public.orders;
create policy "orders_select_owner_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- ORDER ITEMS
drop policy if exists "items_insert_owner" on public.order_items;
create policy "items_insert_owner" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders
      where orders.id = order_id and orders.user_id = auth.uid()
    )
  );
drop policy if exists "items_select_owner_or_admin" on public.order_items;
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

-- ------------------------------------------------------------
-- 6. CARRITOS GUARDADOS POR USUARIO
-- ------------------------------------------------------------
create table if not exists public.carts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  items jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.carts enable row level security;

drop policy if exists "carts_select_own" on public.carts;
create policy "carts_select_own" on public.carts
  for select using (auth.uid() = user_id);
drop policy if exists "carts_insert_own" on public.carts;
create policy "carts_insert_own" on public.carts
  for insert with check (auth.uid() = user_id);
drop policy if exists "carts_update_own" on public.carts;
create policy "carts_update_own" on public.carts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "carts_delete_own" on public.carts;
create policy "carts_delete_own" on public.carts
  for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 7. FAVORITOS POR USUARIO
-- ------------------------------------------------------------
create table if not exists public.favorites (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  product_ids jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = user_id);
drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = user_id);
drop policy if exists "favorites_update_own" on public.favorites;
create policy "favorites_update_own" on public.favorites
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 8. STORAGE: bucket para imágenes de productos
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "images_public_read" on storage.objects;
create policy "images_public_read" on storage.objects
  for select using (bucket_id = 'images');

drop policy if exists "images_auth_upload" on storage.objects;
create policy "images_auth_upload" on storage.objects
  for insert with check (bucket_id = 'images' and auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- 8.1. STORAGE: bucket para videos del Header (Hero)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hero-videos',
  'hero-videos',
  true,
  104857600, -- 100 MB
  array['video/mp4', 'video/webm', 'video/quicktime', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime', 'image/png', 'image/jpeg', 'image/webp'];

-- Lectura pública para cualquier visitante
drop policy if exists "hero_videos_public_select" on storage.objects;
create policy "hero_videos_public_select" on storage.objects
  for select using (bucket_id = 'hero-videos');

-- Subida para administradores
drop policy if exists "hero_videos_auth_insert" on storage.objects;
create policy "hero_videos_auth_insert" on storage.objects
  for insert with check (bucket_id = 'hero-videos' and auth.role() = 'authenticated');

-- Actualización para administradores
drop policy if exists "hero_videos_auth_update" on storage.objects;
create policy "hero_videos_auth_update" on storage.objects
  for update using (bucket_id = 'hero-videos' and auth.role() = 'authenticated');

-- Eliminación para administradores (permite borrar el video anterior)
drop policy if exists "hero_videos_auth_delete" on storage.objects;
create policy "hero_videos_auth_delete" on storage.objects
  for delete using (bucket_id = 'hero-videos' and auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- 9. IMAGEN EN CATEGORÍAS (migración)
-- ------------------------------------------------------------
alter table public.categories
  add column if not exists image text default '';

-- ------------------------------------------------------------
-- 10. AJUSTES (umbral de stock, etc.)
-- ------------------------------------------------------------
create table if not exists public.settings (
  key text primary key,
  value text not null default ''
);
insert into public.settings (key, value) values ('low_stock_threshold','5') on conflict (key) do nothing;
alter table public.settings enable row level security;
drop policy if exists "settings_read" on public.settings;
create policy "settings_read" on public.settings for select using (true);
drop policy if exists "settings_write_admin" on public.settings;
create policy "settings_write_admin" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- 11. GALERÍA (Inspírate con nosotros)
-- ------------------------------------------------------------
create table if not exists public.gallery (
  id serial primary key,
  image text not null,
  created_at timestamptz not null default now()
);
alter table public.gallery enable row level security;
drop policy if exists "gallery_read" on public.gallery;
create policy "gallery_read" on public.gallery for select using (true);
drop policy if exists "gallery_write_admin" on public.gallery;
create policy "gallery_write_admin" on public.gallery
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- 12. GESTIÓN DE USUARIOS (PANEL ADMINISTRADOR)
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Columna de email opcional en profiles para facilitar consultas
alter table public.profiles add column if not exists email text;

-- Permitir a los administradores actualizar perfiles de cualquier usuario
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- Permitir a administradores eliminar perfiles
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

-- Función para listar todos los usuarios con datos de auth y perfil
create or replace function public.admin_get_users()
returns table (
  id uuid,
  email text,
  name text,
  lastname text,
  phone text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado. Solo administradores.';
  end if;

  return query
  select 
    u.id,
    u.email::text,
    coalesce(p.name, u.raw_user_meta_data ->> 'name'),
    coalesce(p.lastname, u.raw_user_meta_data ->> 'lastname'),
    coalesce(p.phone, u.raw_user_meta_data ->> 'phone'),
    coalesce(p.role, 'customer') as role,
    u.created_at,
    u.last_sign_in_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$$;

-- Función para cambiar el rol de un usuario (admin o customer)
create or replace function public.admin_set_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado. Solo administradores.';
  end if;

  if new_role not in ('admin', 'customer') then
    raise exception 'Rol inválido. Debe ser admin o customer.';
  end if;

  insert into public.profiles (id, role)
  values (target_user_id, new_role)
  on conflict (id) do update set role = new_role;
end;
$$;

-- Función para actualizar la contraseña de un usuario directamente
create or replace function public.admin_update_user_password(target_user_id uuid, new_password text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado. Solo administradores.';
  end if;

  if length(new_password) < 6 then
    raise exception 'La contraseña debe contener al menos 6 caracteres.';
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf', 10)),
      updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'Usuario no encontrado.';
  end if;
end;
$$;

