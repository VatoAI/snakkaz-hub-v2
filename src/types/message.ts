export interface DecryptedMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url?: string | null;
  };
  receiver_id?: string | null;
  created_at: string;
  encryption_key: string;
  iv: string;
  is_encrypted?: boolean;
}
