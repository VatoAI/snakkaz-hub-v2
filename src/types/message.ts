
export interface Message {
  id: string;
  encrypted_content: string;
  encryption_key: string;
  iv: string;
  created_at: string;
  ephemeral_ttl?: number | null;
  sender: {
    username: string | null;
    full_name: string | null;
  };
}

export interface DecryptedMessage extends Omit<Message, 'encrypted_content'> {
  content: string;
}
