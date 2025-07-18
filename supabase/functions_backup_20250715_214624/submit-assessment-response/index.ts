import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { questionId, answerValue } = await req.json();

    // 1. Get user and company
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response('User not found', { status: 401 });
    }
    const { data: profile, error: profileError } = await supabaseClient
      .from('UserProfile')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response('User profile not found', { status: 404 });
    }
    const { company_id } = profile;

    // 2. Fetch question details
    const { data: question, error: questionError } = await supabaseClient
        .from('AssessmentQuestion')
        .select('*')
        .eq('id', questionId)
        .single();
    
    if (questionError || !question) {
        return new Response('Question not found', { status: 404 });
    }

    // 3. Handle action type
    if (question.action_type === 'UPDATE_PROFILE' && question.target_field) {
      // This is a profile update question
      const { error: companyUpdateError } = await supabaseClient
        .from('Company')
        .update({ [question.target_field]: answerValue })
        .eq('id', company_id);

      if (companyUpdateError) {
        throw new Error(`Failed to update company profile: ${companyUpdateError.message}`);
      }
    }
    
    // 4. Calculate score and upsert response (always do this to track history)
    const score = calculateScore(question, answerValue);
    const responseToUpsert = {
        company_id: company_id,
        question_id: questionId,
        user_id: user.id,
        value: answerValue === null ? 'N/A' : String(answerValue),
        score: score,
    };

    const { data: upsertedResponse, error: upsertError } = await supabaseClient
        .from('AssessmentResponse')
        .upsert(responseToUpsert, { onConflict: 'company_id, question_id' })
        .select()
        .single();
    
    if (upsertError) {
        throw new Error(upsertError.message);
    }

    return new Response(JSON.stringify(upsertedResponse), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

function calculateScore(question, answer) {
    if (answer === null) {
        return null;
    }
    if (question.question_type === 'bool') {
        return answer ? 100 : 0;
    }
    if (question.question_type === 'enum' && question.options && typeof question.options === 'object') {
        return question.options[answer] || 0;
    }
    if (question.question_type === 'number') {
        // For simplicity, we'll just return the number itself as the score for now.
        // A real implementation would use the `thresholds` field.
        const numericAnswer = Number(answer);
        return isNaN(numericAnswer) ? 0 : Math.min(100, Math.max(0, numericAnswer));
    }
    return 0;
} 