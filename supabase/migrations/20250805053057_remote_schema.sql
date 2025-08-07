drop trigger if exists "update_callback_events_updated_at" on "public"."callback_events";

drop policy "Service role can access analytics events" on "public"."analytics_events";

drop policy "Users can delete own analytics events" on "public"."analytics_events";

drop policy "Users can read own analytics events" on "public"."analytics_events";

drop policy "Users can update own analytics events" on "public"."analytics_events";

drop policy "Service role can manage all callback events" on "public"."callback_events";

drop policy "Users can delete their own callback events" on "public"."callback_events";

drop policy "Users can insert their own callback events" on "public"."callback_events";

drop policy "Users can update their own callback events" on "public"."callback_events";

drop policy "Users can view their own callback events" on "public"."callback_events";

drop policy "Enable all access for authenticated users" on "public"."chat_usage_tracking";

drop policy "Company owners can insert companies" on "public"."companies";

drop policy "Company owners can manage their companies" on "public"."companies";

drop policy "Company owners can update company" on "public"."companies";

drop policy "Service role can manage all companies" on "public"."companies";

drop policy "Users can read own company" on "public"."companies";

drop policy "Users can view associated companies" on "public"."companies";

drop policy "Admins can manage company members" on "public"."company_members";

drop policy "Users can view company members" on "public"."company_members";

drop policy "Enable all access for authenticated users" on "public"."personal_automations";

drop policy "Enable all access for authenticated users" on "public"."personal_thoughts";

drop policy "Users can delete their own tasks" on "public"."tasks";

drop policy "Users can insert their own tasks" on "public"."tasks";

drop policy "Users can read own tasks" on "public"."tasks";

drop policy "Users can update their own tasks" on "public"."tasks";

drop policy "Users can view their own tasks" on "public"."tasks";

drop policy "Users can delete own integrations" on "public"."user_integrations";

drop policy "Users can insert own integrations" on "public"."user_integrations";

drop policy "Users can update own integrations" on "public"."user_integrations";

drop policy "Enable all access for authenticated users" on "public"."user_licenses";

drop policy "Enable all access for authenticated users" on "public"."user_profiles";

drop policy "user_profiles_insert_policy" on "public"."user_profiles";

drop policy "user_profiles_select_policy" on "public"."user_profiles";

drop policy "user_profiles_service_role_policy" on "public"."user_profiles";

drop policy "user_profiles_update_policy" on "public"."user_profiles";

drop policy "Users can insert own analytics events" on "public"."analytics_events";

drop policy "Users can manage own tasks" on "public"."tasks";

revoke delete on table "public"."action_cards" from "anon";

revoke insert on table "public"."action_cards" from "anon";

revoke references on table "public"."action_cards" from "anon";

revoke select on table "public"."action_cards" from "anon";

revoke trigger on table "public"."action_cards" from "anon";

revoke truncate on table "public"."action_cards" from "anon";

revoke update on table "public"."action_cards" from "anon";

revoke delete on table "public"."action_cards" from "authenticated";

revoke insert on table "public"."action_cards" from "authenticated";

revoke references on table "public"."action_cards" from "authenticated";

revoke select on table "public"."action_cards" from "authenticated";

revoke trigger on table "public"."action_cards" from "authenticated";

revoke truncate on table "public"."action_cards" from "authenticated";

revoke update on table "public"."action_cards" from "authenticated";

revoke delete on table "public"."ai_audit_logs" from "anon";

revoke insert on table "public"."ai_audit_logs" from "anon";

revoke references on table "public"."ai_audit_logs" from "anon";

revoke select on table "public"."ai_audit_logs" from "anon";

revoke trigger on table "public"."ai_audit_logs" from "anon";

revoke truncate on table "public"."ai_audit_logs" from "anon";

revoke update on table "public"."ai_audit_logs" from "anon";

revoke delete on table "public"."ai_audit_logs" from "authenticated";

revoke insert on table "public"."ai_audit_logs" from "authenticated";

revoke references on table "public"."ai_audit_logs" from "authenticated";

revoke select on table "public"."ai_audit_logs" from "authenticated";

revoke trigger on table "public"."ai_audit_logs" from "authenticated";

revoke truncate on table "public"."ai_audit_logs" from "authenticated";

revoke update on table "public"."ai_audit_logs" from "authenticated";

revoke delete on table "public"."ai_conversations" from "anon";

revoke insert on table "public"."ai_conversations" from "anon";

revoke references on table "public"."ai_conversations" from "anon";

revoke select on table "public"."ai_conversations" from "anon";

revoke trigger on table "public"."ai_conversations" from "anon";

revoke truncate on table "public"."ai_conversations" from "anon";

revoke update on table "public"."ai_conversations" from "anon";

revoke delete on table "public"."ai_conversations" from "authenticated";

revoke insert on table "public"."ai_conversations" from "authenticated";

revoke references on table "public"."ai_conversations" from "authenticated";

revoke select on table "public"."ai_conversations" from "authenticated";

revoke trigger on table "public"."ai_conversations" from "authenticated";

revoke truncate on table "public"."ai_conversations" from "authenticated";

revoke update on table "public"."ai_conversations" from "authenticated";

revoke delete on table "public"."ai_email_accounts" from "anon";

revoke insert on table "public"."ai_email_accounts" from "anon";

revoke references on table "public"."ai_email_accounts" from "anon";

revoke select on table "public"."ai_email_accounts" from "anon";

revoke trigger on table "public"."ai_email_accounts" from "anon";

revoke truncate on table "public"."ai_email_accounts" from "anon";

revoke update on table "public"."ai_email_accounts" from "anon";

revoke delete on table "public"."ai_email_accounts" from "authenticated";

revoke insert on table "public"."ai_email_accounts" from "authenticated";

revoke references on table "public"."ai_email_accounts" from "authenticated";

revoke select on table "public"."ai_email_accounts" from "authenticated";

revoke trigger on table "public"."ai_email_accounts" from "authenticated";

revoke truncate on table "public"."ai_email_accounts" from "authenticated";

revoke update on table "public"."ai_email_accounts" from "authenticated";

revoke delete on table "public"."ai_email_accounts" from "service_role";

revoke insert on table "public"."ai_email_accounts" from "service_role";

revoke references on table "public"."ai_email_accounts" from "service_role";

revoke select on table "public"."ai_email_accounts" from "service_role";

revoke trigger on table "public"."ai_email_accounts" from "service_role";

revoke truncate on table "public"."ai_email_accounts" from "service_role";

revoke update on table "public"."ai_email_accounts" from "service_role";

revoke delete on table "public"."ai_email_attachments" from "anon";

revoke insert on table "public"."ai_email_attachments" from "anon";

revoke references on table "public"."ai_email_attachments" from "anon";

revoke select on table "public"."ai_email_attachments" from "anon";

revoke trigger on table "public"."ai_email_attachments" from "anon";

revoke truncate on table "public"."ai_email_attachments" from "anon";

revoke update on table "public"."ai_email_attachments" from "anon";

revoke delete on table "public"."ai_email_attachments" from "authenticated";

revoke insert on table "public"."ai_email_attachments" from "authenticated";

revoke references on table "public"."ai_email_attachments" from "authenticated";

revoke select on table "public"."ai_email_attachments" from "authenticated";

revoke trigger on table "public"."ai_email_attachments" from "authenticated";

revoke truncate on table "public"."ai_email_attachments" from "authenticated";

revoke update on table "public"."ai_email_attachments" from "authenticated";

revoke delete on table "public"."ai_email_attachments" from "service_role";

revoke insert on table "public"."ai_email_attachments" from "service_role";

revoke references on table "public"."ai_email_attachments" from "service_role";

revoke select on table "public"."ai_email_attachments" from "service_role";

revoke trigger on table "public"."ai_email_attachments" from "service_role";

revoke truncate on table "public"."ai_email_attachments" from "service_role";

revoke update on table "public"."ai_email_attachments" from "service_role";

revoke delete on table "public"."ai_email_messages" from "anon";

revoke insert on table "public"."ai_email_messages" from "anon";

revoke references on table "public"."ai_email_messages" from "anon";

revoke select on table "public"."ai_email_messages" from "anon";

revoke trigger on table "public"."ai_email_messages" from "anon";

revoke truncate on table "public"."ai_email_messages" from "anon";

revoke update on table "public"."ai_email_messages" from "anon";

revoke delete on table "public"."ai_email_messages" from "authenticated";

revoke insert on table "public"."ai_email_messages" from "authenticated";

revoke references on table "public"."ai_email_messages" from "authenticated";

revoke select on table "public"."ai_email_messages" from "authenticated";

revoke trigger on table "public"."ai_email_messages" from "authenticated";

revoke truncate on table "public"."ai_email_messages" from "authenticated";

revoke update on table "public"."ai_email_messages" from "authenticated";

revoke delete on table "public"."ai_email_messages" from "service_role";

revoke insert on table "public"."ai_email_messages" from "service_role";

revoke references on table "public"."ai_email_messages" from "service_role";

revoke select on table "public"."ai_email_messages" from "service_role";

revoke trigger on table "public"."ai_email_messages" from "service_role";

revoke truncate on table "public"."ai_email_messages" from "service_role";

revoke update on table "public"."ai_email_messages" from "service_role";

revoke delete on table "public"."ai_email_sync_jobs" from "anon";

revoke insert on table "public"."ai_email_sync_jobs" from "anon";

revoke references on table "public"."ai_email_sync_jobs" from "anon";

revoke select on table "public"."ai_email_sync_jobs" from "anon";

revoke trigger on table "public"."ai_email_sync_jobs" from "anon";

revoke truncate on table "public"."ai_email_sync_jobs" from "anon";

revoke update on table "public"."ai_email_sync_jobs" from "anon";

revoke delete on table "public"."ai_email_sync_jobs" from "authenticated";

revoke insert on table "public"."ai_email_sync_jobs" from "authenticated";

revoke references on table "public"."ai_email_sync_jobs" from "authenticated";

revoke select on table "public"."ai_email_sync_jobs" from "authenticated";

revoke trigger on table "public"."ai_email_sync_jobs" from "authenticated";

revoke truncate on table "public"."ai_email_sync_jobs" from "authenticated";

revoke update on table "public"."ai_email_sync_jobs" from "authenticated";

revoke delete on table "public"."ai_email_sync_jobs" from "service_role";

revoke insert on table "public"."ai_email_sync_jobs" from "service_role";

revoke references on table "public"."ai_email_sync_jobs" from "service_role";

revoke select on table "public"."ai_email_sync_jobs" from "service_role";

revoke trigger on table "public"."ai_email_sync_jobs" from "service_role";

revoke truncate on table "public"."ai_email_sync_jobs" from "service_role";

revoke update on table "public"."ai_email_sync_jobs" from "service_role";

revoke delete on table "public"."ai_embedding_cache" from "anon";

revoke insert on table "public"."ai_embedding_cache" from "anon";

revoke references on table "public"."ai_embedding_cache" from "anon";

revoke select on table "public"."ai_embedding_cache" from "anon";

revoke trigger on table "public"."ai_embedding_cache" from "anon";

revoke truncate on table "public"."ai_embedding_cache" from "anon";

revoke update on table "public"."ai_embedding_cache" from "anon";

revoke delete on table "public"."ai_embedding_cache" from "authenticated";

revoke insert on table "public"."ai_embedding_cache" from "authenticated";

revoke references on table "public"."ai_embedding_cache" from "authenticated";

revoke select on table "public"."ai_embedding_cache" from "authenticated";

revoke trigger on table "public"."ai_embedding_cache" from "authenticated";

revoke truncate on table "public"."ai_embedding_cache" from "authenticated";

revoke update on table "public"."ai_embedding_cache" from "authenticated";

revoke delete on table "public"."ai_inbox_items" from "anon";

revoke insert on table "public"."ai_inbox_items" from "anon";

revoke references on table "public"."ai_inbox_items" from "anon";

revoke select on table "public"."ai_inbox_items" from "anon";

revoke trigger on table "public"."ai_inbox_items" from "anon";

revoke truncate on table "public"."ai_inbox_items" from "anon";

revoke update on table "public"."ai_inbox_items" from "anon";

revoke delete on table "public"."ai_inbox_items" from "authenticated";

revoke insert on table "public"."ai_inbox_items" from "authenticated";

revoke references on table "public"."ai_inbox_items" from "authenticated";

revoke select on table "public"."ai_inbox_items" from "authenticated";

revoke trigger on table "public"."ai_inbox_items" from "authenticated";

revoke truncate on table "public"."ai_inbox_items" from "authenticated";

revoke update on table "public"."ai_inbox_items" from "authenticated";

revoke delete on table "public"."ai_inbox_rules" from "anon";

revoke insert on table "public"."ai_inbox_rules" from "anon";

revoke references on table "public"."ai_inbox_rules" from "anon";

revoke select on table "public"."ai_inbox_rules" from "anon";

revoke trigger on table "public"."ai_inbox_rules" from "anon";

revoke truncate on table "public"."ai_inbox_rules" from "anon";

revoke update on table "public"."ai_inbox_rules" from "anon";

revoke delete on table "public"."ai_inbox_rules" from "authenticated";

revoke insert on table "public"."ai_inbox_rules" from "authenticated";

revoke references on table "public"."ai_inbox_rules" from "authenticated";

revoke select on table "public"."ai_inbox_rules" from "authenticated";

revoke trigger on table "public"."ai_inbox_rules" from "authenticated";

revoke truncate on table "public"."ai_inbox_rules" from "authenticated";

revoke update on table "public"."ai_inbox_rules" from "authenticated";

revoke delete on table "public"."ai_inbox_rules" from "service_role";

revoke insert on table "public"."ai_inbox_rules" from "service_role";

revoke references on table "public"."ai_inbox_rules" from "service_role";

revoke select on table "public"."ai_inbox_rules" from "service_role";

revoke trigger on table "public"."ai_inbox_rules" from "service_role";

revoke truncate on table "public"."ai_inbox_rules" from "service_role";

revoke update on table "public"."ai_inbox_rules" from "service_role";

revoke delete on table "public"."ai_integrations_oauth" from "anon";

revoke insert on table "public"."ai_integrations_oauth" from "anon";

revoke references on table "public"."ai_integrations_oauth" from "anon";

revoke select on table "public"."ai_integrations_oauth" from "anon";

revoke trigger on table "public"."ai_integrations_oauth" from "anon";

revoke truncate on table "public"."ai_integrations_oauth" from "anon";

revoke update on table "public"."ai_integrations_oauth" from "anon";

revoke delete on table "public"."ai_integrations_oauth" from "authenticated";

revoke insert on table "public"."ai_integrations_oauth" from "authenticated";

revoke references on table "public"."ai_integrations_oauth" from "authenticated";

revoke select on table "public"."ai_integrations_oauth" from "authenticated";

revoke trigger on table "public"."ai_integrations_oauth" from "authenticated";

revoke truncate on table "public"."ai_integrations_oauth" from "authenticated";

revoke update on table "public"."ai_integrations_oauth" from "authenticated";

revoke delete on table "public"."ai_integrations_oauth" from "service_role";

revoke insert on table "public"."ai_integrations_oauth" from "service_role";

revoke references on table "public"."ai_integrations_oauth" from "service_role";

revoke select on table "public"."ai_integrations_oauth" from "service_role";

revoke trigger on table "public"."ai_integrations_oauth" from "service_role";

revoke truncate on table "public"."ai_integrations_oauth" from "service_role";

revoke update on table "public"."ai_integrations_oauth" from "service_role";

revoke delete on table "public"."ai_messages" from "anon";

revoke insert on table "public"."ai_messages" from "anon";

revoke references on table "public"."ai_messages" from "anon";

revoke select on table "public"."ai_messages" from "anon";

revoke trigger on table "public"."ai_messages" from "anon";

revoke truncate on table "public"."ai_messages" from "anon";

revoke update on table "public"."ai_messages" from "anon";

revoke delete on table "public"."ai_messages" from "authenticated";

revoke insert on table "public"."ai_messages" from "authenticated";

revoke references on table "public"."ai_messages" from "authenticated";

revoke select on table "public"."ai_messages" from "authenticated";

revoke trigger on table "public"."ai_messages" from "authenticated";

revoke truncate on table "public"."ai_messages" from "authenticated";

revoke update on table "public"."ai_messages" from "authenticated";

revoke delete on table "public"."analytics_events" from "anon";

revoke insert on table "public"."analytics_events" from "anon";

revoke references on table "public"."analytics_events" from "anon";

revoke select on table "public"."analytics_events" from "anon";

revoke trigger on table "public"."analytics_events" from "anon";

revoke truncate on table "public"."analytics_events" from "anon";

revoke update on table "public"."analytics_events" from "anon";

revoke delete on table "public"."analytics_events" from "authenticated";

revoke insert on table "public"."analytics_events" from "authenticated";

revoke references on table "public"."analytics_events" from "authenticated";

revoke select on table "public"."analytics_events" from "authenticated";

revoke trigger on table "public"."analytics_events" from "authenticated";

revoke truncate on table "public"."analytics_events" from "authenticated";

revoke update on table "public"."analytics_events" from "authenticated";

revoke delete on table "public"."assessment_category" from "anon";

revoke insert on table "public"."assessment_category" from "anon";

revoke references on table "public"."assessment_category" from "anon";

revoke select on table "public"."assessment_category" from "anon";

revoke trigger on table "public"."assessment_category" from "anon";

revoke truncate on table "public"."assessment_category" from "anon";

revoke update on table "public"."assessment_category" from "anon";

revoke delete on table "public"."assessment_category" from "authenticated";

revoke insert on table "public"."assessment_category" from "authenticated";

revoke references on table "public"."assessment_category" from "authenticated";

revoke select on table "public"."assessment_category" from "authenticated";

revoke trigger on table "public"."assessment_category" from "authenticated";

revoke truncate on table "public"."assessment_category" from "authenticated";

revoke update on table "public"."assessment_category" from "authenticated";

revoke delete on table "public"."assessment_category_score" from "anon";

revoke insert on table "public"."assessment_category_score" from "anon";

revoke references on table "public"."assessment_category_score" from "anon";

revoke select on table "public"."assessment_category_score" from "anon";

revoke trigger on table "public"."assessment_category_score" from "anon";

revoke truncate on table "public"."assessment_category_score" from "anon";

revoke update on table "public"."assessment_category_score" from "anon";

revoke delete on table "public"."assessment_category_score" from "authenticated";

revoke insert on table "public"."assessment_category_score" from "authenticated";

revoke references on table "public"."assessment_category_score" from "authenticated";

revoke select on table "public"."assessment_category_score" from "authenticated";

revoke trigger on table "public"."assessment_category_score" from "authenticated";

revoke truncate on table "public"."assessment_category_score" from "authenticated";

revoke update on table "public"."assessment_category_score" from "authenticated";

revoke delete on table "public"."assessment_question" from "anon";

revoke insert on table "public"."assessment_question" from "anon";

revoke references on table "public"."assessment_question" from "anon";

revoke select on table "public"."assessment_question" from "anon";

revoke trigger on table "public"."assessment_question" from "anon";

revoke truncate on table "public"."assessment_question" from "anon";

revoke update on table "public"."assessment_question" from "anon";

revoke delete on table "public"."assessment_question" from "authenticated";

revoke insert on table "public"."assessment_question" from "authenticated";

revoke references on table "public"."assessment_question" from "authenticated";

revoke select on table "public"."assessment_question" from "authenticated";

revoke trigger on table "public"."assessment_question" from "authenticated";

revoke truncate on table "public"."assessment_question" from "authenticated";

revoke update on table "public"."assessment_question" from "authenticated";

revoke delete on table "public"."assessment_response" from "anon";

revoke insert on table "public"."assessment_response" from "anon";

revoke references on table "public"."assessment_response" from "anon";

revoke select on table "public"."assessment_response" from "anon";

revoke trigger on table "public"."assessment_response" from "anon";

revoke truncate on table "public"."assessment_response" from "anon";

revoke update on table "public"."assessment_response" from "anon";

revoke delete on table "public"."assessment_response" from "authenticated";

revoke insert on table "public"."assessment_response" from "authenticated";

revoke references on table "public"."assessment_response" from "authenticated";

revoke select on table "public"."assessment_response" from "authenticated";

revoke trigger on table "public"."assessment_response" from "authenticated";

revoke truncate on table "public"."assessment_response" from "authenticated";

revoke update on table "public"."assessment_response" from "authenticated";

revoke delete on table "public"."assessment_summary" from "anon";

revoke insert on table "public"."assessment_summary" from "anon";

revoke references on table "public"."assessment_summary" from "anon";

revoke select on table "public"."assessment_summary" from "anon";

revoke trigger on table "public"."assessment_summary" from "anon";

revoke truncate on table "public"."assessment_summary" from "anon";

revoke update on table "public"."assessment_summary" from "anon";

revoke delete on table "public"."assessment_summary" from "authenticated";

revoke insert on table "public"."assessment_summary" from "authenticated";

revoke references on table "public"."assessment_summary" from "authenticated";

revoke select on table "public"."assessment_summary" from "authenticated";

revoke trigger on table "public"."assessment_summary" from "authenticated";

revoke truncate on table "public"."assessment_summary" from "authenticated";

revoke update on table "public"."assessment_summary" from "authenticated";

revoke delete on table "public"."audit_logs" from "anon";

revoke insert on table "public"."audit_logs" from "anon";

revoke references on table "public"."audit_logs" from "anon";

revoke select on table "public"."audit_logs" from "anon";

revoke trigger on table "public"."audit_logs" from "anon";

revoke truncate on table "public"."audit_logs" from "anon";

revoke update on table "public"."audit_logs" from "anon";

revoke delete on table "public"."audit_logs" from "authenticated";

