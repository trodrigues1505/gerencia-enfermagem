// Similaridade de strings (Dice bigram)
function strSim(a, b) {
  if (!a || !b) return 0;
  a = a.toUpperCase().trim(); b = b.toUpperCase().trim();
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bg = s => { const m = new Map(); for (let i=0;i<s.length-1;i++){const k=s[i]+s[i+1];m.set(k,(m.get(k)||0)+1);} return m; };
  const aB=bg(a),bB=bg(b); let inter=0;
  for (const [k,v] of aB) inter+=Math.min(v,bB.get(k)||0);
  return (2*inter)/(a.length+b.length-2);
}

// O Livro tem DUAS etapas, preenchidas por pessoas (e plantões) diferentes:
//   1) SAÍDA   — quando a ambulância sai (aba "Registrar saída")
//   2) RETORNO — quando a ambulância volta (aba "Aguardando retorno")
const LS_EMPTY={data_solic_ambulancia:"",data_saida:"",nome_paciente:"",idade:"",especialidade:"",destino:"",ambulancia:"",medico:"",enfermeiro:"",tecnico_auxiliar:"",hora_solic_ambulancia:"",hora_saida:"",observacao:""};
const LS_RET_EMPTY={hora_retorno:"",finalizado:null,permaneceu:null,observacao:""};
// Obrigatórios da etapa 1 (saída). Na etapa 2 o obrigatório é só o horário de retorno.
const LS_REQUIRED=["data_solic_ambulancia","data_saida","nome_paciente","idade","especialidade","destino","ambulancia","medico","enfermeiro","tecnico_auxiliar","hora_solic_ambulancia","hora_saida"];
// "Sem médico" etc.: afirmação explícita (não é campo esquecido). Definida em canon.js.
const LS_SEM=(typeof Canon!=="undefined"&&Canon.EQUIPE_SEM)||{medico:"SEM MÉDICO",enfermeiro:"SEM ENFERMEIRO(A)",tecnico_auxiliar:"SEM TÉCNICO/AUXILIAR"};
const lsEhSem=v=>(typeof Canon!=="undefined"&&Canon.ehSemEquipe)?Canon.ehSemEquipe(v):Object.values(LS_SEM).includes(String(v||"").trim().toUpperCase());
// Diferença entre dois momentos (data + hora) em "HH:MM". Sem as datas, assume a virada de meia-noite (23:10 -> 01:40).
function lsDiff(dIni,hIni,dFim,hFim){
  const a=lsHora(hIni),b=lsHora(hFim);
  if(!a||!b)return "";
  let min=null;
  if(dIni&&dFim){
    const t1=new Date(`${dIni}T${a}:00`),t2=new Date(`${dFim}T${b}:00`);
    if(!isNaN(t1)&&!isNaN(t2)&&t2>=t1)min=Math.round((t2-t1)/60000);
  }
  if(min===null){
    const [h1,m1]=a.split(":").map(Number),[h2,m2]=b.split(":").map(Number);
    min=(h2*60+m2)-(h1*60+m1);if(min<0)min+=1440;
  }
  return String(Math.floor(min/60)).padStart(2,"0")+":"+String(min%60).padStart(2,"0");
}
// Tudo que o Livro sabe e a planilha tem coluna para receber. Só vai o que foi preenchido:
// campo vazio no Livro nunca apaga o que já está na planilha.
function lsLivroParaPlanilha(l){
  const u={};
  if(l.ambulancia)u.tipo_ambulancia=l.ambulancia;
  if(l.data_solic_ambulancia)u.data_saida_ambulancia=l.data_solic_ambulancia; // coluna da planilha "Solicitação base ambulância — data"
  if(l.hora_solic_ambulancia)u.hora_solic_ambulancia=lsHora(l.hora_solic_ambulancia);
  if(l.data_saida)u.data_saida_real=l.data_saida;                              // dia em que a ambulância realmente saiu
  if(l.hora_saida)u.horario_saida_ambulancia=lsHora(l.hora_saida);
  if(l.hora_retorno)u.horario_retorno=lsHora(l.hora_retorno);                  // vazio se o retorno ainda não foi registrado
  if(l.medico)u.medico=l.medico;
  if(l.enfermeiro)u.enfermeiro=l.enfermeiro;
  if(l.tecnico_auxiliar)u.tecnico_auxiliar=l.tecnico_auxiliar;
  if(l.destino)u.instituicao_destino=l.destino;
  if(l.observacao)u.observacao=l.observacao;
  if(l.finalizado===true||l.finalizado===false)u.finalizado=l.finalizado;     // Sim/Não só se alguém respondeu
  if(l.permaneceu===true||l.permaneceu===false)u.permaneceu=l.permaneceu;
  // tempos calculados (com as datas, porque o pedido pode ser num dia e a saída no outro)
  const te=lsDiff(l.data_solic_ambulancia||l.data_saida,l.hora_solic_ambulancia,l.data_saida,l.hora_saida);
  if(te)u.tempo_espera=te;
  const du=lsDiff(l.data_saida,l.hora_saida,l.data_saida,l.hora_retorno);
  if(du)u.duracao_remocao=du;
  return u;
}
// O que ainda falta levar do retorno para a planilha (compara o Livro com a linha vinculada).
function lsDiferencasRetorno(l,rem){
  const u={};
  const hr=lsHora(l.hora_retorno);
  if(hr&&lsHora(rem.horario_retorno)!==hr)u.horario_retorno=hr;
  ["finalizado","permaneceu"].forEach(k=>{if((l[k]===true||l[k]===false)&&rem[k]!==l[k])u[k]=l[k];});
  // A observação do retorno é ACRESCENTADA no Livro. Na planilha só acompanha se ela estava vazia ou igual à anterior:
  // assim não apaga uma observação editada à mão.
  const lo=(l.observacao||"").trim(),ro=(rem.observacao||"").trim();
  if(lo&&lo!==ro&&(ro===""||lo.startsWith(ro)))u.observacao=lo;
  if(u.horario_retorno){
    const du=lsDiff(l.data_saida,l.hora_saida,l.data_saida,l.hora_retorno);
    if(du)u.duracao_remocao=du;
  }
  return u;
}
// "14:30:00" -> "14:30" (o banco pode devolver com segundos; a planilha e o dashboard esperam HH:MM)
function lsHora(v){const t=String(v||"").trim();const m=t.match(/^(\d{1,2}):(\d{2})/);return m?m[1].padStart(2,"0")+":"+m[2]:t;}
// Usa H() do app: resolve o JWT da sessao a cada chamada. Header fixo com a
// anon key fazia o PostgREST tratar as requisicoes como "anon" e as policies
// de livro_saida (todas {authenticated}) barravam o INSERT com 42501.
const LS_H=()=>H();

