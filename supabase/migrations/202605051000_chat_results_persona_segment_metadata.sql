alter table public.chat_results
  add column if not exists persona_segment_id text,
  add column if not exists persona_segment_name text,
  add column if not exists persona_segment_color_token text;

comment on column public.chat_results.persona_segment_id is
  'Applied persona segment identifier for this thread anchor row (for restoring persona state when reopening chats).';

comment on column public.chat_results.persona_segment_name is
  'Applied persona segment display name captured at message time.';

comment on column public.chat_results.persona_segment_color_token is
  'Persona accent color token used to restore chat history and thread styling when re-opening a chat.';
