-- Add business foundation action card templates

INSERT INTO public.ai_action_card_templates (slug, title, description, category, template_data)
VALUES
  ('define-mission', 'Define Mission Statement', 'Craft a compelling mission statement that explains why your company exists.', 'business-foundations',
   '{"actions": [{"id": "draft_mission", "label": "Draft with AI", "eventType": "develop_business_plan", "payload": {"focus_area": "mission"}}]}'::jsonb),
  ('define-vision', 'Define Vision Statement', 'Establish an inspiring vision for where your company is headed.', 'business-foundations',
   '{"actions": [{"id": "draft_vision", "label": "Draft with AI", "eventType": "develop_business_plan", "payload": {"focus_area": "vision"}}]}'::jsonb),
  ('define-value-proposition', 'Define Value Proposition', 'Articulate the unique value you deliver to customers.', 'business-foundations',
   '{"actions": [{"id": "draft_value_prop", "label": "Draft with AI", "eventType": "develop_business_plan", "payload": {"focus_area": "value_proposition"}}]}'::jsonb),
  ('set-goals', 'Set 12-Month Goals', 'Outline measurable goals and success metrics for the next year.', 'business-foundations',
   '{"actions": [{"id": "draft_goals", "label": "Draft with AI", "eventType": "develop_business_plan", "payload": {"focus_area": "goals"}}]}'::jsonb); 