revoke insert on table "public"."audit_logs" from "authenticated";

revoke references on table "public"."audit_logs" from "authenticated";

revoke select on table "public"."audit_logs" from "authenticated";

revoke trigger on table "public"."audit_logs" from "authenticated";

revoke truncate on table "public"."audit_logs" from "authenticated";

revoke update on table "public"."audit_logs" from "authenticated";

revoke delete on table "public"."audit_logs" from "service_role";

revoke insert on table "public"."audit_logs" from "service_role";

revoke references on table "public"."audit_logs" from "service_role";

revoke select on table "public"."audit_logs" from "service_role";

revoke trigger on table "public"."audit_logs" from "service_role";

revoke truncate on table "public"."audit_logs" from "service_role";

revoke update on table "public"."audit_logs" from "service_role";

revoke delete on table "public"."business_metrics" from "anon";

revoke insert on table "public"."business_metrics" from "anon";

revoke references on table "public"."business_metrics" from "anon";

revoke select on table "public"."business_metrics" from "anon";

revoke trigger on table "public"."business_metrics" from "anon";

revoke truncate on table "public"."business_metrics" from "anon";

revoke update on table "public"."business_metrics" from "anon";

revoke delete on table "public"."business_metrics" from "authenticated";

revoke insert on table "public"."business_metrics" from "authenticated";

revoke references on table "public"."business_metrics" from "authenticated";

revoke select on table "public"."business_metrics" from "authenticated";

revoke trigger on table "public"."business_metrics" from "authenticated";

revoke truncate on table "public"."business_metrics" from "authenticated";

revoke update on table "public"."business_metrics" from "authenticated";

revoke delete on table "public"."callback_events" from "anon";

revoke insert on table "public"."callback_events" from "anon";

revoke references on table "public"."callback_events" from "anon";

revoke select on table "public"."callback_events" from "anon";

revoke trigger on table "public"."callback_events" from "anon";

revoke truncate on table "public"."callback_events" from "anon";

revoke update on table "public"."callback_events" from "anon";

revoke delete on table "public"."callback_events" from "authenticated";

revoke insert on table "public"."callback_events" from "authenticated";

revoke references on table "public"."callback_events" from "authenticated";

revoke select on table "public"."callback_events" from "authenticated";

revoke trigger on table "public"."callback_events" from "authenticated";

revoke truncate on table "public"."callback_events" from "authenticated";

revoke update on table "public"."callback_events" from "authenticated";

revoke delete on table "public"."callback_events" from "service_role";

revoke insert on table "public"."callback_events" from "service_role";

revoke references on table "public"."callback_events" from "service_role";

revoke select on table "public"."callback_events" from "service_role";

revoke trigger on table "public"."callback_events" from "service_role";

revoke truncate on table "public"."callback_events" from "service_role";

revoke update on table "public"."callback_events" from "service_role";

revoke delete on table "public"."chat_conversations" from "anon";

revoke insert on table "public"."chat_conversations" from "anon";

revoke references on table "public"."chat_conversations" from "anon";

revoke select on table "public"."chat_conversations" from "anon";

revoke trigger on table "public"."chat_conversations" from "anon";

revoke truncate on table "public"."chat_conversations" from "anon";

revoke update on table "public"."chat_conversations" from "anon";

revoke delete on table "public"."chat_conversations" from "authenticated";

revoke insert on table "public"."chat_conversations" from "authenticated";

revoke references on table "public"."chat_conversations" from "authenticated";

revoke select on table "public"."chat_conversations" from "authenticated";

revoke trigger on table "public"."chat_conversations" from "authenticated";

revoke truncate on table "public"."chat_conversations" from "authenticated";

revoke update on table "public"."chat_conversations" from "authenticated";

revoke delete on table "public"."chat_messages" from "anon";

revoke insert on table "public"."chat_messages" from "anon";

revoke references on table "public"."chat_messages" from "anon";

revoke select on table "public"."chat_messages" from "anon";

revoke trigger on table "public"."chat_messages" from "anon";

revoke truncate on table "public"."chat_messages" from "anon";

revoke update on table "public"."chat_messages" from "anon";

revoke delete on table "public"."chat_messages" from "authenticated";

revoke insert on table "public"."chat_messages" from "authenticated";

revoke references on table "public"."chat_messages" from "authenticated";

revoke select on table "public"."chat_messages" from "authenticated";

revoke trigger on table "public"."chat_messages" from "authenticated";

revoke truncate on table "public"."chat_messages" from "authenticated";

revoke update on table "public"."chat_messages" from "authenticated";

revoke references on table "public"."chat_usage_tracking" from "anon";

revoke trigger on table "public"."chat_usage_tracking" from "anon";

revoke truncate on table "public"."chat_usage_tracking" from "anon";

revoke references on table "public"."chat_usage_tracking" from "authenticated";

revoke trigger on table "public"."chat_usage_tracking" from "authenticated";

revoke truncate on table "public"."chat_usage_tracking" from "authenticated";

revoke delete on table "public"."chat_usage_tracking" from "service_role";

revoke insert on table "public"."chat_usage_tracking" from "service_role";

revoke references on table "public"."chat_usage_tracking" from "service_role";

revoke select on table "public"."chat_usage_tracking" from "service_role";

revoke trigger on table "public"."chat_usage_tracking" from "service_role";

revoke truncate on table "public"."chat_usage_tracking" from "service_role";

revoke update on table "public"."chat_usage_tracking" from "service_role";

revoke delete on table "public"."companies" from "anon";

revoke insert on table "public"."companies" from "anon";

revoke references on table "public"."companies" from "anon";

revoke select on table "public"."companies" from "anon";

revoke trigger on table "public"."companies" from "anon";

revoke truncate on table "public"."companies" from "anon";

revoke update on table "public"."companies" from "anon";

revoke delete on table "public"."companies" from "authenticated";

revoke insert on table "public"."companies" from "authenticated";

revoke references on table "public"."companies" from "authenticated";

revoke select on table "public"."companies" from "authenticated";

revoke trigger on table "public"."companies" from "authenticated";

revoke truncate on table "public"."companies" from "authenticated";

revoke update on table "public"."companies" from "authenticated";

revoke delete on table "public"."company_members" from "anon";

revoke insert on table "public"."company_members" from "anon";

revoke references on table "public"."company_members" from "anon";

revoke select on table "public"."company_members" from "anon";

revoke trigger on table "public"."company_members" from "anon";

revoke truncate on table "public"."company_members" from "anon";

revoke update on table "public"."company_members" from "anon";

revoke delete on table "public"."company_members" from "authenticated";

revoke insert on table "public"."company_members" from "authenticated";

revoke references on table "public"."company_members" from "authenticated";

revoke select on table "public"."company_members" from "authenticated";

revoke trigger on table "public"."company_members" from "authenticated";

revoke truncate on table "public"."company_members" from "authenticated";

revoke update on table "public"."company_members" from "authenticated";

revoke delete on table "public"."environment_config" from "anon";

revoke insert on table "public"."environment_config" from "anon";

revoke references on table "public"."environment_config" from "anon";

revoke select on table "public"."environment_config" from "anon";

revoke trigger on table "public"."environment_config" from "anon";

revoke truncate on table "public"."environment_config" from "anon";

revoke update on table "public"."environment_config" from "anon";

revoke delete on table "public"."environment_config" from "authenticated";

revoke insert on table "public"."environment_config" from "authenticated";

revoke references on table "public"."environment_config" from "authenticated";

revoke select on table "public"."environment_config" from "authenticated";

revoke trigger on table "public"."environment_config" from "authenticated";

revoke truncate on table "public"."environment_config" from "authenticated";

revoke update on table "public"."environment_config" from "authenticated";

revoke delete on table "public"."environment_config" from "service_role";

revoke insert on table "public"."environment_config" from "service_role";

revoke references on table "public"."environment_config" from "service_role";

revoke select on table "public"."environment_config" from "service_role";

revoke trigger on table "public"."environment_config" from "service_role";

revoke truncate on table "public"."environment_config" from "service_role";

revoke update on table "public"."environment_config" from "service_role";

revoke delete on table "public"."integration_ninjarmm_device_data" from "anon";

revoke insert on table "public"."integration_ninjarmm_device_data" from "anon";

revoke references on table "public"."integration_ninjarmm_device_data" from "anon";

revoke select on table "public"."integration_ninjarmm_device_data" from "anon";

revoke trigger on table "public"."integration_ninjarmm_device_data" from "anon";

revoke truncate on table "public"."integration_ninjarmm_device_data" from "anon";

revoke update on table "public"."integration_ninjarmm_device_data" from "anon";

revoke delete on table "public"."integration_ninjarmm_device_data" from "authenticated";

revoke insert on table "public"."integration_ninjarmm_device_data" from "authenticated";

revoke references on table "public"."integration_ninjarmm_device_data" from "authenticated";

revoke select on table "public"."integration_ninjarmm_device_data" from "authenticated";

revoke trigger on table "public"."integration_ninjarmm_device_data" from "authenticated";

revoke truncate on table "public"."integration_ninjarmm_device_data" from "authenticated";

revoke update on table "public"."integration_ninjarmm_device_data" from "authenticated";

revoke delete on table "public"."integration_ninjarmm_device_data" from "service_role";

revoke insert on table "public"."integration_ninjarmm_device_data" from "service_role";

revoke references on table "public"."integration_ninjarmm_device_data" from "service_role";

revoke select on table "public"."integration_ninjarmm_device_data" from "service_role";

revoke trigger on table "public"."integration_ninjarmm_device_data" from "service_role";

revoke truncate on table "public"."integration_ninjarmm_device_data" from "service_role";

revoke update on table "public"."integration_ninjarmm_device_data" from "service_role";

revoke delete on table "public"."integrations" from "anon";

revoke insert on table "public"."integrations" from "anon";

revoke references on table "public"."integrations" from "anon";

revoke select on table "public"."integrations" from "anon";

revoke trigger on table "public"."integrations" from "anon";

revoke truncate on table "public"."integrations" from "anon";

revoke update on table "public"."integrations" from "anon";

revoke delete on table "public"."n8n_configurations" from "anon";

revoke insert on table "public"."n8n_configurations" from "anon";

revoke references on table "public"."n8n_configurations" from "anon";

revoke select on table "public"."n8n_configurations" from "anon";

revoke trigger on table "public"."n8n_configurations" from "anon";

revoke truncate on table "public"."n8n_configurations" from "anon";

revoke update on table "public"."n8n_configurations" from "anon";

revoke delete on table "public"."n8n_configurations" from "authenticated";

revoke insert on table "public"."n8n_configurations" from "authenticated";

revoke references on table "public"."n8n_configurations" from "authenticated";

revoke select on table "public"."n8n_configurations" from "authenticated";

revoke trigger on table "public"."n8n_configurations" from "authenticated";

revoke truncate on table "public"."n8n_configurations" from "authenticated";

revoke update on table "public"."n8n_configurations" from "authenticated";

revoke delete on table "public"."oauth_tokens" from "anon";

revoke insert on table "public"."oauth_tokens" from "anon";

revoke references on table "public"."oauth_tokens" from "anon";

revoke select on table "public"."oauth_tokens" from "anon";

revoke trigger on table "public"."oauth_tokens" from "anon";

revoke truncate on table "public"."oauth_tokens" from "anon";

revoke update on table "public"."oauth_tokens" from "anon";

revoke delete on table "public"."oauth_tokens" from "authenticated";

revoke insert on table "public"."oauth_tokens" from "authenticated";

revoke references on table "public"."oauth_tokens" from "authenticated";

revoke select on table "public"."oauth_tokens" from "authenticated";

revoke trigger on table "public"."oauth_tokens" from "authenticated";

revoke truncate on table "public"."oauth_tokens" from "authenticated";

revoke update on table "public"."oauth_tokens" from "authenticated";

revoke references on table "public"."personal_automations" from "anon";

revoke trigger on table "public"."personal_automations" from "anon";

revoke truncate on table "public"."personal_automations" from "anon";

revoke references on table "public"."personal_automations" from "authenticated";

revoke trigger on table "public"."personal_automations" from "authenticated";

revoke truncate on table "public"."personal_automations" from "authenticated";

revoke delete on table "public"."personal_automations" from "service_role";

revoke insert on table "public"."personal_automations" from "service_role";

revoke references on table "public"."personal_automations" from "service_role";

revoke select on table "public"."personal_automations" from "service_role";

revoke trigger on table "public"."personal_automations" from "service_role";

revoke truncate on table "public"."personal_automations" from "service_role";

revoke update on table "public"."personal_automations" from "service_role";

revoke references on table "public"."personal_thoughts" from "anon";

revoke trigger on table "public"."personal_thoughts" from "anon";

revoke truncate on table "public"."personal_thoughts" from "anon";

revoke references on table "public"."personal_thoughts" from "authenticated";

revoke trigger on table "public"."personal_thoughts" from "authenticated";

revoke truncate on table "public"."personal_thoughts" from "authenticated";

revoke delete on table "public"."personal_thoughts" from "service_role";

revoke insert on table "public"."personal_thoughts" from "service_role";

revoke references on table "public"."personal_thoughts" from "service_role";

revoke select on table "public"."personal_thoughts" from "service_role";

revoke trigger on table "public"."personal_thoughts" from "service_role";

revoke truncate on table "public"."personal_thoughts" from "service_role";

revoke update on table "public"."personal_thoughts" from "service_role";

revoke delete on table "public"."recent" from "anon";

revoke insert on table "public"."recent" from "anon";

revoke references on table "public"."recent" from "anon";

revoke select on table "public"."recent" from "anon";

revoke trigger on table "public"."recent" from "anon";

revoke truncate on table "public"."recent" from "anon";

revoke update on table "public"."recent" from "anon";

revoke delete on table "public"."recent" from "authenticated";

revoke insert on table "public"."recent" from "authenticated";

revoke references on table "public"."recent" from "authenticated";

revoke select on table "public"."recent" from "authenticated";

revoke trigger on table "public"."recent" from "authenticated";

revoke truncate on table "public"."recent" from "authenticated";

revoke update on table "public"."recent" from "authenticated";

revoke delete on table "public"."tasks" from "anon";

revoke insert on table "public"."tasks" from "anon";

revoke references on table "public"."tasks" from "anon";

revoke select on table "public"."tasks" from "anon";

revoke trigger on table "public"."tasks" from "anon";

revoke truncate on table "public"."tasks" from "anon";

revoke update on table "public"."tasks" from "anon";

revoke delete on table "public"."tasks" from "authenticated";

revoke insert on table "public"."tasks" from "authenticated";

revoke references on table "public"."tasks" from "authenticated";

revoke select on table "public"."tasks" from "authenticated";

revoke trigger on table "public"."tasks" from "authenticated";

revoke truncate on table "public"."tasks" from "authenticated";

revoke update on table "public"."tasks" from "authenticated";

revoke delete on table "public"."thoughts" from "anon";

revoke insert on table "public"."thoughts" from "anon";

revoke references on table "public"."thoughts" from "anon";

revoke select on table "public"."thoughts" from "anon";

revoke trigger on table "public"."thoughts" from "anon";

revoke truncate on table "public"."thoughts" from "anon";

revoke update on table "public"."thoughts" from "anon";

revoke delete on table "public"."thoughts" from "authenticated";

revoke insert on table "public"."thoughts" from "authenticated";

revoke references on table "public"."thoughts" from "authenticated";

revoke select on table "public"."thoughts" from "authenticated";

revoke trigger on table "public"."thoughts" from "authenticated";

revoke truncate on table "public"."thoughts" from "authenticated";

revoke update on table "public"."thoughts" from "authenticated";

revoke delete on table "public"."user_activity" from "anon";

revoke insert on table "public"."user_activity" from "anon";

revoke references on table "public"."user_activity" from "anon";

revoke select on table "public"."user_activity" from "anon";

revoke trigger on table "public"."user_activity" from "anon";

revoke truncate on table "public"."user_activity" from "anon";

revoke update on table "public"."user_activity" from "anon";

revoke delete on table "public"."user_activity" from "authenticated";

revoke insert on table "public"."user_activity" from "authenticated";

revoke references on table "public"."user_activity" from "authenticated";

revoke select on table "public"."user_activity" from "authenticated";

revoke trigger on table "public"."user_activity" from "authenticated";

revoke truncate on table "public"."user_activity" from "authenticated";

revoke update on table "public"."user_activity" from "authenticated";

revoke delete on table "public"."user_integrations" from "anon";

revoke insert on table "public"."user_integrations" from "anon";

revoke references on table "public"."user_integrations" from "anon";

revoke select on table "public"."user_integrations" from "anon";

revoke trigger on table "public"."user_integrations" from "anon";

revoke truncate on table "public"."user_integrations" from "anon";

revoke update on table "public"."user_integrations" from "anon";

revoke references on table "public"."user_licenses" from "anon";

revoke trigger on table "public"."user_licenses" from "anon";

revoke truncate on table "public"."user_licenses" from "anon";

revoke references on table "public"."user_licenses" from "authenticated";

revoke trigger on table "public"."user_licenses" from "authenticated";

revoke truncate on table "public"."user_licenses" from "authenticated";

revoke delete on table "public"."user_licenses" from "service_role";

revoke insert on table "public"."user_licenses" from "service_role";

revoke references on table "public"."user_licenses" from "service_role";

revoke select on table "public"."user_licenses" from "service_role";

revoke trigger on table "public"."user_licenses" from "service_role";

revoke truncate on table "public"."user_licenses" from "service_role";

revoke update on table "public"."user_licenses" from "service_role";

alter table "public"."callback_events" drop constraint "callback_events_company_id_fkey";

alter table "public"."callback_events" drop constraint "callback_events_user_id_fkey";

alter table "public"."user_integrations" drop constraint "user_integrations_integration_id_fkey";

alter table "public"."user_profiles" drop constraint "user_profiles_company_id_fkey";

drop function if exists "public"."apply_company_level_policies"(table_name text);

drop function if exists "public"."apply_hybrid_policies"(table_name text);

drop function if exists "public"."apply_readonly_policies"(table_name text);

drop function if exists "public"."apply_user_level_policies"(table_name text);

drop function if exists "public"."create_user_profile_if_missing"();

drop function if exists "public"."debug_auth_context"();

drop function if exists "public"."get_business_profile_safe"(org_id uuid);

drop function if exists "public"."get_user_profile_safe"(user_id uuid);

drop function if exists "public"."list_policy_summary"();

drop function if exists "public"."validate_auth_context"();

drop function if exists "public"."validate_policy_coverage"();

alter table "public"."callback_events" drop constraint "callback_events_pkey";

drop index if exists "public"."callback_events_pkey";

drop index if exists "public"."idx_analytics_events_event_type";

drop index if exists "public"."idx_callback_events_company_id";

drop index if exists "public"."idx_callback_events_created_at";

drop index if exists "public"."idx_callback_events_event_type";

drop index if exists "public"."idx_callback_events_status";

drop index if exists "public"."idx_callback_events_user_id";

drop table "public"."callback_events";

create table "public"."billing_accounts" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "stripe_customer_id" text,
    "payment_method_id" text,
    "billing_email" text not null,
    "billing_address" jsonb default '{}'::jsonb,
    "tax_id" text,
    "currency" text default 'USD'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."billing_accounts" enable row level security;

create table "public"."business_profiles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "legal_structure" text,
    "industry" text,
    "core_products" text[] default '{}'::text[],
    "target_clients" text[] default '{}'::text[],
    "business_stage" text,
    "annual_revenue" text,
    "team_size" text,
    "primary_channels" text[] default '{}'::text[],
    "key_metrics" text[] default '{}'::text[],
    "pain_points" text[] default '{}'::text[],
    "business_email" text,
    "primary_goals" text[] default '{}'::text[],
    "timeline" text,
    "assessment_completion_percentage" integer default 0,
    "last_assessment_date" timestamp with time zone,
    "assessment_version" text default '1.0.0'::text,
    "auto_detected_answers" jsonb default '[]'::jsonb,
    "data_sources" text[] default '{}'::text[],
    "auto_detection_confidence" integer default 0,
    "business_context" jsonb default '{}'::jsonb,
    "ai_insights" jsonb default '[]'::jsonb,
    "recommendations" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "company_name" text,
    "company_size" text,
    "competitive_advantages" text[] default '{}'::text[],
    "current_clients" text[] default '{}'::text[],
    "business_model" text,
    "org_id" uuid,
    "business_email_domain" text,
    "business_email_analysis" jsonb default '{}'::jsonb,
    "competitive_landscape" jsonb default '{}'::jsonb,
    "market_research_data" jsonb default '{}'::jsonb,
    "performance_metrics" jsonb default '{}'::jsonb,
    "integration_data" jsonb default '{}'::jsonb,
    "business_health_history" jsonb default '[]'::jsonb,
    "strategic_roadmap" jsonb default '{}'::jsonb,
    "risk_assessment" jsonb default '{}'::jsonb,
    "opportunity_analysis" jsonb default '{}'::jsonb
);


alter table "public"."business_profiles" enable row level security;

create table "public"."calendar_events" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "start_time" timestamp with time zone not null,
    "end_time" timestamp with time zone not null,
    "all_day" boolean default false,
    "location" text,
    "company_id" uuid,
    "created_by" uuid not null,
    "event_type" text default 'meeting'::text,
    "status" text default 'scheduled'::text,
    "attendees" jsonb default '[]'::jsonb,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."calendar_events" enable row level security;

create table "public"."company_audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "user_id" uuid not null,
    "action" text not null,
    "resource" text not null,
    "details" jsonb default '{}'::jsonb,
    "ip_address" inet,
    "created_at" timestamp with time zone default now()
);


alter table "public"."company_audit_logs" enable row level security;

