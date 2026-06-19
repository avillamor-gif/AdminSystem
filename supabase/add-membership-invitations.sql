-- Create membership invitation table for sending invites to apply for membership

CREATE TABLE IF NOT EXISTS membership_invitations (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email            VARCHAR(255) NOT NULL UNIQUE,
  target_name      VARCHAR(255),
  invitation_type  VARCHAR(50)  NOT NULL CHECK (invitation_type IN ('referred', 'direct'))
                   DEFAULT 'direct',
  referrer_id      UUID        REFERENCES employees(id) ON DELETE SET NULL,
  referrer_name    VARCHAR(255),
  invitation_code  VARCHAR(100) UNIQUE,
  status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'sent', 'accepted', 'rejected', 'expired')),
  sent_at          TIMESTAMPTZ,
  accepted_at      TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_membership_invitations_email ON membership_invitations(email);
CREATE INDEX IF NOT EXISTS idx_membership_invitations_status ON membership_invitations(status);
CREATE INDEX IF NOT EXISTS idx_membership_invitations_referrer ON membership_invitations(referrer_id);
CREATE INDEX IF NOT EXISTS idx_membership_invitations_code ON membership_invitations(invitation_code);

-- Enable RLS
ALTER TABLE membership_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only authenticated users can view
CREATE POLICY membership_invitations_select
  ON membership_invitations FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()));

-- RLS Policy: Only authenticated users can insert
CREATE POLICY membership_invitations_insert
  ON membership_invitations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()));

-- RLS Policy: Only the referrer or admins can update
CREATE POLICY membership_invitations_update
  ON membership_invitations FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid())
    OR referrer_id = (SELECT employee_id FROM user_roles WHERE user_id = auth.uid())
  );

-- RLS Policy: Only authenticated users can delete
CREATE POLICY membership_invitations_delete
  ON membership_invitations FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()));

-- Auto-generate invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS VARCHAR(100) AS $$
DECLARE
  code VARCHAR(100);
BEGIN
  code := 'MI-' || to_char(NOW(), 'YYYYMMDDHH24MISS') || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 8);
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invitation code
CREATE OR REPLACE FUNCTION set_invitation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invitation_code IS NULL THEN
    NEW.invitation_code := generate_invitation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS membership_invitations_set_code ON membership_invitations;

CREATE TRIGGER membership_invitations_set_code
BEFORE INSERT ON membership_invitations
FOR EACH ROW
EXECUTE FUNCTION set_invitation_code();
