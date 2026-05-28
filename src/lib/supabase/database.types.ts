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
      players: {
        Row: {
          id: string
          division_id: string
          first_name: string
          last_name: string
          dni: string | null
          birth_date: string | null
          photo_url: string | null
          inactivo: boolean
          active: boolean
          parent_name: string | null
          parent_phone: string | null
          parent_name_2: string | null
          parent_phone_2: string | null
          sobrenombre: string | null
          fecha_alta: string | null
          colegio: string | null
          school_id: string | null
          grado: string | null
          address: string | null
          lat: number | null
          lng: number | null
          maps_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          division_id: string
          first_name: string
          last_name: string
          dni?: string | null
          birth_date?: string | null
          photo_url?: string | null
          inactivo?: boolean
          active?: boolean
          parent_name?: string | null
          parent_phone?: string | null
          parent_name_2?: string | null
          parent_phone_2?: string | null
          sobrenombre?: string | null
          fecha_alta?: string | null
          colegio?: string | null
          school_id?: string | null
          grado?: string | null
          address?: string | null
        }
        Update: Partial<{
          division_id: string
          first_name: string
          last_name: string
          dni: string | null
          birth_date: string | null
          photo_url: string | null
          inactivo: boolean
          active: boolean
          parent_name: string | null
          parent_phone: string | null
          parent_name_2: string | null
          parent_phone_2: string | null
          sobrenombre: string | null
          fecha_alta: string | null
          colegio: string | null
          school_id: string | null
          grado: string | null
          address: string | null
        }>
      }
      player_notes: {
        Row: {
          id: string
          player_id: string
          note_date: string | null
          content: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          player_id: string
          content: string
          note_date?: string | null
          created_by?: string | null
        }
        Update: Partial<{
          content: string
          note_date: string | null
        }>
      }
      training_sessions: {
        Row: {
          id: string
          division_id: string
          session_date: string
          session_type: string
          day_label: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          division_id: string
          session_date: string
          session_type: string
          day_label?: string | null
          created_by?: string | null
        }
        Update: Partial<{
          session_date: string
          day_label: string | null
          session_type: string
        }>
      }
      attendance_records: {
        Row: {
          session_id: string
          player_id: string
          present: boolean
          recorded_by: string | null
          recorded_at: string
        }
        Insert: {
          session_id: string
          player_id: string
          present: boolean
          recorded_by?: string | null
        }
        Update: Partial<{
          present: boolean
          recorded_by: string | null
        }>
      }
    }
  }
}