create table "public"."company_billing" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "plan" text not null,
    "status" text default 'active'::text,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "amount" numeric(10,2),
    "currency" text default 'USD'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."company_billing" enable row level security;

create table "public"."company_export_requests" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "requested_by" uuid not null,
    "type" text not null,
    "status" text default 'pending'::text,
    "file_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."company_export_requests" enable row level security;

create table "public"."company_invitations" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "email" text not null,
    "role_id" uuid not null,
    "department_id" uuid,
    "invited_by" uuid not null,
    "status" text default 'pending'::text,
    "expires_at" timestamp with time zone default (now() + '7 days'::interval),
    "accepted_at" timestamp with time zone,
    "accepted_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."company_invitations" enable row level security;

create table "public"."company_notifications" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "type" text not null,
    "title" text not null,
    "message" text not null,
    "is_read" boolean default false,
    "created_by" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."company_notifications" enable row level security;

create table "public"."company_reports" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "name" text not null,
    "type" text not null,
    "schedule" text,
    "recipients" text[] default '{}'::text[],
    "last_generated" timestamp with time zone,
    "created_by" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."company_reports" enable row level security;

create table "public"."company_roles" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid,
    "name" text not null,
    "description" text,
    "permissions" text[] default '{}'::text[],
    "is_system_role" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."company_roles" enable row level security;

create table "public"."company_templates" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "name" text not null,
    "type" text not null,
    "content" jsonb default '{}'::jsonb,
    "created_by" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."company_templates" enable row level security;

create table "public"."company_usage" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "date" date not null,
    "api_calls" integer default 0,
    "storage_used" bigint default 0,
    "active_users" integer default 0,
    "created_at" timestamp with time zone default now()
);


alter table "public"."company_usage" enable row level security;

create table "public"."company_workflows" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "name" text not null,
    "description" text,
    "steps" jsonb default '[]'::jsonb,
    "is_active" boolean default true,
    "created_by" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."company_workflows" enable row level security;

create table "public"."contacts" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "company_id" uuid,
    "integration_id" uuid,
    "first_name" text not null,
    "last_name" text,
    "email" text,
    "phone" text,
    "job_title" text,
    "department" text,
    "hubspotid" text,
    "external_id" text,
    "company_name" text,
    "lead_source" text,
    "status" text default 'active'::text,
    "notes" text,
    "tags" text[] default '{}'::text[],
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."contacts" enable row level security;

create table "public"."data_point_relationships" (
    "id" uuid not null default gen_random_uuid(),
    "user_integration_id" uuid not null,
    "datapoint_id" text not null,
    "datapoint_name" text not null,
    "related_datapoints" text[] default '{}'::text[],
    "dependencies" text[] default '{}'::text[],
    "consumers" text[] default '{}'::text[],
    "data_flow" text default 'both'::text,
    "last_validated" timestamp with time zone default now(),
    "validation_status" text default 'unknown'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."data_point_relationships" enable row level security;

create table "public"."deals" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "company_id" uuid,
    "contact_id" uuid,
    "integration_id" uuid,
    "title" text not null,
    "description" text,
    "amount" numeric(15,2),
    "currency" text default 'USD'::text,
    "stage" text default 'prospecting'::text,
    "probability" numeric(5,2),
    "hubspotid" text,
    "external_id" text,
    "close_date" timestamp with time zone,
    "lead_source" text,
    "notes" text,
    "tags" text[] default '{}'::text[],
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."deals" enable row level security;

create table "public"."departments" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "name" text not null,
    "description" text,
    "manager_id" uuid,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."departments" enable row level security;

create table "public"."document_folders" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "parent_id" uuid,
    "company_id" uuid not null,
    "created_by" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."document_folders" enable row level security;

create table "public"."document_shares" (
    "id" uuid not null default gen_random_uuid(),
    "document_id" uuid not null,
    "shared_with_user_id" uuid,
    "shared_with_company_id" uuid,
    "permission" text not null,
    "expires_at" timestamp with time zone,
    "created_by" uuid not null,
    "created_at" timestamp with time zone default now()
);


create table "public"."documents" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "content" text,
    "file_path" text,
    "file_size" bigint,
    "mime_type" text,
    "company_id" uuid not null,
    "created_by" uuid not null,
    "folder_id" uuid,
    "is_public" boolean default false,
    "tags" text[] default '{}'::text[],
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."documents" enable row level security;

create table "public"."entity_mappings" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "entity_type" text not null,
    "canonical_id" uuid not null,
    "canonical_type" text not null,
    "integration_id" uuid,
    "integration_name" text not null,
    "external_id" text not null,
    "external_system" text not null,
    "confidence_score" numeric(3,2) default 1.0,
    "match_method" text,
    "match_reason" text,
    "metadata" jsonb default '{}'::jsonb,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."entity_mappings" enable row level security;

create table "public"."entity_resolution_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "entity_type" text not null,
    "external_id" text not null,
    "external_system" text not null,
    "integration_id" uuid,
    "resolution_method" text,
    "confidence_score" numeric(3,2),
    "canonical_id" uuid,
    "matched_entities" text[] default '{}'::text[],
    "processing_time_ms" integer,
    "error_message" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."entity_resolution_logs" enable row level security;

create table "public"."entity_similarity_scores" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "entity1_id" uuid not null,
    "entity1_type" text not null,
    "entity1_integration" text not null,
    "entity1_external_id" text not null,
    "entity2_id" uuid not null,
    "entity2_type" text not null,
    "entity2_integration" text not null,
    "entity2_external_id" text not null,
    "overall_score" numeric(3,2) not null,
    "name_similarity" numeric(3,2),
    "email_similarity" numeric(3,2),
    "phone_similarity" numeric(3,2),
    "domain_similarity" numeric(3,2),
    "address_similarity" numeric(3,2),
    "ai_confidence" numeric(3,2),
    "ai_reasoning" text,
    "reviewed_by" uuid,
    "review_decision" text,
    "review_notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."entity_similarity_scores" enable row level security;

create table "public"."integration_data" (
    "id" uuid not null default gen_random_uuid(),
    "user_integration_id" uuid not null,
    "data_point_definition_id" text,
    "data_type" text not null,
    "data_content" jsonb not null,
    "data_category" text,
    "business_value" text,
    "is_required" boolean default false,
    "refresh_frequency" text,
    "sample_value" jsonb,
    "validation_rules" jsonb,
    "sync_timestamp" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."integration_data" enable row level security;

create table "public"."integration_sync_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "integration_id" uuid not null,
    "sync_type" text not null default 'full'::text,
    "records_processed" integer not null default 0,
    "status" text not null default 'success'::text,
    "executed_at" timestamp with time zone not null default now(),
    "duration_ms" integer,
    "errors" jsonb default '[]'::jsonb,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."integration_sync_logs" enable row level security;

create table "public"."integration_types" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "icon" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
);


create table "public"."notification_templates" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "subject" text,
    "body" text not null,
    "type" text not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
);


create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "message" text not null,
    "type" text default 'info'::text,
    "category" text default 'system'::text,
    "is_read" boolean default false,
    "action_url" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "read_at" timestamp with time zone
);


alter table "public"."notifications" enable row level security;

create table "public"."operation_contexts" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "org_id" uuid,
    "user_id" uuid not null,
    "operation" text not null,
    "table_name" text,
    "record_id" uuid,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."operation_contexts" enable row level security;

create table "public"."org_groups" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."org_groups" enable row level security;

create table "public"."organizations" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "name" text not null,
    "slug" text not null,
    "description" text,
    "org_group_id" uuid,
    "settings" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."organizations" enable row level security;

create table "public"."project_members" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "user_id" uuid not null,
    "role" text default 'member'::text,
    "joined_at" timestamp with time zone default now()
);


alter table "public"."project_members" enable row level security;

create table "public"."project_statuses" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "color" text default '#6B7280'::text,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now()
);


create table "public"."projects" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "company_id" uuid not null,
    "owner_id" uuid not null,
    "status" text default 'active'::text,
    "priority" text default 'medium'::text,
    "start_date" date,
    "end_date" date,
    "budget" numeric,
    "progress" integer default 0,
    "tags" text[] default '{}'::text[],
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."projects" enable row level security;

create table "public"."rls_denials" (
    "id" uuid not null default gen_random_uuid(),
    "event_time" timestamp with time zone default now(),
    "user_id" uuid,
    "tenant_id" uuid,
    "org_id" uuid,
    "table_name" text not null,
    "operation" text not null,
    "error_message" text,
    "request_path" text,
    "user_agent" text,
    "ip_address" inet,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."rls_denials" enable row level security;

create table "public"."shared_records" (
    "id" uuid not null default gen_random_uuid(),
    "table_name" text not null,
    "record_id" uuid not null,
    "shared_by_tenant_id" uuid not null,
    "shared_with_tenant_ids" jsonb default '[]'::jsonb,
    "shared_with_org_ids" jsonb default '[]'::jsonb,
    "permissions" text[] default '{read}'::text[],
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
);


alter table "public"."shared_records" enable row level security;

create table "public"."slow_queries" (
    "id" uuid not null default gen_random_uuid(),
    "query_text" text not null,
    "execution_time_ms" integer not null,
    "rows_returned" integer,
    "tenant_id" uuid,
    "org_id" uuid,
    "user_id" uuid,
    "table_name" text,
    "operation" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."slow_queries" enable row level security;

create table "public"."subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "plan" text not null,
    "status" text default 'active'::text,
    "seats" integer not null default 1,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "stripe_subscription_id" text,
    "stripe_customer_id" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."subscriptions" enable row level security;

create table "public"."system_settings" (
    "id" uuid not null default gen_random_uuid(),
    "key" text not null,
    "value" jsonb not null,
    "description" text,
    "is_public" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."system_settings" enable row level security;

create table "public"."task_attachments" (
    "id" uuid not null default gen_random_uuid(),
    "task_id" uuid not null,
    "file_name" text not null,
    "file_path" text not null,
    "file_size" bigint,
    "mime_type" text,
    "uploaded_by" uuid not null,
    "created_at" timestamp with time zone default now()
);


create table "public"."task_comments" (
    "id" uuid not null default gen_random_uuid(),
    "task_id" uuid not null,
    "user_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."task_priorities" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "color" text default '#6B7280'::text,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now()
);


create table "public"."task_statuses" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "color" text default '#6B7280'::text,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now()
);


create table "public"."tenant_entitlements" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "resource" text not null,
    "action" text not null,
    "limit_value" integer,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."tenant_entitlements" enable row level security;

create table "public"."tenant_notifications" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "type" text not null,
    "title" text not null,
    "message" text not null,
    "is_read" boolean default false,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."tenant_notifications" enable row level security;

create table "public"."tenants" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "parent_id" uuid,
    "billing_account_id" text,
    "status" text default 'active'::text,
    "settings" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."tenants" enable row level security;

create table "public"."usage_events" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "org_id" uuid,
    "user_id" uuid not null,
    "resource" text not null,
    "action" text not null,
    "quantity" integer not null default 1,
    "cost" numeric(10,4),
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."usage_events" enable row level security;

create table "public"."user_activity_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "action" text not null,
    "resource_type" text,
    "resource_id" uuid,
    "metadata" jsonb default '{}'::jsonb,
    "ip_address" inet,
    "user_agent" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."user_activity_logs" enable row level security;

create table "public"."user_api_keys" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "key_hash" text not null,
    "permissions" text[] default '{}'::text[],
    "is_active" boolean default true,
    "last_used_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_api_keys" enable row level security;

create table "public"."user_company_roles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "company_id" uuid not null,
    "role_id" uuid not null,
    "department_id" uuid,
    "is_primary" boolean default false,
    "assigned_by" uuid not null,
    "assigned_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone
);


alter table "public"."user_company_roles" enable row level security;

create table "public"."user_invitations" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "invited_by" uuid not null,
    "company_id" uuid,
    "role_id" uuid,
    "status" text default 'pending'::text,
    "token" text not null,
    "expires_at" timestamp with time zone not null,
    "accepted_at" timestamp with time zone,
    "accepted_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_invitations" enable row level security;

create table "public"."user_notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "message" text not null,
    "type" text not null,
    "is_read" boolean default false,
    "action_url" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
);


create table "public"."user_organizations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "org_id" uuid not null,
    "role" text not null default 'member'::text,
    "permissions" text[] default '{}'::text[],
    "is_primary" boolean default false,
    "joined_at" timestamp with time zone default now()
);


alter table "public"."user_organizations" enable row level security;

create table "public"."user_preferences" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "theme" text default 'system'::text,
    "language" text default 'en'::text,
    "timezone" text default 'UTC'::text,
    "notifications_enabled" boolean default true,
    "email_notifications" boolean default true,
    "push_notifications" boolean default false,
    "dashboard_layout" jsonb default '{}'::jsonb,
    "sidebar_collapsed" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_preferences" enable row level security;

create table "public"."user_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "session_token" text not null,
    "expires_at" timestamp with time zone not null,
    "ip_address" inet,
    "user_agent" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_sessions" enable row level security;

alter table "public"."companies" add column "created_by" uuid;

alter table "public"."tasks" add column "user_id" uuid not null;

alter table "public"."thoughts" add column "category" text not null;

alter table "public"."thoughts" add column "status" text not null;

alter table "public"."user_profiles" drop column "company";

alter table "public"."user_profiles" add column "department" text;

alter table "public"."user_profiles" add column "display_name" text;

alter table "public"."user_profiles" add column "first_name" text;

alter table "public"."user_profiles" add column "job_title" text;

alter table "public"."user_profiles" add column "last_name" text;

alter table "public"."user_profiles" add column "onboarding_completed" boolean default false;

alter table "public"."user_profiles" add column "phone" text;

alter table "public"."user_profiles" add column "timezone" text default 'UTC'::text;

alter table "public"."user_profiles" alter column "preferences" set default '{"theme": "system", "language": "en", "notifications": true}'::jsonb;

alter table "public"."user_profiles" alter column "role" set default 'user'::text;

CREATE UNIQUE INDEX billing_accounts_pkey ON public.billing_accounts USING btree (id);

CREATE UNIQUE INDEX billing_accounts_tenant_id_key ON public.billing_accounts USING btree (tenant_id);

CREATE UNIQUE INDEX business_profiles_pkey ON public.business_profiles USING btree (id);

CREATE UNIQUE INDEX calendar_events_pkey ON public.calendar_events USING btree (id);

CREATE UNIQUE INDEX company_audit_logs_pkey ON public.company_audit_logs USING btree (id);

CREATE UNIQUE INDEX company_billing_pkey ON public.company_billing USING btree (id);

CREATE UNIQUE INDEX company_export_requests_pkey ON public.company_export_requests USING btree (id);

CREATE UNIQUE INDEX company_invitations_pkey ON public.company_invitations USING btree (id);

CREATE UNIQUE INDEX company_notifications_pkey ON public.company_notifications USING btree (id);

CREATE UNIQUE INDEX company_reports_pkey ON public.company_reports USING btree (id);

CREATE UNIQUE INDEX company_roles_pkey ON public.company_roles USING btree (id);

CREATE UNIQUE INDEX company_templates_pkey ON public.company_templates USING btree (id);

CREATE UNIQUE INDEX company_usage_pkey ON public.company_usage USING btree (id);

CREATE UNIQUE INDEX company_workflows_pkey ON public.company_workflows USING btree (id);

CREATE UNIQUE INDEX contacts_hubspotid_key ON public.contacts USING btree (hubspotid);

CREATE UNIQUE INDEX contacts_pkey ON public.contacts USING btree (id);

CREATE UNIQUE INDEX data_point_relationships_pkey ON public.data_point_relationships USING btree (id);

CREATE UNIQUE INDEX data_point_relationships_user_integration_id_datapoint_id_key ON public.data_point_relationships USING btree (user_integration_id, datapoint_id);

CREATE UNIQUE INDEX deals_hubspotid_key ON public.deals USING btree (hubspotid);

CREATE UNIQUE INDEX deals_pkey ON public.deals USING btree (id);

CREATE UNIQUE INDEX departments_company_id_name_key ON public.departments USING btree (company_id, name);

CREATE UNIQUE INDEX departments_pkey ON public.departments USING btree (id);

CREATE UNIQUE INDEX document_folders_pkey ON public.document_folders USING btree (id);

CREATE UNIQUE INDEX document_shares_pkey ON public.document_shares USING btree (id);

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

CREATE UNIQUE INDEX entity_mappings_integration_id_external_id_entity_type_key ON public.entity_mappings USING btree (integration_id, external_id, entity_type);

CREATE UNIQUE INDEX entity_mappings_pkey ON public.entity_mappings USING btree (id);

CREATE UNIQUE INDEX entity_resolution_logs_pkey ON public.entity_resolution_logs USING btree (id);

CREATE UNIQUE INDEX entity_similarity_scores_entity1_id_entity1_integration_ent_key ON public.entity_similarity_scores USING btree (entity1_id, entity1_integration, entity1_external_id, entity2_id, entity2_integration, entity2_external_id);

CREATE UNIQUE INDEX entity_similarity_scores_pkey ON public.entity_similarity_scores USING btree (id);

CREATE INDEX idx_billing_accounts_stripe_customer_id ON public.billing_accounts USING btree (stripe_customer_id);

CREATE INDEX idx_billing_accounts_tenant_id ON public.billing_accounts USING btree (tenant_id);

CREATE INDEX idx_business_profiles_ai_insights_gin ON public.business_profiles USING gin (ai_insights);

CREATE INDEX idx_business_profiles_annual_revenue ON public.business_profiles USING btree (annual_revenue);

CREATE INDEX idx_business_profiles_assessment_completion ON public.business_profiles USING btree (assessment_completion_percentage);

CREATE INDEX idx_business_profiles_business_context_gin ON public.business_profiles USING gin (business_context);

CREATE INDEX idx_business_profiles_business_email_analysis_gin ON public.business_profiles USING gin (business_email_analysis);

CREATE INDEX idx_business_profiles_business_email_domain ON public.business_profiles USING btree (business_email_domain);

CREATE INDEX idx_business_profiles_business_health_history_gin ON public.business_profiles USING gin (business_health_history);

CREATE INDEX idx_business_profiles_business_model ON public.business_profiles USING btree (business_model);

CREATE INDEX idx_business_profiles_business_stage ON public.business_profiles USING btree (business_stage);

CREATE INDEX idx_business_profiles_company_name ON public.business_profiles USING btree (company_name);

CREATE INDEX idx_business_profiles_company_size ON public.business_profiles USING btree (company_size);

CREATE INDEX idx_business_profiles_competitive_advantages_gin ON public.business_profiles USING gin (competitive_advantages);

CREATE INDEX idx_business_profiles_competitive_landscape_gin ON public.business_profiles USING gin (competitive_landscape);

CREATE INDEX idx_business_profiles_core_products_gin ON public.business_profiles USING gin (core_products);

CREATE INDEX idx_business_profiles_current_clients_gin ON public.business_profiles USING gin (current_clients);

CREATE INDEX idx_business_profiles_data_sources_gin ON public.business_profiles USING gin (data_sources);

CREATE INDEX idx_business_profiles_industry ON public.business_profiles USING btree (industry);

CREATE INDEX idx_business_profiles_integration_data_gin ON public.business_profiles USING gin (integration_data);

CREATE INDEX idx_business_profiles_key_metrics_gin ON public.business_profiles USING gin (key_metrics);

CREATE INDEX idx_business_profiles_market_research_data_gin ON public.business_profiles USING gin (market_research_data);

CREATE INDEX idx_business_profiles_opportunity_analysis_gin ON public.business_profiles USING gin (opportunity_analysis);

CREATE INDEX idx_business_profiles_org_id ON public.business_profiles USING btree (org_id);

CREATE INDEX idx_business_profiles_pain_points_gin ON public.business_profiles USING gin (pain_points);

CREATE INDEX idx_business_profiles_performance_metrics_gin ON public.business_profiles USING gin (performance_metrics);

CREATE INDEX idx_business_profiles_primary_channels_gin ON public.business_profiles USING gin (primary_channels);

CREATE INDEX idx_business_profiles_primary_goals_gin ON public.business_profiles USING gin (primary_goals);

CREATE INDEX idx_business_profiles_recommendations_gin ON public.business_profiles USING gin (recommendations);

CREATE INDEX idx_business_profiles_risk_assessment_gin ON public.business_profiles USING gin (risk_assessment);

CREATE INDEX idx_business_profiles_strategic_roadmap_gin ON public.business_profiles USING gin (strategic_roadmap);

CREATE INDEX idx_business_profiles_target_clients_gin ON public.business_profiles USING gin (target_clients);

CREATE INDEX idx_business_profiles_team_size ON public.business_profiles USING btree (team_size);

CREATE INDEX idx_business_profiles_user_id ON public.business_profiles USING btree (user_id);

CREATE INDEX idx_calendar_events_company_id ON public.calendar_events USING btree (company_id);

CREATE INDEX idx_calendar_events_created_by ON public.calendar_events USING btree (created_by);

CREATE INDEX idx_calendar_events_start_time ON public.calendar_events USING btree (start_time);

CREATE INDEX idx_companies_created_by ON public.companies USING btree (created_by);

CREATE INDEX idx_company_audit_logs_company_id ON public.company_audit_logs USING btree (company_id);

CREATE INDEX idx_company_audit_logs_created_at ON public.company_audit_logs USING btree (created_at);

CREATE INDEX idx_company_audit_logs_user_id ON public.company_audit_logs USING btree (user_id);

CREATE INDEX idx_company_billing_company_id ON public.company_billing USING btree (company_id);

CREATE INDEX idx_company_billing_status ON public.company_billing USING btree (status);

