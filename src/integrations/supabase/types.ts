export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health: {
        Row: {
          id: string
          last_checked: string
          status: string
        }
        Insert: {
          id?: string
          last_checked?: string
          status?: string
        }
        Update: {
          id?: string
          last_checked?: string
          status?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          encrypted_content: string
          encryption_key: string | null
          ephemeral_ttl: number | null
          group_id: boolean | null
          id: string
          is_deleted: boolean | null
          is_delivered: boolean | null
          is_edited: boolean | null
          iv: string | null
          media_type: string | null
          media_url: string | null
          read_at: string | null
          receiver_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          encrypted_content: string
          encryption_key?: string | null
          ephemeral_ttl?: number | null
          group_id?: boolean | null
          id?: string
          is_deleted?: boolean | null
          is_delivered?: boolean | null
          is_edited?: boolean | null
          iv?: string | null
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          encrypted_content?: string
          encryption_key?: string | null
          ephemeral_ttl?: number | null
          group_id?: boolean | null
          id?: string
          is_deleted?: boolean | null
          is_delivered?: boolean | null
          is_edited?: boolean | null
          iv?: string | null
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      signaling: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          signal_data: Json
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          signal_data: Json
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          signal_data?: Json
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          id: string
          last_seen: string
          status: Database["public"]["Enums"]["user_status"]
          user_id: string
        }
        Insert: {
          id?: string
          last_seen?: string
          status?: Database["public"]["Enums"]["user_status"]
          user_id: string
        }
        Update: {
          id?: string
          last_seen?: string
          status?: Database["public"]["Enums"]["user_status"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_add_columns: {
        Args: {
          p_table_name: string
          column_names: string[]
        }
        Returns: undefined
      }
      mark_message_as_deleted: {
        Args: {
          message_id: string
          user_id: string
        }
        Returns: undefined
      }
      mark_message_as_read: {
        Args: {
          message_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      user_status: "online" | "busy" | "brb"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
