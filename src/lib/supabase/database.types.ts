export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// NOTE: This is a stub file. Run `npm run db:types` to regenerate with full types.
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Database {
  public: {
    Tables: Record<string, { Row: any; Insert: any; Update: any; Relationships: any[] }>
    Views: Record<string, { Row: any }>
    Functions: Record<string, any>
    Enums: Record<string, string>
    CompositeTypes: Record<string, any>
  }
}

export type Tables<T extends string = string> = any
export type TablesInsert<T extends string = string> = any
export type TablesUpdate<T extends string = string> = any