CREATE INDEX idx_company_export_requests_company_id ON public.company_export_requests USING btree (company_id);

CREATE INDEX idx_company_export_requests_status ON public.company_export_requests USING btree (status);

CREATE INDEX idx_company_invitations_company_id ON public.company_invitations USING btree (company_id);

CREATE INDEX idx_company_invitations_email ON public.company_invitations USING btree (email);

CREATE INDEX idx_company_invitations_status ON public.company_invitations USING btree (status);

CREATE INDEX idx_company_notifications_company_id ON public.company_notifications USING btree (company_id);

CREATE INDEX idx_company_notifications_is_read ON public.company_notifications USING btree (is_read);

CREATE INDEX idx_company_reports_company_id ON public.company_reports USING btree (company_id);

CREATE INDEX idx_company_reports_type ON public.company_reports USING btree (type);

CREATE INDEX idx_company_roles_company_id ON public.company_roles USING btree (company_id);

CREATE INDEX idx_company_roles_name ON public.company_roles USING btree (name);

CREATE INDEX idx_company_templates_company_id ON public.company_templates USING btree (company_id);

CREATE INDEX idx_company_templates_type ON public.company_templates USING btree (type);

CREATE INDEX idx_company_usage_company_id ON public.company_usage USING btree (company_id);

CREATE INDEX idx_company_usage_date ON public.company_usage USING btree (date);

CREATE INDEX idx_company_workflows_company_id ON public.company_workflows USING btree (company_id);

CREATE INDEX idx_company_workflows_is_active ON public.company_workflows USING btree (is_active);

CREATE INDEX idx_contacts_company_id ON public.contacts USING btree (company_id);

CREATE INDEX idx_contacts_email ON public.contacts USING btree (email);

CREATE INDEX idx_contacts_hubspotid ON public.contacts USING btree (hubspotid);

CREATE INDEX idx_contacts_user_id ON public.contacts USING btree (user_id);

CREATE INDEX idx_data_point_relationships_datapoint_id ON public.data_point_relationships USING btree (datapoint_id);

CREATE INDEX idx_data_point_relationships_user_integration_id ON public.data_point_relationships USING btree (user_integration_id);

CREATE INDEX idx_data_point_relationships_validation_status ON public.data_point_relationships USING btree (validation_status);

CREATE INDEX idx_deals_company_id ON public.deals USING btree (company_id);

CREATE INDEX idx_deals_contact_id ON public.deals USING btree (contact_id);

CREATE INDEX idx_deals_hubspotid ON public.deals USING btree (hubspotid);

CREATE INDEX idx_deals_stage ON public.deals USING btree (stage);

CREATE INDEX idx_deals_user_id ON public.deals USING btree (user_id);

CREATE INDEX idx_document_folders_company_id ON public.document_folders USING btree (company_id);

CREATE INDEX idx_documents_company_id ON public.documents USING btree (company_id);

CREATE INDEX idx_documents_created_by ON public.documents USING btree (created_by);

CREATE INDEX idx_entity_mappings_canonical_id ON public.entity_mappings USING btree (canonical_id);

CREATE INDEX idx_entity_mappings_entity_type ON public.entity_mappings USING btree (entity_type);

CREATE INDEX idx_entity_mappings_integration_external ON public.entity_mappings USING btree (integration_id, external_id);

CREATE INDEX idx_entity_mappings_user_id ON public.entity_mappings USING btree (user_id);

CREATE INDEX idx_entity_resolution_logs_created ON public.entity_resolution_logs USING btree (created_at);

CREATE INDEX idx_entity_resolution_logs_external ON public.entity_resolution_logs USING btree (external_system, external_id);

CREATE INDEX idx_entity_resolution_logs_user_id ON public.entity_resolution_logs USING btree (user_id);

CREATE INDEX idx_entity_similarity_entity1 ON public.entity_similarity_scores USING btree (entity1_id, entity1_type);

CREATE INDEX idx_entity_similarity_entity2 ON public.entity_similarity_scores USING btree (entity2_id, entity2_type);

CREATE INDEX idx_entity_similarity_overall_score ON public.entity_similarity_scores USING btree (overall_score);

CREATE INDEX idx_entity_similarity_user_id ON public.entity_similarity_scores USING btree (user_id);

CREATE INDEX idx_integration_data_business_value ON public.integration_data USING btree (business_value);

CREATE INDEX idx_integration_data_data_type ON public.integration_data USING btree (data_type);

CREATE INDEX idx_integration_data_sync_timestamp ON public.integration_data USING btree (sync_timestamp);

CREATE INDEX idx_integration_data_user_integration_id ON public.integration_data USING btree (user_integration_id);

CREATE INDEX idx_integration_sync_logs_executed_at ON public.integration_sync_logs USING btree (executed_at DESC);

CREATE INDEX idx_integration_sync_logs_integration_id ON public.integration_sync_logs USING btree (integration_id);

CREATE INDEX idx_integration_sync_logs_status ON public.integration_sync_logs USING btree (status);

CREATE INDEX idx_integration_sync_logs_user_id ON public.integration_sync_logs USING btree (user_id);

CREATE INDEX idx_integration_sync_logs_user_integration ON public.integration_sync_logs USING btree (user_id, integration_id);

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE INDEX idx_operation_contexts_created_at ON public.operation_contexts USING btree (created_at);

CREATE INDEX idx_operation_contexts_tenant_id ON public.operation_contexts USING btree (tenant_id);

CREATE INDEX idx_operation_contexts_user_id ON public.operation_contexts USING btree (user_id);

CREATE INDEX idx_organizations_org_group_id ON public.organizations USING btree (org_group_id);

CREATE INDEX idx_organizations_slug ON public.organizations USING btree (slug);

CREATE INDEX idx_organizations_tenant_id ON public.organizations USING btree (tenant_id);

CREATE INDEX idx_project_members_project_id ON public.project_members USING btree (project_id);

CREATE INDEX idx_project_members_user_id ON public.project_members USING btree (user_id);

CREATE INDEX idx_projects_company_id ON public.projects USING btree (company_id);

CREATE INDEX idx_projects_owner_id ON public.projects USING btree (owner_id);

CREATE INDEX idx_rls_denials_event_time ON public.rls_denials USING btree (event_time);

CREATE INDEX idx_rls_denials_table_name ON public.rls_denials USING btree (table_name);

CREATE INDEX idx_rls_denials_tenant_id ON public.rls_denials USING btree (tenant_id);

CREATE INDEX idx_rls_denials_user_id ON public.rls_denials USING btree (user_id);

CREATE INDEX idx_shared_records_record_id ON public.shared_records USING btree (record_id);

CREATE INDEX idx_shared_records_shared_by ON public.shared_records USING btree (shared_by_tenant_id);

CREATE INDEX idx_shared_records_table_name ON public.shared_records USING btree (table_name);

CREATE INDEX idx_slow_queries_created_at ON public.slow_queries USING btree (created_at);

CREATE INDEX idx_slow_queries_execution_time ON public.slow_queries USING btree (execution_time_ms);

CREATE INDEX idx_slow_queries_tenant_id ON public.slow_queries USING btree (tenant_id);

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);

CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions USING btree (stripe_subscription_id);

CREATE INDEX idx_subscriptions_tenant_id ON public.subscriptions USING btree (tenant_id);

CREATE INDEX idx_tasks_user_id ON public.tasks USING btree (user_id);

CREATE INDEX idx_tenant_entitlements_resource ON public.tenant_entitlements USING btree (resource);

CREATE INDEX idx_tenant_entitlements_tenant_id ON public.tenant_entitlements USING btree (tenant_id);

CREATE INDEX idx_tenant_notifications_created_at ON public.tenant_notifications USING btree (created_at);

CREATE INDEX idx_tenant_notifications_is_read ON public.tenant_notifications USING btree (is_read);

CREATE INDEX idx_tenant_notifications_tenant_id ON public.tenant_notifications USING btree (tenant_id);

CREATE INDEX idx_tenant_notifications_type ON public.tenant_notifications USING btree (type);

CREATE INDEX idx_tenants_parent_id ON public.tenants USING btree (parent_id);

CREATE INDEX idx_tenants_slug ON public.tenants USING btree (slug);

CREATE INDEX idx_tenants_status ON public.tenants USING btree (status);

CREATE INDEX idx_thoughts_category ON public.thoughts USING btree (category);

CREATE INDEX idx_thoughts_status ON public.thoughts USING btree (status);

CREATE INDEX idx_usage_events_created_at ON public.usage_events USING btree (created_at);

CREATE INDEX idx_usage_events_org_id ON public.usage_events USING btree (org_id);

CREATE INDEX idx_usage_events_resource ON public.usage_events USING btree (resource);

CREATE INDEX idx_usage_events_tenant_id ON public.usage_events USING btree (tenant_id);

CREATE INDEX idx_usage_events_user_id ON public.usage_events USING btree (user_id);

CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs USING btree (created_at);

CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs USING btree (user_id);

CREATE INDEX idx_user_api_keys_key_hash ON public.user_api_keys USING btree (key_hash);

CREATE INDEX idx_user_api_keys_user_id ON public.user_api_keys USING btree (user_id);

CREATE INDEX idx_user_company_roles_company_id ON public.user_company_roles USING btree (company_id);

CREATE INDEX idx_user_company_roles_role_id ON public.user_company_roles USING btree (role_id);

CREATE INDEX idx_user_company_roles_user_id ON public.user_company_roles USING btree (user_id);

CREATE INDEX idx_user_invitations_email ON public.user_invitations USING btree (email);

CREATE INDEX idx_user_invitations_token ON public.user_invitations USING btree (token);

CREATE INDEX idx_user_organizations_is_primary ON public.user_organizations USING btree (is_primary);

CREATE INDEX idx_user_organizations_org_id ON public.user_organizations USING btree (org_id);

CREATE INDEX idx_user_organizations_user_id ON public.user_organizations USING btree (user_id);

CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (session_token);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);

CREATE UNIQUE INDEX integration_data_pkey ON public.integration_data USING btree (id);

CREATE UNIQUE INDEX integration_data_user_integration_id_data_point_definition__key ON public.integration_data USING btree (user_integration_id, data_point_definition_id, data_type);

CREATE UNIQUE INDEX integration_sync_logs_pkey ON public.integration_sync_logs USING btree (id);

CREATE UNIQUE INDEX integration_types_name_key ON public.integration_types USING btree (name);

CREATE UNIQUE INDEX integration_types_pkey ON public.integration_types USING btree (id);

CREATE UNIQUE INDEX notification_templates_name_key ON public.notification_templates USING btree (name);

CREATE UNIQUE INDEX notification_templates_pkey ON public.notification_templates USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX operation_contexts_pkey ON public.operation_contexts USING btree (id);

CREATE UNIQUE INDEX org_groups_pkey ON public.org_groups USING btree (id);

CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

CREATE UNIQUE INDEX organizations_tenant_id_slug_key ON public.organizations USING btree (tenant_id, slug);

CREATE UNIQUE INDEX project_members_pkey ON public.project_members USING btree (id);

CREATE UNIQUE INDEX project_members_project_id_user_id_key ON public.project_members USING btree (project_id, user_id);

CREATE UNIQUE INDEX project_statuses_name_key ON public.project_statuses USING btree (name);

CREATE UNIQUE INDEX project_statuses_pkey ON public.project_statuses USING btree (id);

CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);

CREATE UNIQUE INDEX rls_denials_pkey ON public.rls_denials USING btree (id);

CREATE UNIQUE INDEX shared_records_pkey ON public.shared_records USING btree (id);

CREATE UNIQUE INDEX shared_records_table_name_record_id_key ON public.shared_records USING btree (table_name, record_id);

CREATE UNIQUE INDEX slow_queries_pkey ON public.slow_queries USING btree (id);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);

CREATE UNIQUE INDEX system_settings_pkey ON public.system_settings USING btree (id);

CREATE UNIQUE INDEX task_attachments_pkey ON public.task_attachments USING btree (id);

CREATE UNIQUE INDEX task_comments_pkey ON public.task_comments USING btree (id);

CREATE UNIQUE INDEX task_priorities_name_key ON public.task_priorities USING btree (name);

CREATE UNIQUE INDEX task_priorities_pkey ON public.task_priorities USING btree (id);

CREATE UNIQUE INDEX task_statuses_name_key ON public.task_statuses USING btree (name);

CREATE UNIQUE INDEX task_statuses_pkey ON public.task_statuses USING btree (id);

CREATE UNIQUE INDEX tenant_entitlements_pkey ON public.tenant_entitlements USING btree (id);

CREATE UNIQUE INDEX tenant_entitlements_tenant_id_resource_action_key ON public.tenant_entitlements USING btree (tenant_id, resource, action);

CREATE UNIQUE INDEX tenant_notifications_pkey ON public.tenant_notifications USING btree (id);

CREATE UNIQUE INDEX tenants_pkey ON public.tenants USING btree (id);

CREATE UNIQUE INDEX tenants_slug_key ON public.tenants USING btree (slug);

CREATE UNIQUE INDEX usage_events_pkey ON public.usage_events USING btree (id);

CREATE UNIQUE INDEX user_activity_logs_pkey ON public.user_activity_logs USING btree (id);

CREATE UNIQUE INDEX user_api_keys_key_hash_key ON public.user_api_keys USING btree (key_hash);

CREATE UNIQUE INDEX user_api_keys_pkey ON public.user_api_keys USING btree (id);

CREATE UNIQUE INDEX user_company_roles_pkey ON public.user_company_roles USING btree (id);

CREATE UNIQUE INDEX user_company_roles_user_id_company_id_role_id_key ON public.user_company_roles USING btree (user_id, company_id, role_id);

CREATE UNIQUE INDEX user_invitations_pkey ON public.user_invitations USING btree (id);

CREATE UNIQUE INDEX user_invitations_token_key ON public.user_invitations USING btree (token);

CREATE UNIQUE INDEX user_notifications_pkey ON public.user_notifications USING btree (id);

CREATE UNIQUE INDEX user_organizations_pkey ON public.user_organizations USING btree (id);

CREATE UNIQUE INDEX user_organizations_user_id_org_id_key ON public.user_organizations USING btree (user_id, org_id);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id);

CREATE UNIQUE INDEX user_preferences_user_id_key ON public.user_preferences USING btree (user_id);

CREATE UNIQUE INDEX user_sessions_pkey ON public.user_sessions USING btree (id);

CREATE UNIQUE INDEX user_sessions_session_token_key ON public.user_sessions USING btree (session_token);

alter table "public"."billing_accounts" add constraint "billing_accounts_pkey" PRIMARY KEY using index "billing_accounts_pkey";

alter table "public"."business_profiles" add constraint "business_profiles_pkey" PRIMARY KEY using index "business_profiles_pkey";

alter table "public"."calendar_events" add constraint "calendar_events_pkey" PRIMARY KEY using index "calendar_events_pkey";

alter table "public"."company_audit_logs" add constraint "company_audit_logs_pkey" PRIMARY KEY using index "company_audit_logs_pkey";

alter table "public"."company_billing" add constraint "company_billing_pkey" PRIMARY KEY using index "company_billing_pkey";

alter table "public"."company_export_requests" add constraint "company_export_requests_pkey" PRIMARY KEY using index "company_export_requests_pkey";

alter table "public"."company_invitations" add constraint "company_invitations_pkey" PRIMARY KEY using index "company_invitations_pkey";

alter table "public"."company_notifications" add constraint "company_notifications_pkey" PRIMARY KEY using index "company_notifications_pkey";

alter table "public"."company_reports" add constraint "company_reports_pkey" PRIMARY KEY using index "company_reports_pkey";

alter table "public"."company_roles" add constraint "company_roles_pkey" PRIMARY KEY using index "company_roles_pkey";

alter table "public"."company_templates" add constraint "company_templates_pkey" PRIMARY KEY using index "company_templates_pkey";

alter table "public"."company_usage" add constraint "company_usage_pkey" PRIMARY KEY using index "company_usage_pkey";

alter table "public"."company_workflows" add constraint "company_workflows_pkey" PRIMARY KEY using index "company_workflows_pkey";

alter table "public"."contacts" add constraint "contacts_pkey" PRIMARY KEY using index "contacts_pkey";

alter table "public"."data_point_relationships" add constraint "data_point_relationships_pkey" PRIMARY KEY using index "data_point_relationships_pkey";

alter table "public"."deals" add constraint "deals_pkey" PRIMARY KEY using index "deals_pkey";

alter table "public"."departments" add constraint "departments_pkey" PRIMARY KEY using index "departments_pkey";

alter table "public"."document_folders" add constraint "document_folders_pkey" PRIMARY KEY using index "document_folders_pkey";

alter table "public"."document_shares" add constraint "document_shares_pkey" PRIMARY KEY using index "document_shares_pkey";

alter table "public"."documents" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."entity_mappings" add constraint "entity_mappings_pkey" PRIMARY KEY using index "entity_mappings_pkey";

alter table "public"."entity_resolution_logs" add constraint "entity_resolution_logs_pkey" PRIMARY KEY using index "entity_resolution_logs_pkey";

alter table "public"."entity_similarity_scores" add constraint "entity_similarity_scores_pkey" PRIMARY KEY using index "entity_similarity_scores_pkey";

alter table "public"."integration_data" add constraint "integration_data_pkey" PRIMARY KEY using index "integration_data_pkey";

alter table "public"."integration_sync_logs" add constraint "integration_sync_logs_pkey" PRIMARY KEY using index "integration_sync_logs_pkey";

alter table "public"."integration_types" add constraint "integration_types_pkey" PRIMARY KEY using index "integration_types_pkey";

alter table "public"."notification_templates" add constraint "notification_templates_pkey" PRIMARY KEY using index "notification_templates_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."operation_contexts" add constraint "operation_contexts_pkey" PRIMARY KEY using index "operation_contexts_pkey";

alter table "public"."org_groups" add constraint "org_groups_pkey" PRIMARY KEY using index "org_groups_pkey";

alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."project_members" add constraint "project_members_pkey" PRIMARY KEY using index "project_members_pkey";

alter table "public"."project_statuses" add constraint "project_statuses_pkey" PRIMARY KEY using index "project_statuses_pkey";

alter table "public"."projects" add constraint "projects_pkey" PRIMARY KEY using index "projects_pkey";

alter table "public"."rls_denials" add constraint "rls_denials_pkey" PRIMARY KEY using index "rls_denials_pkey";

alter table "public"."shared_records" add constraint "shared_records_pkey" PRIMARY KEY using index "shared_records_pkey";

alter table "public"."slow_queries" add constraint "slow_queries_pkey" PRIMARY KEY using index "slow_queries_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."system_settings" add constraint "system_settings_pkey" PRIMARY KEY using index "system_settings_pkey";

alter table "public"."task_attachments" add constraint "task_attachments_pkey" PRIMARY KEY using index "task_attachments_pkey";

alter table "public"."task_comments" add constraint "task_comments_pkey" PRIMARY KEY using index "task_comments_pkey";

alter table "public"."task_priorities" add constraint "task_priorities_pkey" PRIMARY KEY using index "task_priorities_pkey";

alter table "public"."task_statuses" add constraint "task_statuses_pkey" PRIMARY KEY using index "task_statuses_pkey";

alter table "public"."tenant_entitlements" add constraint "tenant_entitlements_pkey" PRIMARY KEY using index "tenant_entitlements_pkey";

alter table "public"."tenant_notifications" add constraint "tenant_notifications_pkey" PRIMARY KEY using index "tenant_notifications_pkey";

alter table "public"."tenants" add constraint "tenants_pkey" PRIMARY KEY using index "tenants_pkey";

alter table "public"."usage_events" add constraint "usage_events_pkey" PRIMARY KEY using index "usage_events_pkey";

alter table "public"."user_activity_logs" add constraint "user_activity_logs_pkey" PRIMARY KEY using index "user_activity_logs_pkey";

alter table "public"."user_api_keys" add constraint "user_api_keys_pkey" PRIMARY KEY using index "user_api_keys_pkey";

alter table "public"."user_company_roles" add constraint "user_company_roles_pkey" PRIMARY KEY using index "user_company_roles_pkey";

alter table "public"."user_invitations" add constraint "user_invitations_pkey" PRIMARY KEY using index "user_invitations_pkey";

alter table "public"."user_notifications" add constraint "user_notifications_pkey" PRIMARY KEY using index "user_notifications_pkey";

alter table "public"."user_organizations" add constraint "user_organizations_pkey" PRIMARY KEY using index "user_organizations_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."user_sessions" add constraint "user_sessions_pkey" PRIMARY KEY using index "user_sessions_pkey";

alter table "public"."billing_accounts" add constraint "billing_accounts_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE not valid;

alter table "public"."billing_accounts" validate constraint "billing_accounts_tenant_id_fkey";

alter table "public"."billing_accounts" add constraint "billing_accounts_tenant_id_key" UNIQUE using index "billing_accounts_tenant_id_key";

alter table "public"."business_profiles" add constraint "business_profiles_annual_revenue_check" CHECK ((annual_revenue = ANY (ARRAY['under-100k'::text, '100k-500k'::text, '500k-1m'::text, '1m-5m'::text, '5m-10m'::text, '10m+'::text]))) not valid;

alter table "public"."business_profiles" validate constraint "business_profiles_annual_revenue_check";

alter table "public"."business_profiles" add constraint "business_profiles_business_model_check" CHECK ((business_model = ANY (ARRAY['b2b'::text, 'b2c'::text, 'b2b2c'::text, 'marketplace'::text, 'subscription'::text, 'consulting'::text, 'product'::text, 'service'::text]))) not valid;

alter table "public"."business_profiles" validate constraint "business_profiles_business_model_check";

