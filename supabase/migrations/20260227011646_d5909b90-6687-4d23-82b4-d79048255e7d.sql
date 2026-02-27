
-- Add priority and due_date columns to tickets
ALTER TABLE public.tickets ADD COLUMN priority text NOT NULL DEFAULT 'Medium';
ALTER TABLE public.tickets ADD COLUMN due_date timestamptz;

-- Use a validation trigger instead of CHECK constraint for priority
CREATE OR REPLACE FUNCTION public.validate_ticket_priority()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.priority NOT IN ('Low', 'Medium', 'High', 'Critical') THEN
    RAISE EXCEPTION 'Invalid priority value: %. Must be Low, Medium, High, or Critical.', NEW.priority;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_ticket_priority
  BEFORE INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ticket_priority();

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  old_status text,
  new_status text,
  changed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view audit logs for their own tickets
CREATE POLICY "Users can view own ticket audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = audit_logs.ticket_id AND t.user_id = auth.uid()
    )
  );

-- Trigger function to log status changes
CREATE OR REPLACE FUNCTION public.log_ticket_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (ticket_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_ticket_status_change
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ticket_status_change();

-- Enable realtime for audit_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
