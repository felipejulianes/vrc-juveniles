export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'admin' | 'coach' | 'tutora'
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: 'admin' | 'coach' | 'tutora'
        }
        Update: Partial<{
          full_name: string | null
          role: 'admin' | 'coach' | 'tutora'
        }>
      }
      divisions: {
        Row: {
          id: string
          name: string
          is_juvenile: boolean
        }
        Insert: never
        Update: never
      }
      coach_divisions: {
        Row: {
          coach_id: string
          division_id: string
        }
        Insert: {
          coach_id: string
          division_id: string
        }
        Update: never
      }
      player_positions: {
        Row: {
          player_id: string
          position_primary: number | null
          position_alt1: number | null
          position_alt2: number | null
          notes: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          player_id: string
          position_primary?: number | null
          position_alt1?: number | null
          position_alt2?: number | null
          notes?: string | null
          updated_by?: string | null
        }
        Update: Partial<{
          position_primary: number | null
          position_alt1: number | null
          position_alt2: number | null
          notes: string | null
          updated_by: string | null
        }>
      }
    }
  }
}