alter table "public"."business_profiles" add constraint "business_profiles_business_stage_check" CHECK ((business_stage = ANY (ARRAY['startup'::text, 'growth'::text, 'mature'::text, 'scaling'::text]))) not valid;

alter table "public"."business_profiles" validate constraint "business_profiles_business_stage_check";

alter table "public"."business_profiles" add constraint "business_profiles_company_size_check" CHECK ((company_size = ANY (ARRAY['micro'::text, 'small'::text, 'medium'::text, 'large'::text]))) not valid;

alter table "public"."business_profiles" validate constraint "business_profiles_company_size_check";

alter table "public"."business_profiles" add constraint "business_profiles_legal_structure_check" CHECK ((legal_structure = ANY (ARRAY['partnership'::text, 'llc'::text, 'scorp'::text, 'c-corp'::text, 'sole-proprietorship'::text]))) not valid;

alter table "public"."business_profiles" validate constraint "business_profiles_legal_structure_check";

alter table "public"."business_profiles" add constraint "business_profiles_team_size_check" CHECK ((team_size = ANY (ARRAY['1-5'::text, '6-10'::text, '11-25'::text, '26-50'::text, '50+'::text]))) not valid;

alter table "public"."business_profiles" validate constraint "business_profiles_team_size_check";

alter table "public"."business_profiles" add constraint "business_profiles_timeline_check" CHECK ((timeline = ANY (ARRAY['3-months'::text, '6-months'::text, '1-year'::text, '2-years'::text]))) not valid;

alter table "public"."business_profiles" validate constraint "business_profiles_timeline_check";

alter table "public"."business_profiles" add constraint "business_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."business_profiles" validate constraint "business_profiles_user_id_fkey";

alter table "public"."calendar_events" add constraint "calendar_events_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) not valid;

alter table "public"."calendar_events" validate constraint "calendar_events_company_id_fkey";

alter table "public"."calendar_events" add constraint "calendar_events_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."calendar_events" validate constraint "calendar_events_created_by_fkey";

alter table "public"."calendar_events" add constraint "calendar_events_event_type_check" CHECK ((event_type = ANY (ARRAY['meeting'::text, 'task'::text, 'reminder'::text, 'deadline'::text]))) not valid;

alter table "public"."calendar_events" validate constraint "calendar_events_event_type_check";

alter table "public"."calendar_events" add constraint "calendar_events_status_check" CHECK ((status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text]))) not valid;

alter table "public"."calendar_events" validate constraint "calendar_events_status_check";

alter table "public"."companies" add constraint "companies_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."companies" validate constraint "companies_created_by_fkey";

alter table "public"."company_audit_logs" add constraint "company_audit_logs_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_audit_logs" validate constraint "company_audit_logs_company_id_fkey";

alter table "public"."company_audit_logs" add constraint "company_audit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."company_audit_logs" validate constraint "company_audit_logs_user_id_fkey";

alter table "public"."company_billing" add constraint "company_billing_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_billing" validate constraint "company_billing_company_id_fkey";

alter table "public"."company_billing" add constraint "company_billing_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'past_due'::text, 'cancelled'::text]))) not valid;

alter table "public"."company_billing" validate constraint "company_billing_status_check";

alter table "public"."company_export_requests" add constraint "company_export_requests_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_export_requests" validate constraint "company_export_requests_company_id_fkey";

alter table "public"."company_export_requests" add constraint "company_export_requests_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES auth.users(id) not valid;

alter table "public"."company_export_requests" validate constraint "company_export_requests_requested_by_fkey";

alter table "public"."company_export_requests" add constraint "company_export_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."company_export_requests" validate constraint "company_export_requests_status_check";

alter table "public"."company_invitations" add constraint "company_invitations_accepted_by_fkey" FOREIGN KEY (accepted_by) REFERENCES auth.users(id) not valid;

alter table "public"."company_invitations" validate constraint "company_invitations_accepted_by_fkey";

alter table "public"."company_invitations" add constraint "company_invitations_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_invitations" validate constraint "company_invitations_company_id_fkey";

alter table "public"."company_invitations" add constraint "company_invitations_department_id_fkey" FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL not valid;

alter table "public"."company_invitations" validate constraint "company_invitations_department_id_fkey";

alter table "public"."company_invitations" add constraint "company_invitations_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) not valid;

alter table "public"."company_invitations" validate constraint "company_invitations_invited_by_fkey";

alter table "public"."company_invitations" add constraint "company_invitations_role_id_fkey" FOREIGN KEY (role_id) REFERENCES company_roles(id) ON DELETE CASCADE not valid;

alter table "public"."company_invitations" validate constraint "company_invitations_role_id_fkey";

alter table "public"."company_invitations" add constraint "company_invitations_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text, 'cancelled'::text]))) not valid;

alter table "public"."company_invitations" validate constraint "company_invitations_status_check";

alter table "public"."company_notifications" add constraint "company_notifications_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_notifications" validate constraint "company_notifications_company_id_fkey";

alter table "public"."company_notifications" add constraint "company_notifications_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."company_notifications" validate constraint "company_notifications_created_by_fkey";

alter table "public"."company_reports" add constraint "company_reports_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_reports" validate constraint "company_reports_company_id_fkey";

alter table "public"."company_reports" add constraint "company_reports_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."company_reports" validate constraint "company_reports_created_by_fkey";

alter table "public"."company_roles" add constraint "company_roles_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_roles" validate constraint "company_roles_company_id_fkey";

alter table "public"."company_templates" add constraint "company_templates_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_templates" validate constraint "company_templates_company_id_fkey";

alter table "public"."company_templates" add constraint "company_templates_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."company_templates" validate constraint "company_templates_created_by_fkey";

alter table "public"."company_usage" add constraint "company_usage_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_usage" validate constraint "company_usage_company_id_fkey";

alter table "public"."company_workflows" add constraint "company_workflows_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_workflows" validate constraint "company_workflows_company_id_fkey";

alter table "public"."company_workflows" add constraint "company_workflows_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."company_workflows" validate constraint "company_workflows_created_by_fkey";

alter table "public"."contacts" add constraint "contacts_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL not valid;

alter table "public"."contacts" validate constraint "contacts_company_id_fkey";

alter table "public"."contacts" add constraint "contacts_hubspotid_key" UNIQUE using index "contacts_hubspotid_key";

alter table "public"."contacts" add constraint "contacts_integration_id_fkey" FOREIGN KEY (integration_id) REFERENCES user_integrations(id) ON DELETE SET NULL not valid;

alter table "public"."contacts" validate constraint "contacts_integration_id_fkey";

alter table "public"."contacts" add constraint "contacts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."contacts" validate constraint "contacts_user_id_fkey";

alter table "public"."data_point_relationships" add constraint "data_point_relationships_data_flow_check" CHECK ((data_flow = ANY (ARRAY['input'::text, 'output'::text, 'both'::text]))) not valid;

alter table "public"."data_point_relationships" validate constraint "data_point_relationships_data_flow_check";

alter table "public"."data_point_relationships" add constraint "data_point_relationships_user_integration_id_datapoint_id_key" UNIQUE using index "data_point_relationships_user_integration_id_datapoint_id_key";

alter table "public"."data_point_relationships" add constraint "data_point_relationships_user_integration_id_fkey" FOREIGN KEY (user_integration_id) REFERENCES user_integrations(id) ON DELETE CASCADE not valid;

alter table "public"."data_point_relationships" validate constraint "data_point_relationships_user_integration_id_fkey";

alter table "public"."data_point_relationships" add constraint "data_point_relationships_validation_status_check" CHECK ((validation_status = ANY (ARRAY['valid'::text, 'invalid'::text, 'unknown'::text]))) not valid;

alter table "public"."data_point_relationships" validate constraint "data_point_relationships_validation_status_check";

alter table "public"."deals" add constraint "deals_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL not valid;

alter table "public"."deals" validate constraint "deals_company_id_fkey";

alter table "public"."deals" add constraint "deals_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL not valid;

alter table "public"."deals" validate constraint "deals_contact_id_fkey";

alter table "public"."deals" add constraint "deals_hubspotid_key" UNIQUE using index "deals_hubspotid_key";

alter table "public"."deals" add constraint "deals_integration_id_fkey" FOREIGN KEY (integration_id) REFERENCES user_integrations(id) ON DELETE SET NULL not valid;

alter table "public"."deals" validate constraint "deals_integration_id_fkey";

alter table "public"."deals" add constraint "deals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."deals" validate constraint "deals_user_id_fkey";

alter table "public"."departments" add constraint "departments_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."departments" validate constraint "departments_company_id_fkey";

alter table "public"."departments" add constraint "departments_company_id_name_key" UNIQUE using index "departments_company_id_name_key";

alter table "public"."departments" add constraint "departments_manager_id_fkey" FOREIGN KEY (manager_id) REFERENCES auth.users(id) not valid;

alter table "public"."departments" validate constraint "departments_manager_id_fkey";

alter table "public"."document_folders" add constraint "document_folders_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."document_folders" validate constraint "document_folders_company_id_fkey";

alter table "public"."document_folders" add constraint "document_folders_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."document_folders" validate constraint "document_folders_created_by_fkey";

alter table "public"."document_folders" add constraint "document_folders_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES document_folders(id) not valid;

alter table "public"."document_folders" validate constraint "document_folders_parent_id_fkey";

alter table "public"."document_shares" add constraint "document_shares_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."document_shares" validate constraint "document_shares_created_by_fkey";

alter table "public"."document_shares" add constraint "document_shares_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_shares" validate constraint "document_shares_document_id_fkey";

alter table "public"."document_shares" add constraint "document_shares_permission_check" CHECK ((permission = ANY (ARRAY['read'::text, 'write'::text, 'admin'::text]))) not valid;

alter table "public"."document_shares" validate constraint "document_shares_permission_check";

alter table "public"."document_shares" add constraint "document_shares_shared_with_company_id_fkey" FOREIGN KEY (shared_with_company_id) REFERENCES companies(id) not valid;

alter table "public"."document_shares" validate constraint "document_shares_shared_with_company_id_fkey";

alter table "public"."document_shares" add constraint "document_shares_shared_with_user_id_fkey" FOREIGN KEY (shared_with_user_id) REFERENCES auth.users(id) not valid;

alter table "public"."document_shares" validate constraint "document_shares_shared_with_user_id_fkey";

alter table "public"."documents" add constraint "documents_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."documents" validate constraint "documents_company_id_fkey";

alter table "public"."documents" add constraint "documents_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."documents" validate constraint "documents_created_by_fkey";

alter table "public"."documents" add constraint "documents_folder_id_fkey" FOREIGN KEY (folder_id) REFERENCES document_folders(id) not valid;

alter table "public"."documents" validate constraint "documents_folder_id_fkey";

alter table "public"."entity_mappings" add constraint "entity_mappings_canonical_type_check" CHECK ((canonical_type = ANY (ARRAY['contact'::text, 'company'::text]))) not valid;

alter table "public"."entity_mappings" validate constraint "entity_mappings_canonical_type_check";

alter table "public"."entity_mappings" add constraint "entity_mappings_confidence_score_check" CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric))) not valid;

alter table "public"."entity_mappings" validate constraint "entity_mappings_confidence_score_check";

alter table "public"."entity_mappings" add constraint "entity_mappings_entity_type_check" CHECK ((entity_type = ANY (ARRAY['contact'::text, 'company'::text]))) not valid;

alter table "public"."entity_mappings" validate constraint "entity_mappings_entity_type_check";

alter table "public"."entity_mappings" add constraint "entity_mappings_integration_id_external_id_entity_type_key" UNIQUE using index "entity_mappings_integration_id_external_id_entity_type_key";

alter table "public"."entity_mappings" add constraint "entity_mappings_integration_id_fkey" FOREIGN KEY (integration_id) REFERENCES user_integrations(id) ON DELETE CASCADE not valid;

alter table "public"."entity_mappings" validate constraint "entity_mappings_integration_id_fkey";

alter table "public"."entity_mappings" add constraint "entity_mappings_match_method_check" CHECK ((match_method = ANY (ARRAY['exact'::text, 'fuzzy'::text, 'manual'::text, 'ai'::text, 'email'::text, 'phone'::text, 'domain'::text]))) not valid;

alter table "public"."entity_mappings" validate constraint "entity_mappings_match_method_check";

alter table "public"."entity_mappings" add constraint "entity_mappings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."entity_mappings" validate constraint "entity_mappings_user_id_fkey";

alter table "public"."entity_resolution_logs" add constraint "entity_resolution_logs_entity_type_check" CHECK ((entity_type = ANY (ARRAY['contact'::text, 'company'::text]))) not valid;

alter table "public"."entity_resolution_logs" validate constraint "entity_resolution_logs_entity_type_check";

alter table "public"."entity_resolution_logs" add constraint "entity_resolution_logs_integration_id_fkey" FOREIGN KEY (integration_id) REFERENCES user_integrations(id) ON DELETE CASCADE not valid;

alter table "public"."entity_resolution_logs" validate constraint "entity_resolution_logs_integration_id_fkey";

alter table "public"."entity_resolution_logs" add constraint "entity_resolution_logs_resolution_method_check" CHECK ((resolution_method = ANY (ARRAY['exact_match'::text, 'fuzzy_match'::text, 'ai_match'::text, 'manual'::text, 'new_entity'::text]))) not valid;

alter table "public"."entity_resolution_logs" validate constraint "entity_resolution_logs_resolution_method_check";

alter table "public"."entity_resolution_logs" add constraint "entity_resolution_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."entity_resolution_logs" validate constraint "entity_resolution_logs_user_id_fkey";

alter table "public"."entity_similarity_scores" add constraint "entity_similarity_scores_entity1_id_entity1_integration_ent_key" UNIQUE using index "entity_similarity_scores_entity1_id_entity1_integration_ent_key";

alter table "public"."entity_similarity_scores" add constraint "entity_similarity_scores_entity1_type_check" CHECK ((entity1_type = ANY (ARRAY['contact'::text, 'company'::text]))) not valid;

alter table "public"."entity_similarity_scores" validate constraint "entity_similarity_scores_entity1_type_check";

alter table "public"."entity_similarity_scores" add constraint "entity_similarity_scores_entity2_type_check" CHECK ((entity2_type = ANY (ARRAY['contact'::text, 'company'::text]))) not valid;

alter table "public"."entity_similarity_scores" validate constraint "entity_similarity_scores_entity2_type_check";

alter table "public"."entity_similarity_scores" add constraint "entity_similarity_scores_overall_score_check" CHECK (((overall_score >= (0)::numeric) AND (overall_score <= (1)::numeric))) not valid;

alter table "public"."entity_similarity_scores" validate constraint "entity_similarity_scores_overall_score_check";

alter table "public"."entity_similarity_scores" add constraint "entity_similarity_scores_review_decision_check" CHECK ((review_decision = ANY (ARRAY['same_entity'::text, 'different_entity'::text, 'uncertain'::text]))) not valid;

alter table "public"."entity_similarity_scores" validate constraint "entity_similarity_scores_review_decision_check";

alter table "public"."entity_similarity_scores" add constraint "entity_similarity_scores_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."entity_similarity_scores" validate constraint "entity_similarity_scores_reviewed_by_fkey";

alter table "public"."entity_similarity_scores" add constraint "entity_similarity_scores_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."entity_similarity_scores" validate constraint "entity_similarity_scores_user_id_fkey";

alter table "public"."integration_data" add constraint "integration_data_business_value_check" CHECK ((business_value = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text]))) not valid;

alter table "public"."integration_data" validate constraint "integration_data_business_value_check";

alter table "public"."integration_data" add constraint "integration_data_user_integration_id_data_point_definition__key" UNIQUE using index "integration_data_user_integration_id_data_point_definition__key";

alter table "public"."integration_data" add constraint "integration_data_user_integration_id_fkey" FOREIGN KEY (user_integration_id) REFERENCES user_integrations(id) ON DELETE CASCADE not valid;

alter table "public"."integration_data" validate constraint "integration_data_user_integration_id_fkey";

alter table "public"."integration_sync_logs" add constraint "integration_sync_logs_integration_id_fkey" FOREIGN KEY (integration_id) REFERENCES user_integrations(id) ON DELETE CASCADE not valid;

alter table "public"."integration_sync_logs" validate constraint "integration_sync_logs_integration_id_fkey";

alter table "public"."integration_sync_logs" add constraint "integration_sync_logs_status_check" CHECK ((status = ANY (ARRAY['success'::text, 'error'::text, 'partial'::text]))) not valid;

alter table "public"."integration_sync_logs" validate constraint "integration_sync_logs_status_check";

alter table "public"."integration_sync_logs" add constraint "integration_sync_logs_sync_type_check" CHECK ((sync_type = ANY (ARRAY['full'::text, 'incremental'::text, 'error'::text]))) not valid;

alter table "public"."integration_sync_logs" validate constraint "integration_sync_logs_sync_type_check";

alter table "public"."integration_sync_logs" add constraint "integration_sync_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."integration_sync_logs" validate constraint "integration_sync_logs_user_id_fkey";

alter table "public"."integration_types" add constraint "integration_types_name_key" UNIQUE using index "integration_types_name_key";

alter table "public"."notification_templates" add constraint "notification_templates_name_key" UNIQUE using index "notification_templates_name_key";

alter table "public"."notification_templates" add constraint "notification_templates_type_check" CHECK ((type = ANY (ARRAY['email'::text, 'push'::text, 'sms'::text, 'in_app'::text]))) not valid;

alter table "public"."notification_templates" validate constraint "notification_templates_type_check";

