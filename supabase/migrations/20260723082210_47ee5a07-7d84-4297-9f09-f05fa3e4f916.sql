
-- 1. Support tickets: lock down RLS
DROP POLICY IF EXISTS "Anyone can view their own ticket by ticket_number" ON public.support_tickets;
DROP POLICY IF EXISTS "Anyone can view messages for accessible tickets" ON public.support_messages;
DROP POLICY IF EXISTS "Anyone can add messages to tickets" ON public.support_messages;

-- Secure RPC: fetch ticket by ticket_number (acts as bearer token)
CREATE OR REPLACE FUNCTION public.get_support_ticket_by_number(_ticket_number text)
RETURNS SETOF public.support_tickets
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.support_tickets WHERE ticket_number = _ticket_number LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_support_messages_by_ticket_number(_ticket_number text)
RETURNS SETOF public.support_messages
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.* FROM public.support_messages m
  JOIN public.support_tickets t ON t.id = m.ticket_id
  WHERE t.ticket_number = _ticket_number
  ORDER BY m.created_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.add_support_message_by_number(_ticket_number text, _message text)
RETURNS public.support_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ticket_id uuid;
  _row public.support_messages;
BEGIN
  IF _message IS NULL OR length(trim(_message)) = 0 THEN
    RAISE EXCEPTION 'message required';
  END IF;
  IF length(_message) > 5000 THEN
    RAISE EXCEPTION 'message too long';
  END IF;
  SELECT id INTO _ticket_id FROM public.support_tickets WHERE ticket_number = _ticket_number;
  IF _ticket_id IS NULL THEN
    RAISE EXCEPTION 'ticket not found';
  END IF;
  INSERT INTO public.support_messages (ticket_id, message, is_admin_reply)
    VALUES (_ticket_id, _message, false)
    RETURNING * INTO _row;
  RETURN _row;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_support_ticket(
  _ticket_number text, _name text, _email text, _roblox_name text,
  _discord_name text, _subject text, _recipient text, _message text
) RETURNS public.support_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t public.support_tickets;
BEGIN
  IF _ticket_number IS NULL OR _name = '' OR _email = '' OR _subject = '' OR _message = '' THEN
    RAISE EXCEPTION 'missing required fields';
  END IF;
  INSERT INTO public.support_tickets (ticket_number, name, email, roblox_name, discord_name, subject, recipient)
    VALUES (_ticket_number, _name, _email, _roblox_name, _discord_name, _subject, _recipient)
    RETURNING * INTO _t;
  INSERT INTO public.support_messages (ticket_id, message, is_admin_reply)
    VALUES (_t.id, _message, false);
  RETURN _t;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_support_ticket_by_number(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_support_messages_by_ticket_number(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_support_message_by_number(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_support_ticket(text,text,text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_support_ticket_by_number(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_support_messages_by_ticket_number(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_support_message_by_number(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_support_ticket(text,text,text,text,text,text,text,text) TO anon, authenticated;

-- 2. MEOS notes: restrict self-delete to author only
DROP POLICY IF EXISTS "police self delete with log" ON public.meos_notes;
CREATE POLICY "police self delete own notes" ON public.meos_notes
  FOR DELETE
  USING (is_meos_member(auth.uid()) AND author_id = auth.uid());

-- 3. Storage: remove public listing (public URLs still resolve by known path)
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view home images" ON storage.objects;

-- 4. Revoke anon EXECUTE on internal role-check SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_staff_member(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_bestuur(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_meos_member(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_meos_high(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_content_creator(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_head_content_creator(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_developer_member(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_head_developer(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_onderwereld(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_onderwereld_coordinator(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_onderwereld_hoofd(uuid) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_bestuur(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_meos_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_meos_high(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_content_creator(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_head_content_creator(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_developer_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_head_developer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_onderwereld(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_onderwereld_coordinator(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_onderwereld_hoofd(uuid) TO authenticated;
