-- Add email column to user_roles for easier access without admin API
ALTER TABLE user_roles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing records with emails from auth.users
UPDATE user_roles ur
SET email = au.email
FROM auth.users au
WHERE ur.user_id = au.id;

-- Create function to auto-populate email on insert/update
CREATE OR REPLACE FUNCTION sync_user_role_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get email from auth.users
  SELECT email INTO NEW.email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-populate email
DROP TRIGGER IF EXISTS sync_user_role_email_trigger ON user_roles;
CREATE TRIGGER sync_user_role_email_trigger
  BEFORE INSERT OR UPDATE OF user_id ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_email();

-- Verify the update
SELECT 
  ur.id,
  ur.user_id,
  ur.email,
  ur.role,
  ur.employee_id
FROM user_roles ur
ORDER BY ur.created_at;
