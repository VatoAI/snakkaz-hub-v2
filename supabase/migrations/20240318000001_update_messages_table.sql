-- Add new columns for encrypted content
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS encrypted_content TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS nonce TEXT NOT NULL;

-- Drop old content column if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'messages' 
               AND column_name = 'content') THEN
        ALTER TABLE public.messages DROP COLUMN content;
    END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;

CREATE POLICY "Users can insert messages"
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can read their own messages"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_encrypted_content ON public.messages(encrypted_content);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON public.messages(sender_id, recipient_id); 