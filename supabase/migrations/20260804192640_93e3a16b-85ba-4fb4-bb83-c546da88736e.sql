create or replace function public.submit_application(
  _team text,
  _name text,
  _discord_name text,
  _discord_id text,
  _roblox_name text,
  _age text,
  _answers jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _id uuid;
begin
  insert into public.applications (team, name, discord_name, discord_id, roblox_name, age, answers, status)
  values (_team, _name, _discord_name, _discord_id, _roblox_name, _age, _answers, 'pending')
  returning id into _id;

  return _id;
end;
$$;

grant execute on function public.submit_application(text, text, text, text, text, text, jsonb) to anon, authenticated;
