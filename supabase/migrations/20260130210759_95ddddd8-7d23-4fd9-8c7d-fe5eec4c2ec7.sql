-- Create storage bucket for home images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('home-images', 'home-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Public can view home images"
ON storage.objects FOR SELECT
USING (bucket_id = 'home-images');

-- Create policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload home images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'home-images' AND auth.role() = 'authenticated');

-- Create policy for authenticated users to delete
CREATE POLICY "Authenticated users can delete home images"
ON storage.objects FOR DELETE
USING (bucket_id = 'home-images' AND auth.role() = 'authenticated');

-- Create policy for authenticated users to update
CREATE POLICY "Authenticated users can update home images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'home-images' AND auth.role() = 'authenticated');