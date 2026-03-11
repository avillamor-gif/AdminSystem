export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      absence_categories: {
        Row: {
          affects_pay: boolean | null
          category_code: string
          category_name: string
          category_type: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_occurrences_per_month: number | null
          requires_approval: boolean | null
          severity_level: string | null
          updated_at: string | null
        }
        Insert: {
          affects_pay?: boolean | null
          category_code: string
          category_name: string
          category_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_occurrences_per_month?: number | null
          requires_approval?: boolean | null
          severity_level?: string | null
          updated_at?: string | null
        }
        Update: {
          affects_pay?: boolean | null
          category_code?: string
          category_name?: string
          category_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_occurrences_per_month?: number | null
          requires_approval?: boolean | null
          severity_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      accrual_rules: {
        Row: {
          accrual_frequency: string
          accrual_rate: number
          carry_over_enabled: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          leave_type_id: string
          max_balance: number | null
          max_carry_over: number | null
          rule_code: string
          rule_name: string
          updated_at: string | null
          waiting_period_days: number | null
        }
        Insert: {
          accrual_frequency: string
          accrual_rate: number
          carry_over_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          leave_type_id: string
          max_balance?: number | null
          max_carry_over?: number | null
          rule_code: string
          rule_name: string
          updated_at?: string | null
          waiting_period_days?: number | null
        }
        Update: {
          accrual_frequency?: string
          accrual_rate?: number
          carry_over_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          leave_type_id?: string
          max_balance?: number | null
          max_carry_over?: number | null
          rule_code?: string
          rule_name?: string
          updated_at?: string | null
          waiting_period_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "accrual_rules_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      active_sessions: {
        Row: {
          created_at: string | null
          device_type: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity_at: string | null
          location: string | null
          session_token: string
          started_at: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity_at?: string | null
          location?: string | null
          session_token: string
          started_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity_at?: string | null
          location?: string | null
          session_token?: string
          started_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      asset_assignment_history: {
        Row: {
          asset_id: string
          assigned_by: string
          assigned_date: string
          assigned_to: string
          created_at: string | null
          id: string
          notes: string | null
          reason: string | null
          unassigned_by: string | null
          unassigned_date: string | null
        }
        Insert: {
          asset_id: string
          assigned_by: string
          assigned_date: string
          assigned_to: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          unassigned_by?: string | null
          unassigned_date?: string | null
        }
        Update: {
          asset_id?: string
          assigned_by?: string
          assigned_date?: string
          assigned_to?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          unassigned_by?: string | null
          unassigned_date?: string | null
        }
        Relationships: []
      }
      asset_assignments: {
        Row: {
          asset_id: string
          assigned_by: string | null
          assigned_date: string
          condition_on_assignment: string | null
          condition_on_return: string | null
          created_at: string | null
          employee_id: string
          id: string
          notes: string | null
          returned_by: string | null
          returned_date: string | null
        }
        Insert: {
          asset_id: string
          assigned_by?: string | null
          assigned_date?: string
          condition_on_assignment?: string | null
          condition_on_return?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          returned_by?: string | null
          returned_date?: string | null
        }
        Update: {
          asset_id?: string
          assigned_by?: string | null
          assigned_date?: string
          condition_on_assignment?: string | null
          condition_on_return?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          returned_by?: string | null
          returned_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_returned_by_fkey"
            columns: ["returned_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_returned_by_fkey"
            columns: ["returned_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_brands: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_locations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_maintenance: {
        Row: {
          asset_id: string
          completed_date: string | null
          cost: number | null
          created_at: string | null
          description: string
          id: string
          maintenance_type: string | null
          notes: string | null
          performed_by: string | null
          scheduled_date: string | null
          status: string | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          asset_id: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description: string
          id?: string
          maintenance_type?: string | null
          notes?: string | null
          performed_by?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          asset_id?: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string
          id?: string
          maintenance_type?: string | null
          notes?: string | null
          performed_by?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "asset_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_requests: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          assigned_asset_id: string | null
          category_id: string | null
          created_at: string | null
          employee_id: string
          fulfilled_date: string | null
          id: string
          item_description: string
          justification: string | null
          notes: string | null
          priority: string | null
          rejection_reason: string | null
          requested_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          assigned_asset_id?: string | null
          category_id?: string | null
          created_at?: string | null
          employee_id: string
          fulfilled_date?: string | null
          id?: string
          item_description: string
          justification?: string | null
          notes?: string | null
          priority?: string | null
          rejection_reason?: string | null
          requested_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          assigned_asset_id?: string | null
          category_id?: string | null
          created_at?: string | null
          employee_id?: string
          fulfilled_date?: string | null
          id?: string
          item_description?: string
          justification?: string | null
          notes?: string | null
          priority?: string | null
          rejection_reason?: string | null
          requested_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_requests_assigned_asset_id_fkey"
            columns: ["assigned_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_service_requests: {
        Row: {
          actual_cost: number | null
          asset_id: string
          assigned_technician: string | null
          created_at: string | null
          description: string
          estimated_cost: number | null
          id: string
          issue_type: string
          priority: string
          request_date: string | null
          requested_by: string
          resolution: string | null
          resolution_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          asset_id: string
          assigned_technician?: string | null
          created_at?: string | null
          description: string
          estimated_cost?: number | null
          id?: string
          issue_type: string
          priority: string
          request_date?: string | null
          requested_by: string
          resolution?: string | null
          resolution_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          asset_id?: string
          assigned_technician?: string | null
          created_at?: string | null
          description?: string
          estimated_cost?: number | null
          id?: string
          issue_type?: string
          priority?: string
          request_date?: string | null
          requested_by?: string
          resolution?: string | null
          resolution_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_vendors: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_warranty_tracking: {
        Row: {
          asset_id: string
          claim_history: number | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          coverage: string[] | null
          created_at: string | null
          id: string
          notes: string | null
          renewal_cost: number | null
          updated_at: string | null
          vendor_id: string | null
          warranty_end: string
          warranty_start: string
          warranty_type: string
        }
        Insert: {
          asset_id: string
          claim_history?: number | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          coverage?: string[] | null
          created_at?: string | null
          id?: string
          notes?: string | null
          renewal_cost?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          warranty_end: string
          warranty_start: string
          warranty_type: string
        }
        Update: {
          asset_id?: string
          claim_history?: number | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          coverage?: string[] | null
          created_at?: string | null
          id?: string
          notes?: string | null
          renewal_cost?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          warranty_end?: string
          warranty_start?: string
          warranty_type?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          asset_tag: string | null
          assigned_date: string | null
          assigned_to: string | null
          brand_id: string | null
          category_id: string | null
          condition: string | null
          created_at: string | null
          depreciation_method: string | null
          id: string
          image_url: string | null
          location: string | null
          location_id: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_order_number: string | null
          purchase_price: number | null
          qr_code: string | null
          salvage_value: number | null
          serial_number: string | null
          specifications: Json | null
          status: string | null
          updated_at: string | null
          useful_life_years: number | null
          vendor_id: string | null
          warranty_details: string | null
          warranty_end_date: string | null
          warranty_start_date: string | null
        }
        Insert: {
          asset_tag?: string | null
          assigned_date?: string | null
          assigned_to?: string | null
          brand_id?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string | null
          depreciation_method?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          location_id?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_order_number?: string | null
          purchase_price?: number | null
          qr_code?: string | null
          salvage_value?: number | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string | null
          updated_at?: string | null
          useful_life_years?: number | null
          vendor_id?: string | null
          warranty_details?: string | null
          warranty_end_date?: string | null
          warranty_start_date?: string | null
        }
        Update: {
          asset_tag?: string | null
          assigned_date?: string | null
          assigned_to?: string | null
          brand_id?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string | null
          depreciation_method?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          location_id?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_order_number?: string | null
          purchase_price?: number | null
          qr_code?: string | null
          salvage_value?: number | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string | null
          updated_at?: string | null
          useful_life_years?: number | null
          vendor_id?: string | null
          warranty_details?: string | null
          warranty_end_date?: string | null
          warranty_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "asset_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "asset_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "asset_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_policies: {
        Row: {
          allow_manual_override: boolean | null
          applicable_departments: Json | null
          applicable_employee_types: Json | null
          applicable_locations: Json | null
          auto_deduct_pay: boolean | null
          consecutive_absence_limit: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          early_departure_penalty: string | null
          early_departure_threshold_minutes: number | null
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          late_arrival_penalty: string | null
          late_arrival_threshold_minutes: number | null
          max_clock_out_time: string | null
          max_early_departures_per_month: number | null
          max_late_arrivals_per_month: number | null
          max_unexcused_absences_per_month: number | null
          max_unexcused_absences_per_year: number | null
          min_clock_in_time: string | null
          notification_recipients: Json | null
          notify_on_early_clock_out: boolean | null
          notify_on_late_clock_in: boolean | null
          notify_on_missed_clock_out: boolean | null
          policy_code: string
          policy_name: string
          policy_type: string
          requires_justification: boolean | null
          requires_medical_certificate_after_days: number | null
          rounding_method: string | null
          updated_at: string | null
        }
        Insert: {
          allow_manual_override?: boolean | null
          applicable_departments?: Json | null
          applicable_employee_types?: Json | null
          applicable_locations?: Json | null
          auto_deduct_pay?: boolean | null
          consecutive_absence_limit?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          early_departure_penalty?: string | null
          early_departure_threshold_minutes?: number | null
          effective_from: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          late_arrival_penalty?: string | null
          late_arrival_threshold_minutes?: number | null
          max_clock_out_time?: string | null
          max_early_departures_per_month?: number | null
          max_late_arrivals_per_month?: number | null
          max_unexcused_absences_per_month?: number | null
          max_unexcused_absences_per_year?: number | null
          min_clock_in_time?: string | null
          notification_recipients?: Json | null
          notify_on_early_clock_out?: boolean | null
          notify_on_late_clock_in?: boolean | null
          notify_on_missed_clock_out?: boolean | null
          policy_code: string
          policy_name: string
          policy_type: string
          requires_justification?: boolean | null
          requires_medical_certificate_after_days?: number | null
          rounding_method?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_manual_override?: boolean | null
          applicable_departments?: Json | null
          applicable_employee_types?: Json | null
          applicable_locations?: Json | null
          auto_deduct_pay?: boolean | null
          consecutive_absence_limit?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          early_departure_penalty?: string | null
          early_departure_threshold_minutes?: number | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          late_arrival_penalty?: string | null
          late_arrival_threshold_minutes?: number | null
          max_clock_out_time?: string | null
          max_early_departures_per_month?: number | null
          max_late_arrivals_per_month?: number | null
          max_unexcused_absences_per_month?: number | null
          max_unexcused_absences_per_year?: number | null
          min_clock_in_time?: string | null
          notification_recipients?: Json | null
          notify_on_early_clock_out?: boolean | null
          notify_on_late_clock_in?: boolean | null
          notify_on_missed_clock_out?: boolean | null
          policy_code?: string
          policy_name?: string
          policy_type?: string
          requires_justification?: boolean | null
          requires_medical_certificate_after_days?: number | null
          rounding_method?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          created_at: string | null
          date: string
          employee_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"] | null
          updated_at: string | null
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          updated_at?: string | null
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits_plans: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          is_taxable: boolean
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_taxable?: boolean
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_taxable?: boolean
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      break_policies: {
        Row: {
          applicable_schedules: Json | null
          applicable_shifts: Json | null
          break_type: string
          can_be_split: boolean | null
          compliance_requirement: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          is_paid: boolean | null
          max_splits: number | null
          min_shift_duration_minutes: number | null
          occurs_after_minutes: number | null
          policy_code: string
          policy_name: string
          requires_clock_out: boolean | null
          updated_at: string | null
        }
        Insert: {
          applicable_schedules?: Json | null
          applicable_shifts?: Json | null
          break_type: string
          can_be_split?: boolean | null
          compliance_requirement?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          is_paid?: boolean | null
          max_splits?: number | null
          min_shift_duration_minutes?: number | null
          occurs_after_minutes?: number | null
          policy_code: string
          policy_name: string
          requires_clock_out?: boolean | null
          updated_at?: string | null
        }
        Update: {
          applicable_schedules?: Json | null
          applicable_shifts?: Json | null
          break_type?: string
          can_be_split?: boolean | null
          compliance_requirement?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          is_paid?: boolean | null
          max_splits?: number | null
          min_shift_duration_minutes?: number | null
          occurs_after_minutes?: number | null
          policy_code?: string
          policy_name?: string
          requires_clock_out?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "break_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          cover_letter: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          rating: number | null
          resume_url: string | null
          status: Database["public"]["Enums"]["candidate_status"] | null
          updated_at: string | null
          vacancy_id: string | null
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          resume_url?: string | null
          status?: Database["public"]["Enums"]["candidate_status"] | null
          updated_at?: string | null
          vacancy_id?: string | null
        }
        Update: {
          cover_letter?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          resume_url?: string | null
          status?: Database["public"]["Enums"]["candidate_status"] | null
          updated_at?: string | null
          vacancy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      career_paths: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string | null
          employees_on_path: number | null
          id: string
          levels: Json | null
          name: string
          skills_required: Json | null
          status: string | null
          total_duration: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          employees_on_path?: number | null
          id?: string
          levels?: Json | null
          name: string
          skills_required?: Json | null
          status?: string | null
          total_duration?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          employees_on_path?: number | null
          id?: string
          levels?: Json | null
          name?: string
          skills_required?: Json | null
          status?: string | null
          total_duration?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_structures: {
        Row: {
          address: string | null
          budget: number | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string | null
          description: string | null
          email: string | null
          employee_count: number | null
          established_date: string | null
          id: string
          level: number
          location_id: string | null
          manager_id: string | null
          mission_statement: string | null
          name: string
          operational_hours: string | null
          parent_id: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          status: string | null
          structure_type: string
          timezone: string | null
          updated_at: string | null
          vision_statement: string | null
        }
        Insert: {
          address?: string | null
          budget?: number | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          employee_count?: number | null
          established_date?: string | null
          id?: string
          level?: number
          location_id?: string | null
          manager_id?: string | null
          mission_statement?: string | null
          name: string
          operational_hours?: string | null
          parent_id?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          structure_type: string
          timezone?: string | null
          updated_at?: string | null
          vision_statement?: string | null
        }
        Update: {
          address?: string | null
          budget?: number | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          employee_count?: number | null
          established_date?: string | null
          id?: string
          level?: number
          location_id?: string | null
          manager_id?: string | null
          mission_statement?: string | null
          name?: string
          operational_hours?: string | null
          parent_id?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          structure_type?: string
          timezone?: string | null
          updated_at?: string | null
          vision_statement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_structures_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_structures_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_structures_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "company_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          created_at: string | null
          description: string | null
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          employee_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          budget: number | null
          code: string | null
          cost_center: string | null
          created_at: string | null
          description: string | null
          email: string | null
          established_date: string | null
          id: string
          location_id: string | null
          name: string
          parent_department_id: string | null
          parent_id: string | null
          phone: string | null
          status: string | null
        }
        Insert: {
          budget?: number | null
          code?: string | null
          cost_center?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          established_date?: string | null
          id?: string
          location_id?: string | null
          name: string
          parent_department_id?: string | null
          parent_id?: string | null
          phone?: string | null
          status?: string | null
        }
        Update: {
          budget?: number | null
          code?: string | null
          cost_center?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          established_date?: string | null
          id?: string
          location_id?: string | null
          name?: string
          parent_department_id?: string | null
          parent_id?: string | null
          phone?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string | null
          employee_id: string
          home_phone: string | null
          id: string
          mobile_phone: string
          name: string
          relationship: string
          updated_at: string | null
          work_phone: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          home_phone?: string | null
          id?: string
          mobile_phone: string
          name: string
          relationship: string
          updated_at?: string | null
          work_phone?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          home_phone?: string | null
          id?: string
          mobile_phone?: string
          name?: string
          relationship?: string
          updated_at?: string | null
          work_phone?: string | null
        }
        Relationships: []
      }
      employee_assets: {
        Row: {
          actual_return_date: string | null
          asset_name: string
          asset_number: string | null
          asset_type: string
          assigned_date: string
          condition_on_assignment: string | null
          condition_on_return: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          employee_id: string
          expected_return_date: string | null
          id: string
          purchase_value: number | null
          return_notes: string | null
          returned_to: string | null
          serial_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_return_date?: string | null
          asset_name: string
          asset_number?: string | null
          asset_type: string
          assigned_date: string
          condition_on_assignment?: string | null
          condition_on_return?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          employee_id: string
          expected_return_date?: string | null
          id?: string
          purchase_value?: number | null
          return_notes?: string | null
          returned_to?: string | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_return_date?: string | null
          asset_name?: string
          asset_number?: string | null
          asset_type?: string
          assigned_date?: string
          condition_on_assignment?: string | null
          condition_on_return?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          employee_id?: string
          expected_return_date?: string | null
          id?: string
          purchase_value?: number | null
          return_notes?: string | null
          returned_to?: string | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_attachments: {
        Row: {
          created_at: string | null
          description: string | null
          document_type: string | null
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          mime_type: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_type?: string | null
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          mime_type?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_type?: string | null
          employee_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          mime_type?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_attachments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attachments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_audit_logs: {
        Row: {
          action: string
          changed_by: string
          changed_by_user_id: string | null
          created_at: string | null
          details: Json | null
          employee_id: string
          id: string
        }
        Insert: {
          action: string
          changed_by?: string
          changed_by_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          employee_id: string
          id?: string
        }
        Update: {
          action?: string
          changed_by?: string
          changed_by_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          employee_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_audit_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_audit_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_compliance_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          employee_id: string
          id: string
          is_complete: boolean | null
          label: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          is_complete?: boolean | null
          label: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          is_complete?: boolean | null
          label?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_compliance_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_compliance_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_custom_field_values: {
        Row: {
          created_at: string | null
          employee_id: string
          field_id: string
          id: string
          updated_at: string | null
          value: string | null
          value_array: string[] | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          field_id: string
          id?: string
          updated_at?: string | null
          value?: string | null
          value_array?: string[] | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          field_id?: string
          id?: string
          updated_at?: string | null
          value?: string | null
          value_array?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "employee_custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_custom_fields: {
        Row: {
          category: string
          created_at: string | null
          default_value: string | null
          description: string | null
          editable: boolean | null
          field_key: string
          field_order: number | null
          field_type: string
          help_text: string | null
          id: string
          name: string
          options: Json | null
          placeholder: string | null
          required: boolean | null
          searchable: boolean | null
          show_in_list: boolean | null
          show_in_profile: boolean | null
          status: string | null
          updated_at: string | null
          validation_rules: Json | null
          visible: boolean | null
        }
        Insert: {
          category: string
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          editable?: boolean | null
          field_key: string
          field_order?: number | null
          field_type: string
          help_text?: string | null
          id?: string
          name: string
          options?: Json | null
          placeholder?: string | null
          required?: boolean | null
          searchable?: boolean | null
          show_in_list?: boolean | null
          show_in_profile?: boolean | null
          status?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
          visible?: boolean | null
        }
        Update: {
          category?: string
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          editable?: boolean | null
          field_key?: string
          field_order?: number | null
          field_type?: string
          help_text?: string | null
          id?: string
          name?: string
          options?: Json | null
          placeholder?: string | null
          required?: boolean | null
          searchable?: boolean | null
          show_in_list?: boolean | null
          show_in_profile?: boolean | null
          status?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
          visible?: boolean | null
        }
        Relationships: []
      }
      employee_data_imports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_log: Json | null
          failed_records: number | null
          file_name: string | null
          id: string
          import_type: string
          imported_by: string | null
          started_at: string | null
          status: string | null
          successful_records: number | null
          total_records: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_records?: number | null
          file_name?: string | null
          id?: string
          import_type: string
          imported_by?: string | null
          started_at?: string | null
          status?: string | null
          successful_records?: number | null
          total_records?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_records?: number | null
          file_name?: string | null
          id?: string
          import_type?: string
          imported_by?: string | null
          started_at?: string | null
          status?: string | null
          successful_records?: number | null
          total_records?: number
        }
        Relationships: []
      }
      employee_immigration: {
        Row: {
          comments: string | null
          created_at: string | null
          document_number: string
          document_type: string
          eligible_review_date: string | null
          eligible_status: string | null
          employee_id: string
          expiry_date: string | null
          id: string
          issued_by: string | null
          issued_date: string | null
          updated_at: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          document_number: string
          document_type: string
          eligible_review_date?: string | null
          eligible_status?: string | null
          employee_id: string
          expiry_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          updated_at?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          document_number?: string
          document_type?: string
          eligible_review_date?: string | null
          eligible_status?: string | null
          employee_id?: string
          expiry_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_immigration_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_immigration_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profile_templates: {
        Row: {
          created_at: string | null
          default_values: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          optional_fields: string[] | null
          required_fields: string[]
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_values?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          optional_fields?: string[] | null
          required_fields: string[]
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_values?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          optional_fields?: string[] | null
          required_fields?: string[]
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_reporting_fields: {
        Row: {
          created_at: string | null
          created_by: string | null
          field_mapping: Json
          filters: Json | null
          id: string
          is_public: boolean | null
          report_name: string
          sort_order: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          field_mapping: Json
          filters?: Json | null
          id?: string
          is_public?: boolean | null
          report_name: string
          sort_order?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          field_mapping?: Json
          filters?: Json | null
          id?: string
          is_public?: boolean | null
          report_name?: string
          sort_order?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_schedule_assignments: {
        Row: {
          assigned_by: string | null
          attendance_policy_id: string | null
          created_at: string | null
          effective_from: string
          effective_to: string | null
          employee_id: string
          id: string
          is_temporary: boolean | null
          notes: string | null
          shift_pattern_id: string | null
          updated_at: string | null
          work_schedule_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          attendance_policy_id?: string | null
          created_at?: string | null
          effective_from: string
          effective_to?: string | null
          employee_id: string
          id?: string
          is_temporary?: boolean | null
          notes?: string | null
          shift_pattern_id?: string | null
          updated_at?: string | null
          work_schedule_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          attendance_policy_id?: string | null
          created_at?: string | null
          effective_from?: string
          effective_to?: string | null
          employee_id?: string
          id?: string
          is_temporary?: boolean | null
          notes?: string | null
          shift_pattern_id?: string | null
          updated_at?: string | null
          work_schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_schedule_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedule_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedule_assignments_attendance_policy_id_fkey"
            columns: ["attendance_policy_id"]
            isOneToOne: false
            referencedRelation: "attendance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedule_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedule_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedule_assignments_shift_pattern_id_fkey"
            columns: ["shift_pattern_id"]
            isOneToOne: false
            referencedRelation: "shift_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedule_assignments_work_schedule_id_fkey"
            columns: ["work_schedule_id"]
            isOneToOne: false
            referencedRelation: "work_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          department_id: string | null
          email: string
          employee_id: string
          employment_type_id: string | null
          first_name: string
          hire_date: string
          home_phone: string | null
          id: string
          job_specification_id: string | null
          job_title_id: string | null
          last_name: string
          location_id: string | null
          manager_id: string | null
          marital_status: string | null
          middle_name: string | null
          mobile_phone: string | null
          national_id: string | null
          nationality: string | null
          pagibig_number: string | null
          personal_email: string | null
          philhealth_number: string | null
          phone: string | null
          remote_location: string | null
          salary_structure_id: string | null
          sex: string | null
          sss_number: string | null
          state: string | null
          status: Database["public"]["Enums"]["employee_status"] | null
          suffix: string | null
          tin_number: string | null
          updated_at: string | null
          voters_id: string | null
          work_email: string | null
          work_location_type: string | null
          work_phone: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          email: string
          employee_id: string
          employment_type_id?: string | null
          first_name: string
          hire_date: string
          home_phone?: string | null
          id?: string
          job_specification_id?: string | null
          job_title_id?: string | null
          last_name: string
          location_id?: string | null
          manager_id?: string | null
          marital_status?: string | null
          middle_name?: string | null
          mobile_phone?: string | null
          national_id?: string | null
          nationality?: string | null
          pagibig_number?: string | null
          personal_email?: string | null
          philhealth_number?: string | null
          phone?: string | null
          remote_location?: string | null
          salary_structure_id?: string | null
          sex?: string | null
          sss_number?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          suffix?: string | null
          tin_number?: string | null
          updated_at?: string | null
          voters_id?: string | null
          work_email?: string | null
          work_location_type?: string | null
          work_phone?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          email?: string
          employee_id?: string
          employment_type_id?: string | null
          first_name?: string
          hire_date?: string
          home_phone?: string | null
          id?: string
          job_specification_id?: string | null
          job_title_id?: string | null
          last_name?: string
          location_id?: string | null
          manager_id?: string | null
          marital_status?: string | null
          middle_name?: string | null
          mobile_phone?: string | null
          national_id?: string | null
          nationality?: string | null
          pagibig_number?: string | null
          personal_email?: string | null
          philhealth_number?: string | null
          phone?: string | null
          remote_location?: string | null
          salary_structure_id?: string | null
          sex?: string | null
          sss_number?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          suffix?: string | null
          tin_number?: string | null
          updated_at?: string | null
          voters_id?: string | null
          work_email?: string | null
          work_location_type?: string | null
          work_phone?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_employment_type_id_fkey"
            columns: ["employment_type_id"]
            isOneToOne: false
            referencedRelation: "employment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_job_specification_id_fkey"
            columns: ["job_specification_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_salary_structure_id_fkey"
            columns: ["salary_structure_id"]
            isOneToOne: false
            referencedRelation: "salary_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_types: {
        Row: {
          benefits: Json | null
          category: string
          code: string
          contract_details: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          working_conditions: Json | null
        }
        Insert: {
          benefits?: Json | null
          category: string
          code: string
          contract_details?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          working_conditions?: Json | null
        }
        Update: {
          benefits?: Json | null
          category?: string
          code?: string
          contract_details?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          working_conditions?: Json | null
        }
        Relationships: []
      }
      equipment_request_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          recipient_user_id: string
          request_id: string | null
          request_number: string | null
          requester_name: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          recipient_user_id: string
          request_id?: string | null
          request_number?: string | null
          requester_name?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          recipient_user_id?: string
          request_id?: string | null
          request_number?: string | null
          requester_name?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_request_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "asset_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      exit_interviews: {
        Row: {
          action_items: string | null
          additional_comments: string | null
          career_growth_rating: number | null
          compensation_rating: number | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          employee_id: string
          hr_review_notes: string | null
          id: string
          interview_date: string | null
          interview_location: string | null
          interview_method: string | null
          interview_time: string | null
          interviewer_id: string | null
          interviewer_notes: string | null
          liked_least: string | null
          liked_most: string | null
          open_to_future_contact: boolean | null
          overall_satisfaction_rating: number | null
          reason_for_leaving: string | null
          relationship_with_manager_rating: number | null
          status: string | null
          suggestions_for_improvement: string | null
          termination_request_id: string
          updated_at: string | null
          work_environment_rating: number | null
          work_life_balance_rating: number | null
          would_consider_returning: boolean | null
          would_recommend_company: boolean | null
        }
        Insert: {
          action_items?: string | null
          additional_comments?: string | null
          career_growth_rating?: number | null
          compensation_rating?: number | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          employee_id: string
          hr_review_notes?: string | null
          id?: string
          interview_date?: string | null
          interview_location?: string | null
          interview_method?: string | null
          interview_time?: string | null
          interviewer_id?: string | null
          interviewer_notes?: string | null
          liked_least?: string | null
          liked_most?: string | null
          open_to_future_contact?: boolean | null
          overall_satisfaction_rating?: number | null
          reason_for_leaving?: string | null
          relationship_with_manager_rating?: number | null
          status?: string | null
          suggestions_for_improvement?: string | null
          termination_request_id: string
          updated_at?: string | null
          work_environment_rating?: number | null
          work_life_balance_rating?: number | null
          would_consider_returning?: boolean | null
          would_recommend_company?: boolean | null
        }
        Update: {
          action_items?: string | null
          additional_comments?: string | null
          career_growth_rating?: number | null
          compensation_rating?: number | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          employee_id?: string
          hr_review_notes?: string | null
          id?: string
          interview_date?: string | null
          interview_location?: string | null
          interview_method?: string | null
          interview_time?: string | null
          interviewer_id?: string | null
          interviewer_notes?: string | null
          liked_least?: string | null
          liked_most?: string | null
          open_to_future_contact?: boolean | null
          overall_satisfaction_rating?: number | null
          reason_for_leaving?: string | null
          relationship_with_manager_rating?: number | null
          status?: string | null
          suggestions_for_improvement?: string | null
          termination_request_id?: string
          updated_at?: string | null
          work_environment_rating?: number | null
          work_life_balance_rating?: number | null
          would_consider_returning?: boolean | null
          would_recommend_company?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "exit_interviews_termination_request_id_fkey"
            columns: ["termination_request_id"]
            isOneToOne: false
            referencedRelation: "termination_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_requests: {
        Row: {
          amount: number
          approved_by: string | null
          approved_date: string | null
          billable: boolean | null
          category: string
          client_code: string | null
          created_at: string | null
          currency: string | null
          description: string
          employee_id: string | null
          exchange_rate: number | null
          expense_date: string
          expense_number: string
          id: string
          local_amount: number | null
          merchant: string
          payment_method: string
          policy_compliant: boolean | null
          policy_violation_reason: string | null
          project_code: string | null
          receipt_attached: boolean | null
          receipt_url: string | null
          reimbursement_date: string | null
          rejection_reason: string | null
          status: string | null
          subcategory: string | null
          tags: string[] | null
          tax_amount: number | null
          tax_rate: number | null
          travel_request_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          approved_date?: string | null
          billable?: boolean | null
          category: string
          client_code?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          employee_id?: string | null
          exchange_rate?: number | null
          expense_date: string
          expense_number: string
          id?: string
          local_amount?: number | null
          merchant: string
          payment_method: string
          policy_compliant?: boolean | null
          policy_violation_reason?: string | null
          project_code?: string | null
          receipt_attached?: boolean | null
          receipt_url?: string | null
          reimbursement_date?: string | null
          rejection_reason?: string | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          tax_amount?: number | null
          tax_rate?: number | null
          travel_request_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          approved_date?: string | null
          billable?: boolean | null
          category?: string
          client_code?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          employee_id?: string | null
          exchange_rate?: number | null
          expense_date?: string
          expense_number?: string
          id?: string
          local_amount?: number | null
          merchant?: string
          payment_method?: string
          policy_compliant?: boolean | null
          policy_violation_reason?: string | null
          project_code?: string | null
          receipt_attached?: boolean | null
          receipt_url?: string | null
          reimbursement_date?: string | null
          rejection_reason?: string | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          tax_amount?: number | null
          tax_rate?: number | null
          travel_request_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_requests_travel_request_id_fkey"
            columns: ["travel_request_id"]
            isOneToOne: false
            referencedRelation: "travel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completed_date: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          employee_id: string
          id: string
          priority: Database["public"]["Enums"]["goal_priority"] | null
          progress: number | null
          review_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["goal_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          employee_id: string
          id?: string
          priority?: Database["public"]["Enums"]["goal_priority"] | null
          progress?: number | null
          review_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          employee_id?: string
          id?: string
          priority?: Database["public"]["Enums"]["goal_priority"] | null
          progress?: number | null
          review_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string | null
          description: string | null
          holiday_date: string
          holiday_name: string
          holiday_type: string
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          is_paid: boolean | null
          is_recurring: boolean | null
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          holiday_date: string
          holiday_name: string
          holiday_type: string
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          is_paid?: boolean | null
          is_recurring?: boolean | null
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          holiday_date?: string
          holiday_name?: string
          holiday_type?: string
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          is_paid?: boolean | null
          is_recurring?: boolean | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      international_operations: {
        Row: {
          active_programs: number | null
          address: string | null
          annual_budget: number | null
          beneficiary_count: number | null
          company_structure_id: string | null
          contact_person: string | null
          country: string
          country_code: string
          country_director_id: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          employee_count: number | null
          established_date: string | null
          expat_staff_count: number | null
          funding_sources: string[] | null
          government_partnerships: string[] | null
          id: string
          legal_entity_name: string | null
          local_partners: string[] | null
          local_staff_count: number | null
          location_id: string | null
          notes: string | null
          office_name: string | null
          official_languages: string[] | null
          operation_type: string | null
          phone: string | null
          program_areas: string[] | null
          region: string | null
          registration_authority: string | null
          registration_date: string | null
          registration_number: string | null
          status: string | null
          tax_id: string | null
          timezone: string | null
          updated_at: string | null
          working_languages: string[] | null
        }
        Insert: {
          active_programs?: number | null
          address?: string | null
          annual_budget?: number | null
          beneficiary_count?: number | null
          company_structure_id?: string | null
          contact_person?: string | null
          country: string
          country_code: string
          country_director_id?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          employee_count?: number | null
          established_date?: string | null
          expat_staff_count?: number | null
          funding_sources?: string[] | null
          government_partnerships?: string[] | null
          id?: string
          legal_entity_name?: string | null
          local_partners?: string[] | null
          local_staff_count?: number | null
          location_id?: string | null
          notes?: string | null
          office_name?: string | null
          official_languages?: string[] | null
          operation_type?: string | null
          phone?: string | null
          program_areas?: string[] | null
          region?: string | null
          registration_authority?: string | null
          registration_date?: string | null
          registration_number?: string | null
          status?: string | null
          tax_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          working_languages?: string[] | null
        }
        Update: {
          active_programs?: number | null
          address?: string | null
          annual_budget?: number | null
          beneficiary_count?: number | null
          company_structure_id?: string | null
          contact_person?: string | null
          country?: string
          country_code?: string
          country_director_id?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          employee_count?: number | null
          established_date?: string | null
          expat_staff_count?: number | null
          funding_sources?: string[] | null
          government_partnerships?: string[] | null
          id?: string
          legal_entity_name?: string | null
          local_partners?: string[] | null
          local_staff_count?: number | null
          location_id?: string | null
          notes?: string | null
          office_name?: string | null
          official_languages?: string[] | null
          operation_type?: string | null
          phone?: string | null
          program_areas?: string[] | null
          region?: string | null
          registration_authority?: string | null
          registration_date?: string | null
          registration_number?: string | null
          status?: string | null
          tax_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          working_languages?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "international_operations_company_structure_id_fkey"
            columns: ["company_structure_id"]
            isOneToOne: false
            referencedRelation: "company_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "international_operations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "international_operations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          candidate_id: string
          created_at: string | null
          duration_minutes: number | null
          feedback: string | null
          id: string
          interview_type: string | null
          interviewer_id: string | null
          location: string | null
          notes: string | null
          rating: number | null
          scheduled_at: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_type?: string | null
          interviewer_id?: string | null
          location?: string | null
          notes?: string | null
          rating?: number | null
          scheduled_at: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_type?: string | null
          interviewer_id?: string | null
          location?: string | null
          notes?: string | null
          rating?: number | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      job_descriptions: {
        Row: {
          code: string
          created_at: string | null
          department: string | null
          education_required: string | null
          employment_type: string | null
          experience_required: string | null
          id: string
          job_title_id: string | null
          last_updated: string | null
          qualifications: Json | null
          responsibilities: Json | null
          skills: Json | null
          status: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          department?: string | null
          education_required?: string | null
          employment_type?: string | null
          experience_required?: string | null
          id?: string
          job_title_id?: string | null
          last_updated?: string | null
          qualifications?: Json | null
          responsibilities?: Json | null
          skills?: Json | null
          status?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          department?: string | null
          education_required?: string | null
          employment_type?: string | null
          experience_required?: string | null
          id?: string
          job_title_id?: string | null
          last_updated?: string | null
          qualifications?: Json | null
          responsibilities?: Json | null
          skills?: Json | null
          status?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_descriptions_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_titles: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          employment_type: string | null
          experience_level: string | null
          id: string
          is_active: boolean | null
          location: string | null
          max_salary: number | null
          min_salary: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          experience_level?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_salary?: number | null
          min_salary?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          experience_level?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_salary?: number | null
          min_salary?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      kpis: {
        Row: {
          created_at: string | null
          current_value: number | null
          description: string | null
          employee_id: string
          id: string
          name: string
          period: string | null
          review_id: string | null
          target_value: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          employee_id: string
          id?: string
          name: string
          period?: string | null
          review_id?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          employee_id?: string
          id?: string
          name?: string
          period?: string | null
          review_id?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpis_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_approval_workflows: {
        Row: {
          created_at: string | null
          escalation_days: number | null
          escalation_enabled: boolean | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_sequential: boolean | null
          leave_type_id: string | null
          priority: number | null
          updated_at: string | null
          workflow_code: string
          workflow_name: string
          workflow_steps: Json
        }
        Insert: {
          created_at?: string | null
          escalation_days?: number | null
          escalation_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_sequential?: boolean | null
          leave_type_id?: string | null
          priority?: number | null
          updated_at?: string | null
          workflow_code: string
          workflow_name: string
          workflow_steps?: Json
        }
        Update: {
          created_at?: string | null
          escalation_days?: number | null
          escalation_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_sequential?: boolean | null
          leave_type_id?: string | null
          priority?: number | null
          updated_at?: string | null
          workflow_code?: string
          workflow_name?: string
          workflow_steps?: Json
        }
        Relationships: [
          {
            foreignKeyName: "leave_approval_workflows_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_approvals: {
        Row: {
          approved_at: string | null
          approver_id: string | null
          approver_role: string
          comments: string | null
          created_at: string | null
          due_date: string | null
          escalated_at: string | null
          id: string
          is_optional: boolean | null
          leave_request_id: string
          status: string | null
          step_number: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approver_id?: string | null
          approver_role: string
          comments?: string | null
          created_at?: string | null
          due_date?: string | null
          escalated_at?: string | null
          id?: string
          is_optional?: boolean | null
          leave_request_id: string
          status?: string | null
          step_number: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approver_id?: string | null
          approver_role?: string
          comments?: string | null
          created_at?: string | null
          due_date?: string | null
          escalated_at?: string | null
          id?: string
          is_optional?: boolean | null
          leave_request_id?: string
          status?: string | null
          step_number?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_approvals_leave_request_id_fkey"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          available_days: number | null
          carried_over: number | null
          created_at: string | null
          employee_id: string
          id: string
          leave_type_id: string
          pending_days: number | null
          total_allocated: number | null
          updated_at: string | null
          used_days: number | null
          year: number
        }
        Insert: {
          available_days?: number | null
          carried_over?: number | null
          created_at?: string | null
          employee_id: string
          id?: string
          leave_type_id: string
          pending_days?: number | null
          total_allocated?: number | null
          updated_at?: string | null
          used_days?: number | null
          year: number
        }
        Update: {
          available_days?: number | null
          carried_over?: number | null
          created_at?: string | null
          employee_id?: string
          id?: string
          leave_type_id?: string
          pending_days?: number | null
          total_allocated?: number | null
          updated_at?: string | null
          used_days?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_credit_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          recipient_user_id: string
          request_id: string | null
          requester_name: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          recipient_user_id: string
          request_id?: string | null
          requester_name?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          recipient_user_id?: string
          request_id?: string | null
          requester_name?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_credit_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "leave_credit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_credit_requests: {
        Row: {
          created_at: string | null
          credit_type: string
          days_approved: number | null
          days_requested: number
          destination: string | null
          employee_id: string
          id: string
          is_international: boolean | null
          leave_type_id: string | null
          notes: string | null
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string | null
          work_date_from: string
          work_date_to: string
        }
        Insert: {
          created_at?: string | null
          credit_type: string
          days_approved?: number | null
          days_requested: number
          destination?: string | null
          employee_id: string
          id?: string
          is_international?: boolean | null
          leave_type_id?: string | null
          notes?: string | null
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string | null
          work_date_from: string
          work_date_to: string
        }
        Update: {
          created_at?: string | null
          credit_type?: string
          days_approved?: number | null
          days_requested?: number
          destination?: string | null
          employee_id?: string
          id?: string
          is_international?: boolean | null
          leave_type_id?: string | null
          notes?: string | null
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string | null
          work_date_from?: string
          work_date_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_credit_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_credit_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_credit_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_credit_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_credit_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_policies: {
        Row: {
          advance_notice_days: number | null
          allow_carryover: boolean | null
          allow_half_days: boolean | null
          allow_negative_balance: boolean | null
          annual_leave_days: number | null
          applies_to_all: boolean | null
          approval_levels: number | null
          auto_approve_threshold: number | null
          blackout_periods: Json | null
          carryover_expiry_months: number | null
          created_at: string | null
          department_id: string | null
          description: string | null
          employment_type_id: string | null
          id: string
          is_active: boolean | null
          max_carryover_days: number | null
          max_consecutive_days: number | null
          min_request_days: number | null
          name: string
          personal_leave_days: number | null
          priority: number | null
          requires_approval: boolean | null
          sick_leave_days: number | null
          updated_at: string | null
        }
        Insert: {
          advance_notice_days?: number | null
          allow_carryover?: boolean | null
          allow_half_days?: boolean | null
          allow_negative_balance?: boolean | null
          annual_leave_days?: number | null
          applies_to_all?: boolean | null
          approval_levels?: number | null
          auto_approve_threshold?: number | null
          blackout_periods?: Json | null
          carryover_expiry_months?: number | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          employment_type_id?: string | null
          id?: string
          is_active?: boolean | null
          max_carryover_days?: number | null
          max_consecutive_days?: number | null
          min_request_days?: number | null
          name: string
          personal_leave_days?: number | null
          priority?: number | null
          requires_approval?: boolean | null
          sick_leave_days?: number | null
          updated_at?: string | null
        }
        Update: {
          advance_notice_days?: number | null
          allow_carryover?: boolean | null
          allow_half_days?: boolean | null
          allow_negative_balance?: boolean | null
          annual_leave_days?: number | null
          applies_to_all?: boolean | null
          approval_levels?: number | null
          auto_approve_threshold?: number | null
          blackout_periods?: Json | null
          carryover_expiry_months?: number | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          employment_type_id?: string | null
          id?: string
          is_active?: boolean | null
          max_carryover_days?: number | null
          max_consecutive_days?: number | null
          min_request_days?: number | null
          name?: string
          personal_leave_days?: number | null
          priority?: number | null
          requires_approval?: boolean | null
          sick_leave_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_policies_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_policies_employment_type_id_fkey"
            columns: ["employment_type_id"]
            isOneToOne: false
            referencedRelation: "employment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_policy_configs: {
        Row: {
          blackout_period_enabled: boolean | null
          can_split_leave: boolean | null
          created_at: string | null
          eligibility_criteria: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          leave_type_id: string | null
          max_consecutive_days: number | null
          min_notice_days: number | null
          min_service_months: number | null
          policy_code: string
          policy_name: string
          requires_approval: boolean | null
          updated_at: string | null
        }
        Insert: {
          blackout_period_enabled?: boolean | null
          can_split_leave?: boolean | null
          created_at?: string | null
          eligibility_criteria?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          leave_type_id?: string | null
          max_consecutive_days?: number | null
          min_notice_days?: number | null
          min_service_months?: number | null
          policy_code: string
          policy_name: string
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Update: {
          blackout_period_enabled?: boolean | null
          can_split_leave?: boolean | null
          created_at?: string | null
          eligibility_criteria?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          leave_type_id?: string | null
          max_consecutive_days?: number | null
          min_notice_days?: number | null
          min_service_months?: number | null
          policy_code?: string
          policy_name?: string
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_policy_configs_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_request_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          leave_request_id: string | null
          message: string
          recipient_user_id: string
          requester_name: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          leave_request_id?: string | null
          message: string
          recipient_user_id: string
          requester_name?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          leave_request_id?: string | null
          message?: string
          recipient_user_id?: string
          requester_name?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_request_notifications_leave_request_id_fkey"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"] | null
          total_days: number
          updated_at: string | null
          workflow_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          total_days: number
          updated_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          total_days?: number
          updated_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "leave_approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          category: string
          color_code: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_paid: boolean | null
          leave_type_code: string
          leave_type_name: string
          requires_approval: boolean | null
          updated_at: string | null
        }
        Insert: {
          category: string
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          leave_type_code: string
          leave_type_name: string
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          leave_type_code?: string
          leave_type_name?: string
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      location_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          code: string | null
          company_structure_id: string | null
          conference_room_count: number | null
          country: string
          created_at: string | null
          current_employee_count: number | null
          email: string | null
          employee_capacity: number | null
          established_date: string | null
          fax: string | null
          has_cafeteria: boolean | null
          has_conference_rooms: boolean | null
          has_gym: boolean | null
          has_medical_room: boolean | null
          has_parking: boolean | null
          id: string
          is_headquarters: boolean | null
          latitude: number | null
          lease_expiry_date: string | null
          location_type: string
          longitude: number | null
          manager_id: string | null
          monthly_rent: number | null
          name: string
          notes: string | null
          operational_hours: string | null
          parent_location_id: string | null
          parking_spaces: number | null
          phone: string | null
          postal_code: string | null
          square_footage: number | null
          state_province: string | null
          status: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          code?: string | null
          company_structure_id?: string | null
          conference_room_count?: number | null
          country: string
          created_at?: string | null
          current_employee_count?: number | null
          email?: string | null
          employee_capacity?: number | null
          established_date?: string | null
          fax?: string | null
          has_cafeteria?: boolean | null
          has_conference_rooms?: boolean | null
          has_gym?: boolean | null
          has_medical_room?: boolean | null
          has_parking?: boolean | null
          id?: string
          is_headquarters?: boolean | null
          latitude?: number | null
          lease_expiry_date?: string | null
          location_type: string
          longitude?: number | null
          manager_id?: string | null
          monthly_rent?: number | null
          name: string
          notes?: string | null
          operational_hours?: string | null
          parent_location_id?: string | null
          parking_spaces?: number | null
          phone?: string | null
          postal_code?: string | null
          square_footage?: number | null
          state_province?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          code?: string | null
          company_structure_id?: string | null
          conference_room_count?: number | null
          country?: string
          created_at?: string | null
          current_employee_count?: number | null
          email?: string | null
          employee_capacity?: number | null
          established_date?: string | null
          fax?: string | null
          has_cafeteria?: boolean | null
          has_conference_rooms?: boolean | null
          has_gym?: boolean | null
          has_medical_room?: boolean | null
          has_parking?: boolean | null
          id?: string
          is_headquarters?: boolean | null
          latitude?: number | null
          lease_expiry_date?: string | null
          location_type?: string
          longitude?: number | null
          manager_id?: string | null
          monthly_rent?: number | null
          name?: string
          notes?: string | null
          operational_hours?: string | null
          parent_location_id?: string | null
          parking_spaces?: number | null
          phone?: string | null
          postal_code?: string | null
          square_footage?: number | null
          state_province?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_company_structure_id_fkey"
            columns: ["company_structure_id"]
            isOneToOne: false
            referencedRelation: "company_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "locations_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      org_relationships: {
        Row: {
          child_id: string
          created_at: string | null
          department_id: string | null
          end_date: string | null
          id: string
          notes: string | null
          parent_id: string
          relationship_type: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          child_id: string
          created_at?: string | null
          department_id?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          parent_id: string
          relationship_type?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string | null
          department_id?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          parent_id?: string
          relationship_type?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      overtime_rules: {
        Row: {
          applicable_days: Json | null
          auto_apply: boolean | null
          calculation_method: string
          created_at: string | null
          created_by: string | null
          description: string | null
          effective_from: string
          effective_to: string | null
          employee_groups: Json | null
          id: string
          is_active: boolean | null
          max_overtime_hours: number | null
          priority: number | null
          rate_multiplier: number
          requires_approval: boolean | null
          rule_code: string
          rule_name: string
          rule_type: string
          threshold_hours: number
          updated_at: string | null
        }
        Insert: {
          applicable_days?: Json | null
          auto_apply?: boolean | null
          calculation_method: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_from: string
          effective_to?: string | null
          employee_groups?: Json | null
          id?: string
          is_active?: boolean | null
          max_overtime_hours?: number | null
          priority?: number | null
          rate_multiplier?: number
          requires_approval?: boolean | null
          rule_code: string
          rule_name: string
          rule_type: string
          threshold_hours: number
          updated_at?: string | null
        }
        Update: {
          applicable_days?: Json | null
          auto_apply?: boolean | null
          calculation_method?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          employee_groups?: Json | null
          id?: string
          is_active?: boolean | null
          max_overtime_hours?: number | null
          priority?: number | null
          rate_multiplier?: number
          requires_approval?: boolean | null
          rule_code?: string
          rule_name?: string
          rule_type?: string
          threshold_hours?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "overtime_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overtime_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      password_history: {
        Row: {
          changed_at: string | null
          created_at: string | null
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          changed_at?: string | null
          created_at?: string | null
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          changed_at?: string | null
          created_at?: string | null
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      password_policies: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          rule_name: string
          rule_type: string
          updated_at: string | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          rule_name: string
          rule_type: string
          updated_at?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          rule_name?: string
          rule_type?: string
          updated_at?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: []
      }
      pay_components: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          name: string
          taxable: boolean
          type: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          taxable?: boolean
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          taxable?: boolean
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pay_grades: {
        Row: {
          category: string
          created_at: string | null
          currency: string | null
          description: string | null
          employee_count: number | null
          grade: string
          id: string
          level: number
          maximum_salary: number
          midpoint_salary: number
          minimum_salary: number
          name: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          employee_count?: number | null
          grade: string
          id?: string
          level: number
          maximum_salary: number
          midpoint_salary: number
          minimum_salary: number
          name?: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          employee_count?: number | null
          grade?: string
          id?: string
          level?: number
          maximum_salary?: number
          midpoint_salary?: number
          minimum_salary?: number
          name?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payroll_runs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          pay_date: string
          period_end: string
          period_start: string
          period_type: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          pay_date: string
          period_end: string
          period_start: string
          period_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          pay_date?: string
          period_end?: string
          period_start?: string
          period_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payslips: {
        Row: {
          adjustment_amount: number
          adjustment_note: string | null
          allowances: number
          basic_salary: number
          created_at: string
          deductions_breakdown: Json | null
          earnings_breakdown: Json | null
          employee_id: string
          gross_pay: number
          id: string
          net_pay: number
          other_deductions: number
          pagibig_ee: number
          pagibig_er: number
          payroll_run_id: string
          philhealth_ee: number
          philhealth_er: number
          remarks: string | null
          sss_ee: number
          sss_er: number
          status: string
          total_deductions: number
          updated_at: string
          withholding_tax: number
        }
        Insert: {
          adjustment_amount?: number
          adjustment_note?: string | null
          allowances?: number
          basic_salary?: number
          created_at?: string
          deductions_breakdown?: Json | null
          earnings_breakdown?: Json | null
          employee_id: string
          gross_pay?: number
          id?: string
          net_pay?: number
          other_deductions?: number
          pagibig_ee?: number
          pagibig_er?: number
          payroll_run_id: string
          philhealth_ee?: number
          philhealth_er?: number
          remarks?: string | null
          sss_ee?: number
          sss_er?: number
          status?: string
          total_deductions?: number
          updated_at?: string
          withholding_tax?: number
        }
        Update: {
          adjustment_amount?: number
          adjustment_note?: string | null
          allowances?: number
          basic_salary?: number
          created_at?: string
          deductions_breakdown?: Json | null
          earnings_breakdown?: Json | null
          employee_id?: string
          gross_pay?: number
          id?: string
          net_pay?: number
          other_deductions?: number
          pagibig_ee?: number
          pagibig_er?: number
          payroll_run_id?: string
          philhealth_ee?: number
          philhealth_er?: number
          remarks?: string | null
          sss_ee?: number
          sss_er?: number
          status?: string
          total_deductions?: number
          updated_at?: string
          withholding_tax?: number
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          areas_for_improvement: string | null
          completed_date: string | null
          created_at: string | null
          due_date: string | null
          employee_comments: string | null
          employee_id: string
          id: string
          overall_rating: number | null
          review_period: string | null
          reviewer_comments: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["review_status"] | null
          strengths: string | null
          updated_at: string | null
        }
        Insert: {
          areas_for_improvement?: string | null
          completed_date?: string | null
          created_at?: string | null
          due_date?: string | null
          employee_comments?: string | null
          employee_id: string
          id?: string
          overall_rating?: number | null
          review_period?: string | null
          reviewer_comments?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["review_status"] | null
          strengths?: string | null
          updated_at?: string | null
        }
        Update: {
          areas_for_improvement?: string | null
          completed_date?: string | null
          created_at?: string | null
          due_date?: string | null
          employee_comments?: string | null
          employee_id?: string
          id?: string
          overall_rating?: number | null
          review_period?: string | null
          reviewer_comments?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["review_status"] | null
          strengths?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pim_field_config: {
        Row: {
          access_level: string | null
          created_at: string | null
          display_name: string
          field_group: string
          field_name: string
          field_order: number | null
          id: string
          is_editable: boolean | null
          is_required: boolean | null
          is_sensitive: boolean | null
          is_visible: boolean | null
          show_in_employee_list: boolean | null
          show_in_employee_profile: boolean | null
          show_in_reports: boolean | null
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          display_name: string
          field_group: string
          field_name: string
          field_order?: number | null
          id?: string
          is_editable?: boolean | null
          is_required?: boolean | null
          is_sensitive?: boolean | null
          is_visible?: boolean | null
          show_in_employee_list?: boolean | null
          show_in_employee_profile?: boolean | null
          show_in_reports?: boolean | null
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          display_name?: string
          field_group?: string
          field_name?: string
          field_order?: number | null
          id?: string
          is_editable?: boolean | null
          is_required?: boolean | null
          is_sensitive?: boolean | null
          is_visible?: boolean | null
          show_in_employee_list?: boolean | null
          show_in_employee_profile?: boolean | null
          show_in_reports?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      printing_presses: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          min_order_qty: number | null
          name: string
          notes: string | null
          phone: string | null
          specialties: string[] | null
          turnaround_days: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          min_order_qty?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          specialties?: string[] | null
          turnaround_days?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          min_order_qty?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          specialties?: string[] | null
          turnaround_days?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      publication_request_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          recipient_user_id: string
          request_id: string | null
          request_number: string | null
          requester_name: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          recipient_user_id: string
          request_id?: string | null
          request_number?: string | null
          requester_name?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          recipient_user_id?: string
          request_id?: string | null
          request_number?: string | null
          requester_name?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_request_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "publication_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_requests: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          cover_url: string | null
          created_at: string | null
          currency: string | null
          deadline: string | null
          delivery_address: string | null
          delivery_method: string | null
          employee_id: string | null
          estimated_cost: number | null
          fulfilled_date: string | null
          id: string
          isbn: string | null
          justification: string | null
          notes: string | null
          pdf_url: string | null
          priority: string | null
          publication_id: string
          publication_title: string
          publication_type: string
          publisher: string | null
          purpose: string
          quantity: number | null
          rejection_reason: string | null
          request_number: string
          request_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          cover_url?: string | null
          created_at?: string | null
          currency?: string | null
          deadline?: string | null
          delivery_address?: string | null
          delivery_method?: string | null
          employee_id?: string | null
          estimated_cost?: number | null
          fulfilled_date?: string | null
          id?: string
          isbn?: string | null
          justification?: string | null
          notes?: string | null
          pdf_url?: string | null
          priority?: string | null
          publication_id: string
          publication_title: string
          publication_type: string
          publisher?: string | null
          purpose: string
          quantity?: number | null
          rejection_reason?: string | null
          request_number: string
          request_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          cover_url?: string | null
          created_at?: string | null
          currency?: string | null
          deadline?: string | null
          delivery_address?: string | null
          delivery_method?: string | null
          employee_id?: string | null
          estimated_cost?: number | null
          fulfilled_date?: string | null
          id?: string
          isbn?: string | null
          justification?: string | null
          notes?: string | null
          pdf_url?: string | null
          priority?: string | null
          publication_id?: string
          publication_title?: string
          publication_type?: string
          publisher?: string | null
          purpose?: string
          quantity?: number | null
          rejection_reason?: string | null
          request_number?: string
          request_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      salary_structures: {
        Row: {
          base_salary: number
          code: string
          components: Json | null
          created_at: string | null
          currency: string | null
          effective_date: string
          end_date: string | null
          id: string
          name: string
          pay_grade_id: string | null
          status: string | null
          total_compensation: number
          updated_at: string | null
        }
        Insert: {
          base_salary: number
          code: string
          components?: Json | null
          created_at?: string | null
          currency?: string | null
          effective_date: string
          end_date?: string | null
          id?: string
          name: string
          pay_grade_id?: string | null
          status?: string | null
          total_compensation: number
          updated_at?: string | null
        }
        Update: {
          base_salary?: number
          code?: string
          components?: Json | null
          created_at?: string | null
          currency?: string | null
          effective_date?: string
          end_date?: string | null
          id?: string
          name?: string
          pay_grade_id?: string | null
          status?: string | null
          total_compensation?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_structures_pay_grade_id_fkey"
            columns: ["pay_grade_id"]
            isOneToOne: false
            referencedRelation: "pay_grades"
            referencedColumns: ["id"]
          },
        ]
      }
      security_policies: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          last_reviewed_at: string | null
          name: string
          policy_type: string
          severity: string | null
          updated_at: string | null
          value_boolean: boolean | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_reviewed_at?: string | null
          name: string
          policy_type: string
          severity?: string | null
          updated_at?: string | null
          value_boolean?: boolean | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_reviewed_at?: string | null
          name?: string
          policy_type?: string
          severity?: string | null
          updated_at?: string | null
          value_boolean?: boolean | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: []
      }
      shift_patterns: {
        Row: {
          break_duration_minutes: number | null
          color_code: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number
          end_time: string
          id: string
          is_active: boolean | null
          is_overnight: boolean | null
          max_staff_allowed: number | null
          min_staff_required: number | null
          premium_rate: number | null
          shift_code: string
          shift_name: string
          shift_type: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          break_duration_minutes?: number | null
          color_code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes: number
          end_time: string
          id?: string
          is_active?: boolean | null
          is_overnight?: boolean | null
          max_staff_allowed?: number | null
          min_staff_required?: number | null
          premium_rate?: number | null
          shift_code: string
          shift_name: string
          shift_type: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          break_duration_minutes?: number | null
          color_code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          is_overnight?: boolean | null
          max_staff_allowed?: number | null
          min_staff_required?: number | null
          premium_rate?: number | null
          shift_code?: string
          shift_name?: string
          shift_type?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_patterns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_patterns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_brands: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      supply_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      supply_items: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          location: string | null
          location_id: string | null
          max_stock: number | null
          name: string
          notes: string | null
          quantity_on_hand: number | null
          reorder_point: number | null
          unit: string | null
          unit_cost: number | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          location_id?: string | null
          max_stock?: number | null
          name: string
          notes?: string | null
          quantity_on_hand?: number | null
          reorder_point?: number | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          location_id?: string | null
          max_stock?: number | null
          name?: string
          notes?: string | null
          quantity_on_hand?: number | null
          reorder_point?: number | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "supply_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "supply_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "supply_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "supply_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_locations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      supply_po_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string | null
          item_name: string
          po_id: string | null
          quantity: number
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          item_name: string
          po_id?: string | null
          quantity?: number
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          item_name?: string
          po_id?: string | null
          quantity?: number
          total_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_po_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "supply_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_po_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "supply_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_purchase_orders: {
        Row: {
          created_at: string | null
          created_by: string | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string | null
          po_number: string
          received_date: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number: string
          received_date?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number?: string
          received_date?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "supply_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_request_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          recipient_user_id: string
          request_id: string | null
          request_number: string | null
          requester_name: string | null
          supply_request_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          recipient_user_id: string
          request_id?: string | null
          request_number?: string | null
          requester_name?: string | null
          supply_request_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          recipient_user_id?: string
          request_id?: string | null
          request_number?: string | null
          requester_name?: string | null
          supply_request_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_request_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "supply_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_request_notifications_supply_request_id_fkey"
            columns: ["supply_request_id"]
            isOneToOne: false
            referencedRelation: "supply_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          created_at: string | null
          employee_id: string | null
          fulfilled_at: string | null
          id: string
          item_id: string | null
          item_name: string
          notes: string | null
          priority: string | null
          purpose: string | null
          quantity: number
          rejection_reason: string | null
          request_number: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          fulfilled_at?: string | null
          id?: string
          item_id?: string | null
          item_name: string
          notes?: string | null
          priority?: string | null
          purpose?: string | null
          quantity?: number
          rejection_reason?: string | null
          request_number: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          fulfilled_at?: string | null
          id?: string
          item_id?: string | null
          item_name?: string
          notes?: string | null
          priority?: string | null
          purpose?: string | null
          quantity?: number
          rejection_reason?: string | null
          request_number?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "supply_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "supply_items"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_vendors: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tax_configurations: {
        Row: {
          base_tax: number
          created_at: string | null
          description: string | null
          id: string
          max_income: number | null
          min_income: number
          rate: number
          updated_at: string | null
        }
        Insert: {
          base_tax?: number
          created_at?: string | null
          description?: string | null
          id?: string
          max_income?: number | null
          min_income: number
          rate: number
          updated_at?: string | null
        }
        Update: {
          base_tax?: number
          created_at?: string | null
          description?: string | null
          id?: string
          max_income?: number | null
          min_income?: number
          rate?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      termination_requests: {
        Row: {
          actual_last_working_date: string | null
          approved_by: string | null
          approved_date: string | null
          asset_return_required: boolean | null
          benefits_continuation: boolean | null
          business_justification: string | null
          created_at: string | null
          employee_id: string | null
          exit_interview_date: string | null
          exit_interview_required: boolean | null
          garden_leave: boolean | null
          hr_notes: string | null
          id: string
          is_resignation: boolean | null
          knowledge_transfer_plan: string | null
          non_compete_applicable: boolean | null
          notice_period_days: number | null
          processed_date: string | null
          proposed_last_working_date: string
          rejection_reason: string | null
          replacement_plan: string | null
          request_number: string
          requested_by: string | null
          resignation_letter_url: string | null
          severance_amount: number | null
          severance_applicable: boolean | null
          status: string | null
          termination_reason: string | null
          termination_type: string
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          actual_last_working_date?: string | null
          approved_by?: string | null
          approved_date?: string | null
          asset_return_required?: boolean | null
          benefits_continuation?: boolean | null
          business_justification?: string | null
          created_at?: string | null
          employee_id?: string | null
          exit_interview_date?: string | null
          exit_interview_required?: boolean | null
          garden_leave?: boolean | null
          hr_notes?: string | null
          id?: string
          is_resignation?: boolean | null
          knowledge_transfer_plan?: string | null
          non_compete_applicable?: boolean | null
          notice_period_days?: number | null
          processed_date?: string | null
          proposed_last_working_date: string
          rejection_reason?: string | null
          replacement_plan?: string | null
          request_number: string
          requested_by?: string | null
          resignation_letter_url?: string | null
          severance_amount?: number | null
          severance_applicable?: boolean | null
          status?: string | null
          termination_reason?: string | null
          termination_type: string
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          actual_last_working_date?: string | null
          approved_by?: string | null
          approved_date?: string | null
          asset_return_required?: boolean | null
          benefits_continuation?: boolean | null
          business_justification?: string | null
          created_at?: string | null
          employee_id?: string | null
          exit_interview_date?: string | null
          exit_interview_required?: boolean | null
          garden_leave?: boolean | null
          hr_notes?: string | null
          id?: string
          is_resignation?: boolean | null
          knowledge_transfer_plan?: string | null
          non_compete_applicable?: boolean | null
          notice_period_days?: number | null
          processed_date?: string | null
          proposed_last_working_date?: string
          rejection_reason?: string | null
          replacement_plan?: string | null
          request_number?: string
          requested_by?: string | null
          resignation_letter_url?: string | null
          severance_amount?: number | null
          severance_applicable?: boolean | null
          status?: string | null
          termination_reason?: string | null
          termination_type?: string
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: []
      }
      time_tracking_methods: {
        Row: {
          allows_remote_clock_in: boolean | null
          auto_clock_out: boolean | null
          auto_clock_out_after_hours: number | null
          cost_per_device: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          device_requirements: Json | null
          geofence_enabled: boolean | null
          geofence_locations: Json | null
          geofence_radius_meters: number | null
          grace_period_minutes: number | null
          id: string
          ip_restrictions: Json | null
          is_active: boolean | null
          is_default: boolean | null
          method_code: string
          method_name: string
          monthly_cost: number | null
          requires_device: boolean | null
          requires_location: boolean | null
          requires_photo: boolean | null
          tracking_type: string
          updated_at: string | null
        }
        Insert: {
          allows_remote_clock_in?: boolean | null
          auto_clock_out?: boolean | null
          auto_clock_out_after_hours?: number | null
          cost_per_device?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          device_requirements?: Json | null
          geofence_enabled?: boolean | null
          geofence_locations?: Json | null
          geofence_radius_meters?: number | null
          grace_period_minutes?: number | null
          id?: string
          ip_restrictions?: Json | null
          is_active?: boolean | null
          is_default?: boolean | null
          method_code: string
          method_name: string
          monthly_cost?: number | null
          requires_device?: boolean | null
          requires_location?: boolean | null
          requires_photo?: boolean | null
          tracking_type: string
          updated_at?: string | null
        }
        Update: {
          allows_remote_clock_in?: boolean | null
          auto_clock_out?: boolean | null
          auto_clock_out_after_hours?: number | null
          cost_per_device?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          device_requirements?: Json | null
          geofence_enabled?: boolean | null
          geofence_locations?: Json | null
          geofence_radius_meters?: number | null
          grace_period_minutes?: number | null
          id?: string
          ip_restrictions?: Json | null
          is_active?: boolean | null
          is_default?: boolean | null
          method_code?: string
          method_name?: string
          monthly_cost?: number | null
          requires_device?: boolean | null
          requires_location?: boolean | null
          requires_photo?: boolean | null
          tracking_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_tracking_methods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_methods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_request_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          recipient_user_id: string
          request_id: string | null
          request_number: string | null
          requester_name: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          recipient_user_id: string
          request_id?: string | null
          request_number?: string | null
          requester_name?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          recipient_user_id?: string
          request_id?: string | null
          request_number?: string | null
          requester_name?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_request_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "travel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_requests: {
        Row: {
          accommodation_required: boolean | null
          approved_by: string | null
          approved_date: string | null
          budget_code: string | null
          business_justification: string
          cost_center: string | null
          country: string
          created_at: string | null
          currency: string | null
          destination: string
          documents: string[] | null
          duration: number
          employee_id: string | null
          end_date: string
          estimated_cost: number
          id: string
          purpose: string
          rejection_reason: string | null
          request_number: string
          start_date: string
          status: string | null
          transport_mode: string | null
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          accommodation_required?: boolean | null
          approved_by?: string | null
          approved_date?: string | null
          budget_code?: string | null
          business_justification: string
          cost_center?: string | null
          country: string
          created_at?: string | null
          currency?: string | null
          destination: string
          documents?: string[] | null
          duration: number
          employee_id?: string | null
          end_date: string
          estimated_cost: number
          id?: string
          purpose: string
          rejection_reason?: string | null
          request_number: string
          start_date: string
          status?: string | null
          transport_mode?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          accommodation_required?: boolean | null
          approved_by?: string | null
          approved_date?: string | null
          budget_code?: string | null
          business_justification?: string
          cost_center?: string | null
          country?: string
          created_at?: string | null
          currency?: string | null
          destination?: string
          documents?: string[] | null
          duration?: number
          employee_id?: string | null
          end_date?: string
          estimated_cost?: number
          id?: string
          purpose?: string
          rejection_reason?: string | null
          request_number?: string
          start_date?: string
          status?: string | null
          transport_mode?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: []
      }
      two_factor_auth: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          enabled: boolean | null
          id: string
          method: string
          phone_number: string | null
          secret_key: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          method: string
          phone_number?: string | null
          secret_key?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          method?: string
          phone_number?: string | null
          secret_key?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_password_metadata: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          failed_attempts: number | null
          force_change_on_next_login: boolean | null
          id: string
          last_changed_at: string | null
          locked_until: string | null
          strength: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          failed_attempts?: number | null
          force_change_on_next_login?: boolean | null
          id?: string
          last_changed_at?: string | null
          locked_until?: string | null
          strength?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          failed_attempts?: number | null
          force_change_on_next_login?: boolean | null
          id?: string
          last_changed_at?: string | null
          locked_until?: string | null
          strength?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      vacancies: {
        Row: {
          closing_date: string | null
          created_at: string | null
          department_id: string | null
          description: string | null
          hiring_manager_id: string | null
          id: string
          job_title_id: string | null
          num_positions: number | null
          published_date: string | null
          requirements: string | null
          status: Database["public"]["Enums"]["vacancy_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          closing_date?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          hiring_manager_id?: string | null
          id?: string
          job_title_id?: string | null
          num_positions?: number | null
          published_date?: string | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["vacancy_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          closing_date?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          hiring_manager_id?: string | null
          id?: string
          job_title_id?: string | null
          num_positions?: number | null
          published_date?: string | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["vacancy_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacancies_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          schedule_code: string
          schedule_name: string
          schedule_type: string
          timezone: string | null
          updated_at: string | null
          weekly_hours: number
          work_days: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_from: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          schedule_code: string
          schedule_name: string
          schedule_type: string
          timezone?: string | null
          updated_at?: string | null
          weekly_hours?: number
          work_days?: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          schedule_code?: string
          schedule_name?: string
          schedule_type?: string
          timezone?: string | null
          updated_at?: string | null
          weekly_hours?: number
          work_days?: Json
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_configs: {
        Row: {
          approval_steps: Json
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          notification_table: string
          notify_on_decision: Json
          notify_on_submit: Json
          request_type: string
          updated_at: string
        }
        Insert: {
          approval_steps?: Json
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          notification_table: string
          notify_on_decision?: Json
          notify_on_submit?: Json
          request_type: string
          updated_at?: string
        }
        Update: {
          approval_steps?: Json
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          notification_table?: string
          notify_on_decision?: Json
          notify_on_submit?: Json
          request_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_requests: {
        Row: {
          amount: number | null
          business_justification: string | null
          completed_date: string | null
          created_at: string | null
          currency: string | null
          current_level: number | null
          department: string | null
          employee_id: string | null
          employee_name: string
          id: string
          metadata: Json | null
          priority: string | null
          request_id: string
          request_type: string
          status: string | null
          submitted_date: string | null
          total_levels: number
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          business_justification?: string | null
          completed_date?: string | null
          created_at?: string | null
          currency?: string | null
          current_level?: number | null
          department?: string | null
          employee_id?: string | null
          employee_name: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          request_id: string
          request_type: string
          status?: string | null
          submitted_date?: string | null
          total_levels: number
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          business_justification?: string | null
          completed_date?: string | null
          created_at?: string | null
          currency?: string | null
          current_level?: number | null
          department?: string | null
          employee_id?: string | null
          employee_name?: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          request_id?: string
          request_type?: string
          status?: string | null
          submitted_date?: string | null
          total_levels?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_steps: {
        Row: {
          action_date: string | null
          approver_employee_id: string | null
          approver_name: string | null
          approver_role: string
          comments: string | null
          conditions: Json | null
          created_at: string | null
          id: string
          is_current_level: boolean | null
          level: number
          status: string | null
          updated_at: string | null
          workflow_id: string | null
        }
        Insert: {
          action_date?: string | null
          approver_employee_id?: string | null
          approver_name?: string | null
          approver_role: string
          comments?: string | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_current_level?: boolean | null
          level: number
          status?: string | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          action_date?: string | null
          approver_employee_id?: string | null
          approver_name?: string | null
          approver_role?: string
          comments?: string | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_current_level?: boolean | null
          level?: number
          status?: string | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          conditions: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          request_type: string
          steps: Json
          updated_at: string | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          request_type: string
          steps: Json
          updated_at?: string | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          request_type?: string
          steps?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      board_members: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          department_id: string | null
          department_name: string | null
          email: string | null
          employee_id: string | null
          employment_type_id: string | null
          employment_type_name: string | null
          first_name: string | null
          hire_date: string | null
          id: string | null
          job_title: string | null
          job_title_id: string | null
          last_name: string | null
          location_id: string | null
          manager_id: string | null
          phone: string | null
          remote_location: string | null
          status: Database["public"]["Enums"]["employee_status"] | null
          updated_at: string | null
          work_location_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_employment_type_id_fkey"
            columns: ["employment_type_id"]
            isOneToOne: false
            referencedRelation: "employment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      company_structure_hierarchy: {
        Row: {
          code: string | null
          depth: number | null
          description: string | null
          id: string | null
          level: number | null
          location_id: string | null
          manager_id: string | null
          name: string | null
          parent_id: string | null
          path: string[] | null
          root_name: string | null
          status: string | null
          structure_type: string | null
        }
        Relationships: []
      }
      department_hierarchy: {
        Row: {
          depth: number | null
          description: string | null
          id: string | null
          location_id: string | null
          name: string | null
          parent_department_id: string | null
          path: string[] | null
          root_name: string | null
        }
        Relationships: []
      }
      intl_operations_summary: {
        Row: {
          active_programs: number | null
          address: string | null
          annual_budget: number | null
          beneficiary_count: number | null
          city: string | null
          company_structure_id: string | null
          contact_person: string | null
          country: string | null
          country_code: string | null
          country_director_id: string | null
          created_at: string | null
          currency: string | null
          director_name: string | null
          email: string | null
          employee_count: number | null
          established_date: string | null
          expat_staff_count: number | null
          funding_sources: string[] | null
          government_partnerships: string[] | null
          id: string | null
          legal_entity_name: string | null
          local_partners: string[] | null
          local_staff_count: number | null
          location_id: string | null
          location_name: string | null
          notes: string | null
          office_name: string | null
          official_languages: string[] | null
          operation_type: string | null
          phone: string | null
          program_areas: string[] | null
          region: string | null
          registration_authority: string | null
          registration_date: string | null
          registration_number: string | null
          status: string | null
          structure_name: string | null
          tax_id: string | null
          timezone: string | null
          updated_at: string | null
          working_languages: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "international_operations_company_structure_id_fkey"
            columns: ["company_structure_id"]
            isOneToOne: false
            referencedRelation: "company_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "international_operations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "international_operations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      locations_with_details: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          code: string | null
          company_structure_id: string | null
          conference_room_count: number | null
          country: string | null
          created_at: string | null
          current_employee_count: number | null
          email: string | null
          employee_capacity: number | null
          established_date: string | null
          fax: string | null
          has_cafeteria: boolean | null
          has_conference_rooms: boolean | null
          has_gym: boolean | null
          has_medical_room: boolean | null
          has_parking: boolean | null
          id: string | null
          is_headquarters: boolean | null
          latitude: number | null
          lease_expiry_date: string | null
          location_type: string | null
          longitude: number | null
          manager_email: string | null
          manager_id: string | null
          manager_name: string | null
          monthly_rent: number | null
          name: string | null
          notes: string | null
          operational_hours: string | null
          parent_location_id: string | null
          parking_spaces: number | null
          phone: string | null
          postal_code: string | null
          square_footage: number | null
          state_province: string | null
          status: string | null
          structure_name: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_company_structure_id_fkey"
            columns: ["company_structure_id"]
            isOneToOne: false
            referencedRelation: "company_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "locations_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      attendance_status: "present" | "absent" | "late" | "half_day" | "on_leave"
      candidate_status:
        | "application_initiated"
        | "shortlisted"
        | "interview_scheduled"
        | "hired"
        | "rejected"
      employee_status: "active" | "inactive" | "terminated"
      goal_priority: "low" | "medium" | "high"
      goal_status: "not_started" | "in_progress" | "achieved" | "cancelled"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      review_status: "draft" | "pending" | "in_progress" | "completed"
      user_role: "admin" | "hr" | "manager" | "employee" | "board_member" | "ed"
      vacancy_status: "open" | "closed" | "on_hold" | "filled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_status: ["present", "absent", "late", "half_day", "on_leave"],
      candidate_status: [
        "application_initiated",
        "shortlisted",
        "interview_scheduled",
        "hired",
        "rejected",
      ],
      employee_status: ["active", "inactive", "terminated"],
      goal_priority: ["low", "medium", "high"],
      goal_status: ["not_started", "in_progress", "achieved", "cancelled"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      review_status: ["draft", "pending", "in_progress", "completed"],
      user_role: ["admin", "hr", "manager", "employee", "board_member", "ed"],
      vacancy_status: ["open", "closed", "on_hold", "filled"],
    },
  },
} as const
