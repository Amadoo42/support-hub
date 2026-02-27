-- Rename user_id -> sender_id and message -> body on ticket_messages
-- (handles the case where the table was created with the old column names)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'ticket_messages'
      AND column_name  = 'user_id'
  ) THEN
    ALTER TABLE public.ticket_messages RENAME COLUMN user_id TO sender_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'ticket_messages'
      AND column_name  = 'message'
  ) THEN
    ALTER TABLE public.ticket_messages RENAME COLUMN message TO body;
  END IF;
END $$;

-- Drop and recreate the INSERT policy so it references the (possibly just-renamed)
-- sender_id column instead of the old user_id column.
DROP POLICY IF EXISTS "Users can insert messages for their tickets" ON public.ticket_messages;

CREATE POLICY "Users can insert messages for their tickets"
  ON public.ticket_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      EXISTS (
        SELECT 1 FROM public.tickets
        WHERE tickets.id = ticket_messages.ticket_id
          AND tickets.user_id = auth.uid()
      )
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    )
  );
