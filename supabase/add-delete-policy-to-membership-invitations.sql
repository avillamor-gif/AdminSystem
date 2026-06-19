-- Add DELETE policy to membership_invitations table to allow deletion by authenticated users

CREATE POLICY membership_invitations_delete
  ON membership_invitations FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()));
