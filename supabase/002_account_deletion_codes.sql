-- Create account_deletion_codes table for temporary verification codes
CREATE TABLE IF NOT EXISTS account_deletion_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code varchar(6) NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS account_deletion_codes_user_id_idx ON account_deletion_codes(user_id);
CREATE INDEX IF NOT EXISTS account_deletion_codes_expires_at_idx ON account_deletion_codes(expires_at);

-- Enable Row Level Security
ALTER TABLE account_deletion_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to INSERT/UPDATE their own codes
CREATE POLICY "Users can create their own deletion codes"
  ON account_deletion_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deletion codes"
  ON account_deletion_codes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to SELECT their own codes
CREATE POLICY "Users can only see their own deletion codes"
  ON account_deletion_codes
  FOR SELECT
  USING (auth.uid() = user_id);