alter table "public"."notifications" add constraint "notifications_category_check" CHECK ((category = ANY (ARRAY['system'::text, 'task'::text, 'project'::text, 'integration'::text, 'security'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_category_check";

alter table "public"."notifications" add constraint "notifications_type_check" CHECK ((type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_type_check";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."operation_contexts" add constraint "operation_contexts_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."operation_contexts" validate constraint "operation_contexts_org_id_fkey";

alter table "public"."operation_contexts" add constraint "operation_contexts_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE not valid;

alter table "public"."operation_contexts" validate constraint "operation_contexts_tenant_id_fkey";

alter table "public"."operation_contexts" add constraint "operation_contexts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."operation_contexts" validate constraint "operation_contexts_user_id_fkey";

alter table "public"."org_groups" add constraint "org_groups_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE not valid;

alter table "public"."org_groups" validate constraint "org_groups_tenant_id_fkey";

alter table "public"."organizations" add constraint "organizations_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE not valid;

alter table "public"."organizations" validate constraint "organizations_tenant_id_fkey";

alter table "public"."organizations" add constraint "organizations_tenant_id_slug_key" UNIQUE using index "organizations_tenant_id_slug_key";

alter table "public"."project_members" add constraint "project_members_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_members" validate constraint "project_members_project_id_fkey";

alter table "public"."project_members" add constraint "project_members_project_id_user_id_key" UNIQUE using index "project_members_project_id_user_id_key";

alter table "public"."project_members" add constraint "project_members_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'manager'::text, 'member'::text, 'viewer'::text]))) not valid;

alter table "public"."project_members" validate constraint "project_members_role_check";

alter table "public"."project_members" add constraint "project_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."project_members" validate constraint "project_members_user_id_fkey";

alter table "public"."project_statuses" add constraint "project_statuses_name_key" UNIQUE using index "project_statuses_name_key";

alter table "public"."projects" add constraint "projects_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."projects" validate constraint "projects_company_id_fkey";

alter table "public"."projects" add constraint "projects_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) not valid;

alter table "public"."projects" validate constraint "projects_owner_id_fkey";

alter table "public"."projects" add constraint "projects_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))) not valid;

alter table "public"."projects" validate constraint "projects_priority_check";

alter table "public"."projects" add constraint "projects_progress_check" CHECK (((progress >= 0) AND (progress <= 100))) not valid;

alter table "public"."projects" validate constraint "projects_progress_check";

alter table "public"."projects" add constraint "projects_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text, 'on_hold'::text]))) not valid;

alter table "public"."projects" validate constraint "projects_status_check";

alter table "public"."shared_records" add constraint "shared_records_shared_by_tenant_id_fkey" FOREIGN KEY (shared_by_tenant_id) REFERENCES tenants(id) ON DELETE CASCADE not valid;

alter table "public"."shared_records" validate constraint "shared_records_shared_by_tenant_id_fkey";

alter table "public"."shared_records" add constraint "shared_records_table_name_record_id_key" UNIQUE using index "shared_records_table_name_record_id_key";

alter table "public"."subscriptions" add constraint "subscriptions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'past_due'::text, 'cancelled'::text, 'trialing'::text]))) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_status_check";

alter table "public"."subscriptions" add constraint "subscriptions_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_tenant_id_fkey";

alter table "public"."system_settings" add constraint "system_settings_key_key" UNIQUE using index "system_settings_key_key";

alter table "public"."task_attachments" add constraint "task_attachments_task_id_fkey" FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE not valid;

alter table "public"."task_attachments" validate constraint "task_attachments_task_id_fkey";

alter table "public"."task_attachments" add constraint "task_attachments_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) not valid;

alter table "public"."task_attachments" validate constraint "task_attachments_uploaded_by_fkey";

alter table "public"."task_comments" add constraint "task_comments_task_id_fkey" FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE not valid;

alter table "public"."task_comments" validate constraint "task_comments_task_id_fkey";

alter table "public"."task_comments" add constraint "task_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."task_comments" validate constraint "task_comments_user_id_fkey";

alter table "public"."task_priorities" add constraint "task_priorities_name_key" UNIQUE using index "task_priorities_name_key";

alter table "public"."task_statuses" add constraint "task_statuses_name_key" UNIQUE using index "task_statuses_name_key";

alter table "public"."tasks" add constraint "tasks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_user_id_fkey";

alter table "public"."tenant_entitlements" add constraint "tenant_entitlements_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE not valid;

alter table "public"."tenant_entitlements" validate constraint "tenant_entitlements_tenant_id_fkey";

alter table "public"."tenant_entitlements" add constraint "tenant_entitlements_tenant_id_resource_action_key" UNIQUE using index "tenant_entitlements_tenant_id_resource_action_key";

alter table "public"."tenant_notifications" add constraint "tenant_notifications_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE not valid;

alter table "public"."tenant_notifications" validate constraint "tenant_notifications_tenant_id_fkey";

alter table "public"."tenants" add constraint "tenants_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES tenants(id) ON DELETE SET NULL not valid;

alter table "public"."tenants" validate constraint "tenants_parent_id_fkey";

alter table "public"."tenants" add constraint "tenants_slug_key" UNIQUE using index "tenants_slug_key";

alter table "public"."tenants" add constraint "tenants_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text, 'cancelled'::text]))) not valid;

alter table "public"."tenants" validate constraint "tenants_status_check";

alter table "public"."thoughts" add constraint "thoughts_category_check" CHECK ((category = ANY (ARRAY['idea'::text, 'task'::text, 'reminder'::text, 'update'::text]))) not valid;

alter table "public"."thoughts" validate constraint "thoughts_category_check";

alter table "public"."thoughts" add constraint "thoughts_status_check" CHECK ((status = ANY (ARRAY['future_goals'::text, 'concept'::text, 'in_progress'::text, 'completed'::text, 'pending'::text, 'reviewed'::text, 'implemented'::text, 'not_started'::text, 'upcoming'::text, 'due'::text, 'overdue'::text]))) not valid;

alter table "public"."thoughts" validate constraint "thoughts_status_check";

alter table "public"."usage_events" add constraint "usage_events_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."usage_events" validate constraint "usage_events_org_id_fkey";

alter table "public"."usage_events" add constraint "usage_events_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE not valid;

alter table "public"."usage_events" validate constraint "usage_events_tenant_id_fkey";

alter table "public"."usage_events" add constraint "usage_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."usage_events" validate constraint "usage_events_user_id_fkey";

alter table "public"."user_activity_logs" add constraint "user_activity_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_activity_logs" validate constraint "user_activity_logs_user_id_fkey";

alter table "public"."user_api_keys" add constraint "user_api_keys_key_hash_key" UNIQUE using index "user_api_keys_key_hash_key";

alter table "public"."user_api_keys" add constraint "user_api_keys_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_api_keys" validate constraint "user_api_keys_user_id_fkey";

alter table "public"."user_company_roles" add constraint "user_company_roles_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES auth.users(id) not valid;

alter table "public"."user_company_roles" validate constraint "user_company_roles_assigned_by_fkey";

alter table "public"."user_company_roles" add constraint "user_company_roles_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."user_company_roles" validate constraint "user_company_roles_company_id_fkey";

alter table "public"."user_company_roles" add constraint "user_company_roles_department_id_fkey" FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL not valid;

alter table "public"."user_company_roles" validate constraint "user_company_roles_department_id_fkey";

alter table "public"."user_company_roles" add constraint "user_company_roles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES company_roles(id) ON DELETE CASCADE not valid;

alter table "public"."user_company_roles" validate constraint "user_company_roles_role_id_fkey";

alter table "public"."user_company_roles" add constraint "user_company_roles_user_id_company_id_role_id_key" UNIQUE using index "user_company_roles_user_id_company_id_role_id_key";

alter table "public"."user_company_roles" add constraint "user_company_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_company_roles" validate constraint "user_company_roles_user_id_fkey";

alter table "public"."user_invitations" add constraint "user_invitations_accepted_by_fkey" FOREIGN KEY (accepted_by) REFERENCES auth.users(id) not valid;

alter table "public"."user_invitations" validate constraint "user_invitations_accepted_by_fkey";

alter table "public"."user_invitations" add constraint "user_invitations_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) not valid;

alter table "public"."user_invitations" validate constraint "user_invitations_company_id_fkey";

alter table "public"."user_invitations" add constraint "user_invitations_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) not valid;

alter table "public"."user_invitations" validate constraint "user_invitations_invited_by_fkey";

alter table "public"."user_invitations" add constraint "user_invitations_role_id_fkey" FOREIGN KEY (role_id) REFERENCES company_roles(id) not valid;

alter table "public"."user_invitations" validate constraint "user_invitations_role_id_fkey";

alter table "public"."user_invitations" add constraint "user_invitations_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text, 'cancelled'::text]))) not valid;

alter table "public"."user_invitations" validate constraint "user_invitations_status_check";

alter table "public"."user_invitations" add constraint "user_invitations_token_key" UNIQUE using index "user_invitations_token_key";

alter table "public"."user_notifications" add constraint "user_notifications_type_check" CHECK ((type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text]))) not valid;

alter table "public"."user_notifications" validate constraint "user_notifications_type_check";

alter table "public"."user_notifications" add constraint "user_notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_notifications" validate constraint "user_notifications_user_id_fkey";

alter table "public"."user_organizations" add constraint "user_organizations_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."user_organizations" validate constraint "user_organizations_org_id_fkey";

alter table "public"."user_organizations" add constraint "user_organizations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_organizations" validate constraint "user_organizations_user_id_fkey";

alter table "public"."user_organizations" add constraint "user_organizations_user_id_org_id_key" UNIQUE using index "user_organizations_user_id_org_id_key";

alter table "public"."user_preferences" add constraint "user_preferences_theme_check" CHECK ((theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text]))) not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_theme_check";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_key" UNIQUE using index "user_preferences_user_id_key";

alter table "public"."user_profiles" add constraint "user_profiles_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'user'::text]))) not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_role_check";

alter table "public"."user_sessions" add constraint "user_sessions_session_token_key" UNIQUE using index "user_sessions_session_token_key";

alter table "public"."user_sessions" add constraint "user_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_sessions" validate constraint "user_sessions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.analyze_business_email_domain(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  profile_record RECORD;
  email_domain TEXT;
  analysis JSONB := '{}';
BEGIN
  SELECT business_email INTO profile_record FROM business_profiles WHERE user_id = p_user_id;
  
  IF profile_record.business_email IS NULL THEN
    RETURN analysis;
  END IF;
  
  -- Extract domain from email
  email_domain := split_part(profile_record.business_email, '@', 2);
  
  -- Analyze domain characteristics
  analysis := jsonb_build_object(
    'domain', email_domain,
    'is_custom_domain', email_domain NOT IN ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'),
    'professional_score', CASE 
      WHEN email_domain NOT IN ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com') THEN 85
      ELSE 60
    END,
    'recommendations', CASE 
      WHEN email_domain IN ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com') THEN 
        ARRAY['Consider using a custom domain for better professionalism', 'Set up business email with your domain name']
      ELSE ARRAY['Professional email domain detected', 'Consider email marketing setup']
    END,
    'analyzed_at', NOW()
  );
  
  -- Update the business profile with the analysis
  UPDATE business_profiles 
  SET 
    business_email_domain = email_domain,
    business_email_analysis = analysis
  WHERE user_id = p_user_id;
  
  RETURN analysis;
END;
$function$
;

create or replace view "public"."business_insights_summary" as  SELECT user_id,
    company_name,
    industry,
    business_stage,
    business_model,
    company_size,
    annual_revenue,
    team_size,
    assessment_completion_percentage,
    auto_detection_confidence,
    business_email_domain,
    org_id,
    business_context,
    ai_insights,
    recommendations,
    auto_detected_answers,
    data_sources,
    competitive_landscape,
    market_research_data,
    performance_metrics,
    integration_data,
    business_health_history,
    strategic_roadmap,
    risk_assessment,
    opportunity_analysis,
    created_at,
    updated_at
   FROM business_profiles bp
  WHERE (assessment_completion_percentage > 0);


create or replace view "public"."business_performance_tracking" as  SELECT user_id,
    company_name,
    industry,
    business_stage,
    annual_revenue,
    team_size,
    assessment_completion_percentage,
    performance_metrics,
    business_health_history,
    risk_assessment,
    opportunity_analysis,
    created_at,
    updated_at
   FROM business_profiles bp
  WHERE ((performance_metrics IS NOT NULL) AND (performance_metrics <> '{}'::jsonb));


create or replace view "public"."business_profile_analytics" as  SELECT user_id,
    company_name,
    industry,
    business_stage,
    business_model,
    company_size,
    annual_revenue,
    team_size,
    assessment_completion_percentage,
    auto_detection_confidence,
    business_email_domain,
    org_id,
    (business_context ->> 'business_type'::text) AS business_type,
    (business_context ->> 'market_position'::text) AS market_position,
    ((business_context ->> 'growth_potential'::text))::numeric AS growth_potential,
    ((business_context ->> 'operational_maturity'::text))::numeric AS operational_maturity,
    ((business_context ->> 'financial_health_score'::text))::numeric AS financial_health_score,
    ((business_context ->> 'market_opportunity'::text))::numeric AS market_opportunity,
        CASE
            WHEN (ai_insights IS NOT NULL) THEN jsonb_array_length(ai_insights)
            ELSE 0
        END AS ai_insights_count,
        CASE
            WHEN (recommendations IS NOT NULL) THEN jsonb_array_length(recommendations)
            ELSE 0
        END AS recommendations_count,
    array_length(competitive_advantages, 1) AS competitive_advantages_count,
    array_length(current_clients, 1) AS current_clients_count,
        CASE
            WHEN (business_health_history IS NOT NULL) THEN jsonb_array_length(business_health_history)
            ELSE 0
        END AS health_history_entries,
    created_at,
    updated_at
   FROM business_profiles bp;


CREATE OR REPLACE FUNCTION public.calculate_business_health_score(p_legal_structure text, p_business_stage text, p_annual_revenue text, p_team_size text, p_assessment_completion integer)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Base score from assessment completion
  score := score + (p_assessment_completion * 0.3);
  
  -- Legal structure scoring
  CASE p_legal_structure
    WHEN 'llc' THEN score := score + 15;
    WHEN 'scorp' THEN score := score + 20;
    WHEN 'c-corp' THEN score := score + 25;
    WHEN 'partnership' THEN score := score + 10;
    WHEN 'sole-proprietorship' THEN score := score + 5;
    ELSE score := score + 0;
  END CASE;
  
  -- Business stage scoring
  CASE p_business_stage
    WHEN 'startup' THEN score := score + 10;
    WHEN 'growth' THEN score := score + 15;
    WHEN 'mature' THEN score := score + 20;
    WHEN 'scaling' THEN score := score + 25;
    ELSE score := score + 0;
  END CASE;
  
  -- Revenue scoring
  CASE p_annual_revenue
    WHEN 'under-100k' THEN score := score + 10;
    WHEN '100k-500k' THEN score := score + 15;
    WHEN '500k-1m' THEN score := score + 20;
    WHEN '1m-5m' THEN score := score + 25;
    WHEN '5m-10m' THEN score := score + 30;
    WHEN '10m+' THEN score := score + 35;
    ELSE score := score + 0;
  END CASE;
  
  -- Team size scoring
  CASE p_team_size
    WHEN '1-5' THEN score := score + 5;
    WHEN '6-10' THEN score := score + 10;
    WHEN '11-25' THEN score := score + 15;
    WHEN '26-50' THEN score := score + 20;
    WHEN '50+' THEN score := score + 25;
    ELSE score := score + 0;
  END CASE;
  
  RETURN LEAST(score, 100);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_enhanced_business_health_score(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  profile_record RECORD;
  score INTEGER := 0;
  email_score INTEGER := 0;
  competitive_score INTEGER := 0;
  performance_score INTEGER := 0;
BEGIN
  SELECT * INTO profile_record FROM business_profiles WHERE user_id = p_user_id;
  
  IF profile_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Base score from assessment completion (30%)
  score := score + (profile_record.assessment_completion_percentage * 0.3);
  
  -- Legal structure scoring (15%)
  CASE profile_record.legal_structure
    WHEN 'llc' THEN score := score + 15;
    WHEN 'scorp' THEN score := score + 20;
    WHEN 'c-corp' THEN score := score + 25;
    WHEN 'partnership' THEN score := score + 10;
    WHEN 'sole-proprietorship' THEN score := score + 5;
    ELSE score := score + 0;
  END CASE;
  
  -- Business stage scoring (10%)
  CASE profile_record.business_stage
    WHEN 'startup' THEN score := score + 10;
    WHEN 'growth' THEN score := score + 15;
    WHEN 'mature' THEN score := score + 20;
    WHEN 'scaling' THEN score := score + 25;
    ELSE score := score + 0;
  END CASE;
  
  -- Revenue scoring (15%)
  CASE profile_record.annual_revenue
    WHEN 'under-100k' THEN score := score + 10;
    WHEN '100k-500k' THEN score := score + 15;
    WHEN '500k-1m' THEN score := score + 20;
    WHEN '1m-5m' THEN score := score + 25;
    WHEN '5m-10m' THEN score := score + 30;
    WHEN '10m+' THEN score := score + 35;
    ELSE score := score + 0;
  END CASE;
  
  -- Team size scoring (10%)
  CASE profile_record.team_size
    WHEN '1-5' THEN score := score + 5;
    WHEN '6-10' THEN score := score + 10;
    WHEN '11-25' THEN score := score + 15;
    WHEN '26-50' THEN score := score + 20;
    WHEN '50+' THEN score := score + 25;
    ELSE score := score + 0;
  END CASE;
  
  -- Business email analysis scoring (10%)
  IF profile_record.business_email_analysis IS NOT NULL AND profile_record.business_email_analysis != '{}' THEN
    email_score := (profile_record.business_email_analysis->>'professional_score')::integer;
    score := score + (email_score * 0.1);
  END IF;
  
  -- Competitive advantages scoring (5%)
  IF profile_record.competitive_advantages IS NOT NULL THEN
    competitive_score := array_length(profile_record.competitive_advantages, 1) * 5;
    score := score + (competitive_score * 0.05);
  END IF;
  
  -- Performance metrics scoring (5%)
  IF profile_record.performance_metrics IS NOT NULL AND profile_record.performance_metrics != '{}' THEN
    performance_score := (profile_record.performance_metrics->>'overall_score')::integer;
    score := score + (performance_score * 0.05);
  END IF;
  
  RETURN LEAST(score, 100);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_monitoring_data(p_days_to_keep integer DEFAULT 30)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Cleanup old RLS denials
    DELETE FROM public.rls_denials 
    WHERE event_time < NOW() - INTERVAL '1 day' * p_days_to_keep;
    
    -- Cleanup old slow queries
    DELETE FROM public.slow_queries 
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_to_keep;
    
    -- Log cleanup
    INSERT INTO public.operation_contexts (
        tenant_id, org_id, user_id, operation, table_name, metadata
    ) VALUES (
        NULL, NULL, NULL, 'cleanup_monitoring_data', 'monitoring',
        jsonb_build_object(
            'days_kept', p_days_to_keep,
            'cleaned_at', NOW()
        )
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_preferences()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enhanced_org_select_policy()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Check if user has access
    IF EXISTS (
        SELECT 1 
        FROM public.user_organizations uo
        JOIN public.organizations o ON uo.org_id = o.id
        WHERE o.tenant_id = organizations.tenant_id
        AND uo.user_id = auth.uid()
    ) THEN
        RETURN TRUE;
    ELSE
        -- Log the denial
        PERFORM log_rls_denial('organizations', 'SELECT', 'User does not have access to this organization');
        RETURN FALSE;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_business_insights(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  profile_record RECORD;
  insights JSONB := '[]';
BEGIN
  SELECT * INTO profile_record FROM business_profiles WHERE user_id = p_user_id;
  
  IF profile_record IS NULL THEN
    RETURN insights;
  END IF;
  
  -- Generate insights based on business profile
  IF profile_record.legal_structure = 'sole-proprietorship' AND profile_record.annual_revenue = '500k-1m' THEN
    insights := insights || jsonb_build_object(
      'id', gen_random_uuid(),
      'category', 'financial-optimization',
      'insight_type', 'warning',
      'title', 'Consider LLC or S-Corp for Tax Benefits',
      'description', 'Your revenue level suggests you could benefit from a more formal business structure.',
      'confidence', 85,
      'impact_score', 7,
      'actionable', true,
      'related_metrics', ARRAY['tax_efficiency', 'liability_protection'],
      'generated_at', NOW()
    );
  END IF;
  
  IF profile_record.business_stage = 'startup' AND profile_record.team_size = '1-5' THEN
    insights := insights || jsonb_build_object(
      'id', gen_random_uuid(),
      'category', 'business-strategy',
      'insight_type', 'recommendation',
      'title', 'Focus on Product-Market Fit',
      'description', 'As a startup, prioritize validating your product-market fit before scaling.',
      'confidence', 90,
      'impact_score', 8,
      'actionable', true,
      'related_metrics', ARRAY['customer_validation', 'product_market_fit_score'],
      'generated_at', NOW()
    );
  END IF;
  
  RETURN insights;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_context()
 RETURNS TABLE(tenant_id uuid, org_id uuid, user_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        (auth.jwt() ->> 'tenant_id')::UUID as tenant_id,
        (auth.jwt() ->> 'org_id')::UUID as org_id,
        auth.uid()::UUID as user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_entity_representations(p_user_id uuid, p_canonical_id uuid, p_entity_type text)
 RETURNS TABLE(integration_name text, external_id text, external_system text, confidence_score numeric, match_method text, last_updated timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        em.integration_name,
        em.external_id,
        em.external_system,
        em.confidence_score,
        em.match_method,
        em.updated_at
    FROM public.entity_mappings em
    WHERE em.user_id = p_user_id
    AND em.canonical_id = p_canonical_id
    AND em.entity_type = p_entity_type
    AND em.is_active = true
    ORDER BY em.confidence_score DESC, em.updated_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_rls_denial_stats(p_days integer DEFAULT 7)
 RETURNS TABLE(table_name text, operation text, denial_count bigint, unique_users bigint, most_common_error text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        rd.table_name,
        rd.operation,
        COUNT(*) as denial_count,
        COUNT(DISTINCT rd.user_id) as unique_users,
        MODE() WITHIN GROUP (ORDER BY rd.error_message) as most_common_error
    FROM public.rls_denials rd
    WHERE rd.event_time >= NOW() - INTERVAL '1 day' * p_days
    GROUP BY rd.table_name, rd.operation
    ORDER BY denial_count DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_slow_query_stats(p_days integer DEFAULT 7)
 RETURNS TABLE(table_name text, operation text, avg_execution_time_ms numeric, max_execution_time_ms integer, query_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        sq.table_name,
        sq.operation,
        AVG(sq.execution_time_ms) as avg_execution_time_ms,
        MAX(sq.execution_time_ms) as max_execution_time_ms,
        COUNT(*) as query_count
    FROM public.slow_queries sq
    WHERE sq.created_at >= NOW() - INTERVAL '1 day' * p_days
    GROUP BY sq.table_name, sq.operation
    ORDER BY avg_execution_time_ms DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_tenant_seat_usage(p_tenant_id uuid)
 RETURNS TABLE(current_seats bigint, max_seats integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT uo.user_id) as current_seats,
        COALESCE(s.seats, 0) as max_seats
    FROM public.user_organizations uo
    JOIN public.organizations o ON uo.org_id = o.id
    LEFT JOIN public.subscriptions s ON s.tenant_id = o.tenant_id
    WHERE o.tenant_id = p_tenant_id
    AND s.status = 'active'
    GROUP BY s.seats;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_tenant_usage_summary(p_tenant_id uuid, p_days integer DEFAULT 30)
 RETURNS TABLE(resource text, action text, total_quantity bigint, total_cost numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        ue.resource,
        ue.action,
        SUM(ue.quantity) as total_quantity,
        SUM(ue.cost) as total_cost
    FROM public.usage_events ue
    WHERE ue.tenant_id = p_tenant_id
    AND ue.created_at >= NOW() - INTERVAL '1 day' * p_days
    GROUP BY ue.resource, ue.action
    ORDER BY total_cost DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_company_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN (
        SELECT company_id 
        FROM public.user_profiles 
        WHERE id = auth.uid()
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS TABLE(tenant_id uuid, org_id uuid, role text, is_admin boolean, is_owner boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        o.tenant_id,
        uo.org_id,
        uo.role,
        uo.role IN ('owner', 'admin') as is_admin,
        uo.role = 'owner' as is_owner
    FROM public.user_organizations uo
    JOIN public.organizations o ON uo.org_id = o.id
    WHERE uo.user_id = auth.uid()
    AND uo.is_primary = true
    LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_permission(p_resource text, p_action text DEFAULT 'read'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_tenant_id UUID;
    v_entitlement_count INTEGER;
BEGIN
    -- Get tenant_id from context
    SELECT tenant_id INTO v_tenant_id FROM get_current_context();
    
    IF v_tenant_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check entitlement
    SELECT COUNT(*) INTO v_entitlement_count
    FROM public.tenant_entitlements
    WHERE tenant_id = v_tenant_id 
      AND resource = p_resource 
      AND action = p_action;
    
    RETURN v_entitlement_count > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_company_admin(target_company_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE id = auth.uid() 
        AND company_id = target_company_id
        AND role IN ('admin', 'owner')
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_organizations uo
        JOIN public.organizations o ON uo.org_id = o.id
        WHERE o.tenant_id = p_tenant_id
        AND uo.user_id = auth.uid()
        AND uo.role IN ('owner', 'admin')
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_tenant_owner(p_tenant_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_organizations uo
        JOIN public.organizations o ON uo.org_id = o.id
        WHERE o.tenant_id = p_tenant_id
        AND uo.user_id = auth.uid()
        AND uo.role = 'owner'
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.list_all_policies()
 RETURNS TABLE(table_name text, policy_name text, operation text, definition text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.tablename::TEXT,
        p.policyname::TEXT,
        p.cmd::TEXT,
        p.qual::TEXT
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    ORDER BY p.tablename, p.policyname;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_activity_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- This is a placeholder for now - we'll implement proper activity logging later
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_rls_denial(p_table_name text, p_operation text, p_error_message text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.rls_denials (
        user_id,
        tenant_id,
        org_id,
        table_name,
        operation,
        error_message,
        request_path,
        user_agent,
        ip_address
    ) VALUES (
        auth.uid(),
        (auth.jwt() ->> 'tenant_id')::UUID,
        (auth.jwt() ->> 'org_id')::UUID,
        p_table_name,
        p_operation,
        p_error_message,
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'user-agent',
        inet_client_addr()
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_slow_query(p_query_text text, p_execution_time_ms integer, p_rows_returned integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.slow_queries (
        query_text,
        execution_time_ms,
        rows_returned,
        tenant_id,
        org_id,
        user_id,
        table_name,
        operation
    ) VALUES (
        p_query_text,
        p_execution_time_ms,
        p_rows_returned,
        (auth.jwt() ->> 'tenant_id')::UUID,
        (auth.jwt() ->> 'org_id')::UUID,
        auth.uid(),
        CASE 
            WHEN p_query_text ILIKE '%FROM%tenants%' THEN 'tenants'
            WHEN p_query_text ILIKE '%FROM%organizations%' THEN 'organizations'
            WHEN p_query_text ILIKE '%FROM%user_organizations%' THEN 'user_organizations'
            WHEN p_query_text ILIKE '%FROM%subscriptions%' THEN 'subscriptions'
            WHEN p_query_text ILIKE '%FROM%tenant_entitlements%' THEN 'tenant_entitlements'
            WHEN p_query_text ILIKE '%FROM%shared_records%' THEN 'shared_records'
            WHEN p_query_text ILIKE '%FROM%usage_events%' THEN 'usage_events'
            WHEN p_query_text ILIKE '%FROM%tenant_notifications%' THEN 'tenant_notifications'
            WHEN p_query_text ILIKE '%FROM%billing_accounts%' THEN 'billing_accounts'
            ELSE NULL
        END,
        CASE 
            WHEN p_query_text ILIKE '%SELECT%' THEN 'SELECT'
            WHEN p_query_text ILIKE '%INSERT%' THEN 'INSERT'
            WHEN p_query_text ILIKE '%UPDATE%' THEN 'UPDATE'
            WHEN p_query_text ILIKE '%DELETE%' THEN 'DELETE'
            ELSE 'OTHER'
        END
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_user_activity(p_user_id uuid, p_action text, p_resource_type text DEFAULT NULL::text, p_resource_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO user_activity_logs (
    user_id, 
    action, 
    resource_type, 
    resource_id, 
    metadata
  ) VALUES (
    p_user_id, 
    p_action, 
    p_resource_type, 
    p_resource_id, 
    p_metadata
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.monitor_query_performance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_time_ms INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Execute the original operation
    IF TG_OP = 'INSERT' THEN
        NEW := NEW;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW := NEW;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Log slow queries (over 100ms)
    IF execution_time_ms > 100 THEN
        PERFORM log_slow_query(
            current_query(),
            execution_time_ms,
            CASE WHEN TG_OP = 'SELECT' THEN 1 ELSE NULL END
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.populate_integration_data_from_existing()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    user_integration RECORD;
    contact_count INTEGER;
    company_count INTEGER;
    deal_count INTEGER;
BEGIN
    -- Loop through all user integrations
    FOR user_integration IN 
        SELECT id, user_id, integration_name 
        FROM public.user_integrations 
        WHERE status = 'active'
    LOOP
        -- Count contacts for this user
        SELECT COUNT(*) INTO contact_count 
        FROM public.contacts 
        WHERE user_id = user_integration.user_id;
        
        -- Count companies for this user (using owner_id)
        SELECT COUNT(*) INTO company_count 
        FROM public.companies 
        WHERE owner_id = user_integration.user_id;
        
        -- Count deals for this user (if table exists)
        BEGIN
            SELECT COUNT(*) INTO deal_count 
            FROM public.deals 
            WHERE user_id = user_integration.user_id;
        EXCEPTION WHEN undefined_table THEN
            deal_count := 0;
        END;
        
        -- Insert contact data point
        IF contact_count > 0 THEN
            -- Delete existing record if it exists
            DELETE FROM public.integration_data 
            WHERE user_integration_id = user_integration.id 
            AND data_point_definition_id = 'contacts' 
            AND data_type = 'contacts';
            
            INSERT INTO public.integration_data (
                user_integration_id,
                data_point_definition_id,
                data_type,
                data_content,
                data_category,
                business_value,
                is_required
            ) VALUES (
                user_integration.id,
                'contacts',
                'contacts',
                jsonb_build_object('count', contact_count, 'source', user_integration.integration_name),
                'crm',
                'high',
                true
            );
        END IF;
        
        -- Insert company data point
        IF company_count > 0 THEN
            -- Delete existing record if it exists
            DELETE FROM public.integration_data 
            WHERE user_integration_id = user_integration.id 
            AND data_point_definition_id = 'companies' 
            AND data_type = 'companies';
            
            INSERT INTO public.integration_data (
                user_integration_id,
                data_point_definition_id,
                data_type,
                data_content,
                data_category,
                business_value,
                is_required
            ) VALUES (
                user_integration.id,
                'companies',
                'companies',
                jsonb_build_object('count', company_count, 'source', user_integration.integration_name),
                'crm',
                'high',
                true
            );
        END IF;
        
        -- Insert deal data point
        IF deal_count > 0 THEN
            -- Delete existing record if it exists
            DELETE FROM public.integration_data 
            WHERE user_integration_id = user_integration.id 
            AND data_point_definition_id = 'deals' 
            AND data_type = 'deals';
            
            INSERT INTO public.integration_data (
                user_integration_id,
                data_point_definition_id,
                data_type,
                data_content,
                data_category,
                business_value,
                is_required
            ) VALUES (
                user_integration.id,
                'deals',
                'deals',
                jsonb_build_object('count', deal_count, 'source', user_integration.integration_name),
                'sales',
                'high',
                true
            );
        END IF;
    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_entity(p_user_id uuid, p_entity_type text, p_integration_id uuid, p_external_id text, p_integration_name text, p_entity_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_canonical_id UUID;
    v_existing_mapping RECORD;
    v_similar_entities RECORD;
    v_best_match_id UUID;
    v_best_score DECIMAL(3,2);
BEGIN
    -- First, check if we already have a mapping for this external entity
    SELECT canonical_id INTO v_existing_mapping
    FROM public.entity_mappings
    WHERE user_id = p_user_id
    AND integration_id = p_integration_id
    AND external_id = p_external_id
    AND entity_type = p_entity_type
    AND is_active = true;
    
    IF v_existing_mapping.canonical_id IS NOT NULL THEN
        RETURN v_existing_mapping.canonical_id;
    END IF;
    
    -- Look for similar entities to potentially merge
    v_best_score := 0;
    v_best_match_id := NULL;
    
    -- For contacts, try to match by email, phone, or name
    IF p_entity_type = 'contact' THEN
        -- Try exact email match
        SELECT id INTO v_best_match_id
        FROM public.contacts
        WHERE user_id = p_user_id
        AND email = p_entity_data->>'email'
        AND email IS NOT NULL
        LIMIT 1;
        
        IF v_best_match_id IS NOT NULL THEN
            v_best_score := 0.95;
        ELSE
            -- Try fuzzy name match
            SELECT id INTO v_best_match_id
            FROM public.contacts
            WHERE user_id = p_user_id
            AND (
                (first_name ILIKE p_entity_data->>'first_name' AND last_name ILIKE p_entity_data->>'last_name')
                OR (first_name ILIKE p_entity_data->>'last_name' AND last_name ILIKE p_entity_data->>'first_name')
            )
            LIMIT 1;
            
            IF v_best_match_id IS NOT NULL THEN
                v_best_score := 0.8;
            END IF;
        END IF;
    END IF;
    
    -- For companies, try to match by domain, name, or website
    IF p_entity_type = 'company' THEN
        -- Try exact domain match
        SELECT id INTO v_best_match_id
        FROM public.companies
        WHERE domain = p_entity_data->>'domain'
        AND domain IS NOT NULL
        LIMIT 1;
        
        IF v_best_match_id IS NOT NULL THEN
            v_best_score := 0.95;
        ELSE
            -- Try fuzzy name match
            SELECT id INTO v_best_match_id
            FROM public.companies
            WHERE name ILIKE p_entity_data->>'name'
            LIMIT 1;
            
            IF v_best_match_id IS NOT NULL THEN
                v_best_score := 0.8;
            END IF;
        END IF;
    END IF;
    
    -- If we found a good match, use it as canonical
    IF v_best_score >= 0.8 THEN
        v_canonical_id := v_best_match_id;
    ELSE
        -- Create new canonical entity
        IF p_entity_type = 'contact' THEN
            INSERT INTO public.contacts (
                user_id, first_name, last_name, email, phone, job_title,
                company_name, lead_source, status, metadata
            ) VALUES (
                p_user_id,
                p_entity_data->>'first_name',
                p_entity_data->>'last_name',
                p_entity_data->>'email',
                p_entity_data->>'phone',
                p_entity_data->>'job_title',
                p_entity_data->>'company_name',
                p_entity_data->>'lead_source',
                'active',
                p_entity_data
            ) RETURNING id INTO v_canonical_id;
        ELSIF p_entity_type = 'company' THEN
            INSERT INTO public.companies (
                name, domain, industry, size, description, website,
                metadata
            ) VALUES (
                p_entity_data->>'name',
                p_entity_data->>'domain',
                p_entity_data->>'industry',
                p_entity_data->>'size',
                p_entity_data->>'description',
                p_entity_data->>'website',
                p_entity_data
            ) RETURNING id INTO v_canonical_id;
        END IF;
    END IF;
    
    -- Create mapping record
    INSERT INTO public.entity_mappings (
        user_id, entity_type, canonical_id, canonical_type,
        integration_id, integration_name, external_id, external_system,
        confidence_score, match_method, match_reason, metadata
    ) VALUES (
        p_user_id, p_entity_type, v_canonical_id, p_entity_type,
        p_integration_id, p_integration_name, p_external_id, p_integration_name,
        v_best_score, 
        CASE WHEN v_best_score >= 0.95 THEN 'exact' 
             WHEN v_best_score >= 0.8 THEN 'fuzzy'
             ELSE 'new_entity' END,
        CASE WHEN v_best_score >= 0.95 THEN 'Exact match found'
             WHEN v_best_score >= 0.8 THEN 'Fuzzy match found'
             ELSE 'New entity created' END,
        p_entity_data
    );
    
    RETURN v_canonical_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.scheduled_monitoring_cleanup()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Cleanup data older than 30 days
    PERFORM cleanup_monitoring_data(30);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_company_access_control()
 RETURNS TABLE(test_name text, result boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Test 1: Check if user can access their own company
    RETURN QUERY SELECT 
        'User can access own company'::TEXT,
        public.user_belongs_to_company(public.get_user_company_id())::BOOLEAN;
    
    -- Test 2: Check if user cannot access other companies
    RETURN QUERY SELECT 
        'User cannot access other companies'::TEXT,
        NOT public.user_belongs_to_company(gen_random_uuid())::BOOLEAN;
    
    -- Test 3: Check if service role bypass works
    RETURN QUERY SELECT 
        'Service role bypass works'::TEXT,
        (auth.role() = 'service_role')::BOOLEAN;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.track_business_health_history(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  profile_record RECORD;
  health_score INTEGER;
  history_entry JSONB;
BEGIN
  SELECT * INTO profile_record FROM business_profiles WHERE user_id = p_user_id;
  
  IF profile_record IS NULL THEN
    RETURN '[]';
  END IF;
  
  -- Calculate current health score
  health_score := calculate_enhanced_business_health_score(p_user_id);
  
  -- Create history entry
  history_entry := jsonb_build_object(
    'score', health_score,
    'assessment_completion', profile_record.assessment_completion_percentage,
    'legal_structure', profile_record.legal_structure,
    'business_stage', profile_record.business_stage,
    'annual_revenue', profile_record.annual_revenue,
    'team_size', profile_record.team_size,
    'tracked_at', NOW()
  );
  
  -- Add to history array
  UPDATE business_profiles 
  SET business_health_history = business_health_history || history_entry
  WHERE user_id = p_user_id;
  
  RETURN business_health_history;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_analyze_business_email()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.business_email IS DISTINCT FROM OLD.business_email THEN
    PERFORM analyze_business_email_domain(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_track_health_history()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF (NEW.legal_structure IS DISTINCT FROM OLD.legal_structure OR
      NEW.business_stage IS DISTINCT FROM OLD.business_stage OR
      NEW.annual_revenue IS DISTINCT FROM OLD.annual_revenue OR
      NEW.team_size IS DISTINCT FROM OLD.team_size OR
      NEW.assessment_completion_percentage IS DISTINCT FROM OLD.assessment_completion_percentage) THEN
    PERFORM track_business_health_history(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_business_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_integration_sync_logs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_profile_safe(user_id uuid, updates jsonb)
 RETURNS TABLE(id uuid, email text, first_name text, last_name text, display_name text, role text, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user is updating their own profile
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Can only update own profile';
  END IF;
  
  -- Update the profile
  UPDATE public.user_profiles 
  SET 
    first_name = COALESCE(updates->>'first_name', first_name),
    last_name = COALESCE(updates->>'last_name', last_name),
    display_name = COALESCE(updates->>'display_name', display_name),
    role = COALESCE(updates->>'role', role),
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Return the updated profile
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.first_name,
    up.last_name,
    up.display_name,
    up.role,
    up.updated_at
  FROM public.user_profiles up
  WHERE up.id = user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_belongs_to_company(target_company_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE id = auth.uid() 
        AND company_id = target_company_id
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_company_owner(company_uuid uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN (
        SELECT owner_id FROM companies 
        WHERE id = company_uuid
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_company_owner(company_uuid uuid, user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM companies 
        WHERE id = company_uuid 
        AND owner_id = user_uuid
    );
END;
$function$
;

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

CREATE OR REPLACE FUNCTION public.transfer_company_ownership(company_uuid uuid, new_owner_uuid uuid, current_user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Check if current user is the owner
    IF NOT is_company_owner(company_uuid, current_user_uuid) THEN
        RAISE EXCEPTION 'Only the current owner can transfer ownership';
    END IF;
    
    -- Update company owner
    UPDATE companies 
    SET owner_id = new_owner_uuid, updated_at = NOW()
    WHERE id = company_uuid;
    
    -- Update user profiles to reflect ownership change
    UPDATE user_profiles 
    SET role = 'admin', updated_at = NOW()
    WHERE company_id = company_uuid AND id = current_user_uuid;
    
    UPDATE user_profiles 
    SET role = 'owner', updated_at = NOW()
    WHERE company_id = company_uuid AND id = new_owner_uuid;
    
    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."business_profiles" to "authenticated";

grant insert on table "public"."business_profiles" to "authenticated";

grant select on table "public"."business_profiles" to "authenticated";

grant update on table "public"."business_profiles" to "authenticated";

grant delete on table "public"."contacts" to "service_role";

grant insert on table "public"."contacts" to "service_role";

grant references on table "public"."contacts" to "service_role";

grant select on table "public"."contacts" to "service_role";

grant trigger on table "public"."contacts" to "service_role";

grant truncate on table "public"."contacts" to "service_role";

grant update on table "public"."contacts" to "service_role";

grant delete on table "public"."data_point_relationships" to "authenticated";

grant insert on table "public"."data_point_relationships" to "authenticated";

grant select on table "public"."data_point_relationships" to "authenticated";

grant update on table "public"."data_point_relationships" to "authenticated";

grant delete on table "public"."deals" to "service_role";

grant insert on table "public"."deals" to "service_role";

grant references on table "public"."deals" to "service_role";

grant select on table "public"."deals" to "service_role";

grant trigger on table "public"."deals" to "service_role";

grant truncate on table "public"."deals" to "service_role";

grant update on table "public"."deals" to "service_role";

grant delete on table "public"."integration_data" to "service_role";

grant insert on table "public"."integration_data" to "service_role";

grant references on table "public"."integration_data" to "service_role";

grant select on table "public"."integration_data" to "service_role";

grant trigger on table "public"."integration_data" to "service_role";

grant truncate on table "public"."integration_data" to "service_role";

grant update on table "public"."integration_data" to "service_role";

grant delete on table "public"."organizations" to "service_role";

grant insert on table "public"."organizations" to "service_role";

grant references on table "public"."organizations" to "service_role";

grant select on table "public"."organizations" to "service_role";

grant trigger on table "public"."organizations" to "service_role";

grant truncate on table "public"."organizations" to "service_role";

grant update on table "public"."organizations" to "service_role";

grant delete on table "public"."user_organizations" to "service_role";

grant insert on table "public"."user_organizations" to "service_role";

grant references on table "public"."user_organizations" to "service_role";

grant select on table "public"."user_organizations" to "service_role";

grant trigger on table "public"."user_organizations" to "service_role";

grant truncate on table "public"."user_organizations" to "service_role";

grant update on table "public"."user_organizations" to "service_role";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

create policy "action_cards_delete_own"
on "public"."action_cards"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "action_cards_insert_own"
on "public"."action_cards"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "action_cards_select_own"
on "public"."action_cards"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "action_cards_service_role"
on "public"."action_cards"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "action_cards_update_own"
on "public"."action_cards"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "ai_audit_logs_delete_own"
on "public"."ai_audit_logs"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "ai_audit_logs_insert_own"
on "public"."ai_audit_logs"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "ai_audit_logs_select_own"
on "public"."ai_audit_logs"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "ai_audit_logs_service_role"
on "public"."ai_audit_logs"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "ai_audit_logs_update_own"
on "public"."ai_audit_logs"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "ai_conversations_delete_own"
on "public"."ai_conversations"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "ai_conversations_insert_own"
on "public"."ai_conversations"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "ai_conversations_select_own"
on "public"."ai_conversations"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "ai_conversations_service_role"
on "public"."ai_conversations"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "ai_conversations_update_own"
on "public"."ai_conversations"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "ai_inbox_items_delete_own"
on "public"."ai_inbox_items"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "ai_inbox_items_insert_own"
on "public"."ai_inbox_items"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "ai_inbox_items_select_own"
on "public"."ai_inbox_items"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "ai_inbox_items_service_role"
on "public"."ai_inbox_items"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "ai_inbox_items_update_own"
on "public"."ai_inbox_items"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "ai_insights_delete_own"
on "public"."ai_insights"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "ai_insights_insert_own"
on "public"."ai_insights"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "ai_insights_select_own"
on "public"."ai_insights"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "ai_insights_service_role"
on "public"."ai_insights"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "ai_insights_update_own"
on "public"."ai_insights"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Service role can manage billing accounts"
on "public"."billing_accounts"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Tenant admins can view billing accounts"
on "public"."billing_accounts"
as permissive
for select
to public
using ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Tenant owners can update billing accounts"
on "public"."billing_accounts"
as permissive
for update
to public
using ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = 'owner'::text)))));


create policy "Users can delete own business profile"
on "public"."business_profiles"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own business profile"
on "public"."business_profiles"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can manage own business profiles"
on "public"."business_profiles"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Users can update own business profile"
on "public"."business_profiles"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own business profile"
on "public"."business_profiles"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can view own business profiles"
on "public"."business_profiles"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can view company calendar events"
on "public"."calendar_events"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles ucr
  WHERE ((ucr.user_id = auth.uid()) AND (ucr.company_id = calendar_events.company_id)))));


create policy "chat_conversations_delete_own"
on "public"."chat_conversations"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "chat_conversations_insert_own"
on "public"."chat_conversations"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "chat_conversations_select_own"
on "public"."chat_conversations"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "chat_conversations_service_role"
on "public"."chat_conversations"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "chat_conversations_update_own"
on "public"."chat_conversations"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Service role bypass usage"
on "public"."chat_usage_tracking"
as permissive
for all
to public
using (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


create policy "Users can delete own usage"
on "public"."chat_usage_tracking"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own usage"
on "public"."chat_usage_tracking"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can read own usage"
on "public"."chat_usage_tracking"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can update own usage"
on "public"."chat_usage_tracking"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "companies_delete_policy"
on "public"."companies"
as permissive
for delete
to public
using (((auth.uid() = owner_id) OR (auth.uid() = created_by)));


create policy "companies_insert_policy"
on "public"."companies"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "companies_select_policy"
on "public"."companies"
as permissive
for select
to public
using (((auth.uid() IN ( SELECT company_members.user_id
   FROM company_members
  WHERE (company_members.company_id = companies.id))) OR (auth.uid() = created_by) OR (auth.uid() = owner_id)));


create policy "companies_service_role"
on "public"."companies"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "companies_update_policy"
on "public"."companies"
as permissive
for update
to public
using (((auth.uid() = owner_id) OR (auth.uid() = created_by)));


create policy "Company admins can view audit logs"
on "public"."company_audit_logs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_audit_logs.company_id) AND (user_company_roles.user_id = auth.uid()) AND (user_company_roles.role_id IN ( SELECT company_roles.id
           FROM company_roles
          WHERE (company_roles.name = ANY (ARRAY['owner'::text, 'admin'::text]))))))));


create policy "Company admins can view billing"
on "public"."company_billing"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_billing.company_id) AND (user_company_roles.user_id = auth.uid()) AND (user_company_roles.role_id IN ( SELECT company_roles.id
           FROM company_roles
          WHERE (company_roles.name = ANY (ARRAY['owner'::text, 'admin'::text]))))))));


create policy "Users can create export requests"
on "public"."company_export_requests"
as permissive
for insert
to public
with check ((requested_by = auth.uid()));


create policy "Users can view their export requests"
on "public"."company_export_requests"
as permissive
for select
to public
using (((requested_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_export_requests.company_id) AND (user_company_roles.user_id = auth.uid()) AND (user_company_roles.role_id IN ( SELECT company_roles.id
           FROM company_roles
          WHERE (company_roles.name = ANY (ARRAY['owner'::text, 'admin'::text])))))))));


create policy "Company admins can manage invitations"
on "public"."company_invitations"
as permissive
for all
to public
using (((invited_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_invitations.company_id) AND (user_company_roles.user_id = auth.uid()) AND (user_company_roles.role_id IN ( SELECT company_roles.id
           FROM company_roles
          WHERE (company_roles.name = ANY (ARRAY['owner'::text, 'admin'::text])))))))));


create policy "Users can view company invitations"
on "public"."company_invitations"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_invitations.company_id) AND (user_company_roles.user_id = auth.uid())))));


create policy "company_members_insert_policy"
on "public"."company_members"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "company_members_manage_policy"
on "public"."company_members"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM companies c
  WHERE ((c.id = company_members.company_id) AND (c.owner_id = auth.uid())))));


create policy "company_members_select_policy"
on "public"."company_members"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "company_members_service_role"
on "public"."company_members"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can update their notifications"
on "public"."company_notifications"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_notifications.company_id) AND (user_company_roles.user_id = auth.uid())))));


