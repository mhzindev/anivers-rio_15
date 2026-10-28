-- Prorroga o prazo de confirmação: 25/10/2026 -> 01/11/2026 23:59:59 (Brasília).
-- Única mudança em relação à versão anterior: a data do teste de prazo em registrar_resposta.
CREATE OR REPLACE FUNCTION public.registrar_resposta(p_nome text, p_telefone text, p_confirmado boolean, p_presente text DEFAULT NULL::text, p_detalhe text DEFAULT NULL::text, p_outro boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_nome text := regexp_replace(btrim(coalesce(p_nome, '')), '\s+', ' ', 'g');
  v_tel text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_pres text := nullif(regexp_replace(btrim(coalesce(p_presente, '')), '\s+', ' ', 'g'), '');
  v_det text := nullif(regexp_replace(btrim(coalesce(p_detalhe, '')), '\s+', ' ', 'g'), '');
begin
  if now() > timestamptz '2026-11-01 23:59:59-03' then
    raise exception 'prazo_encerrado' using errcode = 'P0001';
  end if;
  if p_confirmado is null then
    raise exception 'dados_invalidos' using errcode = 'P0001';
  end if;
  if char_length(v_nome) not between 5 and 80
     or v_nome !~ '^[A-Za-zÀ-ÖØ-öø-ÿ]{2,}( [A-Za-zÀ-ÖØ-öø-ÿ]{2,})+$' then
    raise exception 'nome_invalido' using errcode = 'P0001';
  end if;
  if v_tel !~ '^[1-9][1-9][0-9]{8,9}$' or (char_length(v_tel) = 11 and substr(v_tel, 3, 1) <> '9') then
    raise exception 'telefone_invalido' using errcode = 'P0001';
  end if;
  if p_confirmado then
    if v_pres is null or char_length(v_pres) not between 3 and 80 then
      raise exception 'presente_obrigatorio' using errcode = 'P0001';
    end if;
    if v_det is not null and char_length(v_det) > 120 then
      raise exception 'dados_invalidos' using errcode = 'P0001';
    end if;
  else
    v_pres := null; v_det := null; p_outro := false;
  end if;
  if (select count(*) from public.rsvps) >= 2000
     and not exists (select 1 from public.rsvps where telefone = v_tel and nome_chave = public.chave_nome(v_nome)) then
    raise exception 'limite_atingido' using errcode = 'P0001';
  end if;

  insert into public.rsvps as r (nome, telefone, confirmado, presente, presente_detalhe, presente_outro)
  values (v_nome, v_tel, p_confirmado, v_pres, v_det, coalesce(p_outro, false))
  on conflict (telefone, nome_chave) do update
    set nome = excluded.nome,
        confirmado = excluded.confirmado,
        presente = excluded.presente,
        presente_detalhe = excluded.presente_detalhe,
        presente_outro = excluded.presente_outro,
        atualizado_em = now();
end
$function$;
