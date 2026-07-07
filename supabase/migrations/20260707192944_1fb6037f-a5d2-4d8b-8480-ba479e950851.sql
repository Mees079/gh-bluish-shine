
CREATE POLICY "ow_logos_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'onderwereld-logos' AND public.is_onderwereld(auth.uid()));
CREATE POLICY "ow_logos_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'onderwereld-logos' AND public.is_onderwereld_hoofd(auth.uid()));
CREATE POLICY "ow_logos_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'onderwereld-logos' AND public.is_onderwereld_hoofd(auth.uid()));
CREATE POLICY "ow_logos_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'onderwereld-logos' AND public.is_onderwereld_hoofd(auth.uid()));

CREATE POLICY "ow_avatars_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'onderwereld-avatars' AND public.is_onderwereld(auth.uid()));
CREATE POLICY "ow_avatars_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'onderwereld-avatars' AND public.is_onderwereld(auth.uid()));
CREATE POLICY "ow_avatars_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'onderwereld-avatars' AND public.is_onderwereld(auth.uid()));
CREATE POLICY "ow_avatars_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'onderwereld-avatars' AND public.is_onderwereld(auth.uid()));
