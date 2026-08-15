-- À coller dans l'éditeur SQL de Supabase (SQL Editor > New query > Run)

create table if not exists models (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  format text,
  file_path text not null,
  file_name text,
  size_bytes bigint,
  images text[] default '{}',
  created_at timestamptz default now()
);

alter table models enable row level security;

-- Tout le monde peut lire la bibliothèque
create policy "Lecture publique" on models
  for select using (true);

-- Tout le monde peut publier un fichier (pas de compte requis)
-- Si tu veux plus tard restreindre la publication, remplace "true" par
-- une vérification d'authentification (auth.role() = 'authenticated').
create policy "Publication publique" on models
  for insert with check (true);
