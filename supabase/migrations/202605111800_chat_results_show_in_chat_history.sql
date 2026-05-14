-- Omit unsaved custom-audience explore threads from client chat history until promoted.

alter table public.chat_results
  add column if not exists show_in_chat_history boolean not null default true;

comment on column public.chat_results.show_in_chat_history is
  'When false, this row is hidden from client chat history (e.g. custom audience explored before save). Set true when the audience is saved and the thread is promoted.';
