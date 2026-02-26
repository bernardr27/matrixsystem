-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('ghost-storage', 'ghost-storage', true)
ON CONFLICT (id) DO NOTHING;

-- Set up a public access policy
-- This allows anyone (including your screen capture tool) to upload and read
CREATE POLICY "Public Access"
ON storage.objects FOR ALL
USING ( bucket_id = 'ghost-storage' )
WITH CHECK ( bucket_id = 'ghost-storage' );
