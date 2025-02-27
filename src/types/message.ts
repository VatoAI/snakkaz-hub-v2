
export interface Message {
  id: string;
  encrypted_content: string;
  encryption_key: string;
  iv: string;
  created_at: string;
  ephemeral_ttl?: number | null;
  media_url?: string | null;
  media_type?: string | null;
  receiver_id?: string | null;
  is_edited?: boolean;
  edited_at?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  group_id?: string | null;
  sender: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url?: string | null;
  };
}

export interface DecryptedMessage extends Omit<Message, 'encrypted_content'> {
  content: string;
}
