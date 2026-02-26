-- Add cognitive architecture fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS archetype jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS core_values jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_mood text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_energy integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cognitive_bias jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active timestamptz;

-- Security: Ensure users can update their own cognitive data
CREATE POLICY "Users can update their own cognitive data" 
ON profiles FOR UPDATE 
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );
