-- ============================================================
-- Leave Policy Alignment with IBON Manual (June 2023)
-- Applied: May 2026
-- Run ONLY if reverting or re-applying from scratch — these
-- changes were already applied via the REST API.
-- ============================================================

-- 1. Fix Vacation Leave accrual: 5 → 15 days/year
UPDATE accrual_rules
SET accrual_rate = 15
WHERE rule_code = 'VL';

-- 2. Fix Sick Leave accrual: 1 → 15 days/year + 183-day waiting period (after 6th month of employment)
UPDATE accrual_rules
SET accrual_rate = 15,
    waiting_period_days = 183
WHERE rule_code = 'SL';

-- 3. Deactivate Bereavement Leave — manual states PHP 15,000 financial assistance only (section 17.15.2),
--    not a leave type. Existing leave requests are preserved.
UPDATE leave_types
SET is_active = false
WHERE leave_type_code = 'BL';

-- 4. Add Solo Parent Leave type (RA 8972 — Solo Parents' Welfare Act of 2000)
INSERT INTO leave_types (leave_type_name, leave_type_code, description, category, is_paid, requires_approval, color_code, display_order, is_active)
VALUES (
  'Solo Parent Leave', 'SPL',
  'Parental leave for solo parents per RA 8972. 7 working days/year. Requires ≥1 year of service and a valid Solo Parent ID. Non-cumulative and not commutable to cash.',
  'other', true, true, '#8b5cf6', 9, true
)
ON CONFLICT (leave_type_code) DO NOTHING;

-- 5. Add Solo Parent Leave accrual rule (7 days/year, 365-day service wait)
INSERT INTO accrual_rules (rule_name, rule_code, leave_type_id, accrual_frequency, accrual_rate, carry_over_enabled, waiting_period_days, is_active)
SELECT 'Solo Parent Leave', 'SPL-ANNUAL', id, 'annually', 7, false, 365, true
FROM leave_types WHERE leave_type_code = 'SPL'
ON CONFLICT (rule_code) DO NOTHING;

-- 6. Add Paternity Leave accrual rule (7 days, RA 8187 — first 4 deliveries)
INSERT INTO accrual_rules (rule_name, rule_code, leave_type_id, accrual_frequency, accrual_rate, carry_over_enabled, waiting_period_days, is_active)
SELECT 'Paternity Leave', 'PAL-ANNUAL', id, 'annually', 7, false, 0, true
FROM leave_types WHERE leave_type_code = 'PAL'
ON CONFLICT (rule_code) DO NOTHING;

-- 7. Add Maternity Leave accrual rule (105 days, RA 11210 — Expanded Maternity Leave Act)
INSERT INTO accrual_rules (rule_name, rule_code, leave_type_id, accrual_frequency, accrual_rate, carry_over_enabled, waiting_period_days, is_active)
SELECT 'Maternity Leave', 'ML-ANNUAL', id, 'annually', 105, false, 0, true
FROM leave_types WHERE leave_type_code = 'ML'
ON CONFLICT (rule_code) DO NOTHING;

-- 8. Add Probationary employment type
INSERT INTO employment_types (name, code, category, description, is_active)
VALUES (
  'Probationary', 'PROB', 'permanent',
  '6-month probationary period for newly hired staff. Interim evaluation at 3rd month, final performance evaluation at 5th month. Entitled to mandatory contributions (SSS, PAG-IBIG, PhilHealth) and prorated 13th month pay.',
  true
)
ON CONFLICT (code) DO NOTHING;
