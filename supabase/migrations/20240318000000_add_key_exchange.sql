-- Create key_exchange table
CREATE TABLE IF NOT EXISTS public.key_exchange (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    recipient_id UUID NOT NULL REFERENCES auth.users(id),
    public_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_key_exchange_sender_id ON public.key_exchange(sender_id);
CREATE INDEX IF NOT EXISTS idx_key_exchange_recipient_id ON public.key_exchange(recipient_id);
CREATE INDEX IF NOT EXISTS idx_key_exchange_created_at ON public.key_exchange(created_at DESC);

-- Add RLS policies
ALTER TABLE public.key_exchange ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own keys
CREATE POLICY "Users can insert their own keys"
    ON public.key_exchange
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id);

-- Allow users to read keys meant for them or sent by them
CREATE POLICY "Users can read their own key exchanges"
    ON public.key_exchange
    FOR SELECT
    TO authenticated
    USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.key_exchange
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at(); 