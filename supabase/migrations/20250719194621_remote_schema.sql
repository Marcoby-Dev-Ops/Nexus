create extension if not exists "vector" with schema "public" version '0.8.0';

create table "public"."ai_conversations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."ai_conversations" enable row level security;

create table "public"."ai_messages" (
    "id" uuid not null default gen_random_uuid(),
    "conversation_id" uuid not null,
    "role" text not null,
    "content" text not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."ai_messages" enable row level security;

create table "public"."thoughts" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "content" text not null,
    "embedding" vector(1536),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."thoughts" enable row level security;

CREATE UNIQUE INDEX ai_conversations_pkey ON public.ai_conversations USING btree (id);

CREATE UNIQUE INDEX ai_messages_pkey ON public.ai_messages USING btree (id);

CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations USING btree (user_id);

CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages USING btree (conversation_id);

CREATE INDEX idx_ai_messages_created_at ON public.ai_messages USING btree (created_at);

CREATE INDEX idx_thoughts_embedding ON public.thoughts USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_thoughts_user_id ON public.thoughts USING btree (user_id);

CREATE UNIQUE INDEX thoughts_pkey ON public.thoughts USING btree (id);

alter table "public"."ai_conversations" add constraint "ai_conversations_pkey" PRIMARY KEY using index "ai_conversations_pkey";

alter table "public"."ai_messages" add constraint "ai_messages_pkey" PRIMARY KEY using index "ai_messages_pkey";

alter table "public"."thoughts" add constraint "thoughts_pkey" PRIMARY KEY using index "thoughts_pkey";

alter table "public"."ai_conversations" add constraint "ai_conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."ai_conversations" validate constraint "ai_conversations_user_id_fkey";

alter table "public"."ai_messages" add constraint "ai_messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE not valid;

alter table "public"."ai_messages" validate constraint "ai_messages_conversation_id_fkey";

alter table "public"."ai_messages" add constraint "ai_messages_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text]))) not valid;

alter table "public"."ai_messages" validate constraint "ai_messages_role_check";

alter table "public"."thoughts" add constraint "thoughts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."thoughts" validate constraint "thoughts_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_personal_thoughts(query_embedding vector, match_count integer DEFAULT 6, match_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, content text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.content,
        1 - (t.embedding <=> query_embedding) AS similarity
    FROM public.thoughts t
    WHERE t.user_id = match_user_id
    AND t.embedding IS NOT NULL
    ORDER BY t.embedding <=> query_embedding
    LIMIT match_count;
END;
$function$
;

create policy "Users can manage their own conversations"
on "public"."ai_conversations"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Users can manage messages in their conversations"
on "public"."ai_messages"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));


create policy "Users can manage their own thoughts"
on "public"."thoughts"
as permissive
for all
to public
using ((auth.uid() = user_id));



