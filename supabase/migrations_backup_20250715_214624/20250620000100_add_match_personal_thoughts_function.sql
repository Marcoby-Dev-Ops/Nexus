-- Vector similarity search for personal thoughts
-- Returns top N thoughts for a given user's embedding

create or replace function public.match_personal_thoughts(
    query_embedding vector,
    user_uuid uuid,
    match_threshold real default 0.5,
    match_count int default 5
)
returns table (
    thought_id uuid,
    content text,
    category text,
    tags text[],
    similarity real
) language sql stable as $$
select ptv.thought_id,
       pt.content,
       pt.category,
       pt.tags,
       1 - (ptv.content_embedding <=> query_embedding) as similarity
from public.ai_personal_thought_vectors ptv
join public.personal_thoughts pt on pt.id = ptv.thought_id
where pt.user_id = user_uuid
  and (1 - (ptv.content_embedding <=> query_embedding)) > match_threshold
order by ptv.content_embedding <=> query_embedding
limit match_count;
$$;

-- Grant execute to authenticated role (RLS still applies)
grant execute on function public.match_personal_thoughts(vector, uuid, real, int) to authenticated; 