-- Problema: a policy users_atualizar_proprio trava role e status, mas NÃO trava
-- as colunas can_*. Qualquer usuário logado consegue, pelo REST, fazer
-- PATCH na própria linha e ligar can_kanban, can_livro etc.
--
-- Esta versão mantém tudo o que a policy já fazia (auth_uid, role, status) e
-- passa a exigir que os can_* continuem iguais aos valores atuais.
-- senha_trocada, nome, foto e zap continuam editáveis pelo próprio usuário
-- (authTrocarSenha em auth.js depende de poder gravar senha_trocada).
--
-- Rode no SQL Editor do Supabase.

alter policy users_atualizar_proprio on public.users
with check (
  auth_uid = auth.uid()
  and role   = (select u.role   from public.users u where u.auth_uid = auth.uid())
  and status = (select u.status from public.users u where u.auth_uid = auth.uid())
  and can_kanban        is not distinct from (select u.can_kanban        from public.users u where u.auth_uid = auth.uid())
  and can_planilha      is not distinct from (select u.can_planilha      from public.users u where u.auth_uid = auth.uid())
  and can_livro         is not distinct from (select u.can_livro         from public.users u where u.auth_uid = auth.uid())
  and can_prioridade    is not distinct from (select u.can_prioridade    from public.users u where u.auth_uid = auth.uid())
  and can_escala        is not distinct from (select u.can_escala        from public.users u where u.auth_uid = auth.uid())
  and can_justificativa is not distinct from (select u.can_justificativa from public.users u where u.auth_uid = auth.uid())
  and can_acoes         is not distinct from (select u.can_acoes         from public.users u where u.auth_uid = auth.uid())
);

-- Conferir depois:
-- select policyname, with_check from pg_policies
-- where tablename = 'users' and policyname = 'users_atualizar_proprio';
