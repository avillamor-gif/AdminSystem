export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// NOTE: This is a stub file. Run `npm run db:types` to regenerate with full types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Database {
  public: {
    Tables: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: { Row: any; Insert: any; Update: any; Relationships: any[] }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Views: { [key: string]: { Row: any } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Functions: { [key: string]: any }
    Enums: { [key: string]: string }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CompositeTypes: { [key: string]: any }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tables<T extends keyof Database['public']['Tables']> = any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TablesInsert<T extends keyof Database['public']['Tables']> = any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TablesUpdate<T extends keyof Database['public']['Tables']> = any
