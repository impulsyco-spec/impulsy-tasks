-- SCHEMA: Impulsy Tasks
-- Ejecutar en Supabase > SQL Editor

-- 1. Organizaciones (cuentas de clientes)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Perfiles de usuario (extiende auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  full_name text,
  role text check (role in ('owner', 'member')) default 'member',
  created_at timestamptz default now()
);

-- 3. Transcripts
create table transcripts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  created_by uuid references profiles(id),
  title text not null,
  content text not null,
  source text check (source in ('manual', 'fathom')) default 'manual',
  created_at timestamptz default now()
);

-- 4. Tareas
create table tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  transcript_id uuid references transcripts(id) on delete set null,
  created_by uuid references profiles(id),
  assigned_to uuid references profiles(id),
  title text not null,
  description text,
  status text check (status in ('pending_approval', 'active', 'completed', 'rejected')) default 'pending_approval',
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Notificaciones in-app
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- RLS: Habilitar seguridad por fila
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table transcripts enable row level security;
alter table tasks enable row level security;
alter table notifications enable row level security;

-- Políticas: usuarios ven solo su organización
create policy "Profiles: own org" on profiles
  for all using (
    organization_id = (select organization_id from profiles where id = auth.uid())
  );

create policy "Organizations: own" on organizations
  for all using (
    id = (select organization_id from profiles where id = auth.uid())
  );

create policy "Transcripts: own org" on transcripts
  for all using (
    organization_id = (select organization_id from profiles where id = auth.uid())
  );

create policy "Tasks: own org" on tasks
  for all using (
    organization_id = (select organization_id from profiles where id = auth.uid())
  );

create policy "Notifications: own" on notifications
  for all using (user_id = auth.uid());

-- Trigger: actualizar updated_at en tasks
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

-- Trigger: crear perfil al registrarse (sin org, se asigna después)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
