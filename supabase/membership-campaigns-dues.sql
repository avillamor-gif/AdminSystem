-- ── Membership Campaigns & Dues Migration ─────────────────────────────────────

-- 1. Add opt_out_email to existing members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS opt_out_email boolean NOT NULL DEFAULT false;

-- 2. Member Dues (annual/periodic fee tracking)
CREATE TABLE IF NOT EXISTS member_dues (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  period_label    text NOT NULL,                          -- e.g. "2025 Annual"
  amount          numeric(10,2) NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'PHP',
  due_date        date,
  paid_date       date,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','overdue','waived')),
  payment_method  text,
  reference_number text,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 3. Member Email Campaigns
CREATE TABLE IF NOT EXISTS member_campaigns (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,                         -- internal name
  subject          text NOT NULL,                         -- email subject
  preview_text     text,                                  -- preheader text
  body_html        text NOT NULL DEFAULT '',
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','sending','sent','scheduled')),
  recipient_filter jsonb NOT NULL DEFAULT '{"all":true}', -- audience selector
  scheduled_at     timestamptz,
  sent_at          timestamptz,
  recipient_count  integer NOT NULL DEFAULT 0,
  sent_count       integer NOT NULL DEFAULT 0,
  failed_count     integer NOT NULL DEFAULT 0,
  created_by       uuid REFERENCES auth.users(id),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- 4. Campaign Recipients (per-member tracking)
CREATE TABLE IF NOT EXISTS member_campaign_recipients (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid NOT NULL REFERENCES member_campaigns(id) ON DELETE CASCADE,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  email        text NOT NULL,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','sent','failed','bounced')),
  sent_at      timestamptz,
  error_message text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (campaign_id, member_id)
);

-- ── RLS Policies ───────────────────────────────────────────────────────────────

ALTER TABLE member_dues                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_campaigns              ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_campaign_recipients    ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage dues
CREATE POLICY "Authenticated users manage member_dues"
  ON member_dues FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Allow all authenticated users to manage campaigns
CREATE POLICY "Authenticated users manage member_campaigns"
  ON member_campaigns FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Allow all authenticated users to manage campaign recipients
CREATE POLICY "Authenticated users manage member_campaign_recipients"
  ON member_campaign_recipients FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Indexes ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_member_dues_member_id     ON member_dues(member_id);
CREATE INDEX IF NOT EXISTS idx_member_dues_status        ON member_dues(status);
CREATE INDEX IF NOT EXISTS idx_member_campaigns_status   ON member_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON member_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_member   ON member_campaign_recipients(member_id);