create policy "Users can view their notifications"
on "public"."company_notifications"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_notifications.company_id) AND (user_company_roles.user_id = auth.uid())))));


create policy "Company admins can manage reports"
on "public"."company_reports"
as permissive
for all
to public
using (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_reports.company_id) AND (user_company_roles.user_id = auth.uid()) AND (user_company_roles.role_id IN ( SELECT company_roles.id
           FROM company_roles
          WHERE (company_roles.name = ANY (ARRAY['owner'::text, 'admin'::text])))))))));


create policy "Users can view company reports"
on "public"."company_reports"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_reports.company_id) AND (user_company_roles.user_id = auth.uid())))));


create policy "Company admins can manage roles"
on "public"."company_roles"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_roles.company_id) AND (user_company_roles.user_id = auth.uid()) AND (user_company_roles.role_id IN ( SELECT company_roles_1.id
           FROM company_roles company_roles_1
          WHERE (company_roles_1.name = ANY (ARRAY['owner'::text, 'admin'::text]))))))));


create policy "Company owners can manage company roles"
on "public"."company_roles"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM companies c
  WHERE ((c.id = company_roles.company_id) AND (c.owner_id = auth.uid())))));


create policy "Users can view company roles"
on "public"."company_roles"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles ucr
  WHERE ((ucr.user_id = auth.uid()) AND (ucr.company_id = company_roles.company_id)))));


