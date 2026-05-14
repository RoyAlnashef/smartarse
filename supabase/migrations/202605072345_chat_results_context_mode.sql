alter table public.chat_results
  add column if not exists chat_context_mode text not null default 'default';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chat_results_context_mode_check'
  ) then
    alter table public.chat_results
      add constraint chat_results_context_mode_check
      check (chat_context_mode in ('default', 'persona_segment', 'custom_audience'));
  end if;
end
$$;

comment on column public.chat_results.chat_context_mode is
  'Active chat context mode used when generating this row (default, persona_segment, custom_audience).';
