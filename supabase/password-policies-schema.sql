-- Password Policies Configuration Table
CREATE TABLE IF NOT EXISTS password_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'length', 'character', 'history', 'expiry', 'complexity'
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  value_numeric INTEGER, -- For numeric values like min_length, max_length, history_count, expiry_days
  value_text TEXT, -- For text values if needed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rule_name)
);

-- Password History Table (track previous passwords to prevent reuse)
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Password Metadata Table
CREATE TABLE IF NOT EXISTS user_password_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_changed_at TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  strength VARCHAR(20) DEFAULT 'unknown', -- 'weak', 'medium', 'strong'
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  force_change_on_next_login BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Insert default password policy rules
INSERT INTO password_policies (rule_name, rule_type, description, enabled, value_numeric) VALUES
('min_length', 'length', 'Minimum number of characters required', true, 8),
('max_length', 'length', 'Maximum number of characters allowed', true, 128),
('require_uppercase', 'character', 'Must contain at least one uppercase letter', true, 1),
('require_lowercase', 'character', 'Must contain at least one lowercase letter', true, 1),
('require_numbers', 'character', 'Must contain at least one numeric digit', true, 1),
('require_special_chars', 'character', 'Must contain at least one special character', true, 1),
('password_history_count', 'history', 'Prevent reusing previous N passwords', true, 5),
('password_expiry_days', 'expiry', 'Force password change after specified days', true, 90),
('warning_days_before_expiry', 'expiry', 'Warn users N days before password expires', true, 7),
('lockout_attempts', 'complexity', 'Lock account after N failed attempts', true, 5),
('enforce_complexity', 'complexity', 'Apply all enabled password rules', true, 1),
('block_common_passwords', 'complexity', 'Prevent use of dictionary words and common passwords', true, 1)
ON CONFLICT (rule_name) DO NOTHING;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_changed_at ON password_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_password_metadata_user_id ON user_password_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_user_password_metadata_expiry_date ON user_password_metadata(expiry_date);

-- Disable RLS for development
ALTER TABLE password_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_password_metadata DISABLE ROW LEVEL SECURITY;
