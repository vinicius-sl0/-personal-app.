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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anamneses: {
        Row: {
          answers: Json
          conditions: string | null
          created_at: string
          filled_by: string | null
          id: string
          injuries: string | null
          medications: string | null
          parq_has_alert: boolean
          signed_at: string | null
          student_id: string
          updated_at: string
          version: number
        }
        Insert: {
          answers?: Json
          conditions?: string | null
          created_at?: string
          filled_by?: string | null
          id?: string
          injuries?: string | null
          medications?: string | null
          parq_has_alert?: boolean
          signed_at?: string | null
          student_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          answers?: Json
          conditions?: string | null
          created_at?: string
          filled_by?: string | null
          id?: string
          injuries?: string | null
          medications?: string | null
          parq_has_alert?: boolean
          signed_at?: string | null
          student_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "anamneses_filled_by_fkey"
            columns: ["filled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamneses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_metrics: {
        Row: {
          category: Database["public"]["Enums"]["metric_category"]
          created_at: string
          decimals: number
          formula_key: string | null
          id: string
          is_active: boolean
          is_calculated: boolean
          key: string
          label: string
          max_value: number | null
          min_value: number | null
          owner_id: string | null
          sort_order: number
          unit: string | null
          updated_at: string
          value_type: Database["public"]["Enums"]["metric_value_type"]
        }
        Insert: {
          category?: Database["public"]["Enums"]["metric_category"]
          created_at?: string
          decimals?: number
          formula_key?: string | null
          id?: string
          is_active?: boolean
          is_calculated?: boolean
          key: string
          label: string
          max_value?: number | null
          min_value?: number | null
          owner_id?: string | null
          sort_order?: number
          unit?: string | null
          updated_at?: string
          value_type?: Database["public"]["Enums"]["metric_value_type"]
        }
        Update: {
          category?: Database["public"]["Enums"]["metric_category"]
          created_at?: string
          decimals?: number
          formula_key?: string | null
          id?: string
          is_active?: boolean
          is_calculated?: boolean
          key?: string
          label?: string
          max_value?: number | null
          min_value?: number | null
          owner_id?: string | null
          sort_order?: number
          unit?: string | null
          updated_at?: string
          value_type?: Database["public"]["Enums"]["metric_value_type"]
        }
        Relationships: [
          {
            foreignKeyName: "assessment_metrics_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_protocol_metrics: {
        Row: {
          metric_id: string
          position: number
          protocol_id: string
          required: boolean
        }
        Insert: {
          metric_id: string
          position?: number
          protocol_id: string
          required?: boolean
        }
        Update: {
          metric_id?: string
          position?: number
          protocol_id?: string
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "assessment_protocol_metrics_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "assessment_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_protocol_metrics_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "v_student_metric_series"
            referencedColumns: ["metric_id"]
          },
          {
            foreignKeyName: "assessment_protocol_metrics_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "assessment_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_protocols: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_protocols_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_values: {
        Row: {
          assessment_id: string
          created_at: string
          metric_id: string
          updated_at: string
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string
          metric_id: string
          updated_at?: string
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string
          metric_id?: string
          updated_at?: string
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_values_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_values_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "v_student_metric_series"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "assessment_values_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "assessment_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_values_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "v_student_metric_series"
            referencedColumns: ["metric_id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessed_at: string
          created_at: string
          device: string | null
          id: string
          method: string | null
          notes: string | null
          personal_id: string
          protocol_id: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          assessed_at?: string
          created_at?: string
          device?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          personal_id: string
          protocol_id?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          assessed_at?: string
          created_at?: string
          device?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          personal_id?: string
          protocol_id?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "assessment_protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: number
          ip: unknown
          metadata: Json
          personal_id: string | null
          student_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: never
          ip?: unknown
          metadata?: Json
          personal_id?: string | null
          student_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: never
          ip?: unknown
          metadata?: Json
          personal_id?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      consents: {
        Row: {
          accepted_at: string
          created_at: string
          id: string
          ip: unknown
          revoked_at: string | null
          student_id: string | null
          type: Database["public"]["Enums"]["consent_type"]
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          id?: string
          ip?: unknown
          revoked_at?: string | null
          student_id?: string | null
          type: Database["public"]["Enums"]["consent_type"]
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          created_at?: string
          id?: string
          ip?: unknown
          revoked_at?: string | null
          student_id?: string | null
          type?: Database["public"]["Enums"]["consent_type"]
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_reads: {
        Row: {
          conversation_id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          personal_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          personal_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          personal_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      exercise_media: {
        Row: {
          created_at: string
          duration_seconds: number | null
          exercise_id: string
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          position: number
          source: Database["public"]["Enums"]["media_source"]
          storage_path: string | null
          thumbnail_path: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          exercise_id: string
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          position?: number
          source: Database["public"]["Enums"]["media_source"]
          storage_path?: string | null
          thumbnail_path?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          exercise_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          position?: number
          source?: Database["public"]["Enums"]["media_source"]
          storage_path?: string | null
          thumbnail_path?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_media_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_muscle_groups: {
        Row: {
          exercise_id: string
          muscle_group_id: string
        }
        Insert: {
          exercise_id: string
          muscle_group_id: string
        }
        Update: {
          exercise_id?: string
          muscle_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_muscle_groups_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_muscle_groups_muscle_group_id_fkey"
            columns: ["muscle_group_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          equipment_id: string | null
          id: string
          instructions: string | null
          is_archived: boolean
          kcal_per_min: number | null
          name: string
          owner_id: string | null
          primary_muscle_group_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          equipment_id?: string | null
          id?: string
          instructions?: string | null
          is_archived?: boolean
          kcal_per_min?: number | null
          name: string
          owner_id?: string | null
          primary_muscle_group_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          equipment_id?: string | null
          id?: string
          instructions?: string | null
          is_archived?: boolean
          kcal_per_min?: number | null
          name?: string
          owner_id?: string | null
          primary_muscle_group_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_primary_muscle_group_id_fkey"
            columns: ["primary_muscle_group_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_path: string | null
          body: string | null
          conversation_id: string
          created_at: string
          deleted_at: string | null
          id: string
          reply_to_id: string | null
          sender_id: string | null
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          attachment_path?: string | null
          body?: string | null
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id?: string | null
          type?: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          attachment_path?: string | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id?: string | null
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      muscle_groups: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          enabled: boolean
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          enabled?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          enabled?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          url: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_profiles: {
        Row: {
          bio: string | null
          business_name: string | null
          created_at: string
          cref: string | null
          profile_id: string
          secondary_muscle_weight: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          business_name?: string | null
          created_at?: string
          cref?: string | null
          profile_id: string
          secondary_muscle_weight?: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          business_name?: string | null
          created_at?: string
          cref?: string | null
          profile_id?: string
          secondary_muscle_weight?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          locale: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          locale?: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          locale?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      progress_photo_sets: {
        Row: {
          assessment_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          student_id: string
          taken_at: string
          updated_at: string
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          student_id: string
          taken_at?: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          student_id?: string
          taken_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_photo_sets_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_photo_sets_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "v_student_metric_series"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "progress_photo_sets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_photo_sets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_photos: {
        Row: {
          angle: Database["public"]["Enums"]["photo_angle"]
          created_at: string
          height: number | null
          id: string
          mime_type: string
          set_id: string
          size_bytes: number | null
          storage_path: string
          student_id: string
          thumb_path: string | null
          width: number | null
        }
        Insert: {
          angle: Database["public"]["Enums"]["photo_angle"]
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string
          set_id: string
          size_bytes?: number | null
          storage_path: string
          student_id: string
          thumb_path?: string | null
          width?: number | null
        }
        Update: {
          angle?: Database["public"]["Enums"]["photo_angle"]
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string
          set_id?: string
          size_bytes?: number | null
          storage_path?: string
          student_id?: string
          thumb_path?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_set_fk"
            columns: ["set_id", "student_id"]
            isOneToOne: false
            referencedRelation: "progress_photo_sets"
            referencedColumns: ["id", "student_id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      set_logs: {
        Row: {
          completed: boolean
          created_at: string
          exercise_id: string | null
          exercise_name_snapshot: string
          id: string
          load_kg: number | null
          notes: string | null
          prescribed_snapshot: Json | null
          reps_done: number | null
          rpe: number | null
          session_id: string
          set_number: number
          updated_at: string
          workout_exercise_id: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          exercise_id?: string | null
          exercise_name_snapshot: string
          id?: string
          load_kg?: number | null
          notes?: string | null
          prescribed_snapshot?: Json | null
          reps_done?: number | null
          rpe?: number | null
          session_id: string
          set_number: number
          updated_at?: string
          workout_exercise_id?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          exercise_id?: string | null
          exercise_name_snapshot?: string
          id?: string
          load_kg?: number | null
          notes?: string | null
          prescribed_snapshot?: Json | null
          reps_done?: number | null
          rpe?: number | null
          session_id?: string
          set_number?: number
          updated_at?: string
          workout_exercise_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      student_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          revoked_at: string | null
          student_id: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          revoked_at?: string | null
          student_id: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          revoked_at?: string | null
          student_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_invites_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_private_notes: {
        Row: {
          created_at: string
          id: string
          note: string
          personal_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note: string
          personal_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          personal_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_private_notes_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_private_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          anonymized_at: string | null
          archived_at: string | null
          birth_date: string | null
          created_at: string
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          goal: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          personal_id: string
          phone: string | null
          sex: Database["public"]["Enums"]["sex_type"]
          start_date: string
          status: Database["public"]["Enums"]["student_status"]
          training_days: number[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anonymized_at?: string | null
          archived_at?: string | null
          birth_date?: string | null
          created_at?: string
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          goal?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          personal_id: string
          phone?: string | null
          sex?: Database["public"]["Enums"]["sex_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["student_status"]
          training_days?: number[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anonymized_at?: string | null
          archived_at?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          goal?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          personal_id?: string
          phone?: string | null
          sex?: Database["public"]["Enums"]["sex_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["student_status"]
          training_days?: number[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_checkins: {
        Row: {
          comment: string | null
          created_at: string
          diet_adherence: number | null
          difficulties: string | null
          energy: number | null
          id: string
          pain_notes: string | null
          personal_reply: string | null
          progress_feeling: number | null
          replied_at: string | null
          replied_by: string | null
          sleep_quality: number | null
          stress: number | null
          student_id: string
          submitted_at: string
          training_feeling: number | null
          trainings_done: number | null
          updated_at: string
          week_start: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          diet_adherence?: number | null
          difficulties?: string | null
          energy?: number | null
          id?: string
          pain_notes?: string | null
          personal_reply?: string | null
          progress_feeling?: number | null
          replied_at?: string | null
          replied_by?: string | null
          sleep_quality?: number | null
          stress?: number | null
          student_id: string
          submitted_at?: string
          training_feeling?: number | null
          trainings_done?: number | null
          updated_at?: string
          week_start: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          diet_adherence?: number | null
          difficulties?: string | null
          energy?: number | null
          id?: string
          pain_notes?: string | null
          personal_reply?: string | null
          progress_feeling?: number | null
          replied_at?: string | null
          replied_by?: string | null
          sleep_quality?: number | null
          stress?: number | null
          student_id?: string
          submitted_at?: string
          training_feeling?: number | null
          trainings_done?: number | null
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_checkins_replied_by_fkey"
            columns: ["replied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_checkins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          position: number
          reps_max: number | null
          reps_min: number | null
          reps_text: string | null
          rest_seconds: number | null
          rpe_target: number | null
          sets: number
          superset_group: number | null
          target_load_kg: number | null
          technique: Database["public"]["Enums"]["exercise_technique"]
          technique_detail: string | null
          tempo: string | null
          updated_at: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          position?: number
          reps_max?: number | null
          reps_min?: number | null
          reps_text?: string | null
          rest_seconds?: number | null
          rpe_target?: number | null
          sets?: number
          superset_group?: number | null
          target_load_kg?: number | null
          technique?: Database["public"]["Enums"]["exercise_technique"]
          technique_detail?: string | null
          tempo?: string | null
          updated_at?: string
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          reps_max?: number | null
          reps_min?: number | null
          reps_text?: string | null
          rest_seconds?: number | null
          rpe_target?: number | null
          sets?: number
          superset_group?: number | null
          target_load_kg?: number | null
          technique?: Database["public"]["Enums"]["exercise_technique"]
          technique_detail?: string | null
          tempo?: string | null
          updated_at?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_template: boolean
          name: string
          notes: string | null
          objective: string | null
          parent_plan_id: string | null
          personal_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["plan_status"]
          student_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_template?: boolean
          name: string
          notes?: string | null
          objective?: string | null
          parent_plan_id?: string | null
          personal_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          student_id?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_template?: boolean
          name?: string
          notes?: string | null
          objective?: string | null
          parent_plan_id?: string | null
          personal_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          student_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_parent_plan_id_fkey"
            columns: ["parent_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          client_uuid: string | null
          created_at: string
          finished_at: string | null
          id: string
          notes: string | null
          perceived_effort: number | null
          plan_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["session_status"]
          student_id: string
          updated_at: string
          workout_id: string | null
          workout_name_snapshot: string
        }
        Insert: {
          client_uuid?: string | null
          created_at?: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          plan_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          student_id: string
          updated_at?: string
          workout_id?: string | null
          workout_name_snapshot: string
        }
        Update: {
          client_uuid?: string | null
          created_at?: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          plan_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          student_id?: string
          updated_at?: string
          workout_id?: string | null
          workout_name_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          plan_id: string
          position: number
          updated_at: string
          weekday_hint: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          plan_id: string
          position?: number
          updated_at?: string
          weekday_hint?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          plan_id?: string
          position?: number
          updated_at?: string
          weekday_hint?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_student_metric_series: {
        Row: {
          assessed_at: string | null
          assessment_id: string | null
          category: Database["public"]["Enums"]["metric_category"] | null
          metric_id: string | null
          metric_key: string | null
          metric_label: string | null
          student_id: string | null
          unit: string | null
          value_numeric: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      log_audit: {
        Args: {
          p_action: string
          p_entity?: string
          p_entity_id?: string
          p_metadata?: Json
          p_student_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      exercise_technique: "normal" | "dropset" | "biset" | "restpause"
      consent_type:
        | "termos_uso"
        | "politica_privacidade"
        | "dados_saude"
        | "fotos_evolucao"
        | "responsavel_legal"
        | "uso_imagem_marketing"
      difficulty_level: "iniciante" | "intermediario" | "avancado"
      media_kind: "video" | "imagem"
      media_source: "upload" | "youtube" | "vimeo" | "stream" | "externo"
      message_type: "texto" | "imagem" | "audio" | "sistema"
      metric_category:
        | "antropometria"
        | "circunferencia"
        | "dobra_cutanea"
        | "composicao_corporal"
        | "desempenho"
        | "outro"
      metric_value_type: "numeric" | "text"
      notification_channel: "in_app" | "email" | "push"
      notification_type:
        | "nova_mensagem"
        | "treino_atribuido"
        | "avaliacao_registrada"
        | "checkin_pendente"
        | "checkin_recebido"
        | "checkin_respondido"
        | "lembrete"
        | "sistema"
      photo_angle:
        | "frente"
        | "costas"
        | "lado_esquerdo"
        | "lado_direito"
        | "outro"
      plan_status: "rascunho" | "ativo" | "encerrado" | "arquivado"
      session_status: "em_andamento" | "concluida" | "abandonada"
      sex_type: "masculino" | "feminino" | "outro" | "nao_informado"
      student_status: "convidado" | "ativo" | "pausado" | "arquivado"
      user_role: "personal" | "aluno"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      exercise_technique: ["normal", "dropset", "biset", "restpause"],
      consent_type: [
        "termos_uso",
        "politica_privacidade",
        "dados_saude",
        "fotos_evolucao",
        "responsavel_legal",
        "uso_imagem_marketing",
      ],
      difficulty_level: ["iniciante", "intermediario", "avancado"],
      media_kind: ["video", "imagem"],
      media_source: ["upload", "youtube", "vimeo", "stream", "externo"],
      message_type: ["texto", "imagem", "audio", "sistema"],
      metric_category: [
        "antropometria",
        "circunferencia",
        "dobra_cutanea",
        "composicao_corporal",
        "desempenho",
        "outro",
      ],
      metric_value_type: ["numeric", "text"],
      notification_channel: ["in_app", "email", "push"],
      notification_type: [
        "nova_mensagem",
        "treino_atribuido",
        "avaliacao_registrada",
        "checkin_pendente",
        "checkin_recebido",
        "checkin_respondido",
        "lembrete",
        "sistema",
      ],
      photo_angle: [
        "frente",
        "costas",
        "lado_esquerdo",
        "lado_direito",
        "outro",
      ],
      plan_status: ["rascunho", "ativo", "encerrado", "arquivado"],
      session_status: ["em_andamento", "concluida", "abandonada"],
      sex_type: ["masculino", "feminino", "outro", "nao_informado"],
      student_status: ["convidado", "ativo", "pausado", "arquivado"],
      user_role: ["personal", "aluno"],
    },
  },
} as const
