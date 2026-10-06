/* ============================================================================
   Ações de Enfermagem — v3
   - Cada pessoa abre direto na SUA lista (Atrasadas, Hoje, Próximos dias, Sem prazo, Programadas)
   - Qualquer pessoa cria tarefas e rotinas PARA SI; só quem gerencia atribui a outras pessoas
   - Aba "Equipe" (quem gerencia) mostra todo mundo, agrupado por responsável
   - Tarefas programadas: aparecem na lista só a partir do dia escolhido
   - Rotinas: repetem todo dia, dias úteis, dias da semana, todo mês ou a cada N dias
   Precisa da função acoes-write v4 e do SQL 01_banco_acoes.sql já aplicados.
   Tudo fica dentro desta função anônima para não colidir com nomes de outros arquivos.
   ============================================================================ */
(function () {
  var h = React.createElement;
  var TZ = "America/Sao_Paulo";
  var DIAS_ABREV = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var DIAS_INICIAL = ["D", "S", "T", "Q", "Q", "S", "S"];

  /* ───────────────────────── estilos (injetados uma vez) ───────────────────────── */
  var CSS = [
    ".ac-root{--bg:#F8FAFC;--surface:#fff;--surface-2:#F1F5F9;--text:#0F172A;--text-2:#475569;--text-3:#94A3B8;--border:#E2E8F0;--border-2:#CBD5E1;--primary:#0F172A;--primary-h:#1E293B;--accent:#2563EB;--ok:#16A34A;--ok-soft:#F0FDF4;--warn:#B45309;--warn-soft:#FFFBEB;--err:#DC2626;--err-soft:#FEF2F2;--info-soft:#EFF6FF;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:var(--text);-webkit-font-smoothing:antialiased}",
    ".ac-root *{box-sizing:border-box}",
    ".ac-overlay{position:fixed;inset:0;z-index:1000;background:rgba(15,23,42,.45);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;padding:16px;animation:ac-fade .18s ease-out}",
    ".ac-modal{position:relative;width:100%;max-width:780px;height:min(840px,92vh);background:var(--bg);border-radius:20px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px -12px rgba(15,23,42,.35);animation:ac-pop .2s ease-out}",
    ".ac-head{background:var(--surface);padding:20px 24px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:1px solid var(--border)}",
    ".ac-h1{margin:0;font-size:20px;line-height:28px;font-weight:650;letter-spacing:-.01em}",
    ".ac-sub{margin:2px 0 0;font-size:13px;line-height:20px;color:var(--text-2)}",
    ".ac-head-act{display:flex;gap:8px;align-items:center;flex-shrink:0}",
    ".ac-tabs{background:var(--surface);padding:12px 24px;display:flex;gap:6px;overflow-x:auto;border-bottom:1px solid var(--border);scrollbar-width:none}",
    ".ac-tabs::-webkit-scrollbar{display:none}",
    ".ac-tab{flex-shrink:0;display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border:0;border-radius:10px;background:transparent;color:var(--text-2);font:inherit;font-size:14px;font-weight:550;cursor:pointer;transition:background .15s,color .15s}",
    ".ac-tab:hover{background:var(--surface-2);color:var(--text)}",
    ".ac-tab[aria-selected=true]{background:var(--primary);color:#fff}",
    ".ac-count{min-width:20px;height:20px;padding:0 6px;border-radius:99px;background:var(--surface-2);color:var(--text-2);font-size:12px;font-weight:650;display:inline-flex;align-items:center;justify-content:center}",
    ".ac-tab[aria-selected=true] .ac-count{background:rgba(255,255,255,.18);color:#fff}",
    ".ac-count.is-err{background:var(--err-soft);color:var(--err)}",
    ".ac-body{flex:1;overflow-y:auto;padding:20px 24px 32px;overscroll-behavior:contain}",
    ".ac-sec{margin-bottom:24px}",
    ".ac-sec-h{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:13px;font-weight:650;color:var(--text-2);background:none;border:0;padding:0;font-family:inherit}",
    ".ac-sec-h.is-btn{cursor:pointer}",
    ".ac-sec-h.is-err{color:var(--err)}",
    ".ac-sec-h svg{transition:transform .15s}",
    ".ac-sec-h[aria-expanded=false] svg{transform:rotate(-90deg)}",
    ".ac-list{display:flex;flex-direction:column;gap:8px}",
    ".ac-card{display:flex;gap:12px;align-items:flex-start;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px 16px;transition:border-color .15s,box-shadow .15s}",
    ".ac-card:hover{border-color:var(--border-2);box-shadow:0 1px 2px rgba(15,23,42,.04),0 6px 16px -6px rgba(15,23,42,.08)}",
    ".ac-check{flex-shrink:0;width:24px;height:24px;margin-top:1px;border-radius:99px;border:2px solid var(--border-2);background:var(--surface);color:transparent;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:border-color .15s,background .15s,color .15s}",
    ".ac-check:hover{border-color:var(--ok);background:var(--ok-soft);color:var(--ok)}",
    ".ac-check:disabled{cursor:default;opacity:.45}",
    ".ac-check:disabled:hover{border-color:var(--border-2);background:var(--surface);color:transparent}",
    ".ac-card-main{flex:1;min-width:0}",
    ".ac-title{margin:0;font-size:15px;line-height:22px;font-weight:600;word-break:break-word}",
    ".ac-desc{margin:2px 0 0;font-size:13px;line-height:20px;color:var(--text-2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-line}",
    ".ac-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}",
    ".ac-chip{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px;border-radius:99px;background:var(--surface-2);color:var(--text-2);font-size:12px;font-weight:550;white-space:nowrap}",
    ".ac-chip.is-err{background:var(--err-soft);color:#B91C1C}",
    ".ac-chip.is-warn{background:var(--warn-soft);color:var(--warn)}",
    ".ac-chip.is-info{background:var(--info-soft);color:#1D4ED8}",
    ".ac-chip.is-ok{background:var(--ok-soft);color:#15803D}",
    ".ac-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:6px;margin-top:12px}",
    ".ac-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 16px;border-radius:10px;border:1px solid transparent;font:inherit;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s,color .15s,transform .05s}",
    ".ac-btn:active{transform:translateY(1px)}",
    ".ac-btn:disabled{opacity:.55;cursor:not-allowed}",
    ".ac-btn--primary{background:var(--primary);color:#fff}",
    ".ac-btn--primary:hover:not(:disabled){background:var(--primary-h)}",
    ".ac-btn--secondary{background:var(--surface);border-color:var(--border-2);color:var(--text)}",
    ".ac-btn--secondary:hover:not(:disabled){background:var(--surface-2)}",
    ".ac-btn--ghost{background:transparent;color:var(--text-2)}",
    ".ac-btn--ghost:hover:not(:disabled){background:var(--surface-2);color:var(--text)}",
    ".ac-btn--danger{background:var(--err);color:#fff}",
    ".ac-btn--danger:hover:not(:disabled){background:#B91C1C}",
    ".ac-btn--sm{height:32px;padding:0 12px;font-size:13px;border-radius:8px;gap:6px}",
    ".ac-icon-btn{width:32px;height:32px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--text-3);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s,color .15s}",
    ".ac-icon-btn:hover{background:var(--surface-2);color:var(--text)}",
    ".ac-icon-btn.is-danger:hover{background:var(--err-soft);color:var(--err)}",
    ".ac-root :focus-visible{outline:2px solid var(--accent);outline-offset:2px}",
    ".ac-person{display:flex;align-items:center;gap:10px;margin:0 0 10px}",
    ".ac-avatar{width:28px;height:28px;border-radius:99px;background:var(--surface-2);color:var(--text-2);font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}",
    ".ac-person-n{font-size:14px;font-weight:650}",
    ".ac-filter{display:flex;gap:8px;margin-bottom:20px}",
    ".ac-select,.ac-input,.ac-textarea{width:100%;border:1px solid var(--border-2);border-radius:10px;background:var(--surface);color:var(--text);font:inherit;font-size:14px;transition:border-color .15s,box-shadow .15s}",
    ".ac-select,.ac-input{height:42px;padding:0 12px}",
    ".ac-textarea{padding:10px 12px;min-height:84px;resize:vertical;line-height:20px}",
    ".ac-select:focus,.ac-input:focus,.ac-textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.15)}",
    ".ac-input::placeholder,.ac-textarea::placeholder{color:var(--text-3)}",
    ".ac-empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:56px 24px}",
    ".ac-empty-ic{width:56px;height:56px;border-radius:99px;background:var(--surface-2);color:var(--text-3);display:flex;align-items:center;justify-content:center;margin-bottom:16px}",
    ".ac-empty h3{margin:0;font-size:16px;font-weight:650}",
    ".ac-empty p{margin:6px 0 20px;max-width:340px;font-size:14px;line-height:22px;color:var(--text-2)}",
    ".ac-skel{height:78px;border-radius:14px;background:linear-gradient(90deg,var(--surface-2) 25%,#E8EDF3 50%,var(--surface-2) 75%);background-size:200% 100%;animation:ac-shine 1.3s infinite linear}",
    ".ac-banner{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:12px;font-size:13px;line-height:20px;margin-bottom:16px}",
    ".ac-banner svg{flex-shrink:0;margin-top:2px}",
    ".ac-banner.is-info{background:var(--info-soft);color:#1E40AF}",
    ".ac-banner.is-err{background:var(--err-soft);color:#991B1B}",
    ".ac-banner.is-warn{background:var(--warn-soft);color:#92400E}",
    ".ac-done-day{margin:20px 0 8px;font-size:13px;font-weight:650;color:var(--text-2)}",
    ".ac-done{display:flex;gap:12px;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:10px 14px}",
    ".ac-done-ic{flex-shrink:0;width:24px;height:24px;border-radius:99px;background:var(--ok);color:#fff;display:inline-flex;align-items:center;justify-content:center}",
    ".ac-done .ac-title{font-size:14px;font-weight:550;color:var(--text-2);text-decoration:line-through;text-decoration-color:var(--text-3)}",
    ".ac-done-meta{font-size:12px;color:var(--text-3);margin-top:2px}",
    /* formulário (painel que cobre a janela) */
    ".ac-panel{position:absolute;inset:0;z-index:5;background:var(--bg);display:flex;flex-direction:column;animation:ac-slide .2s ease-out}",
    ".ac-panel-body{flex:1;overflow-y:auto;padding:20px 24px 24px}",
    ".ac-panel-foot{background:var(--surface);border-top:1px solid var(--border);padding:14px 24px;display:flex;gap:8px;justify-content:flex-end;align-items:center}",
    ".ac-group{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:16px}",
    ".ac-group-t{margin:0 0 14px;font-size:13px;font-weight:650;color:var(--text-2)}",
    ".ac-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}",
    ".ac-full{grid-column:1/-1}",
    ".ac-field label,.ac-label{display:block;margin-bottom:6px;font-size:13px;font-weight:600}",
    ".ac-hint{margin:6px 0 0;font-size:12px;line-height:18px;color:var(--text-3)}",
    ".ac-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border-radius:12px;background:var(--surface-2)}",
    ".ac-seg button{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:38px;border:0;border-radius:9px;background:transparent;color:var(--text-2);font:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:background .15s,color .15s,box-shadow .15s}",
    ".ac-seg button[aria-pressed=true]{background:var(--surface);color:var(--text);box-shadow:0 1px 3px rgba(15,23,42,.12)}",
    ".ac-wd{display:flex;gap:6px;flex-wrap:wrap}",
    ".ac-wd button{width:42px;height:42px;border-radius:99px;border:1px solid var(--border-2);background:var(--surface);color:var(--text-2);font:inherit;font-size:13px;font-weight:650;cursor:pointer;transition:background .15s,color .15s,border-color .15s}",
    ".ac-wd button[aria-pressed=true]{background:var(--primary);border-color:var(--primary);color:#fff}",
    ".ac-resumo{display:flex;gap:10px;align-items:center;margin-top:16px;padding:12px 14px;border-radius:12px;background:var(--info-soft);color:#1E40AF;font-size:13px;line-height:20px;font-weight:550}",
    ".ac-form-err{margin-right:auto;font-size:13px;color:var(--err);font-weight:550}",
    ".ac-confirm{position:absolute;inset:0;z-index:10;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:20px;animation:ac-fade .15s ease-out}",
    ".ac-confirm-box{width:100%;max-width:400px;background:var(--surface);border-radius:16px;padding:24px;box-shadow:0 24px 48px -12px rgba(15,23,42,.35)}",
    ".ac-confirm-box h3{margin:0 0 6px;font-size:17px;font-weight:650}",
    ".ac-confirm-box p{margin:0 0 20px;font-size:14px;line-height:22px;color:var(--text-2)}",
    ".ac-confirm-box div{display:flex;gap:8px;justify-content:flex-end}",
    ".ac-toast{position:absolute;left:50%;bottom:20px;z-index:20;transform:translateX(-50%);max-width:calc(100% - 32px);display:flex;gap:10px;align-items:center;padding:12px 16px;border-radius:12px;background:var(--primary);color:#fff;font-size:14px;font-weight:550;box-shadow:0 12px 32px -8px rgba(15,23,42,.45);animation:ac-up .2s ease-out}",
    ".ac-toast.is-err{background:#991B1B}",
    "@keyframes ac-fade{from{opacity:0}to{opacity:1}}",
    "@keyframes ac-pop{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}",
    "@keyframes ac-slide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}",
    "@keyframes ac-up{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}",
    "@keyframes ac-shine{to{background-position:-200% 0}}",
    "@media (max-width:640px){",
    ".ac-overlay{padding:0}",
    ".ac-modal{max-width:none;height:100vh;height:100dvh;border-radius:0}",
    ".ac-head{padding:16px 16px 12px}.ac-tabs{padding:10px 16px}.ac-body{padding:16px 16px 32px}",
    ".ac-panel-body{padding:16px}.ac-panel-foot{padding:12px 16px}.ac-grid{grid-template-columns:1fr}",
    ".ac-head-act .ac-btn-label{display:none}.ac-head-act .ac-btn--primary{padding:0 12px}",
    "}",
    "@media (prefers-reduced-motion:reduce){.ac-root *{animation:none!important;transition:none!important}}"
  ].join("\n");

  function injetarCSS() {
    if (document.getElementById("ac-styles")) return;
    var s = document.createElement("style");
    s.id = "ac-styles";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ───────────────────────── ícones (traço no estilo Lucide) ───────────────────────── */
  var ICONES = {
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    timer: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    undo: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    circleCheck: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    listChecks: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
  };
  function Ic(p) {
    var t = p.size || 16;
    return h("svg", { width: t, height: t, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", dangerouslySetInnerHTML: { __html: ICONES[p.n] || "" } });
  }

  /* ───────────────────────── datas e textos ───────────────────────── */
  function isoDe(dt) { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(dt); }
  function isoHoje() { return isoDe(new Date()); }
  function isoAmanha() { return isoDe(new Date(Date.now() + 86400000)); }
  function isoOntem() { return isoDe(new Date(Date.now() - 86400000)); }
  function fmtDia(iso) { var p = String(iso).split("-"); return p[2] + "/" + p[1]; }
  function fmtHora(dt) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(dt); }
  function fmtDiaHora(dt) { return fmtDia(isoDe(dt)) + " " + fmtHora(dt); }
  function fmtTempo(min) { return min >= 60 ? Math.floor(min / 60) + "h" + String(min % 60).padStart(2, "0") + "min" : min + "min"; }
  function prazoISO(val) { return val ? val + ":00-03:00" : null; }      // datetime-local → ISO com fuso do Brasil
  function prazoParaCampo(iso) {                                         // ISO → valor do datetime-local
    if (!iso) return "";
    var d = new Date(iso);
    return isoDe(d) + "T" + fmtHora(d);
  }
  function iniciais(nome) {
    var p = String(nome || "?").trim().split(/\s+/);
    return ((p[0] || "?").charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : "")).toUpperCase();
  }
  function plural(n, um, varios) { return n + " " + (n === 1 ? um : varios); }

  function descreverRegra(r) {
    var t;
    if (r.tipo === "diaria") t = "Todos os dias";
    else if (r.tipo === "semanal") {
      var d = (r.dias_semana || []).slice().sort(function (a, b) { return a - b; });
      if (d.join() === "1,2,3,4,5") t = "Dias úteis (seg a sex)";
      else if (d.length === 7) t = "Todos os dias";
      else t = "Toda semana: " + d.map(function (i) { return DIAS_ABREV[i]; }).join(", ");
    }
    else if (r.tipo === "mensal") t = "Todo mês, dia " + r.dia_mes;
    else if (r.tipo === "intervalo") t = "A cada " + plural(r.intervalo_dias, "dia", "dias");
    else t = "Rotina";
    if (r.hora_prazo) t += " · até " + r.hora_prazo;
    if (r.data_fim) t += " · até " + fmtDia(r.data_fim);
    return t;
  }

  function ordenar(a, b) {
    var pa = a.prioridade == null ? 1e9 : a.prioridade, pb = b.prioridade == null ? 1e9 : b.prioridade;
    if (pa !== pb) return pa - pb;
    var ta = a.prazo ? new Date(a.prazo).getTime() : 1e15, tb = b.prazo ? new Date(b.prazo).getTime() : 1e15;
    if (ta !== tb) return ta - tb;
    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
  }

  function secaoDe(a) {
    if (a.status === "agendada") return "programadas";
    if (!a.prazo) return "sem_prazo";
    var d = new Date(a.prazo);
    if (d < new Date()) return "atrasadas";
    return isoDe(d) === isoHoje() ? "hoje" : "proximas";
  }

  /* ───────────────────────── pecinhas visuais ───────────────────────── */
  function Chip(p) { return h("span", { className: "ac-chip" + (p.tom ? " is-" + p.tom : ""), title: p.title }, p.icone && h(Ic, { n: p.icone, size: 13 }), p.children); }

  function Vazio(p) {
    return h("div", { className: "ac-empty" },
      h("div", { className: "ac-empty-ic" }, h(Ic, { n: p.icone || "circleCheck", size: 26 })),
      h("h3", null, p.titulo), h("p", null, p.texto), p.acao);
  }

  function Esqueleto() { return h("div", { className: "ac-list", "aria-busy": "true" }, h("div", { className: "ac-skel" }), h("div", { className: "ac-skel" }), h("div", { className: "ac-skel" })); }

  function Secao(p) {
    var aberta = p.aberta !== false;
    return h("section", { className: "ac-sec" },
      p.recolhivel
        ? h("button", { type: "button", className: "ac-sec-h is-btn" + (p.tom ? " is-" + p.tom : ""), "aria-expanded": aberta, onClick: p.onToggle }, h(Ic, { n: "chevron", size: 14 }), p.titulo, h("span", { className: "ac-count" + (p.tom === "err" ? " is-err" : "") }, p.itens.length))
        : h("h3", { className: "ac-sec-h" + (p.tom ? " is-" + p.tom : "") }, p.titulo, h("span", { className: "ac-count" + (p.tom === "err" ? " is-err" : "") }, p.itens.length)),
      aberta && h("div", { className: "ac-list" }, p.children));
  }

  /* cartão de uma tarefa */
  function CartaoTarefa(p) {
    var a = p.a, c = p.ctx;
    var agendada = a.status === "agendada";
    var meu = c.meuId && a.responsavel_id === c.meuId;
    var podeAgir = (c.podeGerir || meu) && !agendada;
    var vencida = a.prazo && new Date(a.prazo) < new Date();

    var prazoTxt = null;
    if (a.prazo) {
      var d = new Date(a.prazo), dia = isoDe(d);
      prazoTxt = (dia === isoHoje() ? "Hoje" : dia === isoAmanha() ? "Amanhã" : fmtDia(dia)) + " " + fmtHora(d);
    }
    var prTom = a.prioridade === 1 ? "err" : a.prioridade === 2 ? "warn" : null;

    return h("article", { className: "ac-card" },
      h("button", { type: "button", className: "ac-check", disabled: !podeAgir, "aria-label": "Concluir tarefa " + a.titulo, title: podeAgir ? "Concluir" : agendada ? "Ainda programada" : "Só o responsável conclui", onClick: function () { c.concluir(a); } }, h(Ic, { n: "check", size: 14 })),
      h("div", { className: "ac-card-main" },
        h("h4", { className: "ac-title" }, a.titulo),
        a.descricao && h("p", { className: "ac-desc" }, a.descricao),
        h("div", { className: "ac-meta" },
          a.prioridade != null && h(Chip, { tom: prTom, title: "Prioridade " + a.prioridade + " (1 = mais urgente)" }, "P" + a.prioridade),
          agendada && a.disponivel_em && h(Chip, { tom: "info", icone: "calendar" }, "Aparece em " + fmtDia(a.disponivel_em)),
          prazoTxt && h(Chip, { tom: vencida ? "err" : null, icone: vencida ? "alert" : "clock" }, (vencida ? "Venceu " : "Prazo ") + prazoTxt),
          a.recorrencia_id && h(Chip, { icone: "repeat" }, "Rotina"),
          a.status === "iniciada" && h(Chip, { tom: "info", icone: "play" }, "Em andamento" + (a.iniciada_em ? " desde " + fmtHora(new Date(a.iniciada_em)) : "")),
          a.status === "pausada" && h(Chip, { tom: "warn", icone: "pause" }, "Pausada"),
          a.tempo_min > 0 && h(Chip, { icone: "timer" }, fmtTempo(a.tempo_min)),
          c.mostrarResp && h(Chip, { icone: "user" }, a.responsavel_nome || "Sem responsável")
        ),
        (podeAgir || c.podeEditar(a)) && h("div", { className: "ac-actions" },
          podeAgir && (a.status === "pendente" || a.status === "pausada") && h("button", { type: "button", className: "ac-btn ac-btn--secondary ac-btn--sm", onClick: function () { c.iniciar(a); } }, h(Ic, { n: "play", size: 13 }), a.status === "pausada" ? "Retomar" : "Iniciar"),
          podeAgir && a.status === "iniciada" && h("button", { type: "button", className: "ac-btn ac-btn--secondary ac-btn--sm", onClick: function () { c.pausar(a); } }, h(Ic, { n: "pause", size: 13 }), "Pausar"),
          c.podeEditar(a) && h("button", { type: "button", className: "ac-icon-btn", "aria-label": "Editar", title: "Editar", onClick: function () { c.editar(a); } }, h(Ic, { n: "pencil", size: 16 })),
          c.podeEditar(a) && h("button", { type: "button", className: "ac-icon-btn is-danger", "aria-label": "Excluir", title: "Excluir", onClick: function () { c.excluir(a); } }, h(Ic, { n: "trash", size: 16 }))
        )
      )
    );
  }

  function CartaoRotina(p) {
    var r = p.r;
    return h("article", { className: "ac-card", style: r.ativa ? null : { opacity: 0.7 } },
      h("div", { className: "ac-check", style: { border: 0, background: "var(--info-soft)", color: "#1D4ED8", cursor: "default" } }, h(Ic, { n: "repeat", size: 14 })),
      h("div", { className: "ac-card-main" },
        h("h4", { className: "ac-title" }, r.titulo),
        r.descricao && h("p", { className: "ac-desc" }, r.descricao),
        h("div", { className: "ac-meta" },
          h(Chip, { tom: "info", icone: "calendar" }, descreverRegra(r)),
          r.prioridade != null && h(Chip, null, "P" + r.prioridade),
          h(Chip, { icone: "user" }, r.responsavel_nome || "Sem responsável"),
          h(Chip, null, "Desde " + fmtDia(r.data_inicio)),
          !r.ativa && h(Chip, { tom: "warn", icone: "pause" }, "Rotina pausada")
        ),
        p.podeEditar && h("div", { className: "ac-actions" },
          h("button", { type: "button", className: "ac-btn ac-btn--secondary ac-btn--sm", onClick: function () { p.ativar(r); } }, h(Ic, { n: r.ativa ? "pause" : "play", size: 13 }), r.ativa ? "Pausar rotina" : "Retomar rotina"),
          h("button", { type: "button", className: "ac-icon-btn", "aria-label": "Editar rotina", title: "Editar", onClick: function () { p.editar(r); } }, h(Ic, { n: "pencil", size: 16 })),
          h("button", { type: "button", className: "ac-icon-btn is-danger", "aria-label": "Excluir rotina", title: "Excluir", onClick: function () { p.excluir(r); } }, h(Ic, { n: "trash", size: 16 }))
        )
      )
    );
  }

  /* ───────────────────────── formulário ───────────────────────── */
  function formInicial(modo, ed) {
    var hoje = isoHoje();
    var f = { titulo: "", descricao: "", prioridade: "", responsavel_id: "", quando: "uma_vez", prazo: "", disponivel_em: "",
      rep: "diaria", dias_semana: [1, 2, 3, 4, 5], dia_mes: String(new Date().getDate()), intervalo_dias: "2", data_inicio: hoje, data_fim: "", hora_prazo: "" };
    if (!ed) return f;
    f.titulo = ed.titulo || ""; f.descricao = ed.descricao || "";
    f.prioridade = ed.prioridade != null ? String(ed.prioridade) : "";
    f.responsavel_id = ed.responsavel_id || "";
    if (modo === "rotina") {
      f.quando = "repetir";
      f.rep = ed.tipo === "semanal" ? ((ed.dias_semana || []).slice().sort().join() === "1,2,3,4,5" ? "uteis" : "semanal") : ed.tipo;
      f.dias_semana = ed.dias_semana ? ed.dias_semana.slice() : [1, 2, 3, 4, 5];
      f.dia_mes = ed.dia_mes ? String(ed.dia_mes) : f.dia_mes;
      f.intervalo_dias = ed.intervalo_dias ? String(ed.intervalo_dias) : f.intervalo_dias;
      f.data_inicio = ed.data_inicio; f.data_fim = ed.data_fim || ""; f.hora_prazo = ed.hora_prazo || "";
    } else {
      f.prazo = prazoParaCampo(ed.prazo);
      if (ed.status === "agendada") { f.quando = "programar"; f.disponivel_em = ed.disponivel_em || ""; }
    }
    return f;
  }

  function regraDoForm(f) {
    var tipo = f.rep === "uteis" ? "semanal" : f.rep;
    return { tipo: tipo, dias_semana: f.rep === "uteis" ? [1, 2, 3, 4, 5] : f.dias_semana, dia_mes: Number(f.dia_mes), intervalo_dias: Number(f.intervalo_dias), hora_prazo: f.hora_prazo || null, data_fim: f.data_fim || null };
  }

  function Campo(p) { return h("div", { className: "ac-field" + (p.cheio ? " ac-full" : "") }, h("label", { htmlFor: p.id }, p.rotulo), p.children, p.dica && h("p", { className: "ac-hint" }, p.dica)); }

  function Formulario(p) {
    var modo = p.modo, ed = p.editando;
    var st = React.useState(function () { var ini = formInicial(modo, ed); if (!ed && p.quandoInicial) ini.quando = p.quandoInicial; return ini; });
    var f = st[0], setF = st[1];
    var sv = React.useState(false), salvando = sv[0], setSalvando = sv[1];
    var er = React.useState(""), erro = er[0], setErro = er[1];

    function set(k, v) { setF(function (o) { var n = Object.assign({}, o); n[k] = v; return n; }); }
    function alternaDia(i) { setF(function (o) { var l = o.dias_semana.indexOf(i) >= 0 ? o.dias_semana.filter(function (x) { return x !== i; }) : o.dias_semana.concat([i]); return Object.assign({}, o, { dias_semana: l }); }); }

    var ehRotina = modo === "rotina";
    var ehOcorrencia = !ehRotina && ed && (ed.recorrencia_id || ed.status === "iniciada" || ed.status === "pausada");
    var mostraQuando = !ed;                     // escolher Uma vez / Programar / Repetir só ao criar
    var mostraProgramar = !ehRotina && !ehOcorrencia;  // editar tarefa avulsa ainda permite trocar entre "uma vez" e "programada"

    function enviar() {
      setErro("");
      if (!f.titulo.trim()) { setErro("Dê um título para a tarefa."); return; }
      var corpo, acao;
      if (f.quando === "repetir") {
        if (f.rep === "semanal" && !f.dias_semana.length) { setErro("Escolha pelo menos um dia da semana."); return; }
        if (f.rep === "mensal" && !(Number(f.dia_mes) >= 1 && Number(f.dia_mes) <= 31)) { setErro("O dia do mês deve ser de 1 a 31."); return; }
        if (f.rep === "intervalo" && !(Number(f.intervalo_dias) >= 1)) { setErro("Informe de quantos em quantos dias."); return; }
        if (!f.data_inicio) { setErro("Informe quando a rotina começa."); return; }
        if (f.data_fim && f.data_fim < f.data_inicio) { setErro("O fim da rotina não pode ser antes do início."); return; }
        var rg = regraDoForm(f);
        corpo = { titulo: f.titulo.trim(), descricao: f.descricao.trim() || null, prioridade: f.prioridade ? parseInt(f.prioridade, 10) : null, responsavel_id: f.responsavel_id || null,
          tipo: rg.tipo, dias_semana: rg.tipo === "semanal" ? rg.dias_semana : null, dia_mes: rg.tipo === "mensal" ? rg.dia_mes : null, intervalo_dias: rg.tipo === "intervalo" ? rg.intervalo_dias : null,
          hora_prazo: rg.hora_prazo, data_inicio: f.data_inicio, data_fim: rg.data_fim };
        acao = "rotina";
      } else {
        if (f.quando === "programar") {
          if (!f.disponivel_em) { setErro("Escolha o dia em que a tarefa deve aparecer."); return; }
        }
        corpo = { titulo: f.titulo.trim(), descricao: f.descricao.trim() || null, prioridade: f.prioridade ? parseInt(f.prioridade, 10) : null,
          responsavel_id: f.responsavel_id || null, prazo: prazoISO(f.prazo) };
        if (!ehOcorrencia) corpo.disponivel_em = f.quando === "programar" ? f.disponivel_em : null;
        acao = "tarefa";
      }
      setSalvando(true);
      Promise.resolve(p.onSalvar(acao, corpo)).then(function (msg) {
        if (msg) { setErro(msg); setSalvando(false); }
      });
    }

    var titulo = ehRotina ? "Editar rotina" : ed ? "Editar tarefa" : "Nova tarefa";
    var resumo = f.quando === "repetir" ? descreverRegra(Object.assign({}, regraDoForm(f), { data_fim: null })) + (f.data_inicio ? ", começando em " + fmtDia(f.data_inicio) : "") + (f.data_fim ? " e terminando em " + fmtDia(f.data_fim) : "") : null;

    return h("div", { className: "ac-panel", role: "dialog", "aria-modal": "true", "aria-label": titulo },
      h("div", { className: "ac-head" },
        h("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
          h("button", { type: "button", className: "ac-icon-btn", "aria-label": "Voltar", onClick: p.onCancelar }, h(Ic, { n: "arrowLeft", size: 18 })),
          h("h2", { className: "ac-h1" }, titulo))),
      h("div", { className: "ac-panel-body" },
        ehRotina && h("div", { className: "ac-banner is-info" }, h(Ic, { n: "info", size: 16 }), h("div", null, "As mudanças valem para as próximas tarefas que a rotina criar. O que já foi criado não muda.")),
        ehOcorrencia && ed.recorrencia_id && h("div", { className: "ac-banner is-info" }, h(Ic, { n: "info", size: 16 }), h("div", null, "Esta tarefa veio de uma rotina. Editar aqui muda só esta tarefa, e não as próximas.")),

        h("div", { className: "ac-group" },
          h("div", { className: "ac-grid" },
            h(Campo, { id: "ac-titulo", rotulo: "Título", cheio: true }, h("input", { id: "ac-titulo", className: "ac-input", autoFocus: true, value: f.titulo, onChange: function (e) { set("titulo", e.target.value); }, placeholder: "Ex.: Conferir medicação da UTI", maxLength: 200 })),
            h(Campo, { id: "ac-desc", rotulo: "Descrição (opcional)", cheio: true }, h("textarea", { id: "ac-desc", className: "ac-textarea", value: f.descricao, onChange: function (e) { set("descricao", e.target.value); }, placeholder: "O que precisa ser feito, detalhes importantes…" })))),

        h("div", { className: "ac-group" },
          h("h3", { className: "ac-group-t" }, p.podeGerir ? "Quem faz" : "Prioridade"),
          h("div", { className: "ac-grid" },
            p.podeGerir && h(Campo, { id: "ac-resp", rotulo: "Responsável", cheio: true },
              h("select", { id: "ac-resp", className: "ac-select", value: f.responsavel_id, onChange: function (e) { set("responsavel_id", e.target.value); } },
                h("option", { value: "" }, "Sem responsável"),
                p.users.map(function (u) { return h("option", { key: u.id, value: u.id }, u.nome + (u.tipo ? " (" + u.tipo + " " + (u.coren || u.crm || "") + ")" : "")); }))),
            h(Campo, { id: "ac-pri", rotulo: p.podeGerir ? "Prioridade" : "Prioridade (opcional)", cheio: !p.podeGerir, dica: p.podeGerir ? "1 é a mais urgente." : "1 é a mais urgente. Esta tarefa será só sua." }, h("input", { id: "ac-pri", className: "ac-input", type: "number", min: 1, step: 1, value: f.prioridade, onChange: function (e) { set("prioridade", e.target.value); }, placeholder: "Opcional" })))),

        h("div", { className: "ac-group" },
          h("h3", { className: "ac-group-t" }, "Quando"),
          mostraQuando && h("div", { className: "ac-seg", role: "group", "aria-label": "Quando acontece", style: { marginBottom: 16 } },
            [["uma_vez", "Uma vez", "circleCheck"], ["programar", "Programar", "calendar"], ["repetir", "Repetir", "repeat"]].map(function (o) {
              return h("button", { key: o[0], type: "button", "aria-pressed": f.quando === o[0], onClick: function () { set("quando", o[0]); } }, h(Ic, { n: o[2], size: 15 }), o[1]);
            })),
          !mostraQuando && mostraProgramar && h("div", { className: "ac-seg", role: "group", "aria-label": "Quando aparece", style: { marginBottom: 16, gridTemplateColumns: "repeat(2,1fr)" } },
            [["uma_vez", "Já na lista", "circleCheck"], ["programar", "Programada", "calendar"]].map(function (o) {
              return h("button", { key: o[0], type: "button", "aria-pressed": f.quando === o[0], onClick: function () { set("quando", o[0]); } }, h(Ic, { n: o[2], size: 15 }), o[1]);
            })),

          f.quando === "uma_vez" && h("div", { className: "ac-grid" },
            h(Campo, { id: "ac-prazo", rotulo: "Prazo (opcional)", cheio: true, dica: "A tarefa aparece como atrasada depois desse horário." }, h("input", { id: "ac-prazo", className: "ac-input", type: "datetime-local", value: f.prazo, onChange: function (e) { set("prazo", e.target.value); } }))),

          f.quando === "programar" && h("div", { className: "ac-grid" },
            h(Campo, { id: "ac-disp", rotulo: "Aparece na lista em", dica: "Até esse dia ela fica guardada em “Programadas”." }, h("input", { id: "ac-disp", className: "ac-input", type: "date", min: isoAmanha(), value: f.disponivel_em, onChange: function (e) { set("disponivel_em", e.target.value); } })),
            h(Campo, { id: "ac-prazo2", rotulo: "Prazo (opcional)" }, h("input", { id: "ac-prazo2", className: "ac-input", type: "datetime-local", value: f.prazo, onChange: function (e) { set("prazo", e.target.value); } }))),

          f.quando === "repetir" && h("div", null,
            h("div", { className: "ac-grid" },
              h(Campo, { id: "ac-rep", rotulo: "Repete", cheio: true },
                h("select", { id: "ac-rep", className: "ac-select", value: f.rep, onChange: function (e) { set("rep", e.target.value); } },
                  h("option", { value: "diaria" }, "Todos os dias"),
                  h("option", { value: "uteis" }, "Dias úteis (segunda a sexta)"),
                  h("option", { value: "semanal" }, "Dias da semana que eu escolher"),
                  h("option", { value: "mensal" }, "Uma vez por mês"),
                  h("option", { value: "intervalo" }, "A cada alguns dias"))),
              f.rep === "semanal" && h("div", { className: "ac-full" }, h("span", { className: "ac-label" }, "Em quais dias"),
                h("div", { className: "ac-wd", role: "group", "aria-label": "Dias da semana" }, DIAS_INICIAL.map(function (ini, i) {
                  return h("button", { key: i, type: "button", "aria-pressed": f.dias_semana.indexOf(i) >= 0, title: DIAS_ABREV[i], "aria-label": DIAS_ABREV[i], onClick: function () { alternaDia(i); } }, ini);
                }))),
              f.rep === "mensal" && h(Campo, { id: "ac-dm", rotulo: "No dia do mês", cheio: true, dica: "Em meses mais curtos, vale o último dia." }, h("input", { id: "ac-dm", className: "ac-input", type: "number", min: 1, max: 31, value: f.dia_mes, onChange: function (e) { set("dia_mes", e.target.value); } })),
              f.rep === "intervalo" && h(Campo, { id: "ac-iv", rotulo: "De quantos em quantos dias", cheio: true, dica: "Contando a partir do dia em que a rotina começa." }, h("input", { id: "ac-iv", className: "ac-input", type: "number", min: 1, max: 365, value: f.intervalo_dias, onChange: function (e) { set("intervalo_dias", e.target.value); } })),
              h(Campo, { id: "ac-di", rotulo: "Começa em" }, h("input", { id: "ac-di", className: "ac-input", type: "date", value: f.data_inicio, onChange: function (e) { set("data_inicio", e.target.value); } })),
              h(Campo, { id: "ac-df", rotulo: "Termina em (opcional)" }, h("input", { id: "ac-df", className: "ac-input", type: "date", min: f.data_inicio || undefined, value: f.data_fim, onChange: function (e) { set("data_fim", e.target.value); } })),
              h(Campo, { id: "ac-hp", rotulo: "Horário limite (opcional)", cheio: true, dica: "Sem horário, a tarefa vale até o fim do dia." }, h("input", { id: "ac-hp", className: "ac-input", type: "time", value: f.hora_prazo, onChange: function (e) { set("hora_prazo", e.target.value); } }))),
            h("div", { className: "ac-resumo" }, h(Ic, { n: "repeat", size: 16 }), resumo)))
      ),
      h("div", { className: "ac-panel-foot" },
        erro && h("span", { className: "ac-form-err", role: "alert" }, erro),
        h("button", { type: "button", className: "ac-btn ac-btn--ghost", onClick: p.onCancelar, disabled: salvando }, "Cancelar"),
        h("button", { type: "button", className: "ac-btn ac-btn--primary", onClick: enviar, disabled: salvando }, salvando ? "Salvando…" : ed ? "Salvar alterações" : f.quando === "repetir" ? "Criar rotina" : f.quando === "programar" ? "Programar tarefa" : "Criar tarefa"))
    );
  }

  /* ───────────────────────── tela principal ───────────────────────── */
  function AcoesEnfermagem(props) {
    var currentUser = props.currentUser, userId = props.userId, onClose = props.onClose;
    var isAdmin = !!(currentUser && currentUser.role === "admin");
    var podeGerir = isAdmin || !!(currentUser && currentUser.can_acoes);
    var meuId = currentUser && currentUser.id;

    var sAcoes = React.useState([]), acoes = sAcoes[0], setAcoes = sAcoes[1];
    var sRot = React.useState([]), rotinas = sRot[0], setRotinas = sRot[1];
    var sUsers = React.useState([]), users = sUsers[0], setUsers = sUsers[1];
    var sLoad = React.useState(true), loading = sLoad[0], setLoading = sLoad[1];
    var sErroLoad = React.useState(""), erroLoad = sErroLoad[0], setErroLoad = sErroLoad[1];
    var sAba = React.useState("minhas"), aba = sAba[0], setAba = sAba[1];
    var sForm = React.useState(null), form = sForm[0], setForm = sForm[1];      // { modo:'tarefa'|'rotina', editando }
    var sToast = React.useState(null), toast = sToast[0], setToast = sToast[1];
    var sConf = React.useState(null), conf = sConf[0], setConf = sConf[1];
    var sFiltro = React.useState(""), filtroResp = sFiltro[0], setFiltroResp = sFiltro[1];
    var sAbertas = React.useState({ programadas: false }), abertas = sAbertas[0], setAbertas = sAbertas[1];
    var vivo = React.useRef(true);
    var toastTimer = React.useRef(null);

    injetarCSS();

    function avisar(msg, tipo) {
      setToast({ msg: msg, tipo: tipo || "ok" });
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(function () { if (vivo.current) setToast(null); }, 4000);
    }

    async function getJSON(path) {
      var r = await fetch(SB_URL + "/rest/v1/" + path, { headers: H() });
      if (!r.ok) throw new Error("Falha ao carregar (" + r.status + ")");
      return r.json();
    }
    async function callFn(body) {
      var r = await fetch(FN_URL + "/acoes-write", { method: "POST", headers: H(userId), body: JSON.stringify(body) });
      var d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erro");
      return d;
    }

    /* Quem não gerencia só baixa as próprias tarefas. Quem gerencia baixa todas.
       Tarefas em aberto vêm completas (sem limite que corte); concluídas, as 100 mais recentes. */
    async function carregar() {
      var filtro = !podeGerir && meuId ? "&responsavel_id=eq." + meuId : "";
      try {
        var res = await Promise.all([
          getJSON("acoes_enfermagem?status=in.(agendada,pendente,iniciada,pausada)&order=prioridade.asc.nullslast,created_at.asc&limit=1000" + filtro),
          getJSON("acoes_enfermagem?status=eq.concluida&order=concluida_em.desc.nullslast&limit=100" + filtro)
        ]);
        if (!vivo.current) return;
        setAcoes((Array.isArray(res[0]) ? res[0] : []).concat(Array.isArray(res[1]) ? res[1] : []));
        setErroLoad("");
      } catch (e) {
        if (vivo.current) setErroLoad(e.message || "Não foi possível carregar as tarefas.");
      }
      try { var rr = await getJSON("acoes_recorrentes?order=created_at.asc&limit=300" + filtro); if (vivo.current && Array.isArray(rr)) setRotinas(rr); } catch (e) { /* tabela ainda não criada: aba Rotinas fica vazia */ }
      if (vivo.current) setLoading(false);
    }

    React.useEffect(function () {
      vivo.current = true;
      (async function () {
        await carregar();
        try { var g = await callFn({ action: "gerar" }); if (g && (g.criadas || g.liberadas)) await carregar(); } catch (e) { /* função antiga ou sem rotinas: segue sem gerar */ }
      })();
      (async function () { try { var u = await sbGet("users", "status=eq.aprovado&order=nome.asc"); if (vivo.current && Array.isArray(u)) setUsers(u); } catch (e) {} })();
      return function () { vivo.current = false; clearTimeout(toastTimer.current); };
    }, []);

    React.useEffect(function () {
      function tecla(e) {
        if (e.key !== "Escape") return;
        if (conf) setConf(null); else if (form) setForm(null); else onClose();
      }
      document.addEventListener("keydown", tecla);
      return function () { document.removeEventListener("keydown", tecla); };
    }, [conf, form]);

    function aplicar(row) {
      setAcoes(function (l) { return l.some(function (x) { return x.id === row.id; }) ? l.map(function (x) { return x.id === row.id ? row : x; }) : l.concat([row]); });
    }
    async function acaoTarefa(a, action, okMsg) {
      try { aplicar(await callFn({ action: action, id: a.id })); avisar(okMsg); }
      catch (ex) { avisar(ex.message, "err"); }
    }
    function concluir(a) { return acaoTarefa(a, "concluir", "Tarefa concluída."); }
    function iniciar(a) { return acaoTarefa(a, "iniciar", "Tarefa iniciada."); }
    function pausar(a) { return acaoTarefa(a, "pausar", "Tarefa pausada."); }
    function reabrir(a) { return acaoTarefa(a, "reabrir", "Tarefa reaberta."); }

    function excluirTarefa(a) {
      setConf({ titulo: "Excluir tarefa?", msg: "“" + a.titulo + "” será removida para todos. Isso não pode ser desfeito.", acao: "Excluir", onOk: async function () {
        try { await callFn({ action: "delete", id: a.id }); setAcoes(function (l) { return l.filter(function (x) { return x.id !== a.id; }); }); avisar("Tarefa excluída."); }
        catch (ex) { avisar(ex.message, "err"); }
      } });
    }
    function excluirRotina(r) {
      setConf({ titulo: "Excluir rotina?", msg: "“" + r.titulo + "” deixa de criar tarefas. As tarefas que ela já criou continuam na lista.", acao: "Excluir", onOk: async function () {
        try { await callFn({ action: "rotina_delete", id: r.id }); setRotinas(function (l) { return l.filter(function (x) { return x.id !== r.id; }); }); avisar("Rotina excluída."); }
        catch (ex) { avisar(ex.message, "err"); }
      } });
    }
    async function ativarRotina(r) {
      try {
        var nova = await callFn({ action: "rotina_ativar", id: r.id, body: { ativa: !r.ativa } });
        setRotinas(function (l) { return l.map(function (x) { return x.id === nova.id ? nova : x; }); });
        avisar(nova.ativa ? "Rotina retomada." : "Rotina pausada.");
        if (nova.ativa) { try { await callFn({ action: "gerar" }); await carregar(); } catch (e) {} }
      } catch (ex) { avisar(ex.message, "err"); }
    }

    /* Devolve um texto de erro (fica no formulário) ou nada (deu certo e fecha). */
    async function salvar(tipo, corpo) {
      var ed = form.editando;
      if (!podeGerir) corpo.responsavel_id = meuId || null;   // sem permissão de gerência: sempre para si mesmo
      if (tipo === "tarefa") {
        /* A prioridade vale por pessoa entre tarefas avulsas em aberto (rotinas e programadas ficam de fora da regra). */
        if (corpo.prioridade && corpo.responsavel_id) {
          var conflito = acoes.find(function (a) {
            return a.responsavel_id === corpo.responsavel_id && a.prioridade === corpo.prioridade && !a.recorrencia_id &&
              (a.status === "pendente" || a.status === "iniciada" || a.status === "pausada") && (!ed || a.id !== ed.id);
          });
          if (conflito) return "A prioridade P" + corpo.prioridade + " já está em uso por " + (conflito.responsavel_nome || "essa pessoa") + ". Escolha outra.";
        }
        try {
          var row = ed ? await callFn({ action: "update", id: ed.id, body: corpo }) : await callFn({ action: "create", body: corpo });
          aplicar(row);
          setForm(null);
          avisar(ed ? "Tarefa atualizada." : row.status === "agendada" ? "Tarefa programada para " + fmtDia(row.disponivel_em) + "." : "Tarefa criada.");
          if (!ed && row.status === "agendada") setAba("minhas");
        } catch (ex) { return ex.message; }
        return;
      }
      try {
        var rot = ed ? await callFn({ action: "rotina_update", id: ed.id, body: corpo }) : await callFn({ action: "rotina_create", body: corpo });
        setRotinas(function (l) { return l.some(function (x) { return x.id === rot.id; }) ? l.map(function (x) { return x.id === rot.id ? rot : x; }) : l.concat([rot]); });
        setForm(null);
        avisar(ed ? "Rotina atualizada." : "Rotina criada.");
        try { await callFn({ action: "gerar" }); await carregar(); } catch (e) {}
        if (!ed) setAba("rotinas");
      } catch (ex) { return ex.message; }
    }

    /* ── dados derivados ── */
    var ativas = acoes.filter(function (a) { return a.status !== "concluida"; });
    var concluidas = acoes.filter(function (a) { return a.status === "concluida"; }).sort(function (a, b) { return new Date(b.concluida_em || 0) - new Date(a.concluida_em || 0); });
    var minhas = ativas.filter(function (a) { return podeGerir ? a.responsavel_id === meuId : true; });
    var grupos = { atrasadas: [], hoje: [], proximas: [], sem_prazo: [], programadas: [] };
    minhas.forEach(function (a) { grupos[secaoDe(a)].push(a); });
    Object.keys(grupos).forEach(function (k) { grupos[k].sort(ordenar); });
    var minhasAbertas = minhas.filter(function (a) { return a.status !== "agendada"; }).length;

    var equipeAtiva = ativas.filter(function (a) { return a.status !== "agendada" && (!filtroResp || (filtroResp === "_sem" ? !a.responsavel_id : a.responsavel_id === filtroResp)); });
    var porPessoa = {};
    equipeAtiva.forEach(function (a) { var n = a.responsavel_nome || "Sem responsável"; (porPessoa[n] = porPessoa[n] || []).push(a); });
    var nomesEquipe = Object.keys(porPessoa).sort(function (a, b) { return a === "Sem responsável" ? 1 : b === "Sem responsável" ? -1 : a.localeCompare(b, "pt-BR"); });
    var programadasEquipe = ativas.filter(function (a) { return a.status === "agendada"; }).sort(function (a, b) { return String(a.disponivel_em).localeCompare(String(b.disponivel_em)); });
    var atrasadasTotal = minhas.filter(function (a) { return secaoDe(a) === "atrasadas"; }).length;

    /* Gerência edita tudo. As demais pessoas só editam o que elas mesmas criaram para si. */
    function podeEditar(x) { return podeGerir || (!!meuId && x.criada_por_id === meuId && x.responsavel_id === meuId); }

    var ctx = { meuId: meuId, podeGerir: podeGerir, podeEditar: podeEditar, concluir: concluir, iniciar: iniciar, pausar: pausar,
      editar: function (a) { setForm({ modo: "tarefa", editando: a }); }, excluir: excluirTarefa, mostrarResp: false };
    var ctxEquipe = Object.assign({}, ctx, { mostrarResp: false });
    var ctxProg = Object.assign({}, ctx, { mostrarResp: true });

    var botaoNova = h("button", { type: "button", className: "ac-btn ac-btn--primary", onClick: function () { setForm({ modo: "tarefa", editando: null }); } }, h(Ic, { n: "plus", size: 16 }), h("span", { className: "ac-btn-label" }, "Nova tarefa"));

    function tab(id, rotulo, n, tomErr) {
      return h("button", { key: id, type: "button", role: "tab", "aria-selected": aba === id, className: "ac-tab", onClick: function () { setAba(id); } }, rotulo,
        n != null && h("span", { className: "ac-count" + (tomErr ? " is-err" : "") }, n));
    }

    var subtitulo = loading ? "Carregando suas tarefas…" :
      minhasAbertas === 0 ? "Nada pendente para você agora." :
      plural(minhasAbertas, "tarefa em aberto", "tarefas em aberto") + (atrasadasTotal ? " · " + plural(atrasadasTotal, "atrasada", "atrasadas") : "");

    /* ── conteúdo de cada aba ── */
    var conteudo;
    if (loading) conteudo = h(Esqueleto);
    else if (erroLoad && !acoes.length) conteudo = h(Vazio, { icone: "alert", titulo: "Não foi possível carregar", texto: erroLoad, acao: h("button", { type: "button", className: "ac-btn ac-btn--secondary", onClick: function () { setLoading(true); carregar(); } }, "Tentar de novo") });
    else if (aba === "minhas") {
      var tudoVazio = !minhas.length;
      conteudo = tudoVazio
        ? h(Vazio, { icone: "circleCheck", titulo: "Tudo em dia", texto: "Você não tem tarefas em aberto. Crie uma tarefa para você, programe para depois ou monte uma rotina.", acao: botaoNova })
        : h("div", null,
            grupos.atrasadas.length > 0 && h(Secao, { titulo: "Atrasadas", tom: "err", itens: grupos.atrasadas }, grupos.atrasadas.map(function (a) { return h(CartaoTarefa, { key: a.id, a: a, ctx: ctx }); })),
            grupos.hoje.length > 0 && h(Secao, { titulo: "Hoje", itens: grupos.hoje }, grupos.hoje.map(function (a) { return h(CartaoTarefa, { key: a.id, a: a, ctx: ctx }); })),
            grupos.proximas.length > 0 && h(Secao, { titulo: "Próximos dias", itens: grupos.proximas }, grupos.proximas.map(function (a) { return h(CartaoTarefa, { key: a.id, a: a, ctx: ctx }); })),
            grupos.sem_prazo.length > 0 && h(Secao, { titulo: "Sem prazo", itens: grupos.sem_prazo }, grupos.sem_prazo.map(function (a) { return h(CartaoTarefa, { key: a.id, a: a, ctx: ctx }); })),
            grupos.programadas.length > 0 && h(Secao, { titulo: "Programadas", itens: grupos.programadas, recolhivel: true, aberta: !!abertas.programadas, onToggle: function () { setAbertas(function (o) { return Object.assign({}, o, { programadas: !o.programadas }); }); } },
              grupos.programadas.sort(function (a, b) { return String(a.disponivel_em).localeCompare(String(b.disponivel_em)); }).map(function (a) { return h(CartaoTarefa, { key: a.id, a: a, ctx: ctx }); })));
    }
    else if (aba === "equipe") {
      conteudo = h("div", null,
        h("div", { className: "ac-filter" }, h("select", { className: "ac-select", "aria-label": "Filtrar por pessoa", value: filtroResp, onChange: function (e) { setFiltroResp(e.target.value); } },
          h("option", { value: "" }, "Toda a equipe"), h("option", { value: "_sem" }, "Sem responsável"),
          users.map(function (u) { return h("option", { key: u.id, value: u.id }, u.nome); }))),
        !nomesEquipe.length && h(Vazio, { icone: "user", titulo: "Nenhuma tarefa em aberto", texto: "Quando alguém da equipe tiver tarefas, elas aparecem aqui, agrupadas por pessoa.", acao: botaoNova || null }),
        nomesEquipe.map(function (nome) {
          var itens = porPessoa[nome].slice().sort(ordenar);
          var atr = itens.filter(function (a) { return secaoDe(a) === "atrasadas"; }).length;
          return h("section", { key: nome, className: "ac-sec" },
            h("div", { className: "ac-person" }, h("span", { className: "ac-avatar" }, nome === "Sem responsável" ? "?" : iniciais(nome)), h("span", { className: "ac-person-n" }, nome),
              h("span", { className: "ac-count" }, itens.length), atr > 0 && h(Chip, { tom: "err" }, plural(atr, "atrasada", "atrasadas"))),
            h("div", { className: "ac-list" }, itens.map(function (a) { return h(CartaoTarefa, { key: a.id, a: a, ctx: ctxEquipe }); })));
        }),
        programadasEquipe.length > 0 && !filtroResp && h(Secao, { titulo: "Programadas", itens: programadasEquipe, recolhivel: true, aberta: !!abertas.programadas, onToggle: function () { setAbertas(function (o) { return Object.assign({}, o, { programadas: !o.programadas }); }); } },
          programadasEquipe.map(function (a) { return h(CartaoTarefa, { key: a.id, a: a, ctx: ctxProg }); })));
    }
    else if (aba === "rotinas") {
      conteudo = h("div", null,
        h("div", { className: "ac-banner is-info" }, h(Ic, { n: "info", size: 16 }), h("div", null, podeGerir ? "Cada rotina cria sozinha uma tarefa no dia combinado para o responsável, mesmo com o app fechado." : "Cada rotina cria sozinha uma tarefa no dia combinado para você, mesmo com o app fechado.")),
        !rotinas.length
          ? h(Vazio, { icone: "repeat", titulo: "Nenhuma rotina ainda", texto: "Use rotinas para o que se repete: passagem de plantão, conferência de carrinho de emergência, checagem de materiais…", acao: h("button", { type: "button", className: "ac-btn ac-btn--primary", onClick: function () { setForm({ modo: "tarefa", editando: null, quandoInicial: "repetir" }); } }, h(Ic, { n: "plus", size: 16 }), "Criar rotina") })
          : h("div", { className: "ac-list" }, rotinas.map(function (r) { return h(CartaoRotina, { key: r.id, r: r, podeEditar: podeEditar(r), ativar: ativarRotina, editar: function (x) { setForm({ modo: "rotina", editando: x }); }, excluir: excluirRotina }); })));
    }
    else {
      var porDia = [];
      concluidas.forEach(function (a) {
        var dia = a.concluida_em ? isoDe(new Date(a.concluida_em)) : "";
        var ult = porDia[porDia.length - 1];
        if (!ult || ult.dia !== dia) { ult = { dia: dia, itens: [] }; porDia.push(ult); }
        ult.itens.push(a);
      });
      conteudo = !concluidas.length
        ? h(Vazio, { icone: "listChecks", titulo: "Nada concluído ainda", texto: "As tarefas concluídas aparecem aqui, as 100 mais recentes." })
        : h("div", null, porDia.map(function (g) {
            var rot = g.dia === isoHoje() ? "Hoje" : g.dia === isoOntem() ? "Ontem" : g.dia ? fmtDia(g.dia) : "Sem data";
            return h("section", { key: g.dia },
              h("h3", { className: "ac-done-day" }, rot),
              h("div", { className: "ac-list" }, g.itens.map(function (a) {
                return h("div", { key: a.id, className: "ac-done" },
                  h("span", { className: "ac-done-ic" }, h(Ic, { n: "check", size: 14 })),
                  h("div", { style: { flex: 1, minWidth: 0 } },
                    h("h4", { className: "ac-title" }, a.titulo),
                    h("div", { className: "ac-done-meta" }, [(podeGerir && a.responsavel_nome) ? a.responsavel_nome : null, a.concluida_por_nome ? "concluída por " + a.concluida_por_nome : null, a.concluida_em ? fmtHora(new Date(a.concluida_em)) : null, a.tempo_min > 0 ? fmtTempo(a.tempo_min) : null].filter(Boolean).join(" · "))),
                  podeEditar(a) && h("button", { type: "button", className: "ac-btn ac-btn--ghost ac-btn--sm", onClick: function () { reabrir(a); } }, h(Ic, { n: "undo", size: 13 }), "Reabrir"));
              })));
          }));
    }

    var contAbertasEquipe = ativas.filter(function (a) { return a.status !== "agendada"; }).length;

    return h("div", { className: "ac-root ac-overlay", onMouseDown: function (e) { if (e.target === e.currentTarget && !form && !conf) onClose(); } },
      h("div", { className: "ac-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "ac-h1" },
        h("header", { className: "ac-head" },
          h("div", null, h("h2", { className: "ac-h1", id: "ac-h1" }, "Ações de Enfermagem"), h("p", { className: "ac-sub" }, subtitulo)),
          h("div", { className: "ac-head-act" }, botaoNova,
            h("button", { type: "button", className: "ac-icon-btn", "aria-label": "Fechar", onClick: onClose }, h(Ic, { n: "x", size: 20 })))),
        h("nav", { className: "ac-tabs", role: "tablist", "aria-label": "Visões" },
          tab("minhas", "Minhas", minhasAbertas, atrasadasTotal > 0),
          podeGerir && tab("equipe", "Equipe", contAbertasEquipe),
          tab("rotinas", "Rotinas", rotinas.length),
          tab("concluidas", "Concluídas", concluidas.length)),
        h("div", { className: "ac-body", role: "tabpanel" }, conteudo),
        form && h(Formulario, { key: (form.editando ? form.editando.id : "nova") + form.modo, modo: form.modo, editando: form.editando, quandoInicial: form.quandoInicial, users: users, podeGerir: podeGerir, onSalvar: salvar, onCancelar: function () { setForm(null); } }),
        conf && h("div", { className: "ac-confirm", onMouseDown: function (e) { if (e.target === e.currentTarget) setConf(null); } },
          h("div", { className: "ac-confirm-box", role: "alertdialog", "aria-modal": "true", "aria-labelledby": "ac-conf-t" },
            h("h3", { id: "ac-conf-t" }, conf.titulo), h("p", null, conf.msg),
            h("div", null,
              h("button", { type: "button", className: "ac-btn ac-btn--ghost", onClick: function () { setConf(null); } }, "Cancelar"),
              h("button", { type: "button", className: "ac-btn ac-btn--danger", onClick: function () { var f = conf.onOk; setConf(null); f(); } }, conf.acao)))),
        toast && h("div", { className: "ac-toast" + (toast.tipo === "err" ? " is-err" : ""), role: "status" }, h(Ic, { n: toast.tipo === "err" ? "alert" : "check", size: 16 }), toast.msg)
      )
    );
  }

  window.AcoesEnfermagem = AcoesEnfermagem;
})();