create policy "Company admins can manage templates"
on "public"."company_templates"
as permissive
for all
to public
using (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_templates.company_id) AND (user_company_roles.user_id = auth.uid()) AND (user_company_roles.role_id IN ( SELECT company_roles.id
           FROM company_roles
          WHERE (company_roles.name = ANY (ARRAY['owner'::text, 'admin'::text])))))))));


create policy "Users can view company templates"
on "public"."company_templates"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_templates.company_id) AND (user_company_roles.user_id = auth.uid())))));


create policy "Users can view company usage"
on "public"."company_usage"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_usage.company_id) AND (user_company_roles.user_id = auth.uid())))));


create policy "Company admins can manage workflows"
on "public"."company_workflows"
as permissive
for all
to public
using (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_workflows.company_id) AND (user_company_roles.user_id = auth.uid()) AND (user_company_roles.role_id IN ( SELECT company_roles.id
           FROM company_roles
          WHERE (company_roles.name = ANY (ARRAY['owner'::text, 'admin'::text])))))))));


create policy "Users can view company workflows"
on "public"."company_workflows"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles
  WHERE ((user_company_roles.company_id = company_workflows.company_id) AND (user_company_roles.user_id = auth.uid())))));


create policy "Users can manage own contacts"
on "public"."contacts"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Users can view own contacts"
on "public"."contacts"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "contacts_delete_secure"
on "public"."contacts"
as permissive
for delete
to public
using (user_belongs_to_company(company_id));


create policy "contacts_insert_secure"
on "public"."contacts"
as permissive
for insert
to public
with check (user_belongs_to_company(company_id));


create policy "contacts_select_secure"
on "public"."contacts"
as permissive
for select
to public
using (user_belongs_to_company(company_id));


create policy "contacts_service_role"
on "public"."contacts"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "contacts_update_secure"
on "public"."contacts"
as permissive
for update
to public
using (user_belongs_to_company(company_id));


create policy "Users can delete own data point relationships"
on "public"."data_point_relationships"
as permissive
for delete
to public
using ((user_integration_id IN ( SELECT user_integrations.id
   FROM user_integrations
  WHERE (user_integrations.user_id = auth.uid()))));


create policy "Users can insert own data point relationships"
on "public"."data_point_relationships"
as permissive
for insert
to public
with check ((user_integration_id IN ( SELECT user_integrations.id
   FROM user_integrations
  WHERE (user_integrations.user_id = auth.uid()))));


create policy "Users can update own data point relationships"
on "public"."data_point_relationships"
as permissive
for update
to public
using ((user_integration_id IN ( SELECT user_integrations.id
   FROM user_integrations
  WHERE (user_integrations.user_id = auth.uid()))));


create policy "Users can view own data point relationships"
on "public"."data_point_relationships"
as permissive
for select
to public
using ((user_integration_id IN ( SELECT user_integrations.id
   FROM user_integrations
  WHERE (user_integrations.user_id = auth.uid()))));


create policy "Users can manage own deals"
on "public"."deals"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Users can view own deals"
on "public"."deals"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "deals_delete_secure"
on "public"."deals"
as permissive
for delete
to public
using (user_belongs_to_company(company_id));


create policy "deals_insert_secure"
on "public"."deals"
as permissive
for insert
to public
with check (user_belongs_to_company(company_id));


create policy "deals_select_secure"
on "public"."deals"
as permissive
for select
to public
using (user_belongs_to_company(company_id));


create policy "deals_service_role"
on "public"."deals"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "deals_update_secure"
on "public"."deals"
as permissive
for update
to public
using (user_belongs_to_company(company_id));


create policy "Company owners can manage departments"
on "public"."departments"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM companies c
  WHERE ((c.id = departments.company_id) AND (c.owner_id = auth.uid())))));


create policy "Users can view company departments"
on "public"."departments"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles ucr
  WHERE ((ucr.user_id = auth.uid()) AND (ucr.company_id = departments.company_id)))));


create policy "Users can view company document folders"
on "public"."document_folders"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles ucr
  WHERE ((ucr.user_id = auth.uid()) AND (ucr.company_id = document_folders.company_id)))));


create policy "Users can view company documents"
on "public"."documents"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles ucr
  WHERE ((ucr.user_id = auth.uid()) AND (ucr.company_id = documents.company_id)))));


create policy "Service role can manage entity mappings"
on "public"."entity_mappings"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can manage their own entity mappings"
on "public"."entity_mappings"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Users can view their own entity mappings"
on "public"."entity_mappings"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Service role can manage resolution logs"
on "public"."entity_resolution_logs"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can insert their own resolution logs"
on "public"."entity_resolution_logs"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own resolution logs"
on "public"."entity_resolution_logs"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Service role can manage similarity scores"
on "public"."entity_similarity_scores"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can manage their own similarity scores"
on "public"."entity_similarity_scores"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Users can view their own similarity scores"
on "public"."entity_similarity_scores"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete own integration data"
on "public"."integration_data"
as permissive
for delete
to public
using ((user_integration_id IN ( SELECT user_integrations.id
   FROM user_integrations
  WHERE (user_integrations.user_id = auth.uid()))));


create policy "Users can insert own integration data"
on "public"."integration_data"
as permissive
for insert
to public
with check ((user_integration_id IN ( SELECT user_integrations.id
   FROM user_integrations
  WHERE (user_integrations.user_id = auth.uid()))));


create policy "Users can update own integration data"
on "public"."integration_data"
as permissive
for update
to public
using ((user_integration_id IN ( SELECT user_integrations.id
   FROM user_integrations
  WHERE (user_integrations.user_id = auth.uid()))));


create policy "Users can view own integration data"
on "public"."integration_data"
as permissive
for select
to public
using ((user_integration_id IN ( SELECT user_integrations.id
   FROM user_integrations
  WHERE (user_integrations.user_id = auth.uid()))));


create policy "Service can insert sync logs"
on "public"."integration_sync_logs"
as permissive
for insert
to public
with check (true);


create policy "Service can update sync logs"
on "public"."integration_sync_logs"
as permissive
for update
to public
using (true);


create policy "Users can view own sync logs"
on "public"."integration_sync_logs"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Authenticated users can delete integrations"
on "public"."integrations"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Authenticated users can insert integrations"
on "public"."integrations"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Authenticated users can select integrations"
on "public"."integrations"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Authenticated users can update integrations"
on "public"."integrations"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "n8n_configurations_delete_own"
on "public"."n8n_configurations"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "n8n_configurations_insert_own"
on "public"."n8n_configurations"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "n8n_configurations_select_own"
on "public"."n8n_configurations"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "n8n_configurations_service_role"
on "public"."n8n_configurations"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "n8n_configurations_update_own"
on "public"."n8n_configurations"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own notifications"
on "public"."notifications"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Service role can manage oauth tokens"
on "public"."oauth_tokens"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Service role can manage operations"
on "public"."operation_contexts"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Tenant admins can view tenant operations"
on "public"."operation_contexts"
as permissive
for select
to public
using ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Users can view own operations"
on "public"."operation_contexts"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Service role can manage org groups"
on "public"."org_groups"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Tenant admins can manage org groups"
on "public"."org_groups"
as permissive
for all
to public
using ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Tenant members can view org groups"
on "public"."org_groups"
as permissive
for select
to public
using ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE (uo.user_id = auth.uid()))));


create policy "Service role can manage organizations"
on "public"."organizations"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Tenant admins can create organizations"
on "public"."organizations"
as permissive
for insert
to public
with check ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Tenant admins can update organizations"
on "public"."organizations"
as permissive
for update
to public
using ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Tenant members can view organizations"
on "public"."organizations"
as permissive
for select
to public
using ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE (uo.user_id = auth.uid()))));


create policy "Tenant owners can delete organizations"
on "public"."organizations"
as permissive
for delete
to public
using ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = 'owner'::text)))));


create policy "Service role bypass automations"
on "public"."personal_automations"
as permissive
for all
to public
using (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


create policy "Users can delete own automations"
on "public"."personal_automations"
as permissive
for delete
to public
using ((auth.uid() = userid));


create policy "Users can insert own automations"
on "public"."personal_automations"
as permissive
for insert
to public
with check ((auth.uid() = userid));


create policy "Users can read own automations"
on "public"."personal_automations"
as permissive
for select
to public
using ((auth.uid() = userid));


create policy "Users can update own automations"
on "public"."personal_automations"
as permissive
for update
to public
using ((auth.uid() = userid));


create policy "Service role bypass thoughts"
on "public"."personal_thoughts"
as permissive
for all
to public
using (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


create policy "Users can delete own thoughts"
on "public"."personal_thoughts"
as permissive
for delete
to public
using ((auth.uid() = userid));


create policy "Users can insert own thoughts"
on "public"."personal_thoughts"
as permissive
for insert
to public
with check ((auth.uid() = userid));


create policy "Users can read own thoughts"
on "public"."personal_thoughts"
as permissive
for select
to public
using ((auth.uid() = userid));


create policy "Users can update own thoughts"
on "public"."personal_thoughts"
as permissive
for update
to public
using ((auth.uid() = userid));


create policy "Project members can view projects"
on "public"."project_members"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles ucr
  WHERE ((ucr.user_id = auth.uid()) AND (ucr.company_id = ( SELECT projects.company_id
           FROM projects
          WHERE (projects.id = project_members.project_id)))))));


create policy "Project owners can manage projects"
on "public"."projects"
as permissive
for all
to public
using ((auth.uid() = owner_id));


create policy "Users can view company projects"
on "public"."projects"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_company_roles ucr
  WHERE ((ucr.user_id = auth.uid()) AND (ucr.company_id = projects.company_id)))));


create policy "recent_delete_own"
on "public"."recent"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "recent_insert_own"
on "public"."recent"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "recent_select_own"
on "public"."recent"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "recent_service_role"
on "public"."recent"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "recent_update_own"
on "public"."recent"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Admin can view RLS denials"
on "public"."rls_denials"
as permissive
for select
to public
using ((auth.role() = 'service_role'::text));


create policy "Service role can manage shared records"
on "public"."shared_records"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Tenant admins can create shared records"
on "public"."shared_records"
as permissive
for insert
to public
with check ((shared_by_tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Tenant admins can delete shared records"
on "public"."shared_records"
as permissive
for delete
to public
using ((shared_by_tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Tenant admins can update shared records"
on "public"."shared_records"
as permissive
for update
to public
using ((shared_by_tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Users can view shared records"
on "public"."shared_records"
as permissive
for select
to public
using (((shared_by_tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE (uo.user_id = auth.uid()))) OR (shared_with_tenant_ids ? ( SELECT (o.tenant_id)::text AS tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE (uo.user_id = auth.uid())
 LIMIT 1)) OR (shared_with_org_ids ? ( SELECT (uo.org_id)::text AS org_id
   FROM user_organizations uo
  WHERE (uo.user_id = auth.uid())
 LIMIT 1))));


create policy "Admin can view slow queries"
on "public"."slow_queries"
as permissive
for select
to public
using ((auth.role() = 'service_role'::text));


create policy "Service role can manage subscriptions"
on "public"."subscriptions"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Tenant admins can view subscriptions"
on "public"."subscriptions"
as permissive
for select
to public
using ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Public system settings are readable"
on "public"."system_settings"
as permissive
for select
to public
using ((is_public = true));


create policy "Users can view own tasks"
on "public"."tasks"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "tasks_delete_own"
on "public"."tasks"
as permissive
for delete
to public
using ((auth.uid() = created_by));


create policy "tasks_delete_secure"
on "public"."tasks"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "tasks_insert_own"
on "public"."tasks"
as permissive
for insert
to public
with check ((auth.uid() = created_by));


create policy "tasks_insert_secure"
on "public"."tasks"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "tasks_select_own"
on "public"."tasks"
as permissive
for select
to public
using (((auth.uid() = created_by) OR (auth.uid() = assigned_to)));


create policy "tasks_select_secure"
on "public"."tasks"
as permissive
for select
to public
using (((auth.uid() = user_id) OR (auth.uid() = assigned_to)));


create policy "tasks_service_role"
on "public"."tasks"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "tasks_update_own"
on "public"."tasks"
as permissive
for update
to public
using (((auth.uid() = created_by) OR (auth.uid() = assigned_to)));


create policy "tasks_update_secure"
on "public"."tasks"
as permissive
for update
to public
using (((auth.uid() = user_id) OR (auth.uid() = assigned_to)));


create policy "Service role can manage entitlements"
on "public"."tenant_entitlements"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Tenant admins can view entitlements"
on "public"."tenant_entitlements"
as permissive
for select
to public
using ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Service role can manage notifications"
on "public"."tenant_notifications"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Tenant admins can update notifications"
on "public"."tenant_notifications"
as permissive
for update
to public
using ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Tenant members can view notifications"
on "public"."tenant_notifications"
as permissive
for select
to public
using ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE (uo.user_id = auth.uid()))));


create policy "Service role can manage tenants"
on "public"."tenants"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Tenant owners can view own tenant"
on "public"."tenants"
as permissive
for select
to public
using ((id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "thoughts_delete_own"
on "public"."thoughts"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "thoughts_insert_own"
on "public"."thoughts"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "thoughts_select_own"
on "public"."thoughts"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "thoughts_service_role"
on "public"."thoughts"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "thoughts_update_own"
on "public"."thoughts"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Service role can manage usage events"
on "public"."usage_events"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Tenant admins can view tenant usage"
on "public"."usage_events"
as permissive
for select
to public
using ((tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Users can view own usage events"
on "public"."usage_events"
as permissive
for select
to public
using (((user_id = auth.uid()) AND (tenant_id IN ( SELECT DISTINCT o.tenant_id
   FROM (user_organizations uo
     JOIN organizations o ON ((uo.org_id = o.id)))
  WHERE (uo.user_id = auth.uid())))));


create policy "user_activity_delete_own"
on "public"."user_activity"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "user_activity_insert_own"
on "public"."user_activity"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "user_activity_select_own"
on "public"."user_activity"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "user_activity_service_role"
on "public"."user_activity"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "user_activity_update_own"
on "public"."user_activity"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own activity logs"
on "public"."user_activity_logs"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can manage own API keys"
on "public"."user_api_keys"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "user_company_roles_manage_policy"
on "public"."user_company_roles"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM companies c
  WHERE ((c.id = user_company_roles.company_id) AND (c.owner_id = auth.uid())))));


create policy "user_company_roles_select_policy"
on "public"."user_company_roles"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "user_company_roles_service_role"
on "public"."user_company_roles"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "user_integrations_delete_own"
on "public"."user_integrations"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "user_integrations_insert_own"
on "public"."user_integrations"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "user_integrations_select_own"
on "public"."user_integrations"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "user_integrations_service_role"
on "public"."user_integrations"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "user_integrations_update_own"
on "public"."user_integrations"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view invitations they sent"
on "public"."user_invitations"
as permissive
for select
to public
using ((auth.uid() = invited_by));


create policy "Service role bypass licenses"
on "public"."user_licenses"
as permissive
for all
to public
using (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


create policy "Users can delete own licenses"
on "public"."user_licenses"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own licenses"
on "public"."user_licenses"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can read own licenses"
on "public"."user_licenses"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can update own licenses"
on "public"."user_licenses"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Service role can manage memberships"
on "public"."user_organizations"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Tenant admins can create memberships"
on "public"."user_organizations"
as permissive
for insert
to public
with check ((org_id IN ( SELECT o.id
   FROM (organizations o
     JOIN user_organizations uo ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Tenant admins can delete memberships"
on "public"."user_organizations"
as permissive
for delete
to public
using ((org_id IN ( SELECT o.id
   FROM (organizations o
     JOIN user_organizations uo ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Tenant admins can update memberships"
on "public"."user_organizations"
as permissive
for update
to public
using ((org_id IN ( SELECT o.id
   FROM (organizations o
     JOIN user_organizations uo ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Tenant admins can view all memberships"
on "public"."user_organizations"
as permissive
for select
to public
using ((org_id IN ( SELECT o.id
   FROM (organizations o
     JOIN user_organizations uo ON ((uo.org_id = o.id)))
  WHERE ((uo.user_id = auth.uid()) AND (uo.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));


create policy "Users can view own memberships"
on "public"."user_organizations"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Users can manage own preferences"
on "public"."user_preferences"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Service role bypass profiles"
on "public"."user_profiles"
as permissive
for all
to public
using (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


create policy "Users can delete own profile"
on "public"."user_profiles"
as permissive
for delete
to public
using ((auth.uid() = id));


create policy "Users can insert own profile"
on "public"."user_profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "Users can read own profile"
on "public"."user_profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Users can update own profile"
on "public"."user_profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view own sessions"
on "public"."user_sessions"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert own analytics events"
on "public"."analytics_events"
as permissive
for insert
to public
with check (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM company_members cm
  WHERE ((cm.company_id = analytics_events.company_id) AND (cm.user_id = auth.uid()))))));


create policy "Users can manage own tasks"
on "public"."tasks"
as permissive
for all
to public
using ((auth.uid() = user_id));


CREATE TRIGGER update_billing_accounts_updated_at BEFORE UPDATE ON public.billing_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_analyze_business_email AFTER UPDATE OF business_email ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION trigger_analyze_business_email();

CREATE TRIGGER trigger_track_health_history AFTER UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION trigger_track_health_history();

CREATE TRIGGER trigger_update_business_profiles_updated_at BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION update_business_profiles_updated_at();

CREATE TRIGGER update_company_billing_updated_at BEFORE UPDATE ON public.company_billing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_export_requests_updated_at BEFORE UPDATE ON public.company_export_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_invitations_updated_at BEFORE UPDATE ON public.company_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_notifications_updated_at BEFORE UPDATE ON public.company_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_reports_updated_at BEFORE UPDATE ON public.company_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_roles_updated_at BEFORE UPDATE ON public.company_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_templates_updated_at BEFORE UPDATE ON public.company_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_workflows_updated_at BEFORE UPDATE ON public.company_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_point_relationships_updated_at BEFORE UPDATE ON public.data_point_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_folders_updated_at BEFORE UPDATE ON public.document_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_mappings_updated_at BEFORE UPDATE ON public.entity_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_similarity_scores_updated_at BEFORE UPDATE ON public.entity_similarity_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_integration_sync_logs_updated_at BEFORE UPDATE ON public.integration_sync_logs FOR EACH ROW EXECUTE FUNCTION update_integration_sync_logs_updated_at();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_notifications_updated_at BEFORE UPDATE ON public.tenant_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER log_user_activity_trigger AFTER INSERT OR DELETE OR UPDATE ON public.user_activity_logs FOR EACH ROW EXECUTE FUNCTION log_activity_trigger();

CREATE TRIGGER update_user_company_roles_updated_at BEFORE UPDATE ON public.user_company_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


