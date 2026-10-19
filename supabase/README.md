# Banco de dados (Supabase)

Projeto: `odlicsrhxcwtmyfgfyya` ("Karol's Project").

## Segurança

- `public.rsvps` e `public.admins` têm **RLS ligada e forçada**; `anon` não tem nenhum privilégio nas tabelas.
- Convidados (anon) só enviam respostas pela função `public.registrar_resposta(...)`, que valida nome, número,
  presente e o prazo (25/10/2026 23:59:59, Brasília) e faz *upsert* por **nome + número** (nome sem acento/caixa/espaços extras; mesmo número com nomes diferentes = pessoas diferentes).
- `public.consultar_resposta(nome, numero)` só devolve a resposta quando nome **e** número conferem (usada para não duplicar e para mostrar "você já respondeu").
- Leitura de `rsvps` só para usuários **autenticados cujo e-mail está em `public.admins`** (política `admins leem respostas`).
- A tabela `admins` não é legível por ninguém pela API.

## Dar acesso ao painel (`/painel`)

1. Supabase → Authentication → Users → **Add user** (e-mail + senha, marque "Auto Confirm User").
2. No SQL Editor:

```sql
insert into public.admins (email) values ('email-da-pessoa@exemplo.com');  -- sempre em minúsculas
```

3. Recomendado: Authentication → Sign In / Providers → desligar **"Allow new users to sign up"**.

Para remover o acesso: `delete from public.admins where email = '...';`
