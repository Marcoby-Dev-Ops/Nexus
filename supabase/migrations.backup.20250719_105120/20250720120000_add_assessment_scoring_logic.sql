-- =================================================================
-- Function to recalculate assessment scores for a specific company
-- =================================================================
CREATE OR REPLACE FUNCTION public.update_assessment_scores(target_company_id uuid)
RETURNS void AS $$
BEGIN
    -- Step 1: Delete old scores for the company to ensure a clean slate.
    DELETE FROM public."AssessmentCategoryScore" WHERE company_id = target_company_id;
    DELETE FROM public."AssessmentSummary" WHERE company_id = target_company_id;

    -- Step 2: Recalculate and insert the score for each category.
    -- The key is AVG(ar.score) which naturally ignores NULL scores.
    INSERT INTO public."AssessmentCategoryScore" (company_id, category_id, score)
    SELECT
        target_company_id,
        aq.category_id,
        COALESCE(AVG(ar.score), 0) -- Use COALESCE to set score to 0 if all questions in a category are N/A
    FROM
        public."AssessmentResponse" ar
    JOIN
        public."AssessmentQuestion" aq ON ar.question_id = aq.id
    WHERE
        ar.company_id = target_company_id
    GROUP BY
        aq.category_id;

    -- Step 3: Recalculate and insert the overall summary score.
    -- This calculates the weighted average of the just-calculated category scores.
    INSERT INTO public."AssessmentSummary" (company_id, overall_score, last_calculated)
    SELECT
        target_company_id,
        COALESCE(
            SUM(acs.score * (ac.weight::decimal / 100.0)) / SUM(ac.weight::decimal / 100.0),
            0
        ) AS weighted_average_score,
        NOW()
    FROM
        public."AssessmentCategoryScore" acs
    JOIN
        public."AssessmentCategory" ac ON acs.category_id = ac.id
    WHERE
        acs.company_id = target_company_id;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- Trigger function that calls the master recalculation function
-- =================================================================
CREATE OR REPLACE FUNCTION public.handle_assessment_response_change()
RETURNS trigger AS $$
BEGIN
    -- Call the recalculation function for the company that was affected.
    -- This works for INSERT, UPDATE, and DELETE.
    IF (TG_OP = 'DELETE') THEN
        PERFORM public.update_assessment_scores(OLD.company_id);
        RETURN OLD;
    ELSE
        PERFORM public.update_assessment_scores(NEW.company_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- Trigger that fires after any change to the AssessmentResponse table
-- =================================================================
CREATE TRIGGER on_assessment_response_change
AFTER INSERT OR UPDATE OR DELETE ON public."AssessmentResponse"
FOR EACH ROW EXECUTE FUNCTION public.handle_assessment_response_change(); 