
-- Fix search_path on validate_ticket_priority function
CREATE OR REPLACE FUNCTION public.validate_ticket_priority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.priority NOT IN ('Low', 'Medium', 'High', 'Critical') THEN
    RAISE EXCEPTION 'Invalid priority value: %. Must be Low, Medium, High, or Critical.', NEW.priority;
  END IF;
  RETURN NEW;
END;
$$;
