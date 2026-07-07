
CREATE OR REPLACE FUNCTION public.is_onderwereld(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('onderwereld_proef'::app_role,'onderwereld_coordinator'::app_role,'onderwereld_hoofd'::app_role,'admin'::app_role,'super_admin'::app_role))
$$;

CREATE OR REPLACE FUNCTION public.is_onderwereld_coordinator(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('onderwereld_coordinator'::app_role,'onderwereld_hoofd'::app_role,'admin'::app_role,'super_admin'::app_role))
$$;

CREATE OR REPLACE FUNCTION public.is_onderwereld_hoofd(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('onderwereld_hoofd'::app_role,'admin'::app_role,'super_admin'::app_role))
$$;

REVOKE EXECUTE ON FUNCTION public.is_onderwereld(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_onderwereld_coordinator(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_onderwereld_hoofd(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_onderwereld(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_onderwereld_coordinator(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_onderwereld_hoofd(uuid) TO authenticated;

CREATE TABLE public.ow_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ow_profiles TO authenticated;
GRANT ALL ON public.ow_profiles TO service_role;
ALTER TABLE public.ow_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ow_profiles_read" ON public.ow_profiles FOR SELECT TO authenticated USING (public.is_onderwereld(auth.uid()));
CREATE POLICY "ow_profiles_update_self" ON public.ow_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "ow_profiles_insert_self" ON public.ow_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE TRIGGER ow_profiles_updated BEFORE UPDATE ON public.ow_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ow_gangs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  logo_url text,
  level int NOT NULL DEFAULT 1,
  total_points int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ow_gangs TO authenticated;
GRANT ALL ON public.ow_gangs TO service_role;
ALTER TABLE public.ow_gangs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ow_gangs_read" ON public.ow_gangs FOR SELECT TO authenticated USING (public.is_onderwereld(auth.uid()));
CREATE POLICY "ow_gangs_insert_hoofd" ON public.ow_gangs FOR INSERT TO authenticated
  WITH CHECK (public.is_onderwereld_hoofd(auth.uid()));
CREATE POLICY "ow_gangs_update_hoofd" ON public.ow_gangs FOR UPDATE TO authenticated
  USING (public.is_onderwereld_hoofd(auth.uid())) WITH CHECK (public.is_onderwereld_hoofd(auth.uid()));
CREATE POLICY "ow_gangs_delete_hoofd" ON public.ow_gangs FOR DELETE TO authenticated
  USING (public.is_onderwereld_hoofd(auth.uid()));
CREATE TRIGGER ow_gangs_updated BEFORE UPDATE ON public.ow_gangs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ow_scenarios (
  key text PRIMARY KEY,
  label text NOT NULL,
  base_points int NOT NULL,
  display_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.ow_scenarios TO authenticated;
GRANT ALL ON public.ow_scenarios TO service_role;
ALTER TABLE public.ow_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ow_scenarios_read" ON public.ow_scenarios FOR SELECT TO authenticated USING (public.is_onderwereld(auth.uid()));
INSERT INTO public.ow_scenarios (key,label,base_points,display_order) VALUES
  ('plofkraak','Plofkraak / hit and run',1,1),
  ('gijzeling','Algemene gijzeling',2,2),
  ('bank','Bank overval',3,3),
  ('juwelier','Juwelier',6,4),
  ('museum','Museum',8,5);

CREATE TABLE public.ow_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  multiplier int NOT NULL CHECK (multiplier BETWEEN 2 AND 10),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.ow_boosts TO authenticated;
GRANT ALL ON public.ow_boosts TO service_role;
ALTER TABLE public.ow_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ow_boosts_read" ON public.ow_boosts FOR SELECT TO authenticated USING (public.is_onderwereld(auth.uid()));
CREATE POLICY "ow_boosts_insert" ON public.ow_boosts FOR INSERT TO authenticated
  WITH CHECK (public.is_onderwereld(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "ow_boosts_delete" ON public.ow_boosts FOR DELETE TO authenticated
  USING (public.is_onderwereld_coordinator(auth.uid()));

CREATE TABLE public.ow_point_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gang_id uuid NOT NULL REFERENCES public.ow_gangs(id) ON DELETE CASCADE,
  scenario_key text NOT NULL REFERENCES public.ow_scenarios(key),
  scenario_time timestamptz NOT NULL,
  clip_url text NOT NULL,
  base_points int NOT NULL,
  effective_points int NOT NULL,
  boost_multiplier int NOT NULL DEFAULT 1,
  entered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entered_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ow_point_entries_gang_idx ON public.ow_point_entries(gang_id, scenario_time DESC);
GRANT SELECT, INSERT, DELETE ON public.ow_point_entries TO authenticated;
GRANT ALL ON public.ow_point_entries TO service_role;
ALTER TABLE public.ow_point_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ow_pe_read" ON public.ow_point_entries FOR SELECT TO authenticated USING (public.is_onderwereld(auth.uid()));
CREATE POLICY "ow_pe_insert" ON public.ow_point_entries FOR INSERT TO authenticated
  WITH CHECK (public.is_onderwereld(auth.uid()) AND entered_by = auth.uid());
CREATE POLICY "ow_pe_delete" ON public.ow_point_entries FOR DELETE TO authenticated
  USING (public.is_onderwereld_coordinator(auth.uid()));

CREATE TABLE public.ow_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gang_id uuid NOT NULL REFERENCES public.ow_gangs(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('inactivity','manual')),
  reason text,
  week_start date,
  resolved_at timestamptz,
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ow_warnings_gang_idx ON public.ow_warnings(gang_id, resolved_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ow_warnings TO authenticated;
GRANT ALL ON public.ow_warnings TO service_role;
ALTER TABLE public.ow_warnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ow_warn_read" ON public.ow_warnings FOR SELECT TO authenticated USING (public.is_onderwereld(auth.uid()));
CREATE POLICY "ow_warn_insert" ON public.ow_warnings FOR INSERT TO authenticated
  WITH CHECK (public.is_onderwereld_coordinator(auth.uid()));
CREATE POLICY "ow_warn_update_hoofd" ON public.ow_warnings FOR UPDATE TO authenticated
  USING (public.is_onderwereld_coordinator(auth.uid())) WITH CHECK (public.is_onderwereld_coordinator(auth.uid()));
CREATE POLICY "ow_warn_delete_hoofd" ON public.ow_warnings FOR DELETE TO authenticated
  USING (public.is_onderwereld_hoofd(auth.uid()));

CREATE TABLE public.ow_inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('system','chat','urgent')),
  body text NOT NULL,
  gang_id uuid REFERENCES public.ow_gangs(id) ON DELETE SET NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ow_inbox_created_idx ON public.ow_inbox_messages(created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.ow_inbox_messages TO authenticated;
GRANT ALL ON public.ow_inbox_messages TO service_role;
ALTER TABLE public.ow_inbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ow_inbox_read" ON public.ow_inbox_messages FOR SELECT TO authenticated USING (public.is_onderwereld(auth.uid()));
CREATE POLICY "ow_inbox_insert" ON public.ow_inbox_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_onderwereld(auth.uid()));
CREATE POLICY "ow_inbox_delete_hoofd" ON public.ow_inbox_messages FOR DELETE TO authenticated
  USING (public.is_onderwereld_hoofd(auth.uid()));

CREATE OR REPLACE FUNCTION public.ow_level_for_points(_pts int)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _pts >= 3050 THEN 6
    WHEN _pts >= 1900 THEN 5
    WHEN _pts >= 1100 THEN 4
    WHEN _pts >= 550  THEN 3
    WHEN _pts >= 200  THEN 2
    ELSE 1
  END
$$;

CREATE OR REPLACE FUNCTION public.ow_recalc_gang(_gang_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _total int; _lvl int;
BEGIN
  SELECT COALESCE(SUM(effective_points),0) INTO _total FROM public.ow_point_entries WHERE gang_id = _gang_id;
  _lvl := public.ow_level_for_points(_total);
  UPDATE public.ow_gangs SET total_points = _total, level = _lvl, updated_at = now() WHERE id = _gang_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ow_pe_after_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.ow_recalc_gang(OLD.gang_id);
    RETURN OLD;
  ELSE
    PERFORM public.ow_recalc_gang(NEW.gang_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER ow_pe_recalc_trg AFTER INSERT OR DELETE ON public.ow_point_entries
FOR EACH ROW EXECUTE FUNCTION public.ow_pe_after_change();

CREATE OR REPLACE FUNCTION public.ow_pe_apply_boost()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _mult int;
BEGIN
  SELECT COALESCE(MAX(multiplier),1) INTO _mult FROM public.ow_boosts
    WHERE NEW.scenario_time >= starts_at AND NEW.scenario_time < ends_at;
  NEW.boost_multiplier := _mult;
  NEW.effective_points := NEW.base_points * _mult;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ow_pe_boost_trg BEFORE INSERT ON public.ow_point_entries
FOR EACH ROW EXECUTE FUNCTION public.ow_pe_apply_boost();

CREATE OR REPLACE FUNCTION public.ow_weekly_inactivity_check()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _week_start date; _week_end date; _g record; _pts int; _existing uuid; _active_count int;
BEGIN
  _week_end := (date_trunc('week', (now() AT TIME ZONE 'Europe/Amsterdam')))::date;
  _week_start := _week_end - 7;

  FOR _g IN SELECT id, name FROM public.ow_gangs LOOP
    SELECT COALESCE(SUM(effective_points),0) INTO _pts FROM public.ow_point_entries
      WHERE gang_id = _g.id
        AND scenario_time >= (_week_start::timestamp AT TIME ZONE 'Europe/Amsterdam')
        AND scenario_time <  (_week_end::timestamp   AT TIME ZONE 'Europe/Amsterdam');

    SELECT id INTO _existing FROM public.ow_warnings
      WHERE gang_id = _g.id AND type='inactivity' AND week_start = _week_start LIMIT 1;

    IF _pts < 50 THEN
      IF _existing IS NULL THEN
        INSERT INTO public.ow_warnings (gang_id,type,reason,week_start,issued_by_name)
        VALUES (_g.id,'inactivity',
          format('Gang haalde %s punten in de week van %s (minimaal 50 vereist).', _pts, to_char(_week_start,'DD-MM-YYYY')),
          _week_start,'Systeem');
        INSERT INTO public.ow_inbox_messages (kind,body,gang_id,author_name)
        VALUES ('system', format('⚠️ Inactiviteit: %s haalde slechts %s punten deze week.', _g.name, _pts), _g.id,'Systeem');

        SELECT COUNT(*) INTO _active_count FROM public.ow_warnings
          WHERE gang_id=_g.id AND resolved_at IS NULL;
        IF _active_count >= 3 THEN
          INSERT INTO public.ow_inbox_messages (kind,body,gang_id,author_name)
          VALUES ('urgent', format('🚨 SPOED: %s heeft %s actieve waarschuwingen — actie vereist!', _g.name, _active_count), _g.id,'Systeem');
        END IF;
      END IF;
    ELSE
      UPDATE public.ow_warnings SET resolved_at = now()
        WHERE gang_id = _g.id AND type='inactivity' AND resolved_at IS NULL;
    END IF;
  END LOOP;
END;
$$;

DO $$ BEGIN
  PERFORM cron.schedule('ow-weekly-inactivity','5 0 * * 1', 'SELECT public.ow_weekly_inactivity_check();');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
