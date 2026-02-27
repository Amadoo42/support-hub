-- Create ticket_messages table
create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.ticket_messages enable row level security;

-- Policy: users can read messages for tickets they own or if they are admin
create policy "Users can view messages for their tickets"
  on public.ticket_messages
  for select
  using (
    exists (
      select 1 from public.tickets
      where tickets.id = ticket_messages.ticket_id
        and tickets.user_id = auth.uid()
    )
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Policy: users can insert messages for tickets they own or if they are admin
create policy "Users can insert messages for their tickets"
  on public.ticket_messages
  for insert
  with check (
    auth.uid() = sender_id
    and (
      exists (
        select 1 from public.tickets
        where tickets.id = ticket_messages.ticket_id
          and tickets.user_id = auth.uid()
      )
      or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    )
  );

-- Enable realtime
alter publication supabase_realtime add table public.ticket_messages;
