-- Fix RLS policies for attendance_records
-- Run this in the Supabase SQL Editor

CREATE POLICY "Allow authenticated read on attendance_records"
  ON attendance_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on attendance_records"
  ON attendance_records FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on attendance_records"
  ON attendance_records FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete on attendance_records"
  ON attendance_records FOR DELETE TO authenticated USING (true);
