-- Add physical attributes columns to publication_requests
ALTER TABLE publication_requests
  ADD COLUMN IF NOT EXISTS est_weight_kg     DECIMAL(8, 3),
  ADD COLUMN IF NOT EXISTS dim_length_cm     DECIMAL(8, 2),
  ADD COLUMN IF NOT EXISTS dim_width_cm      DECIMAL(8, 2),
  ADD COLUMN IF NOT EXISTS dim_height_cm     DECIMAL(8, 2);

COMMENT ON COLUMN publication_requests.est_weight_kg  IS 'Estimated weight of a single copy in kilograms';
COMMENT ON COLUMN publication_requests.dim_length_cm  IS 'Publication length in centimeters';
COMMENT ON COLUMN publication_requests.dim_width_cm   IS 'Publication width in centimeters';
COMMENT ON COLUMN publication_requests.dim_height_cm  IS 'Publication height/thickness in centimeters';
