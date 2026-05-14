-- Legacy Disrupt partial index used `status = 'completed'`; the app uses `complete`
-- (see poll/persist and agent-os n8n coordination). Recreate the cache index so it
-- matches rows the app actually writes.

drop index if exists public.idx_chat_results_cache;

create index if not exists idx_chat_results_cache
  on public.chat_results (organization_id, created_at desc)
  where (
    is_cacheable = true
    and status = 'complete'
  );

comment on index public.idx_chat_results_cache is
  'Cache-oriented lookups; predicate uses status complete (not completed) to match Next.js chat routes.';
