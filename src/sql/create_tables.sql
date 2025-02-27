
-- Funksjon for å sjekke og legge til kolonner hvis de ikke finnes
CREATE OR REPLACE FUNCTION check_and_add_columns(p_table_name text, column_names text[])
RETURNS void AS $$
DECLARE
    col text;
BEGIN
    FOREACH col IN ARRAY column_names
    LOOP
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = p_table_name 
            AND column_name = col
        ) THEN
            -- Legg til boolean eller timestamp kolonner basert på navn
            IF col LIKE '%\_at' THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN %I timestamp with time zone', p_table_name, col);
            ELSE
                EXECUTE format('ALTER TABLE %I ADD COLUMN %I boolean DEFAULT false', p_table_name, col);
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Funksjon for å markere en melding som slettet
CREATE OR REPLACE FUNCTION mark_message_as_deleted(message_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE messages
    SET 
        is_deleted = true,
        deleted_at = now()
    WHERE 
        id = message_id 
        AND sender_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Kjør check_and_add_columns for å sikre at vi har alle nødvendige kolonner
SELECT check_and_add_columns('messages', ARRAY['is_edited', 'edited_at', 'is_deleted', 'deleted_at', 'group_id']);
