export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      absence_categories: {
        Row: {
          id: string
          category_name: string
          category_code: string
          category_type: string
          severity_level: string | null
          affects_pay: boolean | null
          requires_approval: boolean | null
          max_occurrences_per_month: number | null
          description: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          category_name?: string | null
          category_code?: string | null
          category_type?: string | null
          severity_level?: string | null
          affects_pay?: boolean | null
          requires_approval?: boolean | null
          max_occurrences_per_month?: number | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          category_name?: string | null
          category_code?: string | null
          category_type?: string | null
          severity_level?: string | null
          affects_pay?: boolean | null
          requires_approval?: boolean | null
          max_occurrences_per_month?: number | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      accrual_rules: {
        Row: {
          id: string
          rule_name: string
          rule_code: string
          leave_type_id: string
          accrual_frequency: string
          accrual_rate: number
          max_balance: number | null
          carry_over_enabled: boolean | null
          max_carry_over: number | null
          waiting_period_days: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          rule_name?: string | null
          rule_code?: string | null
          leave_type_id?: string | null
          accrual_frequency?: string | null
          accrual_rate?: number | null
          max_balance?: number | null
          carry_over_enabled?: boolean | null
          max_carry_over?: number | null
          waiting_period_days?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          rule_name?: string | null
          rule_code?: string | null
          leave_type_id?: string | null
          accrual_frequency?: string | null
          accrual_rate?: number | null
          max_balance?: number | null
          carry_over_enabled?: boolean | null
          max_carry_over?: number | null
          waiting_period_days?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      active_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          ip_address: string | null
          user_agent: string | null
          device_type: string | null
          location: string | null
          started_at: string | null
          last_activity_at: string | null
          expires_at: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          session_token?: string | null
          ip_address?: string | null
          user_agent?: string | null
          device_type?: string | null
          location?: string | null
          started_at?: string | null
          last_activity_at?: string | null
          expires_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          session_token?: string | null
          ip_address?: string | null
          user_agent?: string | null
          device_type?: string | null
          location?: string | null
          started_at?: string | null
          last_activity_at?: string | null
          expires_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_assignment_history: {
        Row: {
          id: string
          asset_id: string
          assigned_to: string
          assigned_by: string
          assigned_date: string
          unassigned_date: string | null
          unassigned_by: string | null
          reason: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          asset_id?: string | null
          assigned_to?: string | null
          assigned_by?: string | null
          assigned_date?: string | null
          unassigned_date?: string | null
          unassigned_by?: string | null
          reason?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          asset_id?: string | null
          assigned_to?: string | null
          assigned_by?: string | null
          assigned_date?: string | null
          unassigned_date?: string | null
          unassigned_by?: string | null
          reason?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      asset_assignments: {
        Row: {
          id: string
          asset_id: string
          employee_id: string
          assigned_by: string | null
          assigned_date: string
          returned_date: string | null
          returned_by: string | null
          condition_on_assignment: string | null
          condition_on_return: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          asset_id?: string | null
          employee_id?: string | null
          assigned_by?: string | null
          assigned_date?: string | null
          returned_date?: string | null
          returned_by?: string | null
          condition_on_assignment?: string | null
          condition_on_return?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          asset_id?: string | null
          employee_id?: string | null
          assigned_by?: string | null
          assigned_date?: string | null
          returned_date?: string | null
          returned_by?: string | null
          condition_on_assignment?: string | null
          condition_on_return?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      asset_brands: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          description?: string | null
          icon?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          description?: string | null
          icon?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_maintenance: {
        Row: {
          id: string
          asset_id: string
          maintenance_type: string | null
          scheduled_date: string | null
          completed_date: string | null
          performed_by: string | null
          vendor_id: string | null
          cost: number | null
          description: string
          notes: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          asset_id?: string | null
          maintenance_type?: string | null
          scheduled_date?: string | null
          completed_date?: string | null
          performed_by?: string | null
          vendor_id?: string | null
          cost?: number | null
          description?: string | null
          notes?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          asset_id?: string | null
          maintenance_type?: string | null
          scheduled_date?: string | null
          completed_date?: string | null
          performed_by?: string | null
          vendor_id?: string | null
          cost?: number | null
          description?: string | null
          notes?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_requests: {
        Row: {
          id: string
          employee_id: string
          category_id: string | null
          item_description: string
          justification: string | null
          priority: string | null
          status: string | null
          requested_date: string | null
          approved_by: string | null
          approved_date: string | null
          fulfilled_date: string | null
          assigned_asset_id: string | null
          rejection_reason: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          category_id?: string | null
          item_description?: string | null
          justification?: string | null
          priority?: string | null
          status?: string | null
          requested_date?: string | null
          approved_by?: string | null
          approved_date?: string | null
          fulfilled_date?: string | null
          assigned_asset_id?: string | null
          rejection_reason?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          category_id?: string | null
          item_description?: string | null
          justification?: string | null
          priority?: string | null
          status?: string | null
          requested_date?: string | null
          approved_by?: string | null
          approved_date?: string | null
          fulfilled_date?: string | null
          assigned_asset_id?: string | null
          rejection_reason?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_service_requests: {
        Row: {
          id: string
          asset_id: string
          requested_by: string
          issue_type: string
          priority: string
          description: string
          status: string
          assigned_technician: string | null
          request_date: string | null
          resolution_date: string | null
          estimated_cost: number | null
          actual_cost: number | null
          resolution: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          asset_id?: string | null
          requested_by?: string | null
          issue_type?: string | null
          priority?: string | null
          description?: string | null
          status?: string | null
          assigned_technician?: string | null
          request_date?: string | null
          resolution_date?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          resolution?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          asset_id?: string | null
          requested_by?: string | null
          issue_type?: string | null
          priority?: string | null
          description?: string | null
          status?: string | null
          assigned_technician?: string | null
          request_date?: string | null
          resolution_date?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          resolution?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_vendors: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_warranty_tracking: {
        Row: {
          id: string
          asset_id: string
          vendor_id: string | null
          warranty_start: string
          warranty_end: string
          warranty_type: string
          coverage: Json | null
          renewal_cost: number | null
          contact_person: string | null
          contact_email: string | null
          contact_phone: string | null
          claim_history: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          asset_id?: string | null
          vendor_id?: string | null
          warranty_start?: string | null
          warranty_end?: string | null
          warranty_type?: string | null
          coverage?: Json | null
          renewal_cost?: number | null
          contact_person?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          claim_history?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          asset_id?: string | null
          vendor_id?: string | null
          warranty_start?: string | null
          warranty_end?: string | null
          warranty_type?: string | null
          coverage?: Json | null
          renewal_cost?: number | null
          contact_person?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          claim_history?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          id: string
          asset_tag: string | null
          name: string
          category_id: string | null
          brand_id: string | null
          model: string | null
          serial_number: string | null
          vendor_id: string | null
          purchase_date: string | null
          purchase_price: number | null
          purchase_order_number: string | null
          warranty_start_date: string | null
          warranty_end_date: string | null
          warranty_details: string | null
          useful_life_years: number | null
          salvage_value: number | null
          depreciation_method: string | null
          status: string | null
          condition: string | null
          location: string | null
          assigned_to: string | null
          assigned_date: string | null
          specifications: string | null
          qr_code: string | null
          image_url: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          asset_tag?: string | null
          name?: string | null
          category_id?: string | null
          brand_id?: string | null
          model?: string | null
          serial_number?: string | null
          vendor_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          purchase_order_number?: string | null
          warranty_start_date?: string | null
          warranty_end_date?: string | null
          warranty_details?: string | null
          useful_life_years?: number | null
          salvage_value?: number | null
          depreciation_method?: string | null
          status?: string | null
          condition?: string | null
          location?: string | null
          assigned_to?: string | null
          assigned_date?: string | null
          specifications?: string | null
          qr_code?: string | null
          image_url?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          asset_tag?: string | null
          name?: string | null
          category_id?: string | null
          brand_id?: string | null
          model?: string | null
          serial_number?: string | null
          vendor_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          purchase_order_number?: string | null
          warranty_start_date?: string | null
          warranty_end_date?: string | null
          warranty_details?: string | null
          useful_life_years?: number | null
          salvage_value?: number | null
          depreciation_method?: string | null
          status?: string | null
          condition?: string | null
          location?: string | null
          assigned_to?: string | null
          assigned_date?: string | null
          specifications?: string | null
          qr_code?: string | null
          image_url?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance_policies: {
        Row: {
          id: string
          policy_name: string
          policy_code: string
          description: string | null
          policy_type: string
          late_arrival_threshold_minutes: number | null
          late_arrival_penalty: string | null
          max_late_arrivals_per_month: number | null
          early_departure_threshold_minutes: number | null
          early_departure_penalty: string | null
          max_early_departures_per_month: number | null
          max_unexcused_absences_per_month: number | null
          max_unexcused_absences_per_year: number | null
          consecutive_absence_limit: number | null
          requires_medical_certificate_after_days: number | null
          rounding_method: string | null
          min_clock_in_time: string | null
          max_clock_out_time: string | null
          notify_on_late_clock_in: boolean | null
          notify_on_early_clock_out: boolean | null
          notify_on_missed_clock_out: boolean | null
          notification_recipients: string | null
          auto_deduct_pay: boolean | null
          requires_justification: boolean | null
          allow_manual_override: boolean | null
          applicable_departments: string | null
          applicable_locations: string | null
          applicable_employee_types: string | null
          is_default: boolean | null
          is_active: boolean | null
          effective_from: string
          effective_to: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string | null
          policy_name?: string | null
          policy_code?: string | null
          description?: string | null
          policy_type?: string | null
          late_arrival_threshold_minutes?: number | null
          late_arrival_penalty?: string | null
          max_late_arrivals_per_month?: number | null
          early_departure_threshold_minutes?: number | null
          early_departure_penalty?: string | null
          max_early_departures_per_month?: number | null
          max_unexcused_absences_per_month?: number | null
          max_unexcused_absences_per_year?: number | null
          consecutive_absence_limit?: number | null
          requires_medical_certificate_after_days?: number | null
          rounding_method?: string | null
          min_clock_in_time?: string | null
          max_clock_out_time?: string | null
          notify_on_late_clock_in?: boolean | null
          notify_on_early_clock_out?: boolean | null
          notify_on_missed_clock_out?: boolean | null
          notification_recipients?: string | null
          auto_deduct_pay?: boolean | null
          requires_justification?: boolean | null
          allow_manual_override?: boolean | null
          applicable_departments?: string | null
          applicable_locations?: string | null
          applicable_employee_types?: string | null
          is_default?: boolean | null
          is_active?: boolean | null
          effective_from?: string | null
          effective_to?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string | null
          policy_name?: string | null
          policy_code?: string | null
          description?: string | null
          policy_type?: string | null
          late_arrival_threshold_minutes?: number | null
          late_arrival_penalty?: string | null
          max_late_arrivals_per_month?: number | null
          early_departure_threshold_minutes?: number | null
          early_departure_penalty?: string | null
          max_early_departures_per_month?: number | null
          max_unexcused_absences_per_month?: number | null
          max_unexcused_absences_per_year?: number | null
          consecutive_absence_limit?: number | null
          requires_medical_certificate_after_days?: number | null
          rounding_method?: string | null
          min_clock_in_time?: string | null
          max_clock_out_time?: string | null
          notify_on_late_clock_in?: boolean | null
          notify_on_early_clock_out?: boolean | null
          notify_on_missed_clock_out?: boolean | null
          notification_recipients?: string | null
          auto_deduct_pay?: boolean | null
          requires_justification?: boolean | null
          allow_manual_override?: boolean | null
          applicable_departments?: string | null
          applicable_locations?: string | null
          applicable_employee_types?: string | null
          is_default?: boolean | null
          is_active?: boolean | null
          effective_from?: string | null
          effective_to?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          id: string
          employee_id: string
          date: string
          clock_in: string | null
          clock_out: string | null
          status: "present" | "absent" | "late" | "half_day" | "on_leave" | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          date?: string | null
          clock_in?: string | null
          clock_out?: string | null
          status?: "present" | "absent" | "late" | "half_day" | "on_leave" | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          date?: string | null
          clock_in?: string | null
          clock_out?: string | null
          status?: "present" | "absent" | "late" | "half_day" | "on_leave" | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      board_members: {
        Row: {
          id: string | null
          employee_id: string | null
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          date_of_birth: string | null
          hire_date: string | null
          department_id: string | null
          job_title_id: string | null
          manager_id: string | null
          location_id: string | null
          work_location_type: string | null
          remote_location: string | null
          status: "active" | "inactive" | "terminated" | null
          avatar_url: string | null
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          updated_at: string | null
          employment_type_id: string | null
          employment_type_name: string | null
          department_name: string | null
          job_title: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          hire_date?: string | null
          department_id?: string | null
          job_title_id?: string | null
          manager_id?: string | null
          location_id?: string | null
          work_location_type?: string | null
          remote_location?: string | null
          status?: "active" | "inactive" | "terminated" | null
          avatar_url?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          updated_at?: string | null
          employment_type_id?: string | null
          employment_type_name?: string | null
          department_name?: string | null
          job_title?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          hire_date?: string | null
          department_id?: string | null
          job_title_id?: string | null
          manager_id?: string | null
          location_id?: string | null
          work_location_type?: string | null
          remote_location?: string | null
          status?: "active" | "inactive" | "terminated" | null
          avatar_url?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          updated_at?: string | null
          employment_type_id?: string | null
          employment_type_name?: string | null
          department_name?: string | null
          job_title?: string | null
        }
        Relationships: []
      }
      break_policies: {
        Row: {
          id: string
          policy_name: string
          policy_code: string
          description: string | null
          break_type: string
          duration_minutes: number
          is_paid: boolean | null
          is_mandatory: boolean | null
          min_shift_duration_minutes: number | null
          occurs_after_minutes: number | null
          can_be_split: boolean | null
          max_splits: number | null
          requires_clock_out: boolean | null
          applicable_schedules: string | null
          applicable_shifts: string | null
          compliance_requirement: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string | null
          policy_name?: string | null
          policy_code?: string | null
          description?: string | null
          break_type?: string | null
          duration_minutes?: number | null
          is_paid?: boolean | null
          is_mandatory?: boolean | null
          min_shift_duration_minutes?: number | null
          occurs_after_minutes?: number | null
          can_be_split?: boolean | null
          max_splits?: number | null
          requires_clock_out?: boolean | null
          applicable_schedules?: string | null
          applicable_shifts?: string | null
          compliance_requirement?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string | null
          policy_name?: string | null
          policy_code?: string | null
          description?: string | null
          break_type?: string | null
          duration_minutes?: number | null
          is_paid?: boolean | null
          is_mandatory?: boolean | null
          min_shift_duration_minutes?: number | null
          occurs_after_minutes?: number | null
          can_be_split?: boolean | null
          max_splits?: number | null
          requires_clock_out?: boolean | null
          applicable_schedules?: string | null
          applicable_shifts?: string | null
          compliance_requirement?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          id: string
          vacancy_id: string | null
          first_name: string
          last_name: string
          email: string
          phone: string | null
          resume_url: string | null
          cover_letter: string | null
          status: "application_initiated" | "shortlisted" | "interview_scheduled" | "hired" | "rejected" | null
          rating: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          vacancy_id?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          resume_url?: string | null
          cover_letter?: string | null
          status?: "application_initiated" | "shortlisted" | "interview_scheduled" | "hired" | "rejected" | null
          rating?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          vacancy_id?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          resume_url?: string | null
          cover_letter?: string | null
          status?: "application_initiated" | "shortlisted" | "interview_scheduled" | "hired" | "rejected" | null
          rating?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      career_paths: {
        Row: {
          id: string
          name: string
          code: string
          category: string
          description: string | null
          levels: string | null
          total_duration: string | null
          employees_on_path: number | null
          skills_required: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          code?: string | null
          category?: string | null
          description?: string | null
          levels?: string | null
          total_duration?: string | null
          employees_on_path?: number | null
          skills_required?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          code?: string | null
          category?: string | null
          description?: string | null
          levels?: string | null
          total_duration?: string | null
          employees_on_path?: number | null
          skills_required?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_structure_hierarchy: {
        Row: {
          id: string | null
          name: string | null
          description: string | null
          level: number | null
          parent_id: string | null
          structure_type: string | null
          manager_id: string | null
          location_id: string | null
          status: string | null
          code: string | null
          depth: number | null
          path: Json | null
          root_name: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          description?: string | null
          level?: number | null
          parent_id?: string | null
          structure_type?: string | null
          manager_id?: string | null
          location_id?: string | null
          status?: string | null
          code?: string | null
          depth?: number | null
          path?: Json | null
          root_name?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          description?: string | null
          level?: number | null
          parent_id?: string | null
          structure_type?: string | null
          manager_id?: string | null
          location_id?: string | null
          status?: string | null
          code?: string | null
          depth?: number | null
          path?: Json | null
          root_name?: string | null
        }
        Relationships: []
      }
      company_structures: {
        Row: {
          id: string
          name: string
          description: string | null
          level: number
          parent_id: string | null
          structure_type: string
          manager_id: string | null
          location_id: string | null
          employee_count: number | null
          budget: number | null
          established_date: string | null
          status: string | null
          code: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          mission_statement: string | null
          vision_statement: string | null
          operational_hours: string | null
          timezone: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          description?: string | null
          level?: number | null
          parent_id?: string | null
          structure_type?: string | null
          manager_id?: string | null
          location_id?: string | null
          employee_count?: number | null
          budget?: number | null
          established_date?: string | null
          status?: string | null
          code?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          mission_statement?: string | null
          vision_statement?: string | null
          operational_hours?: string | null
          timezone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          description?: string | null
          level?: number | null
          parent_id?: string | null
          structure_type?: string | null
          manager_id?: string | null
          location_id?: string | null
          employee_count?: number | null
          budget?: number | null
          established_date?: string | null
          status?: string | null
          code?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          mission_statement?: string | null
          vision_statement?: string | null
          operational_hours?: string | null
          timezone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_documents: {
        Row: {
          id: string
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          description: string | null
          uploaded_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          description?: string | null
          uploaded_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          description?: string | null
          uploaded_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          description?: string | null
          parent_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          description?: string | null
          parent_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          id: string
          employee_id: string
          name: string
          relationship: string
          home_phone: string | null
          mobile_phone: string
          work_phone: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          name?: string | null
          relationship?: string | null
          home_phone?: string | null
          mobile_phone?: string | null
          work_phone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          name?: string | null
          relationship?: string | null
          home_phone?: string | null
          mobile_phone?: string | null
          work_phone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_assets: {
        Row: {
          id: string
          employee_id: string
          asset_type: string
          asset_name: string
          asset_number: string | null
          serial_number: string | null
          description: string | null
          assigned_date: string
          expected_return_date: string | null
          actual_return_date: string | null
          status: string | null
          condition_on_assignment: string | null
          condition_on_return: string | null
          purchase_value: number | null
          current_value: number | null
          returned_to: string | null
          return_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          asset_type?: string | null
          asset_name?: string | null
          asset_number?: string | null
          serial_number?: string | null
          description?: string | null
          assigned_date?: string | null
          expected_return_date?: string | null
          actual_return_date?: string | null
          status?: string | null
          condition_on_assignment?: string | null
          condition_on_return?: string | null
          purchase_value?: number | null
          current_value?: number | null
          returned_to?: string | null
          return_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          asset_type?: string | null
          asset_name?: string | null
          asset_number?: string | null
          serial_number?: string | null
          description?: string | null
          assigned_date?: string | null
          expected_return_date?: string | null
          actual_return_date?: string | null
          status?: string | null
          condition_on_assignment?: string | null
          condition_on_return?: string | null
          purchase_value?: number | null
          current_value?: number | null
          returned_to?: string | null
          return_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_attachments: {
        Row: {
          id: string
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          mime_type: string | null
          description: string | null
          document_type: string | null
          uploaded_by: string | null
          uploaded_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          mime_type?: string | null
          description?: string | null
          document_type?: string | null
          uploaded_by?: string | null
          uploaded_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          mime_type?: string | null
          description?: string | null
          document_type?: string | null
          uploaded_by?: string | null
          uploaded_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_audit_logs: {
        Row: {
          id: string
          employee_id: string
          action: string
          changed_by: string
          changed_by_user_id: string | null
          details: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          action?: string | null
          changed_by?: string | null
          changed_by_user_id?: string | null
          details?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          action?: string | null
          changed_by?: string | null
          changed_by_user_id?: string | null
          details?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      employee_compliance_items: {
        Row: {
          id: string
          employee_id: string
          label: string
          is_complete: boolean | null
          completed_at: string | null
          completed_by: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          label?: string | null
          is_complete?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          label?: string | null
          is_complete?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_custom_field_values: {
        Row: {
          id: string
          employee_id: string
          field_id: string
          value: string | null
          value_array: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          field_id?: string | null
          value?: string | null
          value_array?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          field_id?: string | null
          value?: string | null
          value_array?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_custom_fields: {
        Row: {
          id: string
          name: string
          field_key: string
          field_type: string
          category: string
          description: string | null
          required: boolean | null
          visible: boolean | null
          editable: boolean | null
          searchable: boolean | null
          show_in_profile: boolean | null
          show_in_list: boolean | null
          field_order: number | null
          options: string | null
          validation_rules: string | null
          default_value: string | null
          help_text: string | null
          placeholder: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          field_key?: string | null
          field_type?: string | null
          category?: string | null
          description?: string | null
          required?: boolean | null
          visible?: boolean | null
          editable?: boolean | null
          searchable?: boolean | null
          show_in_profile?: boolean | null
          show_in_list?: boolean | null
          field_order?: number | null
          options?: string | null
          validation_rules?: string | null
          default_value?: string | null
          help_text?: string | null
          placeholder?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          field_key?: string | null
          field_type?: string | null
          category?: string | null
          description?: string | null
          required?: boolean | null
          visible?: boolean | null
          editable?: boolean | null
          searchable?: boolean | null
          show_in_profile?: boolean | null
          show_in_list?: boolean | null
          field_order?: number | null
          options?: string | null
          validation_rules?: string | null
          default_value?: string | null
          help_text?: string | null
          placeholder?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_data_imports: {
        Row: {
          id: string
          import_type: string
          file_name: string | null
          total_records: number
          successful_records: number | null
          failed_records: number | null
          error_log: string | null
          status: string | null
          imported_by: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          import_type?: string | null
          file_name?: string | null
          total_records?: number | null
          successful_records?: number | null
          failed_records?: number | null
          error_log?: string | null
          status?: string | null
          imported_by?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          import_type?: string | null
          file_name?: string | null
          total_records?: number | null
          successful_records?: number | null
          failed_records?: number | null
          error_log?: string | null
          status?: string | null
          imported_by?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      employee_profile_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          template_type: string
          required_fields: Json
          optional_fields: Json | null
          default_values: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          description?: string | null
          template_type?: string | null
          required_fields?: Json | null
          optional_fields?: Json | null
          default_values?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          description?: string | null
          template_type?: string | null
          required_fields?: Json | null
          optional_fields?: Json | null
          default_values?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_reporting_fields: {
        Row: {
          id: string
          report_name: string
          field_mapping: string
          filters: string | null
          sort_order: string | null
          is_public: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          report_name?: string | null
          field_mapping?: string | null
          filters?: string | null
          sort_order?: string | null
          is_public?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          report_name?: string | null
          field_mapping?: string | null
          filters?: string | null
          sort_order?: string | null
          is_public?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_schedule_assignments: {
        Row: {
          id: string
          employee_id: string
          work_schedule_id: string | null
          shift_pattern_id: string | null
          attendance_policy_id: string | null
          effective_from: string
          effective_to: string | null
          is_temporary: boolean | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          assigned_by: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          work_schedule_id?: string | null
          shift_pattern_id?: string | null
          attendance_policy_id?: string | null
          effective_from?: string | null
          effective_to?: string | null
          is_temporary?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          assigned_by?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          work_schedule_id?: string | null
          shift_pattern_id?: string | null
          attendance_policy_id?: string | null
          effective_from?: string | null
          effective_to?: string | null
          is_temporary?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          assigned_by?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          id: string
          employee_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          date_of_birth: string | null
          hire_date: string
          department_id: string | null
          job_title_id: string | null
          manager_id: string | null
          location_id: string | null
          work_location_type: string | null
          remote_location: string | null
          status: "active" | "inactive" | "terminated" | null
          avatar_url: string | null
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          updated_at: string | null
          employment_type_id: string | null
          job_specification_id: string | null
          middle_name: string | null
          sex: string | null
          marital_status: string | null
          nationality: string | null
          national_id: string | null
          voters_id: string | null
          pagibig_number: string | null
          philhealth_number: string | null
          sss_number: string | null
          tin_number: string | null
          work_phone: string | null
          mobile_phone: string | null
          home_phone: string | null
          work_email: string | null
          personal_email: string | null
          contract_start_date: string | null
          contract_end_date: string | null
          state: string | null
          zip_code: string | null
          suffix: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          hire_date?: string | null
          department_id?: string | null
          job_title_id?: string | null
          manager_id?: string | null
          location_id?: string | null
          work_location_type?: string | null
          remote_location?: string | null
          status?: "active" | "inactive" | "terminated" | null
          avatar_url?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          updated_at?: string | null
          employment_type_id?: string | null
          job_specification_id?: string | null
          middle_name?: string | null
          sex?: string | null
          marital_status?: string | null
          nationality?: string | null
          national_id?: string | null
          voters_id?: string | null
          pagibig_number?: string | null
          philhealth_number?: string | null
          sss_number?: string | null
          tin_number?: string | null
          work_phone?: string | null
          mobile_phone?: string | null
          home_phone?: string | null
          work_email?: string | null
          personal_email?: string | null
          contract_start_date?: string | null
          contract_end_date?: string | null
          state?: string | null
          zip_code?: string | null
          suffix?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          hire_date?: string | null
          department_id?: string | null
          job_title_id?: string | null
          manager_id?: string | null
          location_id?: string | null
          work_location_type?: string | null
          remote_location?: string | null
          status?: "active" | "inactive" | "terminated" | null
          avatar_url?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          updated_at?: string | null
          employment_type_id?: string | null
          job_specification_id?: string | null
          middle_name?: string | null
          sex?: string | null
          marital_status?: string | null
          nationality?: string | null
          national_id?: string | null
          voters_id?: string | null
          pagibig_number?: string | null
          philhealth_number?: string | null
          sss_number?: string | null
          tin_number?: string | null
          work_phone?: string | null
          mobile_phone?: string | null
          home_phone?: string | null
          work_email?: string | null
          personal_email?: string | null
          contract_start_date?: string | null
          contract_end_date?: string | null
          state?: string | null
          zip_code?: string | null
          suffix?: string | null
        }
        Relationships: []
      }
      employment_types: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          category: string
          is_active: boolean | null
          benefits: string | null
          working_conditions: string | null
          contract_details: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          code?: string | null
          description?: string | null
          category?: string | null
          is_active?: boolean | null
          benefits?: string | null
          working_conditions?: string | null
          contract_details?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          code?: string | null
          description?: string | null
          category?: string | null
          is_active?: boolean | null
          benefits?: string | null
          working_conditions?: string | null
          contract_details?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment_request_notifications: {
        Row: {
          id: string
          recipient_user_id: string
          type: string
          title: string
          message: string
          request_id: string | null
          requester_name: string | null
          request_number: string | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          recipient_user_id?: string | null
          type?: string | null
          title?: string | null
          message?: string | null
          request_id?: string | null
          requester_name?: string | null
          request_number?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          recipient_user_id?: string | null
          type?: string | null
          title?: string | null
          message?: string | null
          request_id?: string | null
          requester_name?: string | null
          request_number?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      exit_interviews: {
        Row: {
          id: string
          termination_request_id: string
          employee_id: string
          interview_date: string | null
          interview_time: string | null
          interviewer_id: string | null
          interview_location: string | null
          interview_method: string | null
          status: string | null
          reason_for_leaving: string | null
          liked_most: string | null
          liked_least: string | null
          suggestions_for_improvement: string | null
          relationship_with_manager_rating: number | null
          work_environment_rating: number | null
          compensation_rating: number | null
          career_growth_rating: number | null
          work_life_balance_rating: number | null
          overall_satisfaction_rating: number | null
          would_recommend_company: boolean | null
          would_consider_returning: boolean | null
          open_to_future_contact: boolean | null
          additional_comments: string | null
          interviewer_notes: string | null
          action_items: string | null
          hr_review_notes: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          termination_request_id?: string | null
          employee_id?: string | null
          interview_date?: string | null
          interview_time?: string | null
          interviewer_id?: string | null
          interview_location?: string | null
          interview_method?: string | null
          status?: string | null
          reason_for_leaving?: string | null
          liked_most?: string | null
          liked_least?: string | null
          suggestions_for_improvement?: string | null
          relationship_with_manager_rating?: number | null
          work_environment_rating?: number | null
          compensation_rating?: number | null
          career_growth_rating?: number | null
          work_life_balance_rating?: number | null
          overall_satisfaction_rating?: number | null
          would_recommend_company?: boolean | null
          would_consider_returning?: boolean | null
          open_to_future_contact?: boolean | null
          additional_comments?: string | null
          interviewer_notes?: string | null
          action_items?: string | null
          hr_review_notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          termination_request_id?: string | null
          employee_id?: string | null
          interview_date?: string | null
          interview_time?: string | null
          interviewer_id?: string | null
          interview_location?: string | null
          interview_method?: string | null
          status?: string | null
          reason_for_leaving?: string | null
          liked_most?: string | null
          liked_least?: string | null
          suggestions_for_improvement?: string | null
          relationship_with_manager_rating?: number | null
          work_environment_rating?: number | null
          compensation_rating?: number | null
          career_growth_rating?: number | null
          work_life_balance_rating?: number | null
          overall_satisfaction_rating?: number | null
          would_recommend_company?: boolean | null
          would_consider_returning?: boolean | null
          open_to_future_contact?: boolean | null
          additional_comments?: string | null
          interviewer_notes?: string | null
          action_items?: string | null
          hr_review_notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      expense_requests: {
        Row: {
          id: string
          expense_number: string
          employee_id: string | null
          travel_request_id: string | null
          category: string
          subcategory: string | null
          merchant: string
          description: string
          amount: number
          currency: string | null
          exchange_rate: number | null
          local_amount: number | null
          expense_date: string
          payment_method: string
          status: string | null
          receipt_attached: boolean | null
          receipt_url: string | null
          billable: boolean | null
          client_code: string | null
          project_code: string | null
          tax_amount: number | null
          tax_rate: number | null
          policy_compliant: boolean | null
          policy_violation_reason: string | null
          approved_by: string | null
          approved_date: string | null
          rejection_reason: string | null
          reimbursement_date: string | null
          tags: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          expense_number?: string | null
          employee_id?: string | null
          travel_request_id?: string | null
          category?: string | null
          subcategory?: string | null
          merchant?: string | null
          description?: string | null
          amount?: number | null
          currency?: string | null
          exchange_rate?: number | null
          local_amount?: number | null
          expense_date?: string | null
          payment_method?: string | null
          status?: string | null
          receipt_attached?: boolean | null
          receipt_url?: string | null
          billable?: boolean | null
          client_code?: string | null
          project_code?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          policy_compliant?: boolean | null
          policy_violation_reason?: string | null
          approved_by?: string | null
          approved_date?: string | null
          rejection_reason?: string | null
          reimbursement_date?: string | null
          tags?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          expense_number?: string | null
          employee_id?: string | null
          travel_request_id?: string | null
          category?: string | null
          subcategory?: string | null
          merchant?: string | null
          description?: string | null
          amount?: number | null
          currency?: string | null
          exchange_rate?: number | null
          local_amount?: number | null
          expense_date?: string | null
          payment_method?: string | null
          status?: string | null
          receipt_attached?: boolean | null
          receipt_url?: string | null
          billable?: boolean | null
          client_code?: string | null
          project_code?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          policy_compliant?: boolean | null
          policy_violation_reason?: string | null
          approved_by?: string | null
          approved_date?: string | null
          rejection_reason?: string | null
          reimbursement_date?: string | null
          tags?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          employee_id: string
          title: string
          description: string | null
          priority: "low" | "medium" | "high" | null
          status: "not_started" | "in_progress" | "achieved" | "cancelled" | null
          progress: number | null
          start_date: string | null
          due_date: string | null
          completed_date: string | null
          review_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          title?: string | null
          description?: string | null
          priority?: "low" | "medium" | "high" | null
          status?: "not_started" | "in_progress" | "achieved" | "cancelled" | null
          progress?: number | null
          start_date?: string | null
          due_date?: string | null
          completed_date?: string | null
          review_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          title?: string | null
          description?: string | null
          priority?: "low" | "medium" | "high" | null
          status?: "not_started" | "in_progress" | "achieved" | "cancelled" | null
          progress?: number | null
          start_date?: string | null
          due_date?: string | null
          completed_date?: string | null
          review_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      holidays: {
        Row: {
          id: string
          holiday_name: string
          holiday_date: string
          holiday_type: string
          description: string | null
          is_recurring: boolean | null
          is_paid: boolean | null
          is_mandatory: boolean | null
          year: number
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          holiday_name?: string | null
          holiday_date?: string | null
          holiday_type?: string | null
          description?: string | null
          is_recurring?: boolean | null
          is_paid?: boolean | null
          is_mandatory?: boolean | null
          year?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          holiday_name?: string | null
          holiday_date?: string | null
          holiday_type?: string | null
          description?: string | null
          is_recurring?: boolean | null
          is_paid?: boolean | null
          is_mandatory?: boolean | null
          year?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      international_operations: {
        Row: {
          id: string
          country: string
          country_code: string
          region: string | null
          operation_type: string | null
          office_name: string | null
          location_id: string | null
          company_structure_id: string | null
          country_director_id: string | null
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          established_date: string | null
          status: string | null
          employee_count: number | null
          local_staff_count: number | null
          expat_staff_count: number | null
          annual_budget: number | null
          currency: string | null
          funding_sources: Json | null
          legal_entity_name: string | null
          registration_number: string | null
          tax_id: string | null
          registration_date: string | null
          registration_authority: string | null
          active_programs: number | null
          program_areas: Json | null
          beneficiary_count: number | null
          official_languages: Json | null
          working_languages: Json | null
          timezone: string | null
          local_partners: Json | null
          government_partnerships: Json | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          country?: string | null
          country_code?: string | null
          region?: string | null
          operation_type?: string | null
          office_name?: string | null
          location_id?: string | null
          company_structure_id?: string | null
          country_director_id?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          established_date?: string | null
          status?: string | null
          employee_count?: number | null
          local_staff_count?: number | null
          expat_staff_count?: number | null
          annual_budget?: number | null
          currency?: string | null
          funding_sources?: Json | null
          legal_entity_name?: string | null
          registration_number?: string | null
          tax_id?: string | null
          registration_date?: string | null
          registration_authority?: string | null
          active_programs?: number | null
          program_areas?: Json | null
          beneficiary_count?: number | null
          official_languages?: Json | null
          working_languages?: Json | null
          timezone?: string | null
          local_partners?: Json | null
          government_partnerships?: Json | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          country?: string | null
          country_code?: string | null
          region?: string | null
          operation_type?: string | null
          office_name?: string | null
          location_id?: string | null
          company_structure_id?: string | null
          country_director_id?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          established_date?: string | null
          status?: string | null
          employee_count?: number | null
          local_staff_count?: number | null
          expat_staff_count?: number | null
          annual_budget?: number | null
          currency?: string | null
          funding_sources?: Json | null
          legal_entity_name?: string | null
          registration_number?: string | null
          tax_id?: string | null
          registration_date?: string | null
          registration_authority?: string | null
          active_programs?: number | null
          program_areas?: Json | null
          beneficiary_count?: number | null
          official_languages?: Json | null
          working_languages?: Json | null
          timezone?: string | null
          local_partners?: Json | null
          government_partnerships?: Json | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      interviews: {
        Row: {
          id: string
          candidate_id: string
          interviewer_id: string | null
          scheduled_at: string
          duration_minutes: number | null
          interview_type: string | null
          location: string | null
          notes: string | null
          feedback: string | null
          rating: number | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          candidate_id?: string | null
          interviewer_id?: string | null
          scheduled_at?: string | null
          duration_minutes?: number | null
          interview_type?: string | null
          location?: string | null
          notes?: string | null
          feedback?: string | null
          rating?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          candidate_id?: string | null
          interviewer_id?: string | null
          scheduled_at?: string | null
          duration_minutes?: number | null
          interview_type?: string | null
          location?: string | null
          notes?: string | null
          feedback?: string | null
          rating?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      job_categories: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          parent_id: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          code?: string | null
          description?: string | null
          parent_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          code?: string | null
          description?: string | null
          parent_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      job_descriptions: {
        Row: {
          id: string
          job_title_id: string | null
          title: string
          code: string
          department: string | null
          summary: string | null
          responsibilities: string | null
          qualifications: string | null
          skills: string | null
          experience_required: string | null
          education_required: string | null
          employment_type: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          last_updated: string | null
        }
        Insert: {
          id?: string | null
          job_title_id?: string | null
          title?: string | null
          code?: string | null
          department?: string | null
          summary?: string | null
          responsibilities?: string | null
          qualifications?: string | null
          skills?: string | null
          experience_required?: string | null
          education_required?: string | null
          employment_type?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_updated?: string | null
        }
        Update: {
          id?: string | null
          job_title_id?: string | null
          title?: string | null
          code?: string | null
          department?: string | null
          summary?: string | null
          responsibilities?: string | null
          qualifications?: string | null
          skills?: string | null
          experience_required?: string | null
          education_required?: string | null
          employment_type?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_updated?: string | null
        }
        Relationships: []
      }
      job_titles: {
        Row: {
          id: string
          title: string
          code: string | null
          description: string | null
          min_salary: number | null
          max_salary: number | null
          employment_type: string | null
          experience_level: string | null
          location: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          title?: string | null
          code?: string | null
          description?: string | null
          min_salary?: number | null
          max_salary?: number | null
          employment_type?: string | null
          experience_level?: string | null
          location?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          title?: string | null
          code?: string | null
          description?: string | null
          min_salary?: number | null
          max_salary?: number | null
          employment_type?: string | null
          experience_level?: string | null
          location?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kpis: {
        Row: {
          id: string
          employee_id: string
          name: string
          description: string | null
          target_value: number | null
          current_value: number | null
          unit: string | null
          period: string | null
          review_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          name?: string | null
          description?: string | null
          target_value?: number | null
          current_value?: number | null
          unit?: string | null
          period?: string | null
          review_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          name?: string | null
          description?: string | null
          target_value?: number | null
          current_value?: number | null
          unit?: string | null
          period?: string | null
          review_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leave_approval_workflows: {
        Row: {
          id: string
          workflow_name: string
          workflow_code: string
          leave_type_id: string | null
          workflow_steps: string
          is_sequential: boolean | null
          escalation_enabled: boolean | null
          escalation_days: number | null
          priority: number | null
          is_default: boolean | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          workflow_name?: string | null
          workflow_code?: string | null
          leave_type_id?: string | null
          workflow_steps?: string | null
          is_sequential?: boolean | null
          escalation_enabled?: boolean | null
          escalation_days?: number | null
          priority?: number | null
          is_default?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          workflow_name?: string | null
          workflow_code?: string | null
          leave_type_id?: string | null
          workflow_steps?: string | null
          is_sequential?: boolean | null
          escalation_enabled?: boolean | null
          escalation_days?: number | null
          priority?: number | null
          is_default?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leave_approvals: {
        Row: {
          id: string
          leave_request_id: string
          step_number: number
          approver_role: string
          approver_id: string | null
          status: string | null
          comments: string | null
          approved_at: string | null
          escalated_at: string | null
          due_date: string | null
          is_optional: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          leave_request_id?: string | null
          step_number?: number | null
          approver_role?: string | null
          approver_id?: string | null
          status?: string | null
          comments?: string | null
          approved_at?: string | null
          escalated_at?: string | null
          due_date?: string | null
          is_optional?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          leave_request_id?: string | null
          step_number?: number | null
          approver_role?: string | null
          approver_id?: string | null
          status?: string | null
          comments?: string | null
          approved_at?: string | null
          escalated_at?: string | null
          due_date?: string | null
          is_optional?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leave_balances: {
        Row: {
          id: string
          employee_id: string
          leave_type_id: string
          year: number
          total_allocated: number | null
          used_days: number | null
          pending_days: number | null
          available_days: number | null
          carried_over: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          leave_type_id?: string | null
          year?: number | null
          total_allocated?: number | null
          used_days?: number | null
          pending_days?: number | null
          available_days?: number | null
          carried_over?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          leave_type_id?: string | null
          year?: number | null
          total_allocated?: number | null
          used_days?: number | null
          pending_days?: number | null
          available_days?: number | null
          carried_over?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leave_policies: {
        Row: {
          id: string
          name: string
          description: string | null
          department_id: string | null
          employment_type_id: string | null
          annual_leave_days: number | null
          sick_leave_days: number | null
          personal_leave_days: number | null
          advance_notice_days: number | null
          max_consecutive_days: number | null
          min_request_days: number | null
          blackout_periods: string | null
          allow_half_days: boolean | null
          allow_negative_balance: boolean | null
          allow_carryover: boolean | null
          max_carryover_days: number | null
          carryover_expiry_months: number | null
          requires_approval: boolean | null
          approval_levels: number | null
          auto_approve_threshold: number | null
          is_active: boolean | null
          applies_to_all: boolean | null
          priority: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          description?: string | null
          department_id?: string | null
          employment_type_id?: string | null
          annual_leave_days?: number | null
          sick_leave_days?: number | null
          personal_leave_days?: number | null
          advance_notice_days?: number | null
          max_consecutive_days?: number | null
          min_request_days?: number | null
          blackout_periods?: string | null
          allow_half_days?: boolean | null
          allow_negative_balance?: boolean | null
          allow_carryover?: boolean | null
          max_carryover_days?: number | null
          carryover_expiry_months?: number | null
          requires_approval?: boolean | null
          approval_levels?: number | null
          auto_approve_threshold?: number | null
          is_active?: boolean | null
          applies_to_all?: boolean | null
          priority?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          description?: string | null
          department_id?: string | null
          employment_type_id?: string | null
          annual_leave_days?: number | null
          sick_leave_days?: number | null
          personal_leave_days?: number | null
          advance_notice_days?: number | null
          max_consecutive_days?: number | null
          min_request_days?: number | null
          blackout_periods?: string | null
          allow_half_days?: boolean | null
          allow_negative_balance?: boolean | null
          allow_carryover?: boolean | null
          max_carryover_days?: number | null
          carryover_expiry_months?: number | null
          requires_approval?: boolean | null
          approval_levels?: number | null
          auto_approve_threshold?: number | null
          is_active?: boolean | null
          applies_to_all?: boolean | null
          priority?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leave_policy_configs: {
        Row: {
          id: string
          policy_name: string
          policy_code: string
          leave_type_id: string | null
          eligibility_criteria: string | null
          min_service_months: number | null
          requires_approval: boolean | null
          max_consecutive_days: number | null
          min_notice_days: number | null
          blackout_period_enabled: boolean | null
          can_split_leave: boolean | null
          is_default: boolean | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          policy_name?: string | null
          policy_code?: string | null
          leave_type_id?: string | null
          eligibility_criteria?: string | null
          min_service_months?: number | null
          requires_approval?: boolean | null
          max_consecutive_days?: number | null
          min_notice_days?: number | null
          blackout_period_enabled?: boolean | null
          can_split_leave?: boolean | null
          is_default?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          policy_name?: string | null
          policy_code?: string | null
          leave_type_id?: string | null
          eligibility_criteria?: string | null
          min_service_months?: number | null
          requires_approval?: boolean | null
          max_consecutive_days?: number | null
          min_notice_days?: number | null
          blackout_period_enabled?: boolean | null
          can_split_leave?: boolean | null
          is_default?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leave_request_notifications: {
        Row: {
          id: string
          recipient_user_id: string
          type: string
          title: string
          message: string
          leave_request_id: string | null
          requester_name: string | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          recipient_user_id?: string | null
          type?: string | null
          title?: string | null
          message?: string | null
          leave_request_id?: string | null
          requester_name?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          recipient_user_id?: string | null
          type?: string | null
          title?: string | null
          message?: string | null
          leave_request_id?: string | null
          requester_name?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          id: string
          employee_id: string
          leave_type_id: string
          start_date: string
          end_date: string
          status: "pending" | "approved" | "rejected" | "cancelled" | null
          reason: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string | null
          updated_at: string | null
          workflow_id: string | null
          total_days: number
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          leave_type_id?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: "pending" | "approved" | "rejected" | "cancelled" | null
          reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          workflow_id?: string | null
          total_days?: number | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          leave_type_id?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: "pending" | "approved" | "rejected" | "cancelled" | null
          reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          workflow_id?: string | null
          total_days?: number | null
        }
        Relationships: []
      }
      leave_types: {
        Row: {
          id: string
          leave_type_name: string
          leave_type_code: string
          description: string | null
          category: string
          is_paid: boolean | null
          requires_approval: boolean | null
          color_code: string | null
          display_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          leave_type_name?: string | null
          leave_type_code?: string | null
          description?: string | null
          category?: string | null
          is_paid?: boolean | null
          requires_approval?: boolean | null
          color_code?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          leave_type_name?: string | null
          leave_type_code?: string | null
          description?: string | null
          category?: string | null
          is_paid?: boolean | null
          requires_approval?: boolean | null
          color_code?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      location_types: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          code?: string | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          code?: string | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          name: string
          code: string | null
          location_type: string
          parent_location_id: string | null
          company_structure_id: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state_province: string | null
          country: string
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          fax: string | null
          email: string | null
          website: string | null
          manager_id: string | null
          employee_capacity: number | null
          current_employee_count: number | null
          operational_hours: string | null
          timezone: string | null
          established_date: string | null
          monthly_rent: number | null
          square_footage: number | null
          lease_expiry_date: string | null
          status: string | null
          is_headquarters: boolean | null
          has_parking: boolean | null
          parking_spaces: number | null
          has_cafeteria: boolean | null
          has_gym: boolean | null
          has_medical_room: boolean | null
          has_conference_rooms: boolean | null
          conference_room_count: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          code?: string | null
          location_type?: string | null
          parent_location_id?: string | null
          company_structure_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state_province?: string | null
          country?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          fax?: string | null
          email?: string | null
          website?: string | null
          manager_id?: string | null
          employee_capacity?: number | null
          current_employee_count?: number | null
          operational_hours?: string | null
          timezone?: string | null
          established_date?: string | null
          monthly_rent?: number | null
          square_footage?: number | null
          lease_expiry_date?: string | null
          status?: string | null
          is_headquarters?: boolean | null
          has_parking?: boolean | null
          parking_spaces?: number | null
          has_cafeteria?: boolean | null
          has_gym?: boolean | null
          has_medical_room?: boolean | null
          has_conference_rooms?: boolean | null
          conference_room_count?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          code?: string | null
          location_type?: string | null
          parent_location_id?: string | null
          company_structure_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state_province?: string | null
          country?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          fax?: string | null
          email?: string | null
          website?: string | null
          manager_id?: string | null
          employee_capacity?: number | null
          current_employee_count?: number | null
          operational_hours?: string | null
          timezone?: string | null
          established_date?: string | null
          monthly_rent?: number | null
          square_footage?: number | null
          lease_expiry_date?: string | null
          status?: string | null
          is_headquarters?: boolean | null
          has_parking?: boolean | null
          parking_spaces?: number | null
          has_cafeteria?: boolean | null
          has_gym?: boolean | null
          has_medical_room?: boolean | null
          has_conference_rooms?: boolean | null
          conference_room_count?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      org_relationships: {
        Row: {
          id: string
          parent_id: string
          child_id: string
          relationship_type: string | null
          department_id: string | null
          start_date: string | null
          end_date: string | null
          status: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          parent_id?: string | null
          child_id?: string | null
          relationship_type?: string | null
          department_id?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          parent_id?: string | null
          child_id?: string | null
          relationship_type?: string | null
          department_id?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      overtime_rules: {
        Row: {
          id: string
          rule_name: string
          rule_code: string
          description: string | null
          rule_type: string
          threshold_hours: number
          calculation_method: string
          rate_multiplier: number
          max_overtime_hours: number | null
          requires_approval: boolean | null
          auto_apply: boolean | null
          applicable_days: string | null
          employee_groups: string | null
          priority: number | null
          is_active: boolean | null
          effective_from: string
          effective_to: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string | null
          rule_name?: string | null
          rule_code?: string | null
          description?: string | null
          rule_type?: string | null
          threshold_hours?: number | null
          calculation_method?: string | null
          rate_multiplier?: number | null
          max_overtime_hours?: number | null
          requires_approval?: boolean | null
          auto_apply?: boolean | null
          applicable_days?: string | null
          employee_groups?: string | null
          priority?: number | null
          is_active?: boolean | null
          effective_from?: string | null
          effective_to?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string | null
          rule_name?: string | null
          rule_code?: string | null
          description?: string | null
          rule_type?: string | null
          threshold_hours?: number | null
          calculation_method?: string | null
          rate_multiplier?: number | null
          max_overtime_hours?: number | null
          requires_approval?: boolean | null
          auto_apply?: boolean | null
          applicable_days?: string | null
          employee_groups?: string | null
          priority?: number | null
          is_active?: boolean | null
          effective_from?: string | null
          effective_to?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      password_history: {
        Row: {
          id: string
          user_id: string
          password_hash: string
          changed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          password_hash?: string | null
          changed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          password_hash?: string | null
          changed_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      password_policies: {
        Row: {
          id: string
          rule_name: string
          rule_type: string
          description: string | null
          enabled: boolean | null
          value_numeric: number | null
          value_text: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          rule_name?: string | null
          rule_type?: string | null
          description?: string | null
          enabled?: boolean | null
          value_numeric?: number | null
          value_text?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          rule_name?: string | null
          rule_type?: string | null
          description?: string | null
          enabled?: boolean | null
          value_numeric?: number | null
          value_text?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pay_grades: {
        Row: {
          id: string
          grade: string
          level: number
          title: string
          description: string | null
          category: string
          minimum_salary: number
          midpoint_salary: number
          maximum_salary: number
          currency: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          name: string
          employee_count: number | null
        }
        Insert: {
          id?: string | null
          grade?: string | null
          level?: number | null
          title?: string | null
          description?: string | null
          category?: string | null
          minimum_salary?: number | null
          midpoint_salary?: number | null
          maximum_salary?: number | null
          currency?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          name?: string | null
          employee_count?: number | null
        }
        Update: {
          id?: string | null
          grade?: string | null
          level?: number | null
          title?: string | null
          description?: string | null
          category?: string | null
          minimum_salary?: number | null
          midpoint_salary?: number | null
          maximum_salary?: number | null
          currency?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          name?: string | null
          employee_count?: number | null
        }
        Relationships: []
      }
      performance_reviews: {
        Row: {
          id: string
          employee_id: string
          reviewer_id: string | null
          review_period: string | null
          due_date: string | null
          completed_date: string | null
          status: "draft" | "pending" | "in_progress" | "completed" | null
          overall_rating: number | null
          strengths: string | null
          areas_for_improvement: string | null
          employee_comments: string | null
          reviewer_comments: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          employee_id?: string | null
          reviewer_id?: string | null
          review_period?: string | null
          due_date?: string | null
          completed_date?: string | null
          status?: "draft" | "pending" | "in_progress" | "completed" | null
          overall_rating?: number | null
          strengths?: string | null
          areas_for_improvement?: string | null
          employee_comments?: string | null
          reviewer_comments?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          employee_id?: string | null
          reviewer_id?: string | null
          review_period?: string | null
          due_date?: string | null
          completed_date?: string | null
          status?: "draft" | "pending" | "in_progress" | "completed" | null
          overall_rating?: number | null
          strengths?: string | null
          areas_for_improvement?: string | null
          employee_comments?: string | null
          reviewer_comments?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          id: string
          name: string
          code: string
          category: string
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          code?: string | null
          category?: string | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          code?: string | null
          category?: string | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pim_field_config: {
        Row: {
          id: string
          field_name: string
          display_name: string
          field_group: string
          is_required: boolean | null
          is_visible: boolean | null
          is_editable: boolean | null
          is_sensitive: boolean | null
          show_in_employee_list: boolean | null
          show_in_employee_profile: boolean | null
          show_in_reports: boolean | null
          field_order: number | null
          access_level: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          field_name?: string | null
          display_name?: string | null
          field_group?: string | null
          is_required?: boolean | null
          is_visible?: boolean | null
          is_editable?: boolean | null
          is_sensitive?: boolean | null
          show_in_employee_list?: boolean | null
          show_in_employee_profile?: boolean | null
          show_in_reports?: boolean | null
          field_order?: number | null
          access_level?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          field_name?: string | null
          display_name?: string | null
          field_group?: string | null
          is_required?: boolean | null
          is_visible?: boolean | null
          is_editable?: boolean | null
          is_sensitive?: boolean | null
          show_in_employee_list?: boolean | null
          show_in_employee_profile?: boolean | null
          show_in_reports?: boolean | null
          field_order?: number | null
          access_level?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      printing_presses: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          website: string | null
          address: string | null
          city: string | null
          country: string | null
          specialties: Json | null
          is_active: boolean | null
          min_order_qty: number | null
          turnaround_days: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          specialties?: Json | null
          is_active?: boolean | null
          min_order_qty?: number | null
          turnaround_days?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          specialties?: Json | null
          is_active?: boolean | null
          min_order_qty?: number | null
          turnaround_days?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      publication_request_notifications: {
        Row: {
          id: string
          recipient_user_id: string
          type: string
          title: string
          message: string
          request_id: string | null
          requester_name: string | null
          request_number: string | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          recipient_user_id?: string | null
          type?: string | null
          title?: string | null
          message?: string | null
          request_id?: string | null
          requester_name?: string | null
          request_number?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          recipient_user_id?: string | null
          type?: string | null
          title?: string | null
          message?: string | null
          request_id?: string | null
          requester_name?: string | null
          request_number?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      publication_requests: {
        Row: {
          id: string
          request_number: string
          employee_id: string | null
          publication_id: string
          publication_title: string
          publication_type: string
          publisher: string | null
          isbn: string | null
          request_type: string
          quantity: number | null
          purpose: string
          justification: string | null
          estimated_cost: number | null
          currency: string | null
          priority: string | null
          status: string | null
          delivery_method: string | null
          delivery_address: string | null
          deadline: string | null
          approved_by: string | null
          approved_date: string | null
          rejection_reason: string | null
          fulfilled_date: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          pdf_url: string | null
          cover_url: string | null
        }
        Insert: {
          id?: string | null
          request_number?: string | null
          employee_id?: string | null
          publication_id?: string | null
          publication_title?: string | null
          publication_type?: string | null
          publisher?: string | null
          isbn?: string | null
          request_type?: string | null
          quantity?: number | null
          purpose?: string | null
          justification?: string | null
          estimated_cost?: number | null
          currency?: string | null
          priority?: string | null
          status?: string | null
          delivery_method?: string | null
          delivery_address?: string | null
          deadline?: string | null
          approved_by?: string | null
          approved_date?: string | null
          rejection_reason?: string | null
          fulfilled_date?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          pdf_url?: string | null
          cover_url?: string | null
        }
        Update: {
          id?: string | null
          request_number?: string | null
          employee_id?: string | null
          publication_id?: string | null
          publication_title?: string | null
          publication_type?: string | null
          publisher?: string | null
          isbn?: string | null
          request_type?: string | null
          quantity?: number | null
          purpose?: string | null
          justification?: string | null
          estimated_cost?: number | null
          currency?: string | null
          priority?: string | null
          status?: string | null
          delivery_method?: string | null
          delivery_address?: string | null
          deadline?: string | null
          approved_by?: string | null
          approved_date?: string | null
          rejection_reason?: string | null
          fulfilled_date?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          pdf_url?: string | null
          cover_url?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string
          permission_id: string
          created_at: string | null
        }
        Insert: {
          id?: string | null
          role_id?: string | null
          permission_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          role_id?: string | null
          permission_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          is_system_role: boolean | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          description?: string | null
          is_system_role?: boolean | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          description?: string | null
          is_system_role?: boolean | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      salary_structures: {
        Row: {
          id: string
          name: string
          code: string
          pay_grade_id: string | null
          base_salary: number
          components: string | null
          total_compensation: number
          effective_date: string
          end_date: string | null
          currency: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          code?: string | null
          pay_grade_id?: string | null
          base_salary?: number | null
          components?: string | null
          total_compensation?: number | null
          effective_date?: string | null
          end_date?: string | null
          currency?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          code?: string | null
          pay_grade_id?: string | null
          base_salary?: number | null
          components?: string | null
          total_compensation?: number | null
          effective_date?: string | null
          end_date?: string | null
          currency?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_policies: {
        Row: {
          id: string
          name: string
          category: string
          description: string | null
          policy_type: string
          enabled: boolean | null
          value_boolean: boolean | null
          value_numeric: number | null
          value_text: string | null
          severity: string | null
          last_reviewed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          category?: string | null
          description?: string | null
          policy_type?: string | null
          enabled?: boolean | null
          value_boolean?: boolean | null
          value_numeric?: number | null
          value_text?: string | null
          severity?: string | null
          last_reviewed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          category?: string | null
          description?: string | null
          policy_type?: string | null
          enabled?: boolean | null
          value_boolean?: boolean | null
          value_numeric?: number | null
          value_text?: string | null
          severity?: string | null
          last_reviewed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shift_patterns: {
        Row: {
          id: string
          shift_name: string
          shift_code: string
          description: string | null
          shift_type: string
          start_time: string
          end_time: string
          duration_minutes: number
          break_duration_minutes: number | null
          is_overnight: boolean | null
          color_code: string | null
          premium_rate: number | null
          min_staff_required: number | null
          max_staff_allowed: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string | null
          shift_name?: string | null
          shift_code?: string | null
          description?: string | null
          shift_type?: string | null
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          break_duration_minutes?: number | null
          is_overnight?: boolean | null
          color_code?: string | null
          premium_rate?: number | null
          min_staff_required?: number | null
          max_staff_allowed?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string | null
          shift_name?: string | null
          shift_code?: string | null
          description?: string | null
          shift_type?: string | null
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          break_duration_minutes?: number | null
          is_overnight?: boolean | null
          color_code?: string | null
          premium_rate?: number | null
          min_staff_required?: number | null
          max_staff_allowed?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      supply_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supply_items: {
        Row: {
          id: string
          name: string
          description: string | null
          category_id: string | null
          unit: string | null
          unit_cost: number | null
          quantity_on_hand: number | null
          reorder_point: number | null
          max_stock: number | null
          location: string | null
          vendor_id: string | null
          is_active: boolean | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          description?: string | null
          category_id?: string | null
          unit?: string | null
          unit_cost?: number | null
          quantity_on_hand?: number | null
          reorder_point?: number | null
          max_stock?: number | null
          location?: string | null
          vendor_id?: string | null
          is_active?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          description?: string | null
          category_id?: string | null
          unit?: string | null
          unit_cost?: number | null
          quantity_on_hand?: number | null
          reorder_point?: number | null
          max_stock?: number | null
          location?: string | null
          vendor_id?: string | null
          is_active?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supply_po_items: {
        Row: {
          id: string
          po_id: string | null
          item_id: string | null
          item_name: string
          quantity: number
          unit_cost: number | null
          total_cost: number | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          po_id?: string | null
          item_id?: string | null
          item_name?: string | null
          quantity?: number | null
          unit_cost?: number | null
          total_cost?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          po_id?: string | null
          item_id?: string | null
          item_name?: string | null
          quantity?: number | null
          unit_cost?: number | null
          total_cost?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      supply_purchase_orders: {
        Row: {
          id: string
          po_number: string
          vendor_id: string | null
          vendor_name: string | null
          status: string | null
          order_date: string | null
          expected_date: string | null
          received_date: string | null
          total_amount: number | null
          notes: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          po_number?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          status?: string | null
          order_date?: string | null
          expected_date?: string | null
          received_date?: string | null
          total_amount?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          po_number?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          status?: string | null
          order_date?: string | null
          expected_date?: string | null
          received_date?: string | null
          total_amount?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supply_request_notifications: {
        Row: {
          id: string
          recipient_user_id: string
          type: string
          title: string
          message: string
          supply_request_id: string | null
          request_number: string | null
          is_read: boolean | null
          created_at: string | null
          requester_name: string | null
          request_id: string | null
        }
        Insert: {
          id?: string | null
          recipient_user_id?: string | null
          type?: string | null
          title?: string | null
          message?: string | null
          supply_request_id?: string | null
          request_number?: string | null
          is_read?: boolean | null
          created_at?: string | null
          requester_name?: string | null
          request_id?: string | null
        }
        Update: {
          id?: string | null
          recipient_user_id?: string | null
          type?: string | null
          title?: string | null
          message?: string | null
          supply_request_id?: string | null
          request_number?: string | null
          is_read?: boolean | null
          created_at?: string | null
          requester_name?: string | null
          request_id?: string | null
        }
        Relationships: []
      }
      supply_requests: {
        Row: {
          id: string
          request_number: string
          employee_id: string | null
          item_id: string | null
          item_name: string
          category_id: string | null
          quantity: number
          purpose: string | null
          priority: string | null
          status: string | null
          approved_by: string | null
          approved_at: string | null
          fulfilled_at: string | null
          rejection_reason: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          request_number?: string | null
          employee_id?: string | null
          item_id?: string | null
          item_name?: string | null
          category_id?: string | null
          quantity?: number | null
          purpose?: string | null
          priority?: string | null
          status?: string | null
          approved_by?: string | null
          approved_at?: string | null
          fulfilled_at?: string | null
          rejection_reason?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          request_number?: string | null
          employee_id?: string | null
          item_id?: string | null
          item_name?: string | null
          category_id?: string | null
          quantity?: number | null
          purpose?: string | null
          priority?: string | null
          status?: string | null
          approved_by?: string | null
          approved_at?: string | null
          fulfilled_at?: string | null
          rejection_reason?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supply_vendors: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          payment_terms: string | null
          is_active: boolean | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          payment_terms?: string | null
          is_active?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          payment_terms?: string | null
          is_active?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      termination_requests: {
        Row: {
          id: string
          request_number: string
          employee_id: string | null
          requested_by: string | null
          termination_type: string
          termination_reason: string | null
          proposed_last_working_date: string
          actual_last_working_date: string | null
          notice_period_days: number | null
          is_resignation: boolean | null
          resignation_letter_url: string | null
          severance_applicable: boolean | null
          severance_amount: number | null
          benefits_continuation: boolean | null
          garden_leave: boolean | null
          non_compete_applicable: boolean | null
          status: string | null
          urgency: string | null
          business_justification: string | null
          exit_interview_required: boolean | null
          exit_interview_date: string | null
          asset_return_required: boolean | null
          knowledge_transfer_plan: string | null
          replacement_plan: string | null
          approved_by: string | null
          approved_date: string | null
          rejection_reason: string | null
          processed_date: string | null
          hr_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          request_number?: string | null
          employee_id?: string | null
          requested_by?: string | null
          termination_type?: string | null
          termination_reason?: string | null
          proposed_last_working_date?: string | null
          actual_last_working_date?: string | null
          notice_period_days?: number | null
          is_resignation?: boolean | null
          resignation_letter_url?: string | null
          severance_applicable?: boolean | null
          severance_amount?: number | null
          benefits_continuation?: boolean | null
          garden_leave?: boolean | null
          non_compete_applicable?: boolean | null
          status?: string | null
          urgency?: string | null
          business_justification?: string | null
          exit_interview_required?: boolean | null
          exit_interview_date?: string | null
          asset_return_required?: boolean | null
          knowledge_transfer_plan?: string | null
          replacement_plan?: string | null
          approved_by?: string | null
          approved_date?: string | null
          rejection_reason?: string | null
          processed_date?: string | null
          hr_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          request_number?: string | null
          employee_id?: string | null
          requested_by?: string | null
          termination_type?: string | null
          termination_reason?: string | null
          proposed_last_working_date?: string | null
          actual_last_working_date?: string | null
          notice_period_days?: number | null
          is_resignation?: boolean | null
          resignation_letter_url?: string | null
          severance_applicable?: boolean | null
          severance_amount?: number | null
          benefits_continuation?: boolean | null
          garden_leave?: boolean | null
          non_compete_applicable?: boolean | null
          status?: string | null
          urgency?: string | null
          business_justification?: string | null
          exit_interview_required?: boolean | null
          exit_interview_date?: string | null
          asset_return_required?: boolean | null
          knowledge_transfer_plan?: string | null
          replacement_plan?: string | null
          approved_by?: string | null
          approved_date?: string | null
          rejection_reason?: string | null
          processed_date?: string | null
          hr_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      time_tracking_methods: {
        Row: {
          id: string
          method_name: string
          method_code: string
          description: string | null
          tracking_type: string
          requires_device: boolean | null
          device_requirements: string | null
          allows_remote_clock_in: boolean | null
          geofence_enabled: boolean | null
          geofence_radius_meters: number | null
          geofence_locations: string | null
          requires_photo: boolean | null
          requires_location: boolean | null
          ip_restrictions: string | null
          grace_period_minutes: number | null
          auto_clock_out: boolean | null
          auto_clock_out_after_hours: number | null
          is_default: boolean | null
          is_active: boolean | null
          cost_per_device: number | null
          monthly_cost: number | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string | null
          method_name?: string | null
          method_code?: string | null
          description?: string | null
          tracking_type?: string | null
          requires_device?: boolean | null
          device_requirements?: string | null
          allows_remote_clock_in?: boolean | null
          geofence_enabled?: boolean | null
          geofence_radius_meters?: number | null
          geofence_locations?: string | null
          requires_photo?: boolean | null
          requires_location?: boolean | null
          ip_restrictions?: string | null
          grace_period_minutes?: number | null
          auto_clock_out?: boolean | null
          auto_clock_out_after_hours?: number | null
          is_default?: boolean | null
          is_active?: boolean | null
          cost_per_device?: number | null
          monthly_cost?: number | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string | null
          method_name?: string | null
          method_code?: string | null
          description?: string | null
          tracking_type?: string | null
          requires_device?: boolean | null
          device_requirements?: string | null
          allows_remote_clock_in?: boolean | null
          geofence_enabled?: boolean | null
          geofence_radius_meters?: number | null
          geofence_locations?: string | null
          requires_photo?: boolean | null
          requires_location?: boolean | null
          ip_restrictions?: string | null
          grace_period_minutes?: number | null
          auto_clock_out?: boolean | null
          auto_clock_out_after_hours?: number | null
          is_default?: boolean | null
          is_active?: boolean | null
          cost_per_device?: number | null
          monthly_cost?: number | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      travel_request_notifications: {
        Row: {
          id: string
          recipient_user_id: string
          type: string
          title: string
          message: string
          request_id: string | null
          requester_name: string | null
          request_number: string | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          recipient_user_id?: string | null
          type?: string | null
          title?: string | null
          message?: string | null
          request_id?: string | null
          requester_name?: string | null
          request_number?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          recipient_user_id?: string | null
          type?: string | null
          title?: string | null
          message?: string | null
          request_id?: string | null
          requester_name?: string | null
          request_number?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      travel_requests: {
        Row: {
          id: string
          request_number: string
          employee_id: string | null
          destination: string
          country: string
          purpose: string
          start_date: string
          end_date: string
          duration: number
          estimated_cost: number
          currency: string | null
          status: string | null
          urgency: string | null
          accommodation_required: boolean | null
          transport_mode: string | null
          business_justification: string
          budget_code: string | null
          cost_center: string | null
          approved_by: string | null
          approved_date: string | null
          rejection_reason: string | null
          documents: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          request_number?: string | null
          employee_id?: string | null
          destination?: string | null
          country?: string | null
          purpose?: string | null
          start_date?: string | null
          end_date?: string | null
          duration?: number | null
          estimated_cost?: number | null
          currency?: string | null
          status?: string | null
          urgency?: string | null
          accommodation_required?: boolean | null
          transport_mode?: string | null
          business_justification?: string | null
          budget_code?: string | null
          cost_center?: string | null
          approved_by?: string | null
          approved_date?: string | null
          rejection_reason?: string | null
          documents?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          request_number?: string | null
          employee_id?: string | null
          destination?: string | null
          country?: string | null
          purpose?: string | null
          start_date?: string | null
          end_date?: string | null
          duration?: number | null
          estimated_cost?: number | null
          currency?: string | null
          status?: string | null
          urgency?: string | null
          accommodation_required?: boolean | null
          transport_mode?: string | null
          business_justification?: string | null
          budget_code?: string | null
          cost_center?: string | null
          approved_by?: string | null
          approved_date?: string | null
          rejection_reason?: string | null
          documents?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      two_factor_auth: {
        Row: {
          id: string
          user_id: string
          method: string
          enabled: boolean | null
          secret_key: string | null
          phone_number: string | null
          backup_codes: Json | null
          verified_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          method?: string | null
          enabled?: boolean | null
          secret_key?: string | null
          phone_number?: string | null
          backup_codes?: Json | null
          verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          method?: string | null
          enabled?: boolean | null
          secret_key?: string | null
          phone_number?: string | null
          backup_codes?: Json | null
          verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_password_metadata: {
        Row: {
          id: string
          user_id: string
          last_changed_at: string | null
          expiry_date: string | null
          strength: string | null
          failed_attempts: number | null
          locked_until: string | null
          force_change_on_next_login: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          last_changed_at?: string | null
          expiry_date?: string | null
          strength?: string | null
          failed_attempts?: number | null
          locked_until?: string | null
          force_change_on_next_login?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          last_changed_at?: string | null
          expiry_date?: string | null
          strength?: string | null
          failed_attempts?: number | null
          locked_until?: string | null
          force_change_on_next_login?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: "admin" | "hr" | "manager" | "employee" | "board_member"
          employee_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          role?: "admin" | "hr" | "manager" | "employee" | "board_member" | null
          employee_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          role?: "admin" | "hr" | "manager" | "employee" | "board_member" | null
          employee_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vacancies: {
        Row: {
          id: string
          title: string
          job_title_id: string | null
          hiring_manager_id: string | null
          department_id: string | null
          description: string | null
          requirements: string | null
          num_positions: number | null
          status: "open" | "closed" | "on_hold" | "filled" | null
          published_date: string | null
          closing_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          title?: string | null
          job_title_id?: string | null
          hiring_manager_id?: string | null
          department_id?: string | null
          description?: string | null
          requirements?: string | null
          num_positions?: number | null
          status?: "open" | "closed" | "on_hold" | "filled" | null
          published_date?: string | null
          closing_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          title?: string | null
          job_title_id?: string | null
          hiring_manager_id?: string | null
          department_id?: string | null
          description?: string | null
          requirements?: string | null
          num_positions?: number | null
          status?: "open" | "closed" | "on_hold" | "filled" | null
          published_date?: string | null
          closing_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      work_schedules: {
        Row: {
          id: string
          schedule_name: string
          schedule_code: string
          description: string | null
          schedule_type: string
          work_days: string
          weekly_hours: number
          is_default: boolean | null
          is_active: boolean | null
          effective_from: string
          effective_to: string | null
          timezone: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string | null
          schedule_name?: string | null
          schedule_code?: string | null
          description?: string | null
          schedule_type?: string | null
          work_days?: string | null
          weekly_hours?: number | null
          is_default?: boolean | null
          is_active?: boolean | null
          effective_from?: string | null
          effective_to?: string | null
          timezone?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string | null
          schedule_name?: string | null
          schedule_code?: string | null
          description?: string | null
          schedule_type?: string | null
          work_days?: string | null
          weekly_hours?: number | null
          is_default?: boolean | null
          is_active?: boolean | null
          effective_from?: string | null
          effective_to?: string | null
          timezone?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      workflow_requests: {
        Row: {
          id: string
          request_id: string
          request_type: string
          employee_id: string | null
          employee_name: string
          department: string | null
          current_level: number | null
          total_levels: number
          status: string | null
          priority: string | null
          amount: number | null
          currency: string | null
          business_justification: string | null
          submitted_date: string | null
          completed_date: string | null
          metadata: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          request_id?: string | null
          request_type?: string | null
          employee_id?: string | null
          employee_name?: string | null
          department?: string | null
          current_level?: number | null
          total_levels?: number | null
          status?: string | null
          priority?: string | null
          amount?: number | null
          currency?: string | null
          business_justification?: string | null
          submitted_date?: string | null
          completed_date?: string | null
          metadata?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          request_id?: string | null
          request_type?: string | null
          employee_id?: string | null
          employee_name?: string | null
          department?: string | null
          current_level?: number | null
          total_levels?: number | null
          status?: string | null
          priority?: string | null
          amount?: number | null
          currency?: string | null
          business_justification?: string | null
          submitted_date?: string | null
          completed_date?: string | null
          metadata?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_steps: {
        Row: {
          id: string
          workflow_id: string | null
          level: number
          approver_role: string
          approver_employee_id: string | null
          approver_name: string | null
          status: string | null
          action_date: string | null
          comments: string | null
          is_current_level: boolean | null
          conditions: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          workflow_id?: string | null
          level?: number | null
          approver_role?: string | null
          approver_employee_id?: string | null
          approver_name?: string | null
          status?: string | null
          action_date?: string | null
          comments?: string | null
          is_current_level?: boolean | null
          conditions?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          workflow_id?: string | null
          level?: number | null
          approver_role?: string | null
          approver_employee_id?: string | null
          approver_name?: string | null
          status?: string | null
          action_date?: string | null
          comments?: string | null
          is_current_level?: boolean | null
          conditions?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_templates: {
        Row: {
          id: string
          name: string
          request_type: string
          description: string | null
          is_active: boolean | null
          conditions: string | null
          steps: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          request_type?: string | null
          description?: string | null
          is_active?: boolean | null
          conditions?: string | null
          steps?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          request_type?: string | null
          description?: string | null
          is_active?: boolean | null
          conditions?: string | null
          steps?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][T]["Row"]

export type InsertTables<
  T extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][T]["Insert"]

export type UpdateTables<
  T extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][T]["Update"]

export type Enums<
  T extends keyof PublicSchema["Enums"]
> = PublicSchema["Enums"][T]