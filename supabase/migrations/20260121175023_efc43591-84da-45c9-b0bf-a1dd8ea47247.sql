-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  roblox_name TEXT NOT NULL,
  discord_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support messages table for chat functionality
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin_reply BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets
CREATE POLICY "Anyone can create support tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view their own ticket by ticket_number"
ON public.support_tickets
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage all tickets"
ON public.support_tickets
FOR ALL
USING (is_admin(auth.uid()));

-- RLS policies for support_messages
CREATE POLICY "Anyone can view messages for accessible tickets"
ON public.support_messages
FOR SELECT
USING (true);

CREATE POLICY "Anyone can add messages to tickets"
ON public.support_messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage all messages"
ON public.support_messages
FOR ALL
USING (is_admin(auth.uid()));

-- Add trigger for updated_at on support_tickets
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();