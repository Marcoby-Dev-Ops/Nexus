-- Insert default data point definitions
INSERT INTO data_point_definitions (name, description, data_type, source_integration, mapping_rules) VALUES
('contact_email', 'Contact email address', 'string', 'hubspot', '{"source_field": "email", "validation": "email"}'),
('contact_phone', 'Contact phone number', 'string', 'hubspot', '{"source_field": "phone", "validation": "phone"}'),
('deal_value', 'Deal monetary value', 'decimal', 'hubspot', '{"source_field": "amount", "validation": "positive_number"}'),
('deal_stage', 'Deal stage in pipeline', 'string', 'hubspot', '{"source_field": "dealstage", "validation": "enum"}'),
('company_name', 'Company name', 'string', 'hubspot', '{"source_field": "name", "validation": "not_empty"}');
