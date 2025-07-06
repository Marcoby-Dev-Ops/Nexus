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
      [key: string]: {
        Row: { [key: string]: unknown }
        Insert: { [key: string]: unknown }
        Update: { [key: string]: unknown }
      }
    }
  }
}
