-- Add open/click tracking to campaign tables

-- Per-recipient: store Resend email ID + open/click timestamps
ALTER TABLE member_campaign_recipients
  ADD COLUMN IF NOT EXISTS resend_email_id  text,
  ADD COLUMN IF NOT EXISTS opened_at        timestamptz,
  ADD COLUMN IF NOT EXISTS clicked_at       timestamptz,
  ADD COLUMN IF NOT EXISTS clicked_url      text;

-- Aggregate counts on the campaign itself
ALTER TABLE member_campaigns
  ADD COLUMN IF NOT EXISTS open_count   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count  integer NOT NULL DEFAULT 0;

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_resend_id
  ON member_campaign_recipients(resend_email_id)
  WHERE resend_email_id IS NOT NULL;

-- RPC helpers called by the webhook endpoint
CREATE OR REPLACE FUNCTION increment_campaign_open_count(campaign_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE member_campaigns SET open_count = open_count + 1 WHERE id = campaign_id;
$$;

CREATE OR REPLACE FUNCTION increment_campaign_click_count(campaign_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE member_campaigns SET click_count = click_count + 1 WHERE id = campaign_id;
$$;

