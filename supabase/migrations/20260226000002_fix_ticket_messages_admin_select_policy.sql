-- Fix the SELECT policy for ticket_messages so admins can view all messages.
-- The admin check now uses (SELECT ...) subquery syntax, which is the
-- Supabase-recommended pattern: it evaluates auth.jwt() once per query
-- (rather than once per row) and ensures a stable, correct result.
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON public.ticket_messages;

CREATE POLICY "Users can view messages for their tickets"
  ON public.ticket_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
        AND tickets.user_id = auth.uid()
    )
    OR (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')) = 'admin'
  );