// ─── Auditoria ───────────────────────────────────────────────────────────────
// A autoria e carimbada por trigger no banco (auth.uid() -> public.users).
// O cliente apenas exibe: nada aqui e fonte de verdade.
const LS_ACOES={
  criou:{txt:"Lancou o registro",ico:"\u270E",cor:"#0F172A"},
  vinculou:{txt:"Vinculou a remocao",ico:"\u{1F517}",cor:"#1D4ED8"},
  desvinculou:{txt:"Desfez o vinculo",ico:"\u21A9",cor:"#B45309"},
  sem_vinculo:{txt:"Marcou como sem vinculo",ico:"\u2014",cor:"#64748B"},
  reabriu:{txt:"Reabriu para pendentes",ico:"\u21A9",cor:"#B45309"},
  editou:{txt:"Alterou o registro",ico:"\u270E",cor:"#64748B"},
  retorno:{txt:"Registrou o retorno",ico:"\u21A9",cor:"#15803D"}
};
function lsAutor(p){
  if(!p)return null;
  const nome=(p.preenchido_por_nome||"").trim();
  if(!nome)return null;
  const reg=[(p.preenchido_por_tipo||"").trim(),(p.preenchido_por_registro||"").trim()].filter(Boolean).join(" ");
  return {nome,reg};
}
function lsQuando(iso){
  if(!iso)return "";
  try{
    const d=new Date(iso);
    return d.toLocaleDateString("pt-BR")+" "+d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  }catch(e){return "";}
}
// Linha de assinatura exibida em cada card do livro.
function LS_ASSINATURA(p){
  const a=lsAutor(p);
  return React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginTop:6,fontSize:11,color:a?"#475569":"#B91C1C",fontWeight:600}},
    React.createElement("span",{style:{opacity:.7}},"\u{1F464}"),
    a
      ?React.createElement("span",null,a.nome,a.reg?React.createElement("span",{style:{fontWeight:500,color:"#64748B"}}," \u00B7 ",a.reg):null)
      :React.createElement("span",null,"Autoria nao registrada"),
    p.preenchido_em?React.createElement("span",{style:{fontWeight:500,color:"#94A3B8"}}," \u00B7 ",lsQuando(p.preenchido_em)):null
  );
}

// Linha de assinatura do RETORNO (carimbada no servidor pela função livro_registrar_retorno).
function LS_ASSINATURA_RETORNO(p){
  if(!p||!p.retorno_por_nome)return null;
  const reg=[(p.retorno_por_tipo||"").trim(),(p.retorno_por_registro||"").trim()].filter(Boolean).join(" ");
  return React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginTop:3,fontSize:11,color:"#15803D",fontWeight:600}},
    React.createElement("span",{style:{opacity:.8}},"\u21A9"),
    React.createElement("span",null,"Retorno: ",p.retorno_por_nome,reg?React.createElement("span",{style:{fontWeight:500,color:"#64748B"}}," \u00B7 ",reg):null),
    p.retorno_em?React.createElement("span",{style:{fontWeight:500,color:"#94A3B8"}}," \u00B7 ",lsQuando(p.retorno_em)):null
  );
}

