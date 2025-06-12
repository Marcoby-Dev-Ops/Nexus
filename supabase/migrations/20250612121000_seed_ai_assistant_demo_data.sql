-- Seed data: demo AI conversation and initial message

WITH demo_user AS (
    SELECT id FROM auth.users LIMIT 1
), demo_conv AS (
    INSERT INTO public.ai_conversations (id, user_id, title)
    SELECT gen_random_uuid(), id, 'Demo AI Conversation' FROM demo_user
    RETURNING id, user_id
)
INSERT INTO public.ai_messages (id, conversation_id, user_id, role, content)
SELECT gen_random_uuid(), id, user_id, 'user', 'Hello, can you tell me about our sales performance?' FROM demo_conv; 