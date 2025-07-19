-- This migration fixes the data type of user_id columns from TEXT to UUID in several tables.
-- This is necessary to resolve the "operator does not exist: uuid = text" errors.
-- It also handles potential foreign key constraints and RLS policies by dropping and re-adding them.

-- Step 1: Drop dependent RLS policies
DROP POLICY IF EXISTS "Users can delete own AI action cards" ON public.ai_action_cards;
DROP POLICY IF EXISTS "Users can update own AI action cards" ON public.ai_action_cards;
DROP POLICY IF EXISTS "Users can insert own AI action cards" ON public.ai_action_cards;
DROP POLICY IF EXISTS "Users can view own AI action cards" ON public.ai_action_cards;
DROP POLICY IF EXISTS "chat_usage_isolation" ON public.chat_usage_tracking;
DROP POLICY IF EXISTS "user_licenses_isolation" ON public.user_licenses;
DROP POLICY IF EXISTS "Users can view their own licenses" ON public.user_licenses;
DROP POLICY IF EXISTS "Users can update their own licenses" ON public.user_licenses;
DROP POLICY IF EXISTS "Users can view their own usage" ON public.chat_usage_tracking;
DROP POLICY IF EXISTS "Users can update their own usage" ON public.chat_usage_tracking;
DROP POLICY IF EXISTS "Users can view own AI conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can insert own AI conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can update own AI conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can delete own AI conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can view own AI messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can insert own AI messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can update own AI messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can delete own AI messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can view own AI action card events" ON public.ai_action_card_events;
DROP POLICY IF EXISTS "Users can insert own AI action card events" ON public.ai_action_card_events;

-- Step 2: Drop foreign key constraints
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Fix public.user_licenses
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.user_licenses'::regclass
      AND confrelid = 'auth.users'::regclass
      AND conname LIKE '%user_id_fkey%';
      
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.user_licenses DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;

    -- Fix public.chat_usage_tracking
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.chat_usage_tracking'::regclass
      AND confrelid = 'auth.users'::regclass
      AND conname LIKE '%user_id_fkey%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.chat_usage_tracking DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
    
    -- Fix public.ai_conversations
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.ai_conversations'::regclass
      AND confrelid = 'auth.users'::regclass
      AND conname LIKE '%user_id_fkey%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.ai_conversations DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;

    -- Fix public.ai_messages
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.ai_messages'::regclass
      AND confrelid = 'auth.users'::regclass
      AND conname LIKE '%user_id_fkey%';
      
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.ai_messages DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;

    -- Fix public.ai_action_card_events
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.ai_action_card_events'::regclass
      AND confrelid = 'auth.users'::regclass
      AND conname LIKE '%user_id_fkey%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.ai_action_card_events DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;

END $$;

-- Step 3: Alter the column types
ALTER TABLE public.user_licenses ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
ALTER TABLE public.chat_usage_tracking ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
ALTER TABLE public.ai_conversations ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
ALTER TABLE public.ai_messages ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
ALTER TABLE public.ai_action_card_events ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- Step 4: Re-add the foreign key constraints
ALTER TABLE public.user_licenses ADD CONSTRAINT user_licenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.chat_usage_tracking ADD CONSTRAINT chat_usage_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.ai_conversations ADD CONSTRAINT ai_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.ai_messages ADD CONSTRAINT ai_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.ai_action_card_events ADD CONSTRAINT ai_action_card_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Re-create the RLS policies
-- RLS Policies for user_licenses
CREATE POLICY "Users can view their own licenses" ON public.user_licenses
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own licenses" ON public.user_licenses
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for chat_usage_tracking
CREATE POLICY "Users can view their own usage" ON public.chat_usage_tracking
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own usage" ON public.chat_usage_tracking
    FOR ALL USING (auth.uid() = user_id);

-- RLS policies for ai_conversations
CREATE POLICY "Users can view own AI conversations" ON public.ai_conversations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI conversations" ON public.ai_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI conversations" ON public.ai_conversations
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own AI conversations" ON public.ai_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for ai_messages
CREATE POLICY "Users can view own AI messages" ON public.ai_messages
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI messages" ON public.ai_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI messages" ON public.ai_messages
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own AI messages" ON public.ai_messages
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for ai_action_card_events
CREATE POLICY "Users can view own AI action card events" ON public.ai_action_card_events
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI action card events" ON public.ai_action_card_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_licenses_isolation" ON user_licenses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.id = user_licenses.user_id
  )
);

CREATE POLICY "chat_usage_isolation" ON public.chat_usage_tracking
FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- RLS policies for ai_action_cards
CREATE POLICY "Users can view own AI action cards" ON public.ai_action_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations ac
            WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own AI action cards" ON public.ai_action_cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_conversations ac
            WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update own AI action cards" ON public.ai_action_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations ac
            WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete own AI action cards" ON public.ai_action_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations ac
            WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
        )
    ); 