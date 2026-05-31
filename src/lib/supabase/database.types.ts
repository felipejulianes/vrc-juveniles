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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          player_id: string
          present: boolean
          session_id: string
        }
        Insert: {
          player_id: string
          present?: boolean
          session_id: string
        }
        Update: {
          player_id?: string
          present?: boolean
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "attendance_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "attendance_records_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          active: boolean
          created_at: string
          driver_name: string | null
          driver_phone: string | null
          id: string
          label: string
          patente: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          label: string
          patente?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          label?: string
          patente?: string | null
        }
        Relationships: []
      }
      club_venues: {
        Row: {
          address: string | null
          club_id: string
          created_at: string
          id: string
          is_default: boolean
          lat: number | null
          lng: number | null
          maps_url: string | null
          name: string
        }
        Insert: {
          address?: string | null
          club_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          lat?: number | null
          lng?: number | null
          maps_url?: string | null
          name: string
        }
        Update: {
          address?: string | null
          club_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          lat?: number | null
          lng?: number | null
          maps_url?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_venues_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "opponent_clubs"
            referencedColumns: ["id"]
          },
        ]
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
        Update: {
          coach_id?: string
          division_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_divisions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_divisions_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      division_activities: {
        Row: {
          activity_date: string
          activity_type: string
          bus_id: string | null
          created_at: string
          created_by: string | null
          division_id: string
          id: string
          location_club_id: string | null
          location_notes: string | null
          location_venue_id: string | null
          opponent_club_id: string | null
          opponent_club_ids: string[] | null
          venue: string | null
        }
        Insert: {
          activity_date: string
          activity_type: string
          bus_id?: string | null
          created_at?: string
          created_by?: string | null
          division_id: string
          id?: string
          location_club_id?: string | null
          location_notes?: string | null
          location_venue_id?: string | null
          opponent_club_id?: string | null
          opponent_club_ids?: string[] | null
          venue?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: string
          bus_id?: string | null
          created_at?: string
          created_by?: string | null
          division_id?: string
          id?: string
          location_club_id?: string | null
          location_notes?: string | null
          location_venue_id?: string | null
          opponent_club_id?: string | null
          opponent_club_ids?: string[] | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "division_activities_bus_id_new_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "division_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "division_activities_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "division_activities_location_club_id_fkey"
            columns: ["location_club_id"]
            isOneToOne: false
            referencedRelation: "opponent_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "division_activities_location_venue_id_fkey"
            columns: ["location_venue_id"]
            isOneToOne: false
            referencedRelation: "club_venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "division_activities_opponent_club_id_fkey"
            columns: ["opponent_club_id"]
            isOneToOne: false
            referencedRelation: "opponent_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_juvenile: boolean
          max_age: number | null
          min_age: number | null
          name: string
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_juvenile?: boolean
          max_age?: number | null
          min_age?: number | null
          name: string
          sort_order: number
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_juvenile?: boolean
          max_age?: number | null
          min_age?: number | null
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      donantes: {
        Row: {
          amount: number
          camada: string | null
          categoria: string | null
          created_at: string | null
          email: string
          id: string
          jugador_direccion: string | null
          jugador_dni: string | null
          jugador_email: string | null
          jugador_fecha_nac: string | null
          jugador_nombre: string | null
          jugador_telefono: string | null
          mp_subscription_id: string | null
          name: string
          origen: string | null
          padre_direccion: string | null
          padre_dni: string | null
          padre_email: string | null
          padre_fecha_nac: string | null
          padre_nombre: string | null
          padre_telefono: string | null
          phone: string
          status: string | null
          who_told_you: string | null
        }
        Insert: {
          amount: number
          camada?: string | null
          categoria?: string | null
          created_at?: string | null
          email: string
          id?: string
          jugador_direccion?: string | null
          jugador_dni?: string | null
          jugador_email?: string | null
          jugador_fecha_nac?: string | null
          jugador_nombre?: string | null
          jugador_telefono?: string | null
          mp_subscription_id?: string | null
          name: string
          origen?: string | null
          padre_direccion?: string | null
          padre_dni?: string | null
          padre_email?: string | null
          padre_fecha_nac?: string | null
          padre_nombre?: string | null
          padre_telefono?: string | null
          phone: string
          status?: string | null
          who_told_you?: string | null
        }
        Update: {
          amount?: number
          camada?: string | null
          categoria?: string | null
          created_at?: string | null
          email?: string
          id?: string
          jugador_direccion?: string | null
          jugador_dni?: string | null
          jugador_email?: string | null
          jugador_fecha_nac?: string | null
          jugador_nombre?: string | null
          jugador_telefono?: string | null
          mp_subscription_id?: string | null
          name?: string
          origen?: string | null
          padre_direccion?: string | null
          padre_dni?: string | null
          padre_email?: string | null
          padre_fecha_nac?: string | null
          padre_nombre?: string | null
          padre_telefono?: string | null
          phone?: string
          status?: string | null
          who_told_you?: string | null
        }
        Relationships: []
      }
      match_scoring_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          match_id: string
          player_id: string | null
          rival_scorer: string | null
          team: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          match_id: string
          player_id?: string | null
          rival_scorer?: string | null
          team: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          match_id?: string
          player_id?: string | null
          rival_scorer?: string | null
          team?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_scoring_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scoring_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "attendance_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_scoring_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          created_by: string | null
          division_id: string
          fecha_nro: number | null
          home_away: string
          id: string
          manual: boolean
          match_date: string
          match_time: string | null
          rival: string
          score_away: number | null
          score_home: number | null
          subequipo: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          division_id: string
          fecha_nro?: number | null
          home_away: string
          id?: string
          manual?: boolean
          match_date: string
          match_time?: string | null
          rival: string
          score_away?: number | null
          score_home?: number | null
          subequipo?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          division_id?: string
          fecha_nro?: number | null
          home_away?: string
          id?: string
          manual?: boolean
          match_date?: string
          match_time?: string | null
          rival?: string
          score_away?: number | null
          score_home?: number | null
          subequipo?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      opponent_clubs: {
        Row: {
          active: boolean
          coordinator_name: string | null
          coordinator_notes: string | null
          coordinator_phone: string | null
          created_at: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          coordinator_name?: string | null
          coordinator_notes?: string | null
          coordinator_phone?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          coordinator_name?: string | null
          coordinator_notes?: string | null
          coordinator_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      player_documents: {
        Row: {
          doc_type: string
          id: string
          player_id: string
          received_at: string
          received_by: string | null
        }
        Insert: {
          doc_type: string
          id?: string
          player_id: string
          received_at?: string
          received_by?: string | null
        }
        Update: {
          doc_type?: string
          id?: string
          player_id?: string
          received_at?: string
          received_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_documents_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "attendance_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_documents_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_documents_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_followups: {
        Row: {
          contact_date: string
          contact_type: string
          created_at: string
          created_by: string | null
          id: string
          notes: string
          player_id: string
        }
        Insert: {
          contact_date?: string
          contact_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes: string
          player_id: string
        }
        Update: {
          contact_date?: string
          contact_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_followups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_followups_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "attendance_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_followups_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_interviews: {
        Row: {
          colegio_snapshot: string | null
          created_at: string
          grado: string | null
          id: string
          interview_date: string
          interviewer_id: string | null
          notas: string
          player_id: string
        }
        Insert: {
          colegio_snapshot?: string | null
          created_at?: string
          grado?: string | null
          id?: string
          interview_date?: string
          interviewer_id?: string | null
          notas: string
          player_id: string
        }
        Update: {
          colegio_snapshot?: string | null
          created_at?: string
          grado?: string | null
          id?: string
          interview_date?: string
          interviewer_id?: string | null
          notas?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_interviews_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "attendance_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_interviews_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          note_date: string
          player_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          note_date?: string
          player_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note_date?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_notes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "attendance_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_notes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_positions: {
        Row: {
          notes: string | null
          player_id: string
          position_alt1: number | null
          position_alt2: number | null
          position_primary: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          notes?: string | null
          player_id: string
          position_alt1?: number | null
          position_alt2?: number | null
          position_primary?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          notes?: string | null
          player_id?: string
          position_alt1?: number | null
          position_alt2?: number | null
          position_primary?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_positions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "attendance_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_positions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_positions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          active: boolean
          address: string | null
          apto_medico: boolean
          birth_date: string | null
          colegio: string | null
          como_conocio: string | null
          created_at: string | null
          division_id: string | null
          dni: string | null
          fecha_alta: string
          first_name: string
          grado: string | null
          id: string
          inactivo: boolean
          last_name: string
          lat: number | null
          lng: number | null
          maps_url: string | null
          parent_name: string | null
          parent_name_2: string | null
          parent_phone: string | null
          parent_phone_2: string | null
          photo_url: string | null
          school_id: string | null
          sobrenombre: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          apto_medico?: boolean
          birth_date?: string | null
          colegio?: string | null
          como_conocio?: string | null
          created_at?: string | null
          division_id?: string | null
          dni?: string | null
          fecha_alta?: string
          first_name: string
          grado?: string | null
          id?: string
          inactivo?: boolean
          last_name: string
          lat?: number | null
          lng?: number | null
          maps_url?: string | null
          parent_name?: string | null
          parent_name_2?: string | null
          parent_phone?: string | null
          parent_phone_2?: string | null
          photo_url?: string | null
          school_id?: string | null
          sobrenombre?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          apto_medico?: boolean
          birth_date?: string | null
          colegio?: string | null
          como_conocio?: string | null
          created_at?: string | null
          division_id?: string | null
          dni?: string | null
          fecha_alta?: string
          first_name?: string
          grado?: string | null
          id?: string
          inactivo?: boolean
          last_name?: string
          lat?: number | null
          lng?: number | null
          maps_url?: string | null
          parent_name?: string | null
          parent_name_2?: string | null
          parent_phone?: string | null
          parent_phone_2?: string | null
          photo_url?: string | null
          school_id?: string | null
          sobrenombre?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          role: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      school_visits: {
        Row: {
          created_at: string
          created_by: string | null
          division_ids: string[] | null
          id: string
          notas: string | null
          school_id: string
          status: string
          visit_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          division_ids?: string[] | null
          id?: string
          notas?: string | null
          school_id: string
          status?: string
          visit_date: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          division_ids?: string[] | null
          id?: string
          notas?: string | null
          school_id?: string
          status?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_visits_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          active: boolean
          address: string | null
          aliases: string | null
          created_at: string | null
          id: string
          lat: number | null
          lng: number | null
          maps_url: string | null
          name: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          aliases?: string | null
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          maps_url?: string | null
          name: string
        }
        Update: {
          active?: boolean
          address?: string | null
          aliases?: string | null
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          maps_url?: string | null
          name?: string
        }
        Relationships: []
      }
      tercer_tiempo_reports: {
        Row: {
          activity_date: string
          coach_declared_coaches: number | null
          coach_declared_kids: number | null
          division_id: string
          id: string
          local_coaches_count: number | null
          local_kids_count: number | null
          notes: string | null
          reported_by: string | null
          tercer_tiempo_time: string | null
          updated_at: string
          visitor_club_id: string | null
          visitor_coaches_count: number | null
          visitor_kids_count: number | null
        }
        Insert: {
          activity_date: string
          coach_declared_coaches?: number | null
          coach_declared_kids?: number | null
          division_id: string
          id?: string
          local_coaches_count?: number | null
          local_kids_count?: number | null
          notes?: string | null
          reported_by?: string | null
          tercer_tiempo_time?: string | null
          updated_at?: string
          visitor_club_id?: string | null
          visitor_coaches_count?: number | null
          visitor_kids_count?: number | null
        }
        Update: {
          activity_date?: string
          coach_declared_coaches?: number | null
          coach_declared_kids?: number | null
          division_id?: string
          id?: string
          local_coaches_count?: number | null
          local_kids_count?: number | null
          notes?: string | null
          reported_by?: string | null
          tercer_tiempo_time?: string | null
          updated_at?: string
          visitor_club_id?: string | null
          visitor_coaches_count?: number | null
          visitor_kids_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tercer_tiempo_reports_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tercer_tiempo_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tercer_tiempo_reports_visitor_club_id_fkey"
            columns: ["visitor_club_id"]
            isOneToOne: false
            referencedRelation: "opponent_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      tercer_tiempo_visitors: {
        Row: {
          activity_date: string
          club_id: string | null
          coaches_count: number | null
          created_at: string | null
          division_id: string
          id: string
          kids_count: number | null
        }
        Insert: {
          activity_date: string
          club_id?: string | null
          coaches_count?: number | null
          created_at?: string | null
          division_id: string
          id?: string
          kids_count?: number | null
        }
        Update: {
          activity_date?: string
          club_id?: string | null
          coaches_count?: number | null
          created_at?: string | null
          division_id?: string
          id?: string
          kids_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tercer_tiempo_visitors_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "opponent_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tercer_tiempo_visitors_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          created_at: string | null
          created_by: string | null
          division_id: string
          id: string
          notes: string | null
          session_date: string
          session_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          division_id: string
          id?: string
          notes?: string | null
          session_date: string
          session_type?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          division_id?: string
          id?: string
          notes?: string | null
          session_date?: string
          session_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_pages: {
        Row: {
          category: string
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          published: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          published?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          published?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wiki_pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      attendance_stats: {
        Row: {
          attendance_pct: number | null
          division_id: string | null
          first_name: string | null
          last_name: string | null
          parent_name: string | null
          parent_phone: string | null
          photo_url: string | null
          player_id: string | null
          sessions_present: number | null
          total_sessions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      coach_has_division: { Args: { div_id: string }; Returns: boolean }
      execute_annual_progression: { Args: never; Returns: Json }
      get_attendance_stats_days: {
        Args: {
          p_days?: number
          p_division_id: string
          p_session_type?: string
        }
        Returns: {
          attendance_pct: number
          first_name: string
          last_name: string
          parent_name: string
          parent_phone: string
          photo_url: string
          player_id: string
          sessions_present: number
          total_sessions: number
        }[]
      }
      get_attendance_stats_sessions:
        | {
            Args: { p_division_id: string; p_sessions?: number }
            Returns: {
              attendance_pct: number
              first_name: string
              last_name: string
              parent_name: string
              parent_phone: string
              photo_url: string
              player_id: string
              sessions_present: number
              total_sessions: number
            }[]
          }
        | {
            Args: {
              p_division_id: string
              p_session_type?: string
              p_sessions?: number
            }
            Returns: {
              attendance_pct: number
              first_name: string
              last_name: string
              parent_name: string
              parent_phone: string
              photo_url: string
              player_id: string
              sessions_present: number
              total_sessions: number
            }[]
          }
      get_attendance_stats_since_alta: {
        Args: { p_division_id: string; p_session_type?: string }
        Returns: {
          attendance_pct: number
          first_name: string
          last_name: string
          parent_name: string
          parent_phone: string
          photo_url: string
          player_id: string
          sessions_present: number
          total_sessions: number
        }[]
      }
      get_attendance_stats_year: {
        Args: {
          p_division_id: string
          p_session_type?: string
          p_year?: number
        }
        Returns: {
          attendance_pct: number
          first_name: string
          last_name: string
          parent_name: string
          parent_phone: string
          photo_url: string
          player_id: string
          sessions_present: number
          total_sessions: number
        }[]
      }
      get_user_role: { Args: never; Returns: string }
      preview_annual_progression: {
        Args: never
        Returns: {
          current_division: string
          next_division: string
          player_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
