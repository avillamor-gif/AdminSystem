-- Make required columns nullable so travel requests can be saved as drafts
-- with incomplete data. All validation happens at submit time in the app.
ALTER TABLE travel_requests ALTER COLUMN destination DROP NOT NULL;
ALTER TABLE travel_requests ALTER COLUMN country DROP NOT NULL;
ALTER TABLE travel_requests ALTER COLUMN purpose DROP NOT NULL;
ALTER TABLE travel_requests ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE travel_requests ALTER COLUMN end_date DROP NOT NULL;
ALTER TABLE travel_requests ALTER COLUMN duration DROP NOT NULL;
ALTER TABLE travel_requests ALTER COLUMN business_justification DROP NOT NULL;
