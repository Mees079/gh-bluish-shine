SELECT cron.unschedule('cc-check-live-every-minute');
SELECT cron.schedule('cc-check-live-every-5-minutes', '*/5 * * * *', $$
  SELECT net.http_post(
    url:='https://houdpzneyagzirbtchde.supabase.co/functions/v1/cc-check-live',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdWRwem5leWFnemlyYnRjaGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDI2NDksImV4cCI6MjA3NjAxODY0OX0.iSZqpLIXD1kfeVVV82lR9hF2cAaVDWDXNn2P7WcQu6w","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdWRwem5leWFnemlyYnRjaGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDI2NDksImV4cCI6MjA3NjAxODY0OX0.iSZqpLIXD1kfeVVV82lR9hF2cAaVDWDXNn2P7WcQu6w"}'::jsonb,
    body:='{}'::jsonb
  );
$$);