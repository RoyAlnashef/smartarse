-- Per-project document display / context importance order (lower = earlier in list).

alter table public.project_documents
  add column if not exists sort_order integer;

update public.project_documents d
set sort_order = sub.rn - 1
from (
  select
    id,
    row_number() over (
      partition by project_id
      order by uploaded_at desc
    ) as rn
  from public.project_documents
) sub
where d.id = sub.id;

alter table public.project_documents
  alter column sort_order set not null,
  alter column sort_order set default 0;

create index if not exists project_documents_project_id_sort_order_idx
  on public.project_documents (project_id, sort_order);

comment on column public.project_documents.sort_order is
  'Display and context priority order within the project (0 = first / highest prominence).';

-- Atomic reorder; RLS applies (dashboard admin updates only).
create or replace function public.reorder_project_documents(
  p_project_id uuid,
  p_document_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  expected int;
  got int;
  distinct_ids int;
begin
  select count(*)::int into expected
  from public.project_documents
  where project_id = p_project_id;

  got := coalesce(array_length(p_document_ids, 1), 0);

  if got <> expected then
    raise exception 'reorder_project_documents: expected % document id(s), got %', expected, got;
  end if;

  if expected = 0 then
    return;
  end if;

  select count(distinct x)::int into distinct_ids
  from unnest(p_document_ids) as x;

  if distinct_ids <> expected then
    raise exception 'reorder_project_documents: duplicate or invalid document ids';
  end if;

  select count(*)::int into got
  from unnest(p_document_ids) as x(id)
  inner join public.project_documents d
    on d.id = x.id and d.project_id = p_project_id;

  if got <> expected then
    raise exception 'reorder_project_documents: one or more ids do not belong to this project';
  end if;

  update public.project_documents d
  set sort_order = s.ord
  from (
    select
      id,
      (pos - 1)::int as ord
    from unnest(p_document_ids) with ordinality as u(id, pos)
  ) s
  where d.id = s.id
    and d.project_id = p_project_id;
end;
$$;

grant execute on function public.reorder_project_documents(uuid, uuid[]) to authenticated;
