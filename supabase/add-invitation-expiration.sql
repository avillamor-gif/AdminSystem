-- Add expires_at column to membership_invitations
ALTER TABLE membership_invitations
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days');

-- Add index for expired invitation queries
CREATE INDEX idx_membership_invitations_expires_at ON membership_invitations(expires_at);
