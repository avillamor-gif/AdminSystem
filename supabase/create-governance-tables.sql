-- ============================================================
-- Governance Module
-- Board of Trustees, Membership Registry, General Assemblies
-- Run in: Supabase SQL Editor
-- ============================================================

-- ── 1. Board Trustees ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS board_trustees (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trustee_number VARCHAR(50) UNIQUE,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255),
  phone         VARCHAR(50),
  address       TEXT,
  city          VARCHAR(100),
  country       VARCHAR(100) DEFAULT 'Philippines',
  avatar_url    TEXT,
  notes         TEXT,
  status        VARCHAR(20)  NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive', 'deceased')),
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── 2. Board Terms ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS board_terms (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trustee_id   UUID        NOT NULL REFERENCES board_trustees(id) ON DELETE CASCADE,
  position     VARCHAR(100) NOT NULL
               CHECK (position IN ('Chairperson','Vice Chairperson','Secretary','Treasurer','Trustee')),
  term_start   DATE        NOT NULL,
  term_end     DATE,
  is_current   BOOLEAN     NOT NULL DEFAULT FALSE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_board_terms_trustee  ON board_terms(trustee_id);
CREATE INDEX IF NOT EXISTS idx_board_terms_current  ON board_terms(is_current) WHERE is_current = TRUE;

-- ── 3. Members ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_number    VARCHAR(50) UNIQUE,
  first_name       VARCHAR(100) NOT NULL,
  last_name        VARCHAR(100) NOT NULL,
  email            VARCHAR(255),
  phone            VARCHAR(50),
  address          TEXT,
  city             VARCHAR(100),
  country          VARCHAR(100) DEFAULT 'Philippines',
  membership_type  VARCHAR(50)  NOT NULL DEFAULT 'regular'
                   CHECK (membership_type IN ('regular','associate','honorary','institutional')),
  status           VARCHAR(20)  NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','inactive','suspended','lapsed','deceased')),
  date_admitted    DATE,
  notes            TEXT,
  avatar_url       TEXT,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_type   ON members(membership_type);

-- ── 4. General Assemblies ───────────────────────────────────
CREATE TABLE IF NOT EXISTS general_assemblies (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(255) NOT NULL,
  ga_date      DATE         NOT NULL,
  location     TEXT,
  description  TEXT,
  minutes_url  TEXT,
  status       VARCHAR(20)  NOT NULL DEFAULT 'upcoming'
               CHECK (status IN ('upcoming','completed','cancelled')),
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ga_date   ON general_assemblies(ga_date DESC);
CREATE INDEX IF NOT EXISTS idx_ga_status ON general_assemblies(status);

-- ── 5. GA Attendees ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ga_attendees (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ga_id      UUID        NOT NULL REFERENCES general_assemblies(id) ON DELETE CASCADE,
  member_id  UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ga_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_ga_attendees_ga     ON ga_attendees(ga_id);
CREATE INDEX IF NOT EXISTS idx_ga_attendees_member ON ga_attendees(member_id);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE board_trustees    ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_terms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ga_attendees      ENABLE ROW LEVEL SECURITY;

-- Admins and HR can manage everything; all authenticated can read
CREATE POLICY "governance_read"  ON board_trustees    FOR SELECT TO authenticated USING (true);
CREATE POLICY "governance_write" ON board_trustees    FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','hr')));

CREATE POLICY "terms_read"  ON board_terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "terms_write" ON board_terms FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','hr')));

CREATE POLICY "members_read"  ON members FOR SELECT TO authenticated USING (true);
CREATE POLICY "members_write" ON members FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','hr')));

CREATE POLICY "ga_read"  ON general_assemblies FOR SELECT TO authenticated USING (true);
CREATE POLICY "ga_write" ON general_assemblies FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','hr')));

CREATE POLICY "ga_att_read"  ON ga_attendees FOR SELECT TO authenticated USING (true);
CREATE POLICY "ga_att_write" ON ga_attendees FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','hr')));
