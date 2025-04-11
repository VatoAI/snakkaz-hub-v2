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
      messages: {
        Row: {
          id: string
          created_at: string
          sender_id: string
          receiver_id: string | null
          group_id: boolean | null
          encrypted_content: string
          encryption_key: string
          iv: string
          ephemeral_ttl: number | null
          media_url: string | null
          media_type: string | null
          is_edited: boolean
          edited_at: string | null
          is_deleted: boolean
          deleted_at: string | null
          read_at: string | null
          is_delivered: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          sender_id: string
          receiver_id?: string | null
          group_id?: boolean | null
          encrypted_content: string
          encryption_key: string
          iv: string
          ephemeral_ttl?: number | null
          media_url?: string | null
          media_type?: string | null
          is_edited?: boolean
          edited_at?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
          read_at?: string | null
          is_delivered?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          sender_id?: string
          receiver_id?: string | null
          group_id?: boolean | null
          encrypted_content?: string
          encryption_key?: string
          iv?: string
          ephemeral_ttl?: number | null
          media_url?: string | null
          media_type?: string | null
          is_edited?: boolean
          edited_at?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
          read_at?: string | null
          is_delivered?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          about: string | null
          last_seen: string | null
          is_online: boolean
          status: string | null
        }
        Insert: {
          id: string
          created_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          about?: string | null
          last_seen?: string | null
          is_online?: boolean
          status?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          about?: string | null
          last_seen?: string | null
          is_online?: boolean
          status?: string | null
        }
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
  }
} 