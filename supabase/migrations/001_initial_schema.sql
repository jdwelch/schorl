-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create documents table for syncing task markdown content
create table public.documents (
  user_id uuid references auth.users(id) on delete cascade primary key,
  content text not null default '',
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.documents enable row level security;

-- Create policies
-- Users can only read their own documents
create policy "Users can read own documents"
  on public.documents
  for select
  using (auth.uid() = user_id);

-- Users can insert their own documents
create policy "Users can insert own documents"
  on public.documents
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own documents
create policy "Users can update own documents"
  on public.documents
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own documents
create policy "Users can delete own documents"
  on public.documents
  for delete
  using (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to call handle_updated_at on update
create trigger on_documents_updated
  before update on public.documents
  for each row
  execute function public.handle_updated_at();

-- Create index on user_id for faster lookups
create index documents_user_id_idx on public.documents(user_id);

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all on public.documents to authenticated;