function LivroSaida({currentUser,userId,onClose,onPendentesChange}){
  const [tab,setTab]=useState("novo");
  const [form,setForm]=useState({...LS_EMPTY});
  const [errors,setErrors]=useState({});
  const [formMsg,setFormMsg]=useState("");
  const [saving,setSaving]=useState(false);
  const [pendentes,setPendentes]=useState([]);
  const [loadingP,setLoadingP]=useState(false);
  const [erroP,setErroP]=useState(null);
  const [todos,setTodos]=useState([]);
  const [loadingT,setLoadingT]=useState(false);
  const [erroT,setErroT]=useState(null);
  const [confirmIgnorar,setConfirmIgnorar]=useState(null);
  const [match,setMatch]=useState(null);
  const [vinculando,setVinculando]=useState(false);
  const [remocoes,setRemocoes]=useState([]);
  const [toast,setToast]=useState(null);
  const [confirmClose,setConfirmClose]=useState(false);
  // Vinculo e decisao da administracao. Enfermeiro so preenche o livro.
  // O bloqueio real esta no banco (vinculo-somente-admin.sql); isto aqui
  // apenas evita oferecer uma acao que o servidor vai recusar.
  const podeVincular = currentUser?.role === "admin";
  // Etapa 2 (retorno da ambulância)
  const [retornos,setRetornos]=useState([]);
  const [loadingR,setLoadingR]=useState(false);
  const [erroR,setErroR]=useState(null);
  const [retAberto,setRetAberto]=useState(null);   // id do registro com o formulário de retorno aberto
  const [retForm,setRetForm]=useState({...LS_RET_EMPTY});
  const [retErro,setRetErro]=useState(false);
  const [retSaving,setRetSaving]=useState(false);
  const [auditoria,setAuditoria]=useState(null);   // {registro, linhas|null, erro|null}
  const [loadingA,setLoadingA]=useState(false);

  const notify=(tipo,texto)=>setToast({tipo,texto});
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(null),4500);return()=>clearTimeout(t);},[toast]);

  // Traduz o erro cru do PostgREST numa mensagem util para quem esta no plantao.
  function msgErro(e){
    const t=String(e&&e.message||e||"");
    if(t.includes("42501")||t.includes("row-level security"))
      return "Sua sessao expirou ou voce nao tem permissao para lancar no Livro. Saia e entre novamente; se continuar, procure a coordenacao.";
    if(t.includes("PGRST204")||t.includes("data_solic_ambulancia"))
      return "O banco ainda não foi atualizado para a data da solicitação da ambulância. Avise a coordenação (falta rodar a migração).";
    if(t.includes("Failed to fetch")||t.includes("NetworkError"))
      return "Sem conexao com o servidor. Os dados continuam na tela — tente salvar de novo.";
    return "Nao foi possivel salvar. Detalhe tecnico no console.";
  }

  // Ha algo digitado que seria perdido ao fechar?
  const dirty=Object.keys(LS_EMPTY).some(k=>form[k]!==LS_EMPTY[k]);
  const pedirFechar=()=>{ if(dirty)setConfirmClose(true); else onClose(); };

  useEffect(()=>{loadPendentes();loadRemocoes();loadRetornos();},[]);
  // Selo do botão "Livro de Saída" no menu: pendências de vínculo + saídas aguardando retorno
  useEffect(()=>{if(onPendentesChange)onPendentesChange(pendentes.length+retornos.length);},[pendentes,retornos]);
  useEffect(()=>{if(tab==="todos")loadTodos();if(tab==="retorno")loadRetornos();if(tab==="pendentes")loadPendentes();},[tab]); // lista sempre atualizada ao abrir a aba (outro plantão pode ter lançado saídas)

  // fetch NAO lanca em 401/403 — sem checar r.ok, o corpo de erro virava []
  // e a tela dizia "Nenhum pendente", mascarando falha como sucesso.
  async function loadPendentes(){
    setLoadingP(true);setErroP(null);
    try{
      const r=await fetch(`${SB_URL}/rest/v1/livro_saida?status_vinculo=eq.pendente&order=created_at.desc`,{headers:LS_H()});
      if(!r.ok)throw new Error(await r.text());
      const d=await r.json();
      if(!Array.isArray(d))throw new Error("Resposta inesperada do servidor.");
      setPendentes(d);
    }catch(e){console.error("[LivroSaida] falha ao carregar pendentes:",e);setErroP(msgErro(e));}
    setLoadingP(false);
  }

  // Saídas que ainda não têm o retorno da ambulância (hora_retorno vazia).
  async function loadRetornos(){
    setLoadingR(true);setErroR(null);
    try{
      const r=await fetch(`${SB_URL}/rest/v1/livro_saida?hora_retorno=is.null&order=created_at.asc`,{headers:LS_H()});
      if(!r.ok)throw new Error(await r.text());
      const d=await r.json();
      if(!Array.isArray(d))throw new Error("Resposta inesperada do servidor.");
      setRetornos(d);
    }catch(e){console.error("[LivroSaida] falha ao carregar retornos pendentes:",e);setErroR(msgErro(e));}
    setLoadingR(false);
  }

  // Aba "Todos": sem filtro de status. Antes, qualquer registro que saisse de
  // "pendente" ficava inalcancavel pela interface.
  async function loadTodos(){
    setLoadingT(true);setErroT(null);
    try{
      const r=await fetch(`${SB_URL}/rest/v1/livro_saida?order=created_at.desc&limit=500`,{headers:LS_H()});
      if(!r.ok)throw new Error(await r.text());
      const d=await r.json();
      if(!Array.isArray(d))throw new Error("Resposta inesperada do servidor.");
      setTodos(d);
    }catch(e){console.error("[LivroSaida] falha ao carregar histórico:",e);setErroT(msgErro(e));}
    setLoadingT(false);
  }

  // Devolve um registro para a fila de pendentes (desfaz "sem vínculo").
  async function handleReabrir(livroId){
    try{
      const r=await fetch(`${SB_URL}/rest/v1/livro_saida?id=eq.${livroId}`,{method:"PATCH",headers:{...LS_H(),Prefer:"return=minimal"},body:JSON.stringify({status_vinculo:"pendente",remocao_id:null})});
      if(!r.ok)throw new Error(await r.text());
      loadPendentes();loadTodos();
      notify("ok","Registro devolvido para Pendentes.");
    }catch(e){console.error("[LivroSaida] falha ao reabrir:",e);notify("erro",msgErro(e));}
  }
  // Historico completo de um registro. Somente leitura: a tabela de log nao
  // aceita INSERT/UPDATE/DELETE de cliente nenhum (ver auditoria-livro.sql).
  async function abrirAuditoria(registro){
    setAuditoria({registro,linhas:null,erro:null});
    setLoadingA(true);
    try{
      const r=await fetch(`${SB_URL}/rest/v1/livro_saida_log?livro_id=eq.${registro.id}&order=criado_em.asc`,{headers:LS_H()});
      if(!r.ok)throw new Error(await r.text());
      const d=await r.json();
      if(!Array.isArray(d))throw new Error("Resposta inesperada do servidor.");
      setAuditoria({registro,linhas:d,erro:null});
    }catch(e){
      console.error("[LivroSaida] falha ao carregar auditoria:",e);
      setAuditoria({registro,linhas:null,erro:msgErro(e)});
    }
    setLoadingA(false);
  }

  async function loadRemocoes(){
    try{const r=await fetch(`${SB_URL}/rest/v1/remocoes?select=id,nome_paciente,data_solicitacao,ficha_cross,horario_retorno,finalizado,permaneceu,observacao&order=data_solicitacao.desc&limit=300`,{headers:LS_H()});const d=await r.json();setRemocoes(Array.isArray(d)?d:[]);}catch(e){}
  }

  const set=(k,v)=>{
    setForm(p=>{
      const n={...p,[k]:v};
      // Pedido e saída costumam ser no mesmo dia: a data do pedido acompanha a da saída enquanto não for alterada.
      if(k==="data_saida"&&(!p.data_solic_ambulancia||p.data_solic_ambulancia===p.data_saida))n.data_solic_ambulancia=v;
      return n;
    });
    setErrors(p=>({...p,[k]:false,...(k==="data_saida"||k==="data_solic_ambulancia"||k==="hora_saida"||k==="hora_solic_ambulancia"?{data_solic_ambulancia:false,hora_saida:false}:{})}));
  };

  function validate(){
    const errs={};
    LS_REQUIRED.forEach(k=>{if(!form[k]||String(form[k]).trim()==="")errs[k]=true;});
    let msg=Object.keys(errs).length?"⚠ Preencha todos os campos obrigatórios (*) antes de salvar.":"";
    if(!msg&&form.data_solic_ambulancia>form.data_saida){errs.data_solic_ambulancia=true;msg="⚠ A data da solicitação da ambulância não pode ser depois da data da saída.";}
    if(!msg&&form.data_solic_ambulancia===form.data_saida&&form.hora_saida<form.hora_solic_ambulancia){errs.hora_saida=true;msg="⚠ A saída está antes da solicitação da ambulância no mesmo dia. Confira os horários e as datas.";}
    setErrors(errs);setFormMsg(msg);
    return Object.keys(errs).length===0;
  }

  function findMatches(nome,datas){
    if(!nome)return[];
    const ds=(Array.isArray(datas)?datas:[datas]).filter(Boolean);
    return remocoes
      .map(r=>({...r,sim:strSim(r.nome_paciente,nome)}))
      .filter(r=>{const sd=r.data_solicitacao&&ds.some(d=>r.data_solicitacao.startsWith(d));return r.sim>=0.75||(r.sim>=0.55&&sd);})
      .sort((a,b)=>b.sim-a.sim).slice(0,5);
  }

  async function handleSalvar(){
    if(!validate())return;
    setSaving(true);
    try{
      const payload={...form,preenchido_por:userId||null,status_vinculo:"pendente"}; // sem hora_retorno: é a etapa 2
      const r=await fetch(`${SB_URL}/rest/v1/livro_saida`,{method:"POST",headers:{...LS_H(),Prefer:"return=representation"},body:JSON.stringify(payload)});
      if(!r.ok)throw new Error(await r.text());
      const [saved]=await r.json();
      const candidates=findMatches(form.nome_paciente,[form.data_saida,form.data_solic_ambulancia]);
      loadRetornos();loadPendentes();
      if(candidates.length>0){setMatch({livroRow:saved,candidates});setForm({...LS_EMPTY});setFormMsg("");}
      else{setForm({...LS_EMPTY});setFormMsg("");notify("ok","Saída registrada. Falta registrar o retorno da ambulância (aba Aguardando retorno). Sem correspondência na planilha — ficou em Pendentes.");}
    }catch(e){console.error("[LivroSaida] falha ao salvar:",e);notify("erro",msgErro(e));}
    setSaving(false);
  }

  async function handleVincular(livroId,remocaoId){
    setVinculando(true);
    try{
      // Lê o registro ATUAL do servidor. A lista de Pendentes pode estar desatualizada: o retorno (e Finalizado/Permaneceu)
      // costuma ser lançado por outra pessoa DEPOIS de a lista ter sido carregada.
      let livroEntry=match?.livroRow||pendentes.find(p=>p.id===livroId);
      try{
        const rf=await fetch(`${SB_URL}/rest/v1/livro_saida?id=eq.${livroId}`,{headers:LS_H()});
        if(rf.ok){const d=await rf.json();if(Array.isArray(d)&&d[0])livroEntry=d[0];}
      }catch(_){/* mantém a cópia que já temos */}
      const u=livroEntry&&remocaoId?lsLivroParaPlanilha(livroEntry):{};
      // 1º a planilha: se ela recusar, nada fica pela metade (o registro continua Pendente e dá para tentar de novo)
      if(Object.keys(u).length>0){
        const rp=await fetch(`${SB_URL}/rest/v1/remocoes?id=eq.${remocaoId}`,{method:"PATCH",headers:{...LS_H(),Prefer:"return=representation"},body:JSON.stringify(u)});
        if(!rp.ok)throw new Error(await rp.text());
        const dp=await rp.json();
        if(!Array.isArray(dp)||dp.length===0)throw new Error("Sem permissão para alterar a planilha de remoção, ou a linha não existe mais.");
      }
      const rl=await fetch(`${SB_URL}/rest/v1/livro_saida?id=eq.${livroId}`,{method:"PATCH",headers:{...LS_H(),Prefer:"return=minimal"},body:JSON.stringify({remocao_id:remocaoId,status_vinculo:"vinculado"})});
      if(!rl.ok)throw new Error(await rl.text());
      setMatch(null);setForm({...LS_EMPTY});loadPendentes();loadRemocoes();if(tab==="todos")loadTodos();
      notify("ok",livroEntry&&!livroEntry.hora_retorno
        ?"Vinculado. Dados da saída copiados para a planilha — o retorno será levado quando for registrado."
        :"Vinculado. Dados mesclados na planilha de remoção.");
    }catch(e){console.error("[LivroSaida] falha ao vincular:",e);notify("erro",String(e&&e.message||"").startsWith("Sem permiss")?e.message:msgErro(e));}
    setVinculando(false);
  }

  async function handleIndependente(livroId){
    try{
      const r=await fetch(`${SB_URL}/rest/v1/livro_saida?id=eq.${livroId}`,{method:"PATCH",headers:{...LS_H(),Prefer:"return=minimal"},body:JSON.stringify({status_vinculo:"independente"})});
      if(!r.ok)throw new Error(await r.text());
      setMatch(null);setForm({...LS_EMPTY});setConfirmIgnorar(null);loadPendentes();if(tab==="todos")loadTodos();
      notify("ok","Registro mantido sem vínculo. Continua no histórico, na aba Todos.");
    }catch(e){console.error("[LivroSaida] falha ao marcar independente:",e);notify("erro",msgErro(e));}
  }

  function abrirRetorno(p){setRetAberto(p.id);setRetForm({...LS_RET_EMPTY});setRetErro(false);}

  // Traduz o erro do servidor para quem está no plantão.
  function msgErroRetorno(e){
    const t=String(e&&e.message||e||"");
    let msg="";try{msg=JSON.parse(t).message||"";}catch(_){}
    if(t.includes("PGRST202")||t.includes("Could not find the function"))
      return "O servidor ainda não foi atualizado para registrar retorno. Avise a coordenação (falta rodar a migração do Livro em duas etapas).";
    if(msg)return msg;
    return msgErro(e);
  }

  // Passa o retorno do Livro para a linha vinculada da planilha. Só quem pode editar a planilha consegue;
  // para os demais devolve "negado" e a administração atualiza depois (botão na aba Todos).
  async function sincronizarRetorno(l,opts){
    const silencioso=!!(opts&&opts.silencioso);
    if(!l.remocao_id||!lsHora(l.hora_retorno))return "nada";
    try{
      // compara com a linha ATUAL da planilha (e só envia o que realmente mudou)
      const rg=await fetch(`${SB_URL}/rest/v1/remocoes?id=eq.${l.remocao_id}&select=id,horario_retorno,finalizado,permaneceu,observacao`,{headers:LS_H()});
      if(!rg.ok)throw new Error(await rg.text());
      const dg=await rg.json();
      if(!Array.isArray(dg)||!dg[0]){if(!silencioso)notify("erro","Você não tem permissão para ver essa linha da planilha, ou ela não existe mais.");return "negado";}
      const u=lsDiferencasRetorno(l,dg[0]);
      if(Object.keys(u).length===0){if(!silencioso)notify("ok","A planilha já está com o retorno do Livro.");return "nada";}
      const r=await fetch(`${SB_URL}/rest/v1/remocoes?id=eq.${l.remocao_id}`,{method:"PATCH",headers:{...LS_H(),Prefer:"return=representation"},body:JSON.stringify(u)});
      if(!r.ok)throw new Error(await r.text());
      const d=await r.json();
      if(!Array.isArray(d)||d.length===0){if(!silencioso)notify("erro","Você não tem permissão para alterar a planilha de remoção.");return "negado";}
      if(!silencioso){notify("ok","Planilha de remoção atualizada com o retorno.");loadRemocoes();}
      return "ok";
    }catch(e){console.error("[LivroSaida] falha ao sincronizar retorno:",e);if(!silencioso)notify("erro",msgErro(e));return "erro";}
  }

  async function registrarRetorno(p){
    if(!retForm.hora_retorno){setRetErro(true);return;}
    setRetSaving(true);
    try{
      const r=await fetch(`${SB_URL}/rest/v1/rpc/livro_registrar_retorno`,{method:"POST",headers:LS_H(),body:JSON.stringify({
        p_id:String(p.id),p_hora_retorno:retForm.hora_retorno,
        p_finalizado:retForm.finalizado,p_permaneceu:retForm.permaneceu,
        p_observacao:(retForm.observacao||"").trim()||null})});
      if(!r.ok)throw new Error(await r.text());
      const salvo=await r.json();
      setRetornos(prev=>prev.filter(x=>x.id!==p.id));loadPendentes();
      setRetAberto(null);setRetForm({...LS_RET_EMPTY});setRetErro(false);
      let msg="Retorno registrado.";
      if(salvo&&salvo.remocao_id&&salvo.status_vinculo==="vinculado"){
        const sinc=await sincronizarRetorno(salvo,{silencioso:true});
        msg=sinc==="ok"?"Retorno registrado e planilha atualizada.":"Retorno registrado. A planilha será atualizada pela administração.";
        loadRemocoes();
      }
      notify("ok",msg);
      if(tab==="todos")loadTodos();
    }catch(e){console.error("[LivroSaida] falha ao registrar retorno:",e);notify("erro",msgErroRetorno(e));}
    setRetSaving(false);
  }

  async function handleVincularPendente(livro){
    const candidates=findMatches(livro.nome_paciente,[livro.data_saida,livro.data_solic_ambulancia]);
    setMatch({livroRow:livro,candidates});setTab("novo");
  }

  const iS=k=>({border:`1.5px solid ${errors[k]?"#EF4444":"#E2E8F0"}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:"#0F172A",outline:"none",background:"#fff",width:"100%",boxShadow:errors[k]?"0 0 0 3px rgba(239,68,68,.1)":"none"});
  const sS=k=>({...iS(k),appearance:"none",cursor:"pointer"});
  const LBL=(t,r)=>React.createElement("label",{style:{fontSize:10,fontWeight:600,color:"#374151",textTransform:"uppercase",letterSpacing:".04em",display:"block",marginBottom:3}},t,r&&React.createElement("span",{style:{color:"#EF4444",marginLeft:2}},"*"));
  const FLD=(k,label,el)=>React.createElement("div",{key:k},LBL(label,LS_REQUIRED.includes(k)),el);
  const ERRO_BOX=(msg,retry)=>React.createElement("div",{style:{textAlign:"center",padding:"36px 24px"}},
    React.createElement("div",{style:{fontSize:28,marginBottom:10}},"⚠️"),
    React.createElement("div",{style:{fontSize:13,fontWeight:700,color:"#B91C1C",marginBottom:6}},"Não foi possível carregar"),
    React.createElement("div",{style:{fontSize:12,color:"#64748B",lineHeight:1.5,maxWidth:380,margin:"0 auto 16px"}},msg),
    React.createElement("button",{onClick:retry,style:{background:"#0F172A",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer"}},"Tentar de novo")
  );
  const fmtDate=d=>{try{return new Date(d+"T12:00:00").toLocaleDateString("pt-BR");}catch{return d;}};
  // Sim / Não / vazio (nada vem marcado por padrão)
  const TRI=(grupo,label,val,on)=>React.createElement("div",null,LBL(label,false),React.createElement("div",{className:"ls-bool"},
    React.createElement("label",null,React.createElement("input",{type:"radio",name:grupo,checked:val===true,onChange:()=>on(true)})," Sim"),
    React.createElement("label",null,React.createElement("input",{type:"radio",name:grupo,checked:val===false,onChange:()=>on(false)})," Não"),
    val!==null&&val!==undefined&&React.createElement("button",{type:"button",onClick:()=>on(null),style:{background:"none",border:"none",color:"#94A3B8",fontSize:11,cursor:"pointer",textDecoration:"underline"}},"limpar")));
  // "01/10 → 02/10" quando o pedido da ambulância foi num dia e a saída em outro
  const datasTxt=p=>(p.data_solic_ambulancia&&p.data_solic_ambulancia!==p.data_saida)
    ?React.createElement(React.Fragment,null,"Pedido ",fmtDate(p.data_solic_ambulancia)," → Saída ",React.createElement("b",null,fmtDate(p.data_saida)))
    :fmtDate(p.data_saida);
  // Nome da equipe; "SEM MÉDICO" etc. aparecem destacados para não parecerem esquecimento
  const nomeEq=v=>lsEhSem(v)?React.createElement("span",{style:{background:"#FEF3C7",color:"#92400E",border:"1px solid #FDE68A",borderRadius:99,padding:"0 6px",fontSize:10,fontWeight:700}},v):v;
  // Campo da equipe com a opção "saiu sem ..."
  const EQP=(k,label,ph,semTxt)=>{
    const sem=lsEhSem(form[k]);
    return React.createElement("div",{key:k},LBL(label,true),
      React.createElement("input",{type:"text",placeholder:ph,value:form[k],disabled:sem,onChange:e=>set(k,e.target.value),style:{...iS(k),...(sem?{background:"#FFFBEB",color:"#92400E",fontWeight:700,border:"1.5px solid #FDE68A"}:null)}}),
      React.createElement("label",{style:{display:"flex",alignItems:"center",gap:6,marginTop:5,fontSize:11,cursor:"pointer",color:sem?"#92400E":"#64748B",fontWeight:sem?700:500}},
        React.createElement("input",{type:"checkbox",checked:sem,onChange:e=>set(k,e.target.checked?LS_SEM[k]:"")}),semTxt));
  };
  // Resumo "Saída … · Retorno …" usado nas listas
  const LINHA_HORAS=p=>React.createElement("div",{style:{fontSize:11,color:"#94A3B8",marginTop:2}},"🕐 Saída: ",p.hora_saida?lsHora(p.hora_saida):"—"," · Retorno: ",
    p.hora_retorno?lsHora(p.hora_retorno):React.createElement("span",{style:{color:"#B45309",fontWeight:700}},"aguardando")," · ",p.ambulancia," · Enf: ",nomeEq(p.enfermeiro));
  const iSR=erro=>({border:`1.5px solid ${erro?"#EF4444":"#E2E8F0"}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:"#0F172A",outline:"none",background:"#fff",width:"100%",boxShadow:erro?"0 0 0 3px rgba(239,68,68,.1)":"none"});

  return React.createElement("div",{className:"ls-overlay",onClick:e=>{if(e.target!==e.currentTarget)return;if(match||confirmClose||confirmIgnorar)return;pedirFechar();}},
    React.createElement("div",{className:"ls-modal",style:{position:"relative"}},

      // ── Confirmacao de fechamento (so quando ha texto digitado) ──
      confirmClose&&React.createElement("div",{className:"ls-match-overlay"},
        React.createElement("div",{className:"ls-match-box",style:{maxWidth:400}},
          React.createElement("div",{style:{fontWeight:700,fontSize:15,marginBottom:6}},"Descartar este registro?"),
          React.createElement("div",{style:{fontSize:12,color:"#64748B",lineHeight:1.5,marginBottom:18}},"Os dados digitados ainda não foram salvos e serão perdidos."),
          React.createElement("div",{style:{display:"flex",gap:8,justifyContent:"flex-end"}},
            React.createElement("button",{onClick:()=>setConfirmClose(false),style:{background:"#0F172A",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer"}},"Continuar preenchendo"),
            React.createElement("button",{onClick:()=>{setConfirmClose(false);onClose();},style:{background:"none",border:"1px solid #FECACA",color:"#DC2626",borderRadius:8,padding:"8px 18px",fontSize:12,fontWeight:600,cursor:"pointer"}},"Descartar")
          )
        )
      ),

      // ── Confirmacao de "Sem vinculo" ──
      confirmIgnorar&&React.createElement("div",{className:"ls-match-overlay"},
        React.createElement("div",{className:"ls-match-box",style:{maxWidth:420}},
          React.createElement("div",{style:{fontWeight:700,fontSize:15,marginBottom:6}},"Marcar como sem vínculo?"),
          React.createElement("div",{style:{fontSize:12,color:"#64748B",lineHeight:1.5,marginBottom:18}},
            `"${confirmIgnorar.nome_paciente}" sai da fila de pendentes e deixa de ser cruzado com a planilha de remoção. O registro continua salvo e pode ser reaberto na aba Todos.`),
          React.createElement("div",{style:{display:"flex",gap:8,justifyContent:"flex-end"}},
            React.createElement("button",{onClick:()=>setConfirmIgnorar(null),style:{background:"none",border:"1px solid #E2E8F0",color:"#374151",borderRadius:8,padding:"8px 18px",fontSize:12,cursor:"pointer"}},"Cancelar"),
            React.createElement("button",{onClick:()=>handleIndependente(confirmIgnorar.id),style:{background:"#0F172A",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer"}},"Confirmar")
          )
        )
      ),

      // ── Toast ──
      toast&&React.createElement("div",{onClick:()=>setToast(null),style:{position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",zIndex:20,maxWidth:"90%",display:"flex",alignItems:"flex-start",gap:9,background:toast.tipo==="ok"?"#062B1B":"#3F1114",color:"#fff",borderRadius:10,padding:"11px 15px",fontSize:12,lineHeight:1.45,fontWeight:500,boxShadow:"0 10px 30px rgba(0,0,0,.3)",cursor:"pointer",animation:"lsToastIn .2s ease-out"}},
        React.createElement("span",{style:{fontSize:13,lineHeight:1.2}},toast.tipo==="ok"?"✓":"!"),
        React.createElement("span",null,toast.texto)
      ),

      // ── Match overlay ──
      match&&React.createElement("div",{className:"ls-match-overlay"},
        React.createElement("div",{className:"ls-match-box"},
          React.createElement("div",{style:{fontWeight:700,fontSize:15,marginBottom:4}},
            !podeVincular?"Registro enviado":(match.candidates.length===0?"Sem correspondência na planilha":"Correspondência encontrada")),
          React.createElement("div",{style:{fontSize:12,color:"#64748B",marginBottom:16}},
            !podeVincular
              ?`A saída de "${match.livroRow.nome_paciente}" foi registrada. A conferência com a planilha é feita pela administração.`
              :match.candidates.length===0
              ?`Nenhuma remoção parecida com "${match.livroRow.nome_paciente}" foi localizada na planilha. Isso é normal quando a saída não passou pelo CROSS — mantenha o registro sem vínculo.`
              :`${match.candidates.length} registro(s) parecido(s) para "${match.livroRow.nome_paciente}". Selecione o correto ou salve sem vínculo.`),
          !podeVincular&&React.createElement("div",{style:{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:10,padding:"20px 16px",textAlign:"center",marginBottom:4}},
            React.createElement("div",{style:{fontSize:24,marginBottom:6}},"\u2713"),
            React.createElement("div",{style:{fontSize:13,fontWeight:700,color:"#15803D",marginBottom:4}},"Registro salvo no Livro"),
            React.createElement("div",{style:{fontSize:12,color:"#16A34A",lineHeight:1.5}},"Ele fica em Pendentes at\u00E9 a administra\u00E7\u00E3o conferir e vincular \u00E0 planilha de remo\u00E7\u00E3o. O retorno da ambul\u00E2ncia ser\u00E1 registrado depois, na aba \u201CAguardando retorno\u201D.")
          ),
          podeVincular&&match.candidates.length===0&&React.createElement("div",{style:{background:"#F8FAFC",border:"1px dashed #CBD5E1",borderRadius:10,padding:"20px 16px",textAlign:"center",marginBottom:4}},
            React.createElement("div",{style:{fontSize:24,marginBottom:6}},"🔍"),
            React.createElement("div",{style:{fontSize:12,color:"#64748B",lineHeight:1.5}},"O registro já está salvo no Livro. Ele fica na aba Pendentes até ser vinculado ou marcado como independente.")
          ),
          podeVincular&&match.candidates.map(c=>React.createElement("div",{key:c.id,style:{background:"#F8FAFC",border:"1.5px solid #E2E8F0",borderRadius:9,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}},
            React.createElement("div",null,
              React.createElement("div",{style:{fontWeight:600,fontSize:13}},c.nome_paciente),
              React.createElement("div",{style:{fontSize:11,color:"#64748B",marginTop:2}},
                c.data_solicitacao||"—",c.ficha_cross?` · ${c.ficha_cross}`:"",
                React.createElement("span",{style:{marginLeft:8,background:"#EFF6FF",color:"#1D4ED8",borderRadius:99,padding:"1px 7px",fontSize:10,fontWeight:700}},Math.round(c.sim*100)+"% similar")
              )
            ),
            React.createElement("button",{disabled:vinculando,onClick:()=>!vinculando&&handleVincular(match.livroRow.id,c.id),style:{background:"#16A34A",color:"#fff",border:"none",borderRadius:7,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}},vinculando?"…":"Vincular")
          )),
          React.createElement("div",{style:{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}},
            React.createElement("button",{onClick:()=>setMatch(null),style:podeVincular?{background:"none",border:"1px solid #E2E8F0",borderRadius:7,padding:"7px 16px",fontSize:12,cursor:"pointer",color:"#64748B"}:{background:"#0F172A",color:"#fff",border:"none",borderRadius:7,padding:"7px 20px",fontSize:12,fontWeight:700,cursor:"pointer"}},podeVincular?(match.candidates.length===0?"Decidir depois":"Cancelar"):"Entendi"),
            podeVincular&&React.createElement("button",{onClick:()=>handleIndependente(match.livroRow.id),style:{background:match.candidates.length===0?"#0F172A":"none",color:match.candidates.length===0?"#fff":"#374151",border:match.candidates.length===0?"none":"1px solid #E2E8F0",borderRadius:7,padding:"7px 16px",fontSize:12,fontWeight:match.candidates.length===0?700:400,cursor:"pointer"}},"Manter sem vínculo")
          )
        )
      ),

      // ── Header ──
      React.createElement("div",{className:"ls-hd"},
        React.createElement("div",null,
          React.createElement("h2",null,"📒 Livro de Saída"),
          React.createElement("div",{className:"ls-hd-sub"},"Preenchido por: "+(currentUser?.nome||"—"))
        ),
        React.createElement("button",{onClick:pedirFechar,style:{background:"rgba(255,255,255,.1)",border:"none",color:"#fff",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:16}},"✕")
      ),

      // ── Tabs ──
      React.createElement("div",{style:{display:"flex",borderBottom:"2px solid #F1F5F9",flexShrink:0,background:"#F8FAFC"}},
        [["novo","📝 Registrar saída"],["retorno",`🔁 Aguardando retorno (${erroR?"!":retornos.length})`],["pendentes",`⏳ Pendentes (${erroP?"!":pendentes.length})`],["todos","📚 Todos"]].map(([id,label])=>
          React.createElement("button",{key:id,onClick:()=>setTab(id),style:{flex:1,padding:"10px 16px",background:"none",border:"none",borderBottom:`3px solid ${tab===id?"#3B82F6":"transparent"}`,color:tab===id?"#1D4ED8":"#64748B",fontWeight:tab===id?700:500,fontSize:12,cursor:"pointer",transition:"all .15s"}},label)
        )
      ),

      // ── Body ──
      React.createElement("div",{className:"ls-body"},

        // TAB NOVO
        tab==="novo"&&React.createElement("div",null,
          // Paciente
          React.createElement("div",{className:"ls-section"},
            React.createElement("div",{className:"ls-section-title"},"Dados do Paciente"),
            React.createElement("div",{className:"ls-grid ls-g3"},
              FLD("data_solic_ambulancia","Data da solicitação da ambulância",React.createElement("input",{type:"date",value:form.data_solic_ambulancia,onChange:e=>set("data_solic_ambulancia",e.target.value),style:iS("data_solic_ambulancia")})),
              FLD("data_saida","Data da saída",React.createElement("input",{type:"date",value:form.data_saida,onChange:e=>set("data_saida",e.target.value),style:iS("data_saida")})),
              FLD("idade","Idade",React.createElement("input",{type:"text",placeholder:"ex: 3 anos",value:form.idade,onChange:e=>set("idade",e.target.value),style:iS("idade")}))
            ),
            React.createElement("div",{style:{marginTop:10}},
              FLD("nome_paciente","Nome completo",React.createElement("input",{type:"text",placeholder:"NOME COMPLETO DO PACIENTE",value:form.nome_paciente,onChange:e=>set("nome_paciente",e.target.value.toUpperCase()),style:{...iS("nome_paciente"),textTransform:"uppercase"}}))
            )
          ),
          // Remoção
          React.createElement("div",{className:"ls-section"},
            React.createElement("div",{className:"ls-section-title"},"Dados da Remoção"),
            React.createElement("div",{className:"ls-grid ls-g2"},
              FLD("especialidade","Especialidade / Recurso",React.createElement("input",{type:"text",placeholder:"ex: UTI PEDIÁTRICA, TOMOGRAFIA",value:form.especialidade,onChange:e=>set("especialidade",e.target.value),style:iS("especialidade")})),
              FLD("destino","Destino",React.createElement("input",{type:"text",placeholder:"Hospital / Unidade receptora",value:form.destino,onChange:e=>set("destino",e.target.value),style:iS("destino")})),
              FLD("ambulancia","Tipo de Ambulância",React.createElement("select",{value:form.ambulancia,onChange:e=>set("ambulancia",e.target.value),style:sS("ambulancia")},
                React.createElement("option",{value:""},"— selecione —"),
                React.createElement("option",{value:"BÁSICA"},"🚑 BÁSICA (SBV)"),
                React.createElement("option",{value:"AVANÇADA"},"🚨 AVANÇADA (SAV)"),
                React.createElement("option",{value:"UTI"},"🏥 UTI Móvel")
              ))
            )
          ),
          // Equipe
          React.createElement("div",{className:"ls-section"},
            React.createElement("div",{className:"ls-section-title"},"Equipe"),
            React.createElement("div",{className:"ls-grid ls-g3"},
              EQP("medico","Médico(a)","Dr. Nome","Saiu sem médico"),
              EQP("enfermeiro","Enfermeiro(a)","Nome","Saiu sem enfermeiro(a)"),
              EQP("tecnico_auxiliar","Técnico / Auxiliar","Nome","Saiu sem técnico/auxiliar")
            ),
            React.createElement("div",{style:{fontSize:11,color:"#64748B",lineHeight:1.5,marginTop:8}},
              "Se a remoção realmente saiu sem algum profissional, marque a opção “Saiu sem …”: o registro passa a ",React.createElement("b",null,"afirmar"),
              " que não houve, e não parece que o campo foi esquecido. Campo em branco quer dizer que ninguém preencheu.")
          ),
          // Horários
          React.createElement("div",{className:"ls-section"},
            React.createElement("div",{className:"ls-section-title"},"Horários"),
            React.createElement("div",{className:"ls-grid ls-g2"},
              FLD("hora_solic_ambulancia","Solic. Ambulância",React.createElement("input",{type:"time",value:form.hora_solic_ambulancia,onChange:e=>set("hora_solic_ambulancia",e.target.value),style:iS("hora_solic_ambulancia")})),
              FLD("hora_saida","Saída",React.createElement("input",{type:"time",value:form.hora_saida,onChange:e=>set("hora_saida",e.target.value),style:iS("hora_saida")}))
            )
          ),
          // Observação (a etapa 2 — retorno, Finalizado e Permaneceu — é preenchida depois, em outra aba)
          React.createElement("div",{className:"ls-section"},
            React.createElement("div",{className:"ls-section-title"},"Observação"),
            React.createElement("textarea",{rows:2,value:form.observacao,onChange:e=>set("observacao",e.target.value),placeholder:"Observações adicionais…",style:{...iS("observacao"),resize:"vertical"}})
          ),
          React.createElement("div",{style:{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#1E40AF",lineHeight:1.5,marginTop:4}},
            "\u{1F501} O horário de retorno ",React.createElement("b",null,"não é preenchido agora"),". Quando a ambulância voltar, qualquer profissional registra o retorno na aba “Aguardando retorno” — não precisa ser quem registrou a saída."),
          Object.values(errors).some(Boolean)&&formMsg&&React.createElement("div",{style:{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#DC2626",marginTop:8}},formMsg)
        ),

        // TAB PENDENTES
        tab==="todos"&&React.createElement("div",null,
          loadingT
            ?React.createElement("div",{style:{textAlign:"center",padding:32,color:"#94A3B8"}},"Carregando…")
            :erroT
              ?ERRO_BOX(erroT,loadTodos)
              :todos.length===0
                ?React.createElement("div",{style:{textAlign:"center",padding:48,color:"#94A3B8"}},
                    React.createElement("div",{style:{fontSize:32,marginBottom:8}},"📚"),
                    React.createElement("div",{style:{fontSize:14,fontWeight:600}},"Nenhum registro no Livro"))
                :todos.map(p=>React.createElement("div",{key:p.id,className:"ls-pending-card"},
                    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}},
                      React.createElement("div",{style:{minWidth:0}},
                        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:7,marginBottom:3}},
                          React.createElement("span",{style:{fontWeight:700,fontSize:13}},p.nome_paciente),
                          React.createElement("span",{style:{flexShrink:0,borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:700,
                            background:p.status_vinculo==="vinculado"?"#DCFCE7":p.status_vinculo==="pendente"?"#FEF3C7":"#F1F5F9",
                            color:p.status_vinculo==="vinculado"?"#15803D":p.status_vinculo==="pendente"?"#B45309":"#64748B"}},
                            p.status_vinculo==="vinculado"?"Vinculado":p.status_vinculo==="pendente"?"Pendente":"Sem vínculo")
                        ),
                        React.createElement("div",{style:{fontSize:11,color:"#64748B"}},datasTxt(p)," · ",p.idade," · ",p.especialidade," → ",p.destino),
                        LINHA_HORAS(p),
                        LS_ASSINATURA(p),
                        LS_ASSINATURA_RETORNO(p)
                      ),
                      React.createElement("div",{style:{display:"flex",gap:6,flexShrink:0,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}},
                        (()=>{const rem=remocoes.find(x=>x.id===p.remocao_id);
                          const desatual=podeVincular&&p.status_vinculo==="vinculado"&&p.hora_retorno&&rem&&Object.keys(lsDiferencasRetorno(p,rem)).length>0;
                          return desatual?React.createElement("button",{onClick:()=>sincronizarRetorno(p),title:"A planilha de remoção está sem o retorno do Livro (horário, Finalizado ou Permaneceu). Clique para copiar.",style:{flexShrink:0,background:"#FFFBEB",border:"1px solid #FDE68A",color:"#92400E",borderRadius:7,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}},"⟳ Atualizar planilha"):null;})(),
                        React.createElement("button",{onClick:()=>abrirAuditoria(p),title:"Ver historico de auditoria",style:{background:"none",border:"1px solid #E2E8F0",color:"#475569",borderRadius:7,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}},"\u{1F5D2} Auditoria"),
                        podeVincular&&p.status_vinculo==="independente"&&React.createElement("button",{onClick:()=>handleReabrir(p.id),style:{flexShrink:0,background:"none",border:"1px solid #E2E8F0",color:"#1D4ED8",borderRadius:7,padding:"5px 11px",fontSize:11,fontWeight:600,cursor:"pointer"}},"↩ Reabrir")
                    )
                    )
                  ))
        ),

        // TAB AGUARDANDO RETORNO (etapa 2)
        tab==="retorno"&&React.createElement("div",null,
          React.createElement("div",{style:{fontSize:12,color:"#64748B",lineHeight:1.5,marginBottom:12}},
            "Saídas já registradas que ainda não têm o retorno da ambulância. Quando ela voltar, clique em ",React.createElement("b",null,"Registrar retorno"),". Pode ser outro profissional, de outro plantão."),
          loadingR
            ?React.createElement("div",{style:{textAlign:"center",padding:32,color:"#94A3B8"}},"Carregando…")
            :erroR
              ?ERRO_BOX(erroR,loadRetornos)
              :retornos.length===0
                ?React.createElement("div",{style:{textAlign:"center",padding:48,color:"#94A3B8"}},
                    React.createElement("div",{style:{fontSize:32,marginBottom:8}},"✅"),
                    React.createElement("div",{style:{fontSize:14,fontWeight:600}},"Nenhuma saída aguardando retorno"),
                    React.createElement("div",{style:{fontSize:12,marginTop:4}},"Todas as ambulâncias que saíram já voltaram."))
                :retornos.map(p=>React.createElement("div",{key:p.id,className:"ls-pending-card"},
                    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}},
                      React.createElement("div",{style:{minWidth:0}},
                        React.createElement("div",{style:{fontWeight:700,fontSize:13}},p.nome_paciente),
                        React.createElement("div",{style:{fontSize:11,color:"#64748B",marginTop:2}},datasTxt(p)," · ",p.idade," · ",p.especialidade," → ",p.destino),
                        LINHA_HORAS(p),
                        React.createElement("div",{style:{fontSize:11,color:"#94A3B8",marginTop:2}},"Téc: ",nomeEq(p.tecnico_auxiliar)," · Méd: ",nomeEq(p.medico)),
                        LS_ASSINATURA(p)
                      ),
                      retAberto!==p.id&&React.createElement("button",{onClick:()=>abrirRetorno(p),style:{flexShrink:0,background:"#16A34A",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}},"↩ Registrar retorno")
                    ),
                    retAberto===p.id&&React.createElement("div",{style:{marginTop:12,paddingTop:12,borderTop:"1px dashed #E2E8F0"}},
                      React.createElement("div",{className:"ls-grid ls-g2"},
                        React.createElement("div",null,LBL("Horário de retorno",true),React.createElement("input",{type:"time",autoFocus:true,value:retForm.hora_retorno,onChange:e=>{setRetForm(f=>({...f,hora_retorno:e.target.value}));setRetErro(false);},style:iSR(retErro)})),
                        React.createElement("div",null)
                      ),
                      React.createElement("div",{className:"ls-grid ls-g2",style:{marginTop:10}},
                        TRI("ret_fin_"+p.id,"Finalizado",retForm.finalizado,v=>setRetForm(f=>({...f,finalizado:v}))),
                        TRI("ret_per_"+p.id,"Permaneceu no hospital de destino",retForm.permaneceu,v=>setRetForm(f=>({...f,permaneceu:v})))
                      ),
                      React.createElement("div",{style:{marginTop:10}},
                        LBL("Observação do retorno",false),
                        React.createElement("textarea",{rows:2,value:retForm.observacao,onChange:e=>setRetForm(f=>({...f,observacao:e.target.value})),placeholder:"Opcional — é acrescentada à observação da saída",style:{...iSR(false),resize:"vertical"}})),
                      retErro&&React.createElement("div",{style:{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#DC2626",marginTop:10}},"⚠ Informe o horário de retorno."),
                      React.createElement("div",{style:{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}},
                        React.createElement("button",{onClick:()=>{setRetAberto(null);setRetErro(false);},disabled:retSaving,style:{background:"none",border:"1px solid #E2E8F0",color:"#64748B",borderRadius:8,padding:"7px 16px",fontSize:12,cursor:"pointer"}},"Cancelar"),
                        React.createElement("button",{onClick:()=>registrarRetorno(p),disabled:retSaving,style:{background:"#0F172A",color:"#fff",border:"none",borderRadius:8,padding:"7px 18px",fontSize:12,fontWeight:700,cursor:retSaving?"not-allowed":"pointer",opacity:retSaving?.7:1}},retSaving?"Salvando…":"Salvar retorno")
                      )
                    )
                  ))
        ),

        tab==="pendentes"&&React.createElement("div",null,
          loadingP
            ?React.createElement("div",{style:{textAlign:"center",padding:32,color:"#94A3B8"}},"Carregando…")
            :erroP
              ?ERRO_BOX(erroP,loadPendentes)
              :pendentes.length===0
              ?React.createElement("div",{style:{textAlign:"center",padding:48,color:"#94A3B8"}},
                  React.createElement("div",{style:{fontSize:32,marginBottom:8}},"✅"),
                  React.createElement("div",{style:{fontSize:14,fontWeight:600}},"Nenhum pendente"),
                  React.createElement("div",{style:{fontSize:12,marginTop:4}},"Todos os registros já estão vinculados.")
                )
              :pendentes.map(p=>React.createElement("div",{key:p.id,className:"ls-pending-card"},
                  React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}},
                    React.createElement("div",null,
                      React.createElement("div",{style:{fontWeight:700,fontSize:13}},p.nome_paciente),
                      React.createElement("div",{style:{fontSize:11,color:"#64748B",marginTop:2}},datasTxt(p)," · ",p.idade," · ",p.especialidade," → ",p.destino),
                      LINHA_HORAS(p),
                      LS_ASSINATURA(p),
                      LS_ASSINATURA_RETORNO(p)
                    ),
                    React.createElement("div",{style:{display:"flex",gap:6,flexShrink:0,marginLeft:12,alignItems:"center"}},
                      React.createElement("button",{onClick:()=>abrirAuditoria(p),title:"Ver historico de auditoria",style:{background:"none",border:"1px solid #E2E8F0",color:"#475569",borderRadius:7,padding:"5px 10px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}},"\u{1F5D2}"),
                      podeVincular&&React.createElement("button",{onClick:()=>handleVincularPendente(p),style:{background:"#EFF6FF",border:"1px solid #BFDBFE",color:"#1D4ED8",borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}},"🔗 Vincular"),
                      podeVincular&&React.createElement("button",{onClick:()=>setConfirmIgnorar(p),style:{background:"none",border:"1px solid #E2E8F0",color:"#64748B",borderRadius:7,padding:"5px 10px",fontSize:11,cursor:"pointer"}},"Sem vínculo"),
                      !podeVincular&&React.createElement("span",{style:{fontSize:10,fontWeight:700,color:"#B45309",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:99,padding:"4px 10px",whiteSpace:"nowrap"}},"Aguardando confer\u00EAncia")
                    )
                  )
                ))
        )
      ),

      // ── Modal de auditoria ──
      auditoria&&React.createElement("div",{
        onClick:e=>{if(e.target===e.currentTarget)setAuditoria(null);},
        style:{position:"absolute",inset:0,background:"rgba(15,23,42,.45)",backdropFilter:"blur(2px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,zIndex:60}},
        React.createElement("div",{style:{background:"#fff",borderRadius:16,width:"min(520px,100%)",maxHeight:"86%",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 60px -20px rgba(15,23,42,.5)"}},
          React.createElement("div",{style:{padding:"20px 22px 16px",borderBottom:"1px solid #F1F5F9"}},
            React.createElement("div",{style:{fontSize:11,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:"#94A3B8",marginBottom:6}},"Auditoria do registro"),
            React.createElement("div",{style:{fontSize:16,fontWeight:700,color:"#0F172A"}},auditoria.registro.nome_paciente),
            React.createElement("div",{style:{fontSize:12,color:"#64748B",marginTop:2}},fmtDate(auditoria.registro.data_saida)," \u00B7 ",auditoria.registro.destino||"\u2014")
          ),
          React.createElement("div",{style:{padding:"18px 22px",overflowY:"auto",flex:1}},
            loadingA
              ?React.createElement("div",{style:{textAlign:"center",padding:28,color:"#94A3B8",fontSize:13}},"Carregando hist\u00F3rico\u2026")
              :auditoria.erro
                ?React.createElement("div",{style:{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:10,padding:"12px 14px",fontSize:12,color:"#DC2626"}},auditoria.erro)
                :(auditoria.linhas||[]).length===0
                  ?React.createElement("div",{style:{textAlign:"center",padding:28,color:"#94A3B8"}},
                      React.createElement("div",{style:{fontSize:26,marginBottom:6}},"\u{1F5D2}"),
                      React.createElement("div",{style:{fontSize:13,fontWeight:600,color:"#64748B"}},"Sem hist\u00F3rico registrado"),
                      React.createElement("div",{style:{fontSize:12,marginTop:4}},"Lan\u00E7amento anterior \u00E0 ativa\u00E7\u00E3o da auditoria."))
                  :React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:0}},
                      (auditoria.linhas||[]).map((l,i,arr)=>{
                        const meta=LS_ACOES[l.acao]||LS_ACOES.editou;
                        return React.createElement("div",{key:l.id,style:{display:"flex",gap:12,alignItems:"flex-start"}},
                          React.createElement("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,alignSelf:"stretch"}},
                            React.createElement("div",{style:{width:26,height:26,borderRadius:99,background:"#F8FAFC",border:"1px solid #E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}},meta.ico),
                            i<arr.length-1&&React.createElement("div",{style:{flex:1,width:2,background:"#F1F5F9",minHeight:14}})
                          ),
                          React.createElement("div",{style:{paddingBottom:i<arr.length-1?16:0,minWidth:0}},
                            React.createElement("div",{style:{fontSize:13,fontWeight:700,color:meta.cor}},meta.txt),
                            React.createElement("div",{style:{fontSize:12,color:"#334155",marginTop:2,fontWeight:600}},
                              l.autor_nome||"Autor n\u00E3o identificado",
                              (l.autor_tipo||l.autor_registro)?React.createElement("span",{style:{fontWeight:500,color:"#64748B"}}," \u00B7 ",[l.autor_tipo,l.autor_registro].filter(Boolean).join(" ")):null
                            ),
                            React.createElement("div",{style:{fontSize:11,color:"#94A3B8",marginTop:2}},lsQuando(l.criado_em))
                          )
                        );
                      })
                    )
          ),
          React.createElement("div",{style:{padding:"14px 22px",borderTop:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}},
            React.createElement("div",{style:{fontSize:11,color:"#94A3B8"}},"Registro imut\u00E1vel \u00B7 gerado pelo servidor"),
            React.createElement("button",{onClick:()=>setAuditoria(null),style:{background:"#0F172A",color:"#fff",border:"none",borderRadius:9,padding:"8px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}},"Fechar")
          )
        )
      ),

      // ── Footer ──
      React.createElement("div",{className:"ls-ft"},
        React.createElement("div",{style:{fontSize:11,color:"#94A3B8"}},tab==="novo"?"Campos com * são obrigatórios":tab==="retorno"?`${retornos.length} saída(s) aguardando retorno`:tab==="todos"?`${todos.length} registro(s) no Livro`:`${pendentes.length} registro(s) aguardando vinculação`),
        tab==="novo"&&React.createElement("button",{onClick:handleSalvar,disabled:saving,style:{background:"#0F172A",color:"#fff",border:"none",borderRadius:9,padding:"9px 24px",fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer",opacity:saving?.7:1}},saving?"Salvando…":"💾 Salvar saída")
      )
    )
  );
}

/* Administracao de usuarios. Criar conta no Auth e redefinir senha exigem a
 * service_role key — por isso passam pela Edge Function users-admin, nunca
 * pelo front. A propria funcao confere, a partir do JWT, se quem chama e
 * admin aprovado; o front so desenha a tela. */
async function adminUsuarios(action, id, extra, userId) {
  return await fn("users-admin", { action, id, ...(extra || {}) }, userId);
}

// Liga/desliga uma area de escrita (can_kanban | can_planilha | can_livro).
// Antes era um PATCH direto no REST com a anon key — com RLS ligada isso
// nao passa mais, e nem deveria: permissao se altera no servidor.
async function toggleFlag(uid, campo, atual, reload, callerId) {
  await adminUsuarios("flags", uid, { flags: { [campo]: !atual } }, callerId);
  reload();
}
