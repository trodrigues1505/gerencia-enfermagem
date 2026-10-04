// NOME DA FUNÇÃO NO SUPABASE: cards-write
// v6: identifica quem chama pelo JWT da sessão (não mais pelo header x-user-id,
//     que o cliente controla) e aplica de fato as permissões:
//       - admin: tudo
//       - can_prioridade: só altera prioridade_remocao / hora_prioridade
//       - can_escala:     só altera os campos de escala de equipe
//       - demais ações (create, delete, restore, outros campos): só admin
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-id",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
function cors(){ return new Response("ok",{headers:CORS_HEADERS}); }
function json(data: unknown, status=200){ return new Response(JSON.stringify(data),{status,headers:{...CORS_HEADERS,"Content-Type":"application/json"}}); }
function err(msg: string, status=400){ return json({error:msg},status); }
function adminClient(){ return createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}}); }

// Quem chama, a partir do JWT (Authorization). Devolve a linha de users ou null.
async function getCaller(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const sb = adminClient();
  const { data: au, error } = await sb.auth.getUser(token);
  if (error || !au?.user) return null;
  const { data } = await sb.from("users").select("*")
    .eq("auth_uid", au.user.id).eq("status", "aprovado").maybeSingle();
  return data || null;
}

async function logHistory(cardId: string, userId: string, userName: string, action: string, oldValue?: unknown, newValue?: unknown) {
  const sb = adminClient();
  await sb.from("card_history").insert({ card_id: cardId, user_id: userId, user_nome: userName, action, old_value: oldValue ?? null, new_value: newValue ?? null });
}

const PRIORIDADE_FIELDS = ["prioridade_remocao", "hora_prioridade"];
const ESCALA_FIELDS = [
  "enfermeiro_escalado", "setor_saida_enfermeiro", "remocao_destino", "hora_escala_equipe",
  "medico_escala", "setor_medico_escala", "tecnico_auxiliar_escala", "setor_tecnico_escala",
];

const ALLOWED = [
  "col_id", "pr", "status", "nome", "idade", "adm", "hd", "setor", "rec", "hosp",
  "cross_info", "amb", "saida", "retorno", "grav", "obs", "is_rn", "card_order",
  "receptor", "data_aceite", "hora_aceite", "categoria",
  "ficha_cross", "hora_adm", "medico_solic", "data_resolucao", "hora_resolucao", "unidade_receptora",
  ...PRIORIDADE_FIELDS,
  ...ESCALA_FIELDS,
];

function sanitize(b: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(b || {}).filter(([k]) => ALLOWED.includes(k)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return err("Método não permitido", 405);

  const user = await getCaller(req);
  if (!user) return err("Não autorizado — sessão inválida ou usuário não aprovado", 401);
  const userId = user.id as string;
  const isAdmin = user.role === "admin";

  const { action, id, body } = await req.json();
  const sb = adminClient();

  if (action === "create") {
    if (!isAdmin) return err("Permissão negada — requer admin", 403);
    if (!body?.nome?.trim()) return err("Nome obrigatório", 400);
    const { data, error } = await sb.from("cards").insert(sanitize(body)).select().maybeSingle();
    if (error) return err(error.message, 500);
    if (!data) return err("Não foi possível criar o card.", 500);
    await logHistory(data.id, userId, user.nome as string, "criou card", null, data);
    return json(data, 201);
  }

  if (action === "update") {
    if (!id) return err("ID do card ausente", 400);

    const { data: old, error: findErr } = await sb.from("cards").select("*").eq("id", id).maybeSingle();
    if (findErr) return err(findErr.message, 500);
    if (!old) return err("Card não encontrado — pode ter sido excluído ou os dados locais estão desatualizados. Recarregue a página e tente novamente.", 404);

    let sanitized = sanitize(body);

    if (!isAdmin) {
      // Não-admin: só os campos cobertos pelas flags dele. O resto do formulário é ignorado.
      const campos = [
        ...(user.can_prioridade ? PRIORIDADE_FIELDS : []),
        ...(user.can_escala ? ESCALA_FIELDS : []),
      ];
      if (!campos.length) return err("Permissão negada — requer admin", 403);
      sanitized = Object.fromEntries(Object.entries(sanitized).filter(([k]) => campos.includes(k)));
      if (!Object.keys(sanitized).length) return err("Permissão negada — nenhum campo permitido para o seu acesso", 403);
    }

    const mudouPrioridade = sanitized.prioridade_remocao !== undefined &&
      sanitized.prioridade_remocao !== (old as any).prioridade_remocao;
    const mudouEscala = (
      (sanitized.enfermeiro_escalado !== undefined && sanitized.enfermeiro_escalado !== (old as any).enfermeiro_escalado) ||
      (sanitized.medico_escala !== undefined && sanitized.medico_escala !== (old as any).medico_escala) ||
      (sanitized.tecnico_auxiliar_escala !== undefined && sanitized.tecnico_auxiliar_escala !== (old as any).tecnico_auxiliar_escala)
    );

    const { data, error } = await sb.from("cards").update(sanitized).eq("id", id).select().maybeSingle();
    if (error) return err(error.message, 500);
    if (!data) return err("Não foi possível salvar — o card pode ter sido removido por outro usuário nesse meio tempo. Recarregue a página.", 409);

    await logHistory(id, userId, user.nome as string, "editou card", old, data);
    if (mudouPrioridade) {
      await logHistory(id, userId, user.nome as string, "definiu prioridade",
        { prioridade: (old as any).prioridade_remocao },
        { prioridade: sanitized.prioridade_remocao });
    }
    if (mudouEscala) {
      await logHistory(id, userId, user.nome as string, "escalou equipe",
        { medico: (old as any).medico_escala, enfermeiro: (old as any).enfermeiro_escalado, tecnico: (old as any).tecnico_auxiliar_escala },
        { medico: sanitized.medico_escala, enfermeiro: sanitized.enfermeiro_escalado, tecnico: sanitized.tecnico_auxiliar_escala });
    }

    return json(data);
  }

  if (action === "delete") {
    if (!isAdmin) return err("Permissão negada — requer admin", 403);
    if (!id) return err("ID do card ausente", 400);

    const { data: old, error: findErr } = await sb.from("cards").select("*").eq("id", id).maybeSingle();
    if (findErr) return err(findErr.message, 500);
    if (!old) return err("Card não encontrado — já pode ter sido excluído.", 404);

    const { error } = await sb.from("cards").delete().eq("id", id);
    if (error) return err(error.message, 500);

    await logHistory(id, userId, user.nome as string, "excluiu card", old, null);
    return json({ ok: true, deleted: old });
  }

  if (action === "restore") {
    if (!isAdmin) return err("Permissão negada — requer admin", 403);
    if (!body) return err("Dados do card ausentes", 400);
    const { data, error } = await sb.from("cards").insert(sanitize(body)).select().maybeSingle();
    if (error) return err(error.message, 500);
    if (!data) return err("Não foi possível restaurar o card.", 500);
    await logHistory(data.id, userId, user.nome as string, "restaurou card", null, data);
    return json(data, 201);
  }

  return err("Ação desconhecida", 400);
});
