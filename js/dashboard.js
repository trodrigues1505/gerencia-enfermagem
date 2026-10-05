/* ─── DASHBOARD ─── */
/* Efeito de passar o mouse nos cartões clicáveis (injetado aqui para não depender do css/app.css). */
(function () {
  if (typeof document === "undefined" || document.getElementById("ge-dash-css")) return;
  const st = document.createElement("style");
  st.id = "ge-dash-css";
  st.textContent = ".ge-click:hover{box-shadow:0 4px 14px rgba(15,23,42,.08);transform:translateY(-1px)}" +
                   ".ge-click:focus-visible{outline:2px solid #3B82F6;outline-offset:2px}";
  document.head.appendChild(st);
})();

/* ═══════════════════════════════════════════════════════════════════════════════
   SISTEMA VISUAL DO PAINEL (redesenho out/2026)
   Só a aparência mudou: as contas, as regras de dados e os nomes dos campos continuam os de antes.
   Cores, espaços e raios ficam em variáveis (.dsh); componentes usam classes `dsh-*`.
   Espaçamento: 4 · 8 · 12 · 16 · 24 · 32 · 48.   Raios: cartão 16 · campo 12 · pequeno 8.
   ═══════════════════════════════════════════════════════════════════════════════ */
const DASH_CSS_BASE = `
.dsh{--ink:#0F172A;--ink2:#334155;--muted:#64748B;--faint:#94A3B8;--line:#E8EDF3;--line2:#F1F5F9;--bg:#F8FAFC;--accent:#2563EB;
  --ok:#15803D;--okbg:#DCFCE7;--warn:#B45309;--warnbg:#FEF3C7;--warnline:#FDE68A;--bad:#B91C1C;--badbg:#FEE2E2;
  --s1:4px;--s2:8px;--s3:12px;--s4:16px;--s5:24px;--s6:32px;--s7:48px;--rc:16px;--ri:12px;--rs:8px;
  font-family:Inter,Geist,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
.dsh *,.dsh *::before,.dsh *::after{box-sizing:border-box}
.dsh button,.dsh input,.dsh select,.dsh textarea{font-family:inherit}
.dsh :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.dsh-num{font-variant-numeric:tabular-nums}
.dsh h2,.dsh h3{margin:0}

/* cartões */
.dsh-card{background:#fff;border:1px solid var(--line);border-radius:var(--rc);padding:var(--s5);margin-bottom:var(--s4);box-shadow:0 1px 2px rgba(15,23,42,.03)}
.dsh-card .dsh-card{background:var(--bg);border-color:transparent;box-shadow:none;padding:var(--s4);margin-bottom:0;border-radius:var(--ri)}
.dsh-click{cursor:pointer;transition:box-shadow .18s,transform .18s,border-color .18s,background .18s}
.dsh-click:hover{box-shadow:0 6px 18px rgba(15,23,42,.08);transform:translateY(-1px)}
.dsh-card .dsh-click:hover{background:#fff;border-color:var(--line)}
.dsh-card--warn{background:#FFFDF5;border-color:var(--warnline)}
.dsh-grid{display:grid;gap:var(--s4);margin-bottom:var(--s4)}
.dsh-grid>.dsh-card{margin-bottom:0}
.dsh-grid--tight{gap:var(--s3)}
.dsh-g2{grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))}
.dsh-g3{grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.dsh-g4{grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))}
.dsh-g-fila{grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));margin-bottom:0}
.dsh-sep{height:1px;background:var(--line2);margin:var(--s4) 0}
.dsh-stack>*+*{margin-top:var(--s4)}

/* títulos */
.dsh-title{display:flex;align-items:center;justify-content:space-between;gap:var(--s3);margin-bottom:var(--s4);flex-wrap:wrap}
.dsh-title__t{display:flex;align-items:center;gap:var(--s2);font-size:15px;font-weight:650;letter-spacing:-.01em;color:var(--ink)}
.dsh-title__icon{width:28px;height:28px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;background:var(--line2);color:var(--ink2);flex-shrink:0}
.dsh-title__x{font-size:12px;color:var(--muted)}
.dsh-sub{font-size:12px;color:var(--muted);line-height:1.5}
.dsh-eyebrow{font-size:11px;font-weight:650;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}

/* números de destaque */
.dsh-kpi{position:relative;overflow:hidden}
.dsh-kpi__bar{position:absolute;left:0;right:0;top:0;height:3px}
.dsh-kpi__l{display:flex;align-items:center;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:var(--s2)}
.dsh-kpi__v{font-size:30px;font-weight:700;line-height:1.05;letter-spacing:-.02em}
.dsh-kpi__s{font-size:12px;color:var(--muted);margin-top:var(--s2);line-height:1.45}
.dsh-card.dsh-kpi--alert{background:#FFFBEB;border-color:var(--warnline)}
.dsh-card.dsh-kpi--on{box-shadow:0 0 0 2px var(--kc,var(--ink));border-color:transparent}
.dsh-big{font-size:40px;font-weight:700;letter-spacing:-.03em;line-height:1}

/* chips e etiquetas */
.dsh-chip{text-transform:none;letter-spacing:normal;display:inline-flex;align-items:center;gap:6px;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600;background:var(--line2);color:var(--ink2);white-space:nowrap;line-height:1.6}
.dsh-chip--ok{background:var(--okbg);color:var(--ok)}
.dsh-chip--warn{background:var(--warnbg);color:var(--warn)}
.dsh-chip--bad{background:var(--badbg);color:var(--bad)}
.dsh-tag{display:inline-block;margin-left:6px;padding:0 6px;border-radius:6px;font-size:10.5px;font-weight:700;background:#F5F3FF;color:#6D28D9;vertical-align:middle;line-height:1.6}
.dsh-tag--warn{background:var(--warnbg);color:var(--warn)}
.dsh-dot{width:9px;height:9px;border-radius:99px;display:inline-block;flex-shrink:0}
.dsh-live{width:8px;height:8px;border-radius:99px;background:#22C55E;display:inline-block;animation:dshPulse 2s infinite}
@keyframes dshPulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}70%{box-shadow:0 0 0 7px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}
.dsh-gchip{display:inline-block;padding:1px 9px;border-radius:99px;font-size:11px;font-weight:700;border:1px solid transparent;white-space:nowrap}

/* botões */
.dsh-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:36px;padding:0 14px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--ink2);font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s,color .15s,transform .1s;white-space:nowrap;text-decoration:none}
.dsh-btn:hover{background:var(--bg);border-color:#CBD5E1}
.dsh-btn:active{transform:translateY(1px)}
.dsh-btn:disabled{opacity:.55;cursor:default}
.dsh-btn--primary{background:var(--ink);border-color:var(--ink);color:#fff}
.dsh-btn--primary:hover{background:#1E293B;border-color:#1E293B}
.dsh-btn--ghost{border-color:transparent;background:transparent}
.dsh-btn--ghost:hover{background:var(--line2);border-color:transparent}
.dsh-btn--sm{height:30px;padding:0 10px;font-size:12px;border-radius:8px}
.dsh-btn--danger{color:var(--bad)}
.dsh-btn--danger:hover{background:var(--badbg);border-color:transparent}
.dsh-x{width:32px;height:32px;border-radius:10px;border:0;background:transparent;color:var(--muted);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
.dsh-x:hover{background:var(--line2);color:var(--ink)}
.dsh-link{font-size:12px;font-weight:650;color:var(--warn);text-decoration:none;white-space:nowrap;display:inline-flex;align-items:center;gap:4px}
.dsh-link:hover{text-decoration:underline}

/* controles segmentados */
.dsh-seg{display:inline-flex;gap:2px;background:var(--line2);padding:3px;border-radius:12px;flex-wrap:wrap}
.dsh-seg button{border:0;background:transparent;height:30px;padding:0 12px;border-radius:9px;font-size:13px;font-weight:550;color:var(--muted);cursor:pointer;transition:background .15s,color .15s,box-shadow .15s;white-space:nowrap}
.dsh-seg button:hover:not(:disabled){color:var(--ink)}
.dsh-seg button[aria-pressed="true"]{background:#fff;color:var(--ink);font-weight:650;box-shadow:0 1px 3px rgba(15,23,42,.12)}
.dsh-seg button:disabled{color:#CBD5E1;cursor:not-allowed}
.dsh-seg--sm button{height:26px;padding:0 10px;font-size:12px}
.dsh-in{height:34px;padding:0 10px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);font-size:13px}
.dsh-in:hover{border-color:#CBD5E1}

/* barra de ferramentas */
.dsh-bar-tools{display:flex;align-items:center;gap:var(--s3);flex-wrap:wrap;margin-bottom:var(--s4)}
.dsh-bar-tools__sp{flex:1 1 auto}
.dsh-resumo{font-size:12px;color:var(--muted)}
.dsh-aviso{font-size:13px;color:#92400E;background:#FFFBEB;border:1px solid var(--warnline);border-radius:var(--ri);padding:var(--s3) var(--s4);margin-bottom:var(--s4);line-height:1.55}
.dsh-nota{font-size:12px;color:var(--muted);line-height:1.6}
.dsh-nota--warn{color:var(--warn)}
.dsh-banner{display:flex;gap:var(--s3);align-items:flex-start;padding:var(--s3) var(--s4);background:#FFFBEB;border:1px solid var(--warnline);border-radius:var(--ri);font-size:12.5px;color:#78350F;line-height:1.6}
.dsh-banner svg{margin-top:3px;color:var(--warn)}
.dsh-estado{padding:var(--s7);text-align:center;color:var(--muted);font-size:14px}
.dsh-vazio{display:flex;flex-direction:column;align-items:center;gap:var(--s2);padding:var(--s5) var(--s4);color:var(--faint);font-size:13px;text-align:center}
.dsh-vazio--ok{color:var(--ok)}

/* abas das seções */
.dsh-tabs{display:flex;gap:var(--s1);overflow-x:auto;padding:4px;background:#fff;border:1px solid var(--line);border-radius:16px;margin-bottom:var(--s5);scrollbar-width:none}
.dsh-tabs::-webkit-scrollbar{display:none}
.dsh-tab{flex:1 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:var(--s2);height:40px;padding:0 var(--s4);border:0;border-radius:12px;background:transparent;color:var(--muted);font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}
.dsh-tab:hover{background:var(--bg);color:var(--ink)}
.dsh-tab[aria-selected="true"]{background:var(--ink);color:#fff}
.dsh-tab__n{min-width:20px;height:20px;padding:0 6px;border-radius:99px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;background:var(--line2);color:var(--ink2)}
.dsh-tab[aria-selected="true"] .dsh-tab__n{background:rgba(255,255,255,.22);color:#fff}
.dsh-tab__n--warn{background:var(--warnbg);color:var(--warn)}
.dsh-sec__h{margin:0 0 var(--s4)}
.dsh-sec__t{font-size:20px;font-weight:700;letter-spacing:-.02em}
.dsh-sec__s{font-size:13px;color:var(--muted);margin-top:2px}

/* barras */
.dsh-track{height:8px;border-radius:99px;background:var(--line);overflow:hidden}
.dsh-track>i{display:block;height:100%;border-radius:99px;transition:width .75s cubic-bezier(.22,.9,.3,1)}
.dsh-track--sm{height:5px}
.dsh-track--lg{height:12px}
.dsh-bar{display:flex;gap:2px;height:12px;border-radius:99px;overflow:hidden;background:var(--line)}
.dsh-bar--lg{height:22px}
.dsh-bar--sm{height:6px}
.dsh-bar__seg{height:100%;min-width:0;display:flex;align-items:center;justify-content:center;transition:width .8s cubic-bezier(.22,.9,.3,1);overflow:hidden}
.dsh-bar__in{font-size:11px;font-weight:700;color:#fff;white-space:nowrap;padding:0 4px}
.dsh-leg{display:flex;flex-wrap:wrap;gap:var(--s2) var(--s4);margin-top:var(--s3)}
.dsh-leg__i{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--ink2)}
.dsh-leg__l{color:var(--muted)}
.dsh-leg__p{color:var(--faint);font-size:12px}
.dsh-barra{margin-bottom:var(--s3)}
.dsh-barra:last-child{margin-bottom:0}
.dsh-barra__top{display:flex;justify-content:space-between;align-items:baseline;gap:var(--s2);margin-bottom:6px}
.dsh-barra__l{font-size:13px;color:var(--ink2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-barra__v{font-size:13px;font-weight:650;color:var(--ink);white-space:nowrap}
.dsh-barra__p{color:var(--faint);font-weight:500}
.dsh-rosca{position:relative;flex-shrink:0}
.dsh-rosca__c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1}
.dsh-rosca__c b{font-size:24px;letter-spacing:-.02em}
.dsh-rosca__c span{font-size:11px;color:var(--muted);margin-top:2px}
.dsh-rosca-box{display:flex;align-items:center;gap:var(--s5);flex-wrap:wrap}
.dsh-rosca-box>.dsh-lista-leg{flex:1 1 180px;min-width:0}
.dsh-lista-leg>div{display:flex;align-items:center;gap:var(--s2);padding:6px 0;font-size:13px}
.dsh-lista-leg>div+div{border-top:1px solid var(--line2)}
.dsh-lista-leg .dsh-lista-leg__n{flex:1;color:var(--ink2);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-metabar__box{position:relative;padding-top:6px}
.dsh-metabar__fill{display:flex;height:10px;border-radius:99px;overflow:hidden;background:var(--line)}
.dsh-metabar__fill>div{transition:width .8s cubic-bezier(.22,.9,.3,1)}
.dsh-metabar__meta{position:absolute;top:0;width:2px;height:22px;background:var(--ink);border-radius:2px;transform:translateX(-1px)}
.dsh-metabar__t{font-size:12px;color:var(--muted);margin-top:6px}

/* linhas de lista */
.dsh-list{list-style:none;margin:0;padding:0}
.dsh-list__i{padding:var(--s3) 0;border-top:1px solid var(--line2)}
.dsh-list__i:first-child{border-top:0}
.dsh-list__top{display:flex;justify-content:space-between;align-items:center;gap:var(--s2);flex-wrap:wrap}
.dsh-list__n{font-size:14px;font-weight:650;color:var(--ink)}
.dsh-list__m{font-size:12px;color:var(--muted);margin-top:2px;line-height:1.55}
.dsh-list__m b{font-weight:600;color:var(--ink2)}
.dsh-list__m--warn{color:var(--warn)}
.dsh-pill-link{display:flex;align-items:center;gap:var(--s3);flex-wrap:wrap;padding:var(--s2) var(--s3);margin:0 calc(var(--s3) * -1);border-radius:10px;text-decoration:none;color:var(--ink2);font-size:13px;transition:background .15s}
a.dsh-pill-link:hover{background:var(--bg)}

/* modais */
.dsh-modal{position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:var(--s4);animation:dshFade .18s ease}
.dsh-modal__box{background:#fff;border-radius:20px;width:100%;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(15,23,42,.3);overflow:hidden;animation:dshPop .22s cubic-bezier(.22,.9,.3,1);outline:none}
.dsh-modal__h{padding:var(--s5) var(--s5) var(--s3);display:flex;justify-content:space-between;gap:var(--s3);align-items:flex-start}
.dsh-modal__t{font-size:17px;font-weight:700;letter-spacing:-.01em}
.dsh-modal__s{font-size:12.5px;color:var(--muted);margin-top:2px;line-height:1.5}
.dsh-modal__b{overflow-y:auto;padding:0 var(--s5) var(--s5)}
@keyframes dshFade{from{opacity:0}to{opacity:1}}
@keyframes dshPop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}

/* dica "?" e legenda */
.dsh-tip{position:fixed;left:0;top:0;z-index:3000;width:290px;max-width:calc(100vw - 16px);box-sizing:border-box;pointer-events:none;background:var(--ink);color:#F1F5F9;padding:var(--s3);border-radius:var(--ri);font-size:12px;line-height:1.55;font-weight:400;text-align:left;white-space:normal;box-shadow:0 12px 32px rgba(15,23,42,.35);text-transform:none;letter-spacing:normal}
.dsh-legenda{margin-top:var(--s4);border-radius:var(--ri);background:var(--bg)}
.dsh-legenda>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:6px;padding:10px var(--s3);font-size:12px;font-weight:600;color:var(--muted);border-radius:var(--ri)}
.dsh-legenda>summary::-webkit-details-marker{display:none}
.dsh-legenda>summary:hover{color:var(--ink)}
.dsh-legenda[open]>summary{color:var(--ink)}
.dsh-legenda__dl{margin:0;padding:0 var(--s4) var(--s4);display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:var(--s3) var(--s5)}
.dsh-legenda dt{font-size:12px;font-weight:700;color:var(--ink)}
.dsh-legenda dd{margin:2px 0 0;font-size:12px;color:var(--muted);line-height:1.5}

/* alertas do topo */
.dsh-tile{text-align:left;background:#fff;border:1px solid var(--line);border-radius:var(--rc);padding:var(--s4);cursor:pointer;transition:box-shadow .18s,border-color .18s,transform .18s;display:flex;flex-direction:column;gap:var(--s2);position:relative;box-shadow:0 1px 2px rgba(15,23,42,.03)}
.dsh-tile:hover{box-shadow:0 6px 18px rgba(15,23,42,.08);transform:translateY(-1px)}
.dsh-tile[aria-selected="true"]{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink)}
.dsh-tile__h{display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:600;color:var(--muted);line-height:1.3}
.dsh-tile__lbl{display:inline-flex;align-items:center;flex-wrap:wrap}
.dsh-tile__ic{width:30px;height:30px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center}
.dsh-tile__v{font-size:30px;font-weight:700;line-height:1;letter-spacing:-.02em}
.dsh-tile__s{font-size:12px;color:var(--muted)}
.dsh-qual{display:flex;align-items:center;gap:var(--s3);font-size:12.5px;color:var(--muted);margin:var(--s3) 0 var(--s4)}
.dsh-qual .dsh-track{flex:1;max-width:240px}
.dsh-chips{display:flex;flex-wrap:wrap;gap:var(--s2)}
.dsh-chipbtn{display:inline-flex;align-items:baseline;gap:var(--s2);padding:8px 12px;border:0;border-radius:10px;cursor:pointer;font-size:12.5px;font-weight:600}

/* aguardando agora */
.dsh-ag__top{display:grid;grid-template-columns:auto 1fr;gap:var(--s5);align-items:center;margin-bottom:var(--s4)}
.dsh-ag__stats{display:flex;flex-wrap:wrap;gap:var(--s2) var(--s5)}
.dsh-stat__l{font-size:11.5px;color:var(--muted);font-weight:600}
.dsh-stat__v{font-size:18px;font-weight:700;letter-spacing:-.01em}
.dsh-ag__row{display:grid;grid-template-columns:10px minmax(0,1fr) minmax(120px,220px) 200px;gap:var(--s3);align-items:center;padding:var(--s3) 0;border-top:1px solid var(--line2)}
.dsh-ag__row:first-child{border-top:0}
.dsh-ag__n{font-size:13.5px;font-weight:650}
.dsh-ag__t{font-size:14px;font-weight:700;text-align:right;white-space:nowrap}

/* linhas com barra (destinos, motivos, permaneceu, SLA) */
.dsh-linha{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,2fr) auto;gap:var(--s2) var(--s4);align-items:center;padding:var(--s3) 0}
.dsh-rows>*+*{border-top:1px solid var(--line2)}
.dsh-linha--motivos{grid-template-columns:minmax(0,2fr) minmax(0,1.1fr) auto}
.dsh-linha--dest{grid-template-columns:minmax(0,1.4fr) minmax(0,1.5fr) auto}
.dsh-linha__n{font-size:13.5px;font-weight:600;color:var(--ink);min-width:0}
.dsh-linha__n small{display:block;font-size:12px;font-weight:400;color:var(--muted)}
.dsh-linha__m{display:flex;gap:var(--s2);flex-wrap:wrap;justify-content:flex-end}
.dsh-mini{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}
.dsh-mini+.dsh-mini{margin-top:4px}
.dsh-mini__t{flex:1;min-width:60px}
.dsh-mini__v{min-width:64px;text-align:right;font-weight:650;color:var(--ink2)}
.dsh-mini__l{min-width:44px}
.dsh-pct{font-size:18px;font-weight:700;letter-spacing:-.01em;text-align:right;min-width:52px}
.dsh-pair{display:grid;grid-template-columns:1fr 1fr;gap:var(--s3);margin-top:var(--s2)}
.dsh-pair__l{font-size:11.5px;color:var(--muted);display:flex;justify-content:space-between;margin-bottom:3px}
.dsh-pair__l b{color:var(--ink2);font-weight:650}

/* hero das análises */
.dsh-hero{display:flex;align-items:center;gap:var(--s5);flex-wrap:wrap;margin-bottom:var(--s4)}
.dsh-hero>.dsh-hero__bar{flex:1 1 280px;min-width:0}
.dsh-hero__num{flex-shrink:0}

/* frota */
.dsh-fleet{display:flex;gap:var(--s3);flex-wrap:wrap}
.dsh-fleet__i{flex:1 1 90px;background:#fff;border-radius:var(--ri);padding:var(--s3) var(--s4)}
.dsh-fleet__v{font-size:30px;font-weight:700;line-height:1;letter-spacing:-.02em}
.dsh-fleet__l{font-size:12px;color:var(--muted);margin-top:4px}

/* saneamento */
.dsh-san__sec{display:flex;justify-content:space-between;align-items:center;gap:var(--s3);text-align:left;width:100%;background:var(--bg);border:0;border-radius:var(--ri);padding:var(--s3) var(--s4);cursor:pointer;transition:background .15s}
.dsh-san__sec:hover{background:var(--line2)}
.dsh-san__sec b{font-size:13.5px;font-weight:600;color:var(--ink)}
.dsh-san__h{font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--warn);display:flex;justify-content:space-between;margin:var(--s5) 0 var(--s2)}
.dsh-san__g{border-top:1px solid var(--line2)}
.dsh-san__gb{width:100%;display:flex;align-items:center;gap:var(--s3);padding:var(--s3) 2px;background:none;border:0;cursor:pointer;text-align:left}
.dsh-san__gb span:first-child{flex:1;font-size:13px;font-weight:600;color:var(--ink)}
.dsh-san__item{display:flex;align-items:baseline;gap:var(--s3);flex-wrap:wrap;font-size:12.5px;padding:8px var(--s2);border-radius:var(--rs);color:var(--ink2);text-decoration:none}
a.dsh-san__item:hover{background:#FEF3C7}
.dsh-count{display:inline-block;min-width:24px;text-align:center;padding:0 8px;border-radius:99px;font-size:12px;font-weight:700;line-height:1.6}

/* exceções */
.dsh-exc{display:grid;grid-template-columns:4px minmax(0,1fr) auto;gap:var(--s3);align-items:center;padding:var(--s3) 0;border-top:1px solid var(--line2)}
.dsh-exc:first-child{border-top:0}
.dsh-exc__bar{align-self:stretch;border-radius:4px}
.dsh-exc__n{font-size:14px;font-weight:650}
.dsh-exc__m{display:flex;flex-wrap:wrap;gap:var(--s2) var(--s3);align-items:center;margin-top:4px;font-size:12px;color:var(--muted)}
.dsh-exc__t{font-size:15px;font-weight:700;margin-right:var(--s2)}

/* configurações */
.dsh-cfg__g{background:var(--bg);border-radius:var(--ri);padding:var(--s4)}
.dsh-cfg__f{display:flex;flex-direction:column;gap:6px}
.dsh-cfg__f label{font-size:12.5px;color:var(--ink2);font-weight:550}
.dsh-cfg__hist{display:flex;align-items:baseline;gap:var(--s3);flex-wrap:wrap;padding:8px 0;border-top:1px solid var(--line2);font-size:12.5px;color:var(--ink2)}

/* controle de impressão e responsivo */
@media (max-width:760px){
  .dsh-card{padding:var(--s4)}
  .dsh-kpi__v,.dsh-tile__v{font-size:26px}
  .dsh-ag__top{grid-template-columns:1fr}
  .dsh-ag__row{grid-template-columns:10px 1fr auto}
  .dsh-ag__row>.dsh-track{grid-column:2 / 4;grid-row:2}
  .dsh-linha,.dsh-linha--motivos{grid-template-columns:1fr auto}
  .dsh-linha>.dsh-linha__bar{grid-column:1 / 3;grid-row:2}
  .dsh-linha--dest{grid-template-columns:1fr}
  .dsh-linha--dest>.dsh-linha__bar{grid-column:auto;grid-row:auto}
  .dsh-linha--dest .dsh-linha__m{justify-content:flex-start}
  .dsh-resumo-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:var(--s2)!important}
  .dsh-resumo-grid .dsh-card{padding:var(--s3)}
  .dsh-resumo-grid .dsh-kpi__v{font-size:22px}
  .dsh-hide-sm{display:none}
  .dsh-pair{grid-template-columns:1fr}
  .dsh-seg{flex-wrap:nowrap;overflow-x:auto;max-width:100%}
  .dsh-modal{padding:0;align-items:flex-end}
  .dsh-modal__box{border-radius:20px 20px 0 0;max-height:92vh}
  .dsh-modal__h,.dsh-modal__b{padding-left:var(--s4);padding-right:var(--s4)}
  .dsh-exc{grid-template-columns:4px minmax(0,1fr)}
  .dsh-exc>.dsh-exc__act{grid-column:2}
  .dsh-sec__t{font-size:18px}
}
.dsh-title__r{display:flex;align-items:center;gap:var(--s2);margin-left:auto}
.dsh-title__r .dsh-x{width:30px;height:30px}
.dsh-sec__top{display:flex;justify-content:space-between;align-items:flex-start;gap:var(--s3)}
.dsh-menu{position:relative}
.dsh-menu__p{position:absolute;right:0;top:calc(100% + 6px);z-index:60;min-width:270px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:6px;box-shadow:0 12px 32px rgba(15,23,42,.16)}
.dsh-menu__i{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;text-align:left;border:0;background:transparent;padding:10px 12px;border-radius:10px;cursor:pointer;color:var(--ink);font-size:13px}
.dsh-menu__i:hover{background:var(--bg)}
.dsh-menu__i span{font-size:12px;color:var(--muted)}
.dsh-menu__d{font-size:11.5px;color:var(--muted);padding:8px 12px 6px;border-top:1px solid var(--line2);margin-top:4px;line-height:1.5}
.dsh-cb{width:18px;height:18px;accent-color:#0F172A;cursor:pointer;flex-shrink:0;margin:2px 0 0}
.dsh-cb:disabled{cursor:not-allowed;opacity:.5}
.dsh-nao__row{display:flex;align-items:flex-start;gap:var(--s3);padding:10px 8px;border-radius:12px;cursor:pointer}
.dsh-nao__row:hover{background:var(--bg)}
.dsh-nao__bar{display:flex;align-items:center;justify-content:space-between;gap:var(--s3);flex-wrap:wrap;padding:10px 12px;margin:12px 0 4px;background:var(--bg);border-radius:12px}
.dsh-nao__all{display:inline-flex;align-items:center;gap:10px;font-size:13px;font-weight:600;cursor:pointer}
.dsh-metabar__corte{position:absolute;top:2px;height:20px;border-left:2px dashed #B45309;transform:translateX(-1px)}
.dsh-aud__i{display:grid;grid-template-columns:130px 190px minmax(0,1fr);gap:var(--s3);padding:10px 0;border-top:1px solid var(--line2);font-size:12.5px;align-items:baseline}
@media (max-width:760px){.dsh-aud__i{grid-template-columns:1fr;gap:2px}.dsh-menu__p{right:auto;left:0}}
@media (prefers-reduced-motion:reduce){.dsh *{animation:none!important;transition:none!important}}
`;
(function () {
  if (typeof document === "undefined" || document.getElementById("ge-dash-css-v2")) return;
  const st = document.createElement("style");
  st.id = "ge-dash-css-v2";
  st.textContent = DASH_CSS_BASE;
  document.head.appendChild(st);
})();

/* ─── Ícones (traço fino, no estilo Lucide; desenhados aqui para não depender de biblioteca externa) ─── */
const DASH_ICONES = {
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  bars: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  ok: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  external: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  printer: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  sliders: '<path d="M10 5H3"/><path d="M12 19H3"/><path d="M14 3v4"/><path d="M16 17v4"/><path d="M21 12h-9"/><path d="M21 19h-5"/><path d="M21 5h-7"/><path d="M8 10v4"/><path d="M8 12H3"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  hourglass: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>'
};
function DashIcone({ n, tam = 16, cor }) {
  const d = DASH_ICONES[n];
  if (!d) return null;
  return React.createElement("svg", { width: tam, height: tam, viewBox: "0 0 24 24", fill: "none", stroke: cor || "currentColor", strokeWidth: 2,
    strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", style: { flexShrink: 0 }, dangerouslySetInnerHTML: { __html: d } });
}

/* ─── Animação de entrada: números sobem até o valor e barras preenchem ao montar ───
 * Cada componente tem o seu próprio gatilho, então trocar de aba refaz a animação e atualizar a tela não.
 * Respeita prefers-reduced-motion: quem pediu menos movimento recebe o valor final direto.                   */
function dashMenosMovimento() {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function useDashEntrou() {
  const [e, setE] = useState(dashMenosMovimento);
  useEffect(() => {
    if (e) return;
    const t = setTimeout(() => setE(true), 40);
    return () => clearTimeout(t);
  }, []);
  return e;
}
function useDashContagem(alvo, dur = 900) {
  const ini = dashMenosMovimento() ? alvo : 0;
  const [v, setV] = useState(ini);
  const atual = React.useRef(ini);   // valor que está na tela agora: quando o número muda, anima dele até o novo (e não recomeça do zero)
  useEffect(() => {
    if (dashMenosMovimento() || typeof alvo !== "number" || !isFinite(alvo)) { atual.current = alvo; setV(alvo); return; }
    const de = typeof atual.current === "number" ? atual.current : 0;
    let raf, t0 = null;
    const passo = t => {
      if (t0 === null) t0 = t;
      const p = Math.min((t - t0) / dur, 1);
      const val = de + (alvo - de) * (1 - Math.pow(1 - p, 3));
      atual.current = val; setV(val);
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo, dur]);
  return v;
}
function DashNum({ valor, sufixo = "", casas = 0 }) {
  const v = useDashContagem(typeof valor === "number" ? valor : null);
  if (typeof valor !== "number") return valor == null ? null : valor;
  return (typeof v === "number" ? v : valor).toFixed(casas) + sufixo;
}

/* Contexto de impressão: cada bloco e cada aba pede ao Dashboard "imprima só isto". */
const DashImpCtx = React.createContext(null);

/* ─── Auditoria ───────────────────────────────────────────────────────────────
 * Toda alteração feita pelo painel (configurações, justificativas) grava uma linha em `painel_auditoria`: quem, quando,
 * o quê, valor antes e valor depois. A tabela não tem política de alterar nem de apagar, então o registro é permanente.
 * Se a gravação falhar, o painel AVISA na tela (a alteração já foi feita, mas fica sem registro).                         */
async function dashAuditar(entradas, quem) {
  const linhas = (Array.isArray(entradas) ? entradas : [entradas]).map(e => ({
    usuario_nome: quem || null, acao: e.acao, entidade: e.entidade || null, entidade_id: e.entidade_id == null ? null : String(e.entidade_id),
    resumo: e.resumo || null, antes: e.antes == null ? null : e.antes, depois: e.depois == null ? null : e.depois }));
  if (!linhas.length) return { ok: true };
  try {
    const r = await fetch(`${SB_URL}/rest/v1/painel_auditoria`, { method: "POST", headers: Object.assign({}, H(), { Prefer: "return=minimal" }), body: JSON.stringify(linhas) });
    if (!r.ok) throw new Error(await r.text());
    return { ok: true };
  } catch (e) { return { ok: false, erro: e.message }; }
}

/* ─── Peças visuais reutilizáveis (ficam FORA do Dashboard para manter a identidade entre renderizações) ─── */
function DashCard({ children, style, onClick, className, id }) {
  return React.createElement("div", {
    id, onClick, className: "dsh-card" + (onClick ? " dsh-click" : "") + (className ? " " + className : ""),
    role: onClick ? "button" : undefined, tabIndex: onClick ? 0 : undefined,
    onKeyDown: onClick ? (e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); } }) : undefined,
    style
  }, children);
}

function DashTitulo({ children, extra, tooltip, icone }) {
  const h = React.createElement;
  const imp = React.useContext(DashImpCtx);
  const botao = imp && h("button", { type: "button", className: "dsh-x dash-no-print", title: "Imprimir só este bloco", "aria-label": "Imprimir só este bloco",
    onClick: e => { e.stopPropagation(); imp.bloco(e.currentTarget); } }, h(DashIcone, { n: "printer", tam: 16 }));
  return h("div", { className: "dsh-title" },
    h("div", { className: "dsh-title__t" },
      icone && h("span", { className: "dsh-title__icon" }, h(DashIcone, { n: icone, tam: 16 })),
      h("span", null, children),
      tooltip && h(DashDica, { texto: tooltip, rotulo: typeof children === "string" ? children : undefined })),
    (extra || botao) && h("div", { className: "dsh-title__r" }, extra && h("div", { className: "dsh-title__x" }, extra), botao));
}

function DashKpi({ label, valor, sub, cor, alerta, tooltip, onClick, ativo, topo }) {
  const h = React.createElement;
  return h(DashCard, { onClick, className: "dsh-kpi" + (alerta ? " dsh-kpi--alert" : "") + (ativo ? " dsh-kpi--on" : ""), style: { "--kc": cor || "#0F172A" } },
    topo && h("span", { className: "dsh-kpi__bar", style: { background: topo } }),
    h("div", { className: "dsh-kpi__l" }, label, tooltip && h(DashDica, { texto: tooltip, rotulo: label })),
    h("div", { className: "dsh-kpi__v dsh-num", style: { color: cor || "var(--ink)" } }, typeof valor === "number" ? h(DashNum, { valor }) : valor),
    sub && h("div", { className: "dsh-kpi__s" }, sub));
}

function DashVazio({ children, ok, icone }) {
  const h = React.createElement;
  return h("div", { className: "dsh-vazio" + (ok ? " dsh-vazio--ok" : "") },
    h(DashIcone, { n: icone || (ok ? "ok" : "search"), tam: 22 }), h("span", null, children));
}

/* Barra horizontal simples: um valor contra o maior da lista */
function DashBarra({ label, n, pct, max, cor, tag }) {
  const h = React.createElement, entrou = useDashEntrou();
  return h("div", { className: "dsh-barra" },
    h("div", { className: "dsh-barra__top" },
      h("span", { className: "dsh-barra__l", title: typeof label === "string" ? label : undefined }, label, tag && h("span", { className: "dsh-tag" }, tag)),
      h("span", { className: "dsh-barra__v dsh-num" }, h(DashNum, { valor: n }), h("span", { className: "dsh-barra__p" }, "  ", h(DashNum, { valor: pct, sufixo: "%" })))),
    h("div", { className: "dsh-track" }, h("i", { style: { width: entrou ? (max ? n / max * 100 : 0) + "%" : "0%", background: cor } })));
}

/* Barra empilhada de uma cor por fatia, na proporção de cada uma. segs: [{ id, rot, valor, cor, txt? }] */
/* Texto legível sobre qualquer cor de fatia: escuro sobre cor clara, branco sobre cor escura */
function dashTextoSobre(cor) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(cor || ""));
  if (!m) return "#fff";
  const l = (0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16)) / 255;
  return l > 0.62 ? "#0F172A" : "#fff";
}
function DashEmpilhada({ segs, alto, legenda = true }) {
  const h = React.createElement, entrou = useDashEntrou();
  const ref = React.useRef(null);
  const [larg, setLarg] = useState(0);
  useEffect(() => {   // mede a barra para só escrever dentro da fatia quando o texto cabe
    const el = ref.current;
    if (!el) return;
    const medir = () => setLarg(el.getBoundingClientRect().width);
    medir();
    if (typeof ResizeObserver === "undefined") { window.addEventListener("resize", medir); return () => window.removeEventListener("resize", medir); }
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const total = segs.reduce((t, s) => t + (s.valor || 0), 0);
  const vis = segs.filter(s => s.valor > 0);
  return h("div", null,
    h("div", { ref, className: "dsh-bar" + (alto === "lg" ? " dsh-bar--lg" : alto === "sm" ? " dsh-bar--sm" : ""), role: "img",
      "aria-label": vis.length ? vis.map(s => `${s.rot}: ${s.txt || s.valor}`).join(", ") : "sem dados" },
      vis.map(s => {
        const p = total ? s.valor / total * 100 : 0;
        return h("div", { key: s.id, className: "dsh-bar__seg", title: `${s.rot}: ${s.txt || s.valor} (${p.toFixed(0)}%)`, style: { width: entrou ? p + "%" : "0%", background: s.cor } },
          alto === "lg" && (() => { const rot = s.txt || Math.round(p) + "%"; return larg * p / 100 >= rot.length * 7 + 16 ? h("span", { className: "dsh-bar__in", style: { color: dashTextoSobre(s.cor) } }, rot) : null; })());
      })),
    legenda && h("div", { className: "dsh-leg" },
      segs.map(s => h("div", { key: s.id, className: "dsh-leg__i", style: { opacity: s.valor > 0 ? 1 : 0.5 } },
        h("span", { className: "dsh-dot", style: { background: s.cor } }),
        h("span", { className: "dsh-leg__l" }, s.rot),
        h("b", { className: "dsh-num" }, s.txt || s.valor),
        total > 0 && h("span", { className: "dsh-leg__p" }, Math.round(s.valor / total * 100) + "%")))));
}

/* Rosca (donut) com o total no centro */
function DashRosca({ segs, centro, sub, tam = 132 }) {
  const h = React.createElement, entrou = useDashEntrou();
  const total = segs.reduce((t, s) => t + (s.valor || 0), 0);
  const vis = segs.filter(s => s.valor > 0);
  const R = 52, CIRC = 2 * Math.PI * R;
  let acum = 0;
  return h("div", { className: "dsh-rosca", style: { width: tam, height: tam } },
    h("svg", { viewBox: "0 0 140 140", width: tam, height: tam, role: "img", "aria-label": vis.map(s => `${s.rot}: ${s.valor}`).join(", ") || "sem dados" },
      h("circle", { cx: 70, cy: 70, r: R, fill: "none", stroke: "#F1F5F9", strokeWidth: 16 }),
      total > 0 && vis.map(s => {
        const len = s.valor / total * CIRC, vao = vis.length > 1 ? Math.min(3, len * 0.25) : 0;
        const el = h("circle", { key: s.id, cx: 70, cy: 70, r: R, fill: "none", stroke: s.cor, strokeWidth: 16, transform: "rotate(-90 70 70)",
          strokeDasharray: entrou ? `${Math.max(0, len - vao)} ${CIRC}` : `0 ${CIRC}`, strokeDashoffset: -acum,
          style: { transition: "stroke-dasharray .8s cubic-bezier(.22,.9,.3,1)" } }, h("title", null, `${s.rot}: ${s.valor}`));
        acum += len;
        return el;
      })),
    h("div", { className: "dsh-rosca__c" }, h("b", { className: "dsh-num" }, centro), sub && h("span", null, sub)));
}

/* Barra "duas partes contra uma meta" (ex.: Santa Casa + ambulância contra o tempo do AVC).
 * `corte` (opcional) é o prazo que só a Santa Casa tem para pedir a ambulância: aparece como um tracejado.            */
function DashMetaBar({ a, b, meta, corte, rotA, rotB, corA, corB, metaTxt }) {
  const h = React.createElement, entrou = useDashEntrou();
  corA = corA || "#D97706"; corB = corB || "#E11D48"; metaTxt = metaTxt || ("meta " + dashFmtMin(meta));
  const total = a + b, escala = Math.max(meta, total);
  const temCorte = typeof corte === "number" && corte > 0 && corte < meta;
  return h("div", { className: "dsh-metabar" },
    h("div", { className: "dsh-metabar__box" },
      h("div", { className: "dsh-metabar__fill" },
        h("div", { title: `${rotA}: ${dashFmtMin(a)}`, style: { width: entrou ? a / escala * 100 + "%" : "0%", background: corA } }),
        h("div", { title: `${rotB}: ${dashFmtMin(b)}`, style: { width: entrou ? b / escala * 100 + "%" : "0%", background: corB } })),
      temCorte && h("span", { className: "dsh-metabar__corte", title: "Prazo da Santa Casa para pedir a ambulância: " + dashFmtMin(corte), style: { left: corte / escala * 100 + "%" } }),
      h("span", { className: "dsh-metabar__meta", title: metaTxt, style: { left: meta / escala * 100 + "%" } })),
    h("div", { className: "dsh-metabar__t" },
      h("b", { style: { color: corA } }, rotA + " " + dashFmtMin(a)), " · ", h("b", { style: { color: corB } }, rotB + " " + dashFmtMin(b)),
      ` · total ${dashFmtMin(total)} (${metaTxt}${temCorte ? " · tracejado: prazo da Santa Casa " + dashFmtMin(corte) : ""})`));
}

function DashCobertura({ g }) {
  const baixa = g.cobertura < 80;
  return React.createElement("span", { title: `${g.informados} de ${g.total} registros informaram este campo`, className: baixa ? "dsh-chip dsh-chip--warn" : "dsh-title__x" },
    `${g.informados}/${g.total} informados`);
}

/* ─── Janela (modal) comum a todos os blocos ─── */
function DashModal({ titulo, sub, onClose, largura, children, z }) {
  const h = React.createElement, ref = React.useRef(null);
  useEffect(() => {
    const anterior = document.activeElement;
    if (ref.current && ref.current.focus) ref.current.focus();
    const f = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", f);
    return () => { window.removeEventListener("keydown", f); if (anterior && anterior.focus) { try { anterior.focus(); } catch (x) { /* elemento saiu da tela */ } } };
  }, []);
  return h("div", { className: "dsh dsh-modal dash-no-print", style: z ? { zIndex: z } : undefined, onClick: e => { if (e.target === e.currentTarget) onClose(); } },
    h("div", { ref, tabIndex: -1, role: "dialog", "aria-modal": "true", "aria-label": typeof titulo === "string" ? titulo : undefined, className: "dsh-modal__box", style: { maxWidth: largura || 640 } },
      h("div", { className: "dsh-modal__h" },
        h("div", { style: { minWidth: 0 } }, h("div", { className: "dsh-modal__t" }, titulo), sub && h("div", { className: "dsh-modal__s" }, sub)),
        h("button", { type: "button", className: "dsh-x", onClick: onClose, "aria-label": "Fechar" }, h(DashIcone, { n: "x", tam: 18 }))),
      h("div", { className: "dsh-modal__b" }, children)));
}

/* ─── Janela com a lista de casos (usada por vários blocos) ─── */
function DashListaModal({ titulo, subtitulo, itens, onClose }) {
  const h = React.createElement;
  const LIM = 200;
  return h(DashModal, { titulo, sub: `${itens.length} caso${itens.length !== 1 ? "s" : ""}${subtitulo ? " · " + subtitulo : ""}`, onClose, largura: 680 },
    itens.length === 0 ? h(DashVazio, null, "Nenhum caso.")
      : h("ul", { className: "dsh-list" },
          itens.slice(0, LIM).map((it, i) => {
            const corpo = [
              h("span", { key: "n", className: "dsh-list__n", style: { fontSize: 13 } }, it.nome),
              it.ficha && h("span", { key: "f", className: "dsh-sub" }, it.ficha),
              h("span", { key: "t", className: "dsh-sub", style: { flex: "1 1 240px" } }, it.texto),
              it.campo && h("span", { key: "l", className: "dsh-link", style: { marginLeft: "auto" } }, "abrir", h(DashIcone, { n: "external", tam: 13 }))
            ];
            return h("li", { key: i, className: "dsh-list__i", style: { padding: "4px 0" } },
              it.campo
                ? h("a", { href: `remocao.html?foco=${encodeURIComponent(it.id)}&campo=${encodeURIComponent(it.campo)}`, className: "dsh-pill-link" }, corpo)
                : h("div", { className: "dsh-pill-link" }, corpo));
          }),
        itens.length > LIM && h("li", { className: "dsh-nota", style: { padding: "8px 0" } }, `Mostrando ${LIM} de ${itens.length}.`)));
}

/* ─── Leitura em páginas ──────────────────────────────────────────────────────
 * O Supabase devolve no máximo 1.000 linhas por consulta (Settings → API → Max rows) e corta o resto SEM avisar.
 * Antes, o dashboard pedia limit=5000 e recebia só 1.000. Esta função repete a consulta com limit/offset até acabar.
 * Avança pelo que o servidor REALMENTE devolveu (não por 1.000), então funciona mesmo que o limite do projeto seja outro.
 * Para quando atinge o total informado em Content-Range ou quando uma página vem vazia.
 * Atenção: aqui H() é função (resolve o token da sessão a cada chamada). Na planilha (remocao.html) H é objeto.          */
async function sbGetTodas(path) {
  const out = [];
  let off = 0, total = null;
  while (true) {
    const r = await fetch(`${SB_URL}/rest/v1/${path}${path.includes("?") ? "&" : "?"}limit=1000&offset=${off}`,
      { headers: Object.assign({}, H(), { Prefer: "count=exact" }) });
    if (!r.ok) throw new Error(await r.text());
    const page = await r.json();
    const m = (r.headers.get("Content-Range") || "").match(/\/(\d+)$/);   // ex.: "0-232/233"
    if (m) total = Number(m[1]);
    if (!Array.isArray(page) || page.length === 0) break;
    out.push(...page);
    off += page.length;
    if (total !== null && off >= total) break;
    if (off > 200000) break;                                              // trava de segurança
  }
  return out;
}

/* ─── Regras de leitura da planilha: o dashboard NÃO inventa dado ────────────
 * Cada número vem de um campo preenchido na planilha. O que não está preenchido não é completado nem adivinhado:
 * a linha simplesmente não entra naquela conta, e o painel avisa quantas ficaram de fora.
 *
 * TIPO DA LINHA (a soma dos dois é sempre o total de linhas):
 *   remoção CROSS   = linha com o Nº da ficha CROSS preenchido (ficha_cross)
 *   outras remoções = linha sem ficha CROSS (altas, hemodiálise, exames etc.)
 *
 * GRÁFICO "Volume de remoções": três séries, cada uma no SEU dia:
 *   saídas        → data_saida_real (planilha: DATA SAÍDA AMB.), só se o horário de saída (SAÍDA AMB. SCFM) também estiver preenchido
 *   pedidos       → data_solicitacao, só das linhas CROSS (pedido à CROSS exige ficha)
 *   finalizações  → data_resposta_cross
 *
 * Colunas de ambulância na tabela `remocoes` (os nomes antigos enganam):
 *   data_saida_ambulancia + hora_solic_ambulancia  = PEDIDO da ambulância   (planilha: DATA/HORA SOLIC. AMB.)
 *   data_saida_real       + horario_saida_ambulancia = SAÍDA da ambulância  (planilha: DATA SAÍDA AMB. / SAÍDA AMB. SCFM)
 * Horário de saída sem data de saída: a linha NÃO entra nas barras (não se usa a data do pedido nem se soma um dia).     */
const DASH_CAMPOS_DATA = ["data_solicitacao", "data_resposta_cross", "data_saida_real"];

function dashDiaIso(v) {
  const s = String(v || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function dashTemFicha(x) {
  return String(x.ficha_cross == null ? "" : x.ficha_cross).trim() !== "";
}

function dashTemHorarioSaida(x) {
  return /^(\d{1,2}):(\d{2})/.test(String(x.horario_saida_ambulancia || "").trim());   // aceita "03:45" e "03:45:00"
}

// "05:22" (como a planilha guarda T. ESPERA e DURAÇÃO) -> minutos. Vazio ou fora do formato -> null.
function dashHMemMin(v) {
  const m = String(v == null ? "" : v).trim().match(/^(\d+):(\d{2})(?::\d{2})?$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function dashDiaDaSaida(x) {
  return dashTemHorarioSaida(x) ? dashDiaIso(x.data_saida_real) : null;
}

/* ════════════════════════════════════════════════════════════════════════════
   DASHBOARD — indicadores de regulação
   ----------------------------------------------------------------------------
   FONTE: tabela `remocoes` (registro oficial, digitado manualmente).
   O Kanban (`cards`) entra SÓ no pulso operacional — é fila viva, sem
   histórico: cards são movidos, editados e apagados, então não sustentam
   série temporal nenhuma.

   Três princípios que o desenho carrega:
   1. COBERTURA SEMPRE VISÍVEL. Nenhum campo de remocoes passa de 80% de
      preenchimento (tipo_ambulancia tem 44% de nulos). Percentual sem
      denominador declarado mente por omissão — e isto vira ata de SGQ.
   2. ESCALA CONFORME O DADO. A base começa em 20 dias. Mês parcial ao lado
      de mês completo sugere queda que não existe.
   3. RECURSO ≠ ESPECIALIDADE. Exames são ~29% dos pedidos e não competem
      com as clínicas; ficam visualmente apartados.
   ══════════════════════════════════════════════════════════════════════════ */


/* O "?" ao lado de um nome: abre ao passar o mouse, ao focar com o teclado ou ao clicar/tocar (clicar fixa aberto).
 * O balão é desenhado FORA do cartão (direto no <body>) e posicionado pela tela: assim nenhum cartão o corta
 * (os cartões têm overflow escondido) nem o cartão vizinho passa por cima. Perto da borda, ele se desloca para caber;
 * sem espaço embaixo, abre em cima.                                                                                       */
const useDashLayoutEffect = (typeof window !== "undefined" && React.useLayoutEffect) ? React.useLayoutEffect : useEffect;
function DashDica({ texto, rotulo }) {
  const h = React.createElement;
  const [hover, setHover] = useState(false), [fixa, setFixa] = useState(false), [pos, setPos] = useState(null);
  const ref = React.useRef(null), tipRef = React.useRef(null);
  const visivel = hover || fixa;
  const posiciona = () => {
    const el = ref.current, tip = tipRef.current;
    if (!el || !tip) return;
    const r = el.getBoundingClientRect(), vw = window.innerWidth || 1200, vh = window.innerHeight || 800;
    const w = Math.min(290, vw - 16), alt = tip.offsetHeight || 0;
    const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, vw - w - 8));
    let top = r.bottom + 8;
    if (top + alt > vh - 8 && r.top - 8 - alt >= 8) top = r.top - 8 - alt;
    setPos({ left, top, w });
  };
  useDashLayoutEffect(() => { if (visivel) posiciona(); else setPos(null); }, [visivel, texto]);
  useEffect(() => {
    if (!visivel) return;
    window.addEventListener("scroll", posiciona, true); window.addEventListener("resize", posiciona);
    return () => { window.removeEventListener("scroll", posiciona, true); window.removeEventListener("resize", posiciona); };
  }, [visivel]);
  useEffect(() => {
    if (!fixa) return;
    const fora = e => { if (ref.current && !ref.current.contains(e.target) && !(tipRef.current && tipRef.current.contains(e.target))) setFixa(false); };
    const esc = e => { if (e.key === "Escape") setFixa(false); };
    document.addEventListener("mousedown", fora); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [fixa]);
  const tip = visivel && h("span", { ref: tipRef, role: "tooltip", className: "dsh dsh-tip dash-no-print",
    style: { left: pos ? pos.left : 0, top: pos ? pos.top : 0, width: pos ? pos.w : 290, visibility: pos ? "visible" : "hidden" } }, texto);
  return h("span", { ref, className: "dash-dica dash-no-print", style: { position: "relative", display: "inline-flex", marginLeft: 6, verticalAlign: "middle", textTransform: "none", letterSpacing: "normal" },
    onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) },
    h("span", { role: "button", tabIndex: 0, "aria-label": "O que significa" + (rotulo ? ": " + rotulo : ""), "aria-expanded": visivel,
      onClick: e => { e.stopPropagation(); e.preventDefault(); setFixa(v => !v); },
      onKeyDown: e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); setFixa(v => !v); } },
      onFocus: () => setHover(true), onBlur: () => setHover(false),
      style: { width: 16, height: 16, borderRadius: 99, border: "1px solid " + (visivel ? "#475569" : "#CBD5E1"), color: visivel ? "#0F172A" : "#64748B", background: visivel ? "#F1F5F9" : "#fff",
        fontSize: 10, fontWeight: 800, lineHeight: "14px", textAlign: "center", cursor: "help", userSelect: "none", flexShrink: 0, transition: "all .15s" } }, "?"),
    tip && (typeof ReactDOM !== "undefined" && ReactDOM.createPortal ? ReactDOM.createPortal(tip, document.body) : tip));
}

/* Explicação escrita ("como ler"), recolhida por padrão para não poluir; abre com um clique. */
function DashLegenda({ itens, titulo }) {
  const h = React.createElement;
  return h("details", { className: "dash-legenda dsh-legenda" },
    h("summary", null, h(DashIcone, { n: "info", tam: 14 }), titulo || "Como ler esta parte"),
    h("dl", { className: "dsh-legenda__dl" },
      itens.map(([t, d]) => h("div", { key: t }, h("dt", null, t), h("dd", null, d)))));
}

/* Janela com o glossário completo. */
function DashGlossario({ onClose }) {
  const h = React.createElement;
  const [q, setQ] = useState("");
  const lista = DASH_GLOSSARIO.filter(([t, d]) => !q.trim() || (t + " " + d).toLowerCase().includes(q.trim().toLowerCase()));
  return h(DashModal, { titulo: "Glossário do painel", sub: "Os termos do painel, em palavras simples.", onClose, largura: 640, z: 2500 },
    h("input", { type: "search", className: "dsh-in", "aria-label": "Procurar no glossário", placeholder: "Procurar um termo…", value: q, onChange: e => setQ(e.target.value), style: { width: "100%", height: 40, marginBottom: 8 } }),
    h("dl", { style: { margin: 0 } },
      lista.length === 0 ? h(DashVazio, null, "Nenhum termo encontrado.")
        : lista.map(([t, d]) => h("div", { key: t, style: { padding: "12px 0", borderTop: "1px solid var(--line2)" } },
            h("dt", { style: { fontSize: 14, fontWeight: 650, color: "var(--ink)" } }, t),
            h("dd", { style: { margin: "3px 0 0", fontSize: 13, color: "var(--ink2)", lineHeight: 1.6 } }, d)))));
}

/* ─── Fila do Kanban: cartões clicáveis que abrem a lista dos pacientes ───────
 * "Aceitos sem hospital" conta só pacientes nas colunas abaixo. Pediatria e Psiquiatria não são colunas — são marcas
 * dentro delas, então já entram. Para incluir outra coluna, acrescente o id dela aqui.                              */
const DASH_COLUNAS_ACEITAS = ["aceite", "andamento"];

function DashFilaKanban({ cols, cards, titulo }) {
  const h = React.createElement;
  const [sel, setSel] = useState(null); // { titulo, chave }
  const entrou = useDashEntrou();
  const porCol = useMemo(() => {
    const m = {};
    cols.forEach(c => { m[c.id] = cards.filter(k => k.col_id === c.id); });
    return m;
  }, [cards, cols]);
  const semHosp = useMemo(
    () => cards.filter(c => !(c.hosp || "").trim() && DASH_COLUNAS_ACEITAS.includes(c.col_id)),
    [cards]);
  const rotuloCol = id => (cols.find(c => c.id === id) || {}).label || id;
  const lista = !sel ? [] : sel.chave === "__semhosp" ? semHosp : (porCol[sel.chave] || []);
  const abrir = (tit, chave, n) => n ? () => setSel({ titulo: tit, chave }) : undefined;
  const qtd = c => (porCol[c.id] || []).length;
  const max = Math.max(1, ...cols.map(qtd));
  const total = cols.reduce((t, c) => t + qtd(c), 0);
  const catRotulo = c => (c.categoria && c.categoria !== "normal")
    ? (c.categoria.charAt(0).toUpperCase() + c.categoria.slice(1)) : (c.is_rn ? "RN" : null);

  return h(React.Fragment, null,
    h(DashCard, { id: "bloco-fila" },
      h(DashTitulo, { icone: "list", extra: `${total} paciente${total !== 1 ? "s" : ""} no quadro` }, titulo),
      h("div", { className: "dsh-grid dsh-g-fila dsh-grid--tight" },
        cols.map(c => {
          const n = qtd(c), cor = c.accent || "#64748B";
          return h(DashCard, { key: c.id, onClick: abrir(c.label, c.id, n) },
            h("div", { className: "dsh-sub", style: { fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: c.label }, c.label),
            h("div", { className: "dsh-kpi__v dsh-num", style: { color: n ? cor : "var(--faint)", margin: "6px 0 10px" } }, h(DashNum, { valor: n })),
            h("div", { className: "dsh-track dsh-track--sm" }, h("i", { style: { width: entrou ? n / max * 100 + "%" : "0%", background: cor } })));
        }),
        semHosp.length > 0 && h(DashCard, { key: "sh", className: "dsh-kpi--alert", onClick: abrir("Aceitos sem hospital de destino", "__semhosp", semHosp.length) },
          h("div", { className: "dsh-sub", style: { fontWeight: 600, color: "var(--warn)" } }, "Aceitos sem hospital"),
          h("div", { className: "dsh-kpi__v dsh-num", style: { color: "var(--warn)", margin: "6px 0 10px" } }, h(DashNum, { valor: semHosp.length })),
          h("div", { className: "dsh-track dsh-track--sm" }, h("i", { style: { width: entrou ? semHosp.length / max * 100 + "%" : "0%", background: "#D97706" } }))))),

    sel && h(DashModal, { titulo: sel.titulo, sub: `${lista.length} paciente${lista.length !== 1 ? "s" : ""}`, onClose: () => setSel(null), largura: 560 },
      lista.length === 0 ? h(DashVazio, { ok: true }, "Nenhum paciente aqui agora.")
        : h("ul", { className: "dsh-list" },
            lista.map(c => {
              const g = GC[c.grav] || (typeof GC_SEM !== "undefined" ? GC_SEM : GC.urgencia);
              const cat = catRotulo(c);
              const meta = [c.setor, c.rec, sel.chave === "__semhosp" ? rotuloCol(c.col_id) : (c.hosp ? "→ " + c.hosp : null)].filter(Boolean).join(" · ");
              return h("li", { key: c.id, className: "dsh-list__i" },
                h("div", { className: "dsh-list__top" },
                  h("span", { className: "dsh-list__n" }, c.nome, cat && h("span", { className: "dsh-tag" }, cat)),
                  h("span", { className: "dsh-gchip", style: { color: g.text, background: g.bg, borderColor: g.border } }, g.label)),
                c.hd && h("div", { className: "dsh-list__m" }, h("b", null, "HD: "), c.hd),
                meta && h("div", { className: "dsh-list__m" }, meta));
            }))));
}

/* ─── Protocolo de AVC ───────────────────────────────────────────────────────
 * Meta e prazo vêm de Configurações (avc_meta_min e avc_prazo_pedido_min, cada um com a data em que passa a valer).
 * Estado de "qual card está aberto" fica aqui, no próprio componente, para o resto da tela não ser refeito a cada clique. */
function DashProtocoloAVC({ protocolos, totalRemocoes }) {
  const h = React.createElement, fmtMin = dashFmtMin;
  const [avcSel, setAvcSel] = useState(null);   // card aberto: "total" | "noHorario" | "atrasoSantaCasa" | "atrasoAmbulancia"
  useEffect(() => {
    if (!avcSel) return;
    const f = e => { if (e.key === "Escape") setAvcSel(null); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [avcSel]);
  const P = protocolos;
  const metaTxt = fmtMin(P.metaMin), prazoTxt = fmtMin(P.prazoPedido);
  const dividido = P.prazoDefinido && P.prazoPedido < P.metaMin;
  const titulo = h(DashTitulo, {
    icone: "zap",
    extra: `meta: sair com médico e enfermeiro em até ${metaTxt} da finalização da CROSS`,
    tooltip: `O protocolo de AVC (derrame) tem uma meta: a ambulância precisa sair em até ${metaTxt} depois que a CROSS finaliza a ficha. ` +
      (dividido ? `Dentro dela, a Santa Casa tem até ${prazoTxt} para pedir a ambulância; se pedir depois disso, o atraso é da Santa Casa, mesmo que a ambulância tenha pouco tempo para sair. ` : `Hoje a Santa Casa e o setor de ambulância dividem esse tempo; em Configurações você pode definir um prazo só da Santa Casa para pedir a ambulância. `) +
      "Aqui entram só os pacientes marcados como Protocolo de AVC no Livro de Saída (desde outubro/2026) e que já foram ligados à planilha. Cada paciente cai em um só grupo: saiu no horário; atraso da Santa Casa; ou atraso da ambulância. Clique em um cartão para ver os pacientes."
  }, "Protocolo de AVC");

  if (P.total === 0) return h(DashCard, { id: "bloco-avc" }, titulo,
    h(DashVazio, null, "Nenhum protocolo de AVC no período. Marque “Protocolo de AVC” ao lançar o pedido no Livro de Remoção."));

  const alterna = k => () => setAvcSel(avcSel === k ? null : k);
  const SEL = { noHorario: ["No horário", "#15803D", "#DCFCE7"], atrasoSantaCasa: ["Atraso · Santa Casa", "#92400E", "#FEF3C7"],
    atrasoAmbulancia: ["Atraso · ambulância", "#9F1239", "#FFE4E6"], atrasoSemCausa: ["Atraso · causa não apurada", "#475569", "#F1F5F9"],
    semHorarios: ["Sem horário para medir", "#92400E", "#FFFBEB"] };
  const TIT = { total: "Todos os protocolos de AVC", noHorario: "Saíram no horário",
    atrasoSantaCasa: dividido ? `Atraso · Santa Casa pediu a ambulância depois de ${prazoTxt}` : "Atraso · Santa Casa demorou a pedir a ambulância",
    atrasoAmbulancia: dividido ? `Atraso · pedido no prazo, mas a ambulância saiu depois de ${metaTxt}` : `Atraso · ambulância saiu depois de ${metaTxt}` };

  const casos = avcSel && (() => {
    const itens = avcSel === "total" ? P.lista : P.lista.filter(c => c.cat === avcSel);
    const rel = m => m === null ? "" : m >= 0 ? ` (${fmtMin(m)} após a finalização)` : ` (${fmtMin(-m)} antes da finalização)`;
    const linha = (rot, valor, falta, extra) => h("div", { className: "dsh-list__m" + (falta ? " dsh-list__m--warn" : "") }, rot + ": ", h("b", null, valor), falta ? " — falta" : "", extra || "");
    return h(DashCard, { style: { marginTop: 16 } },
      h("div", { className: "dsh-title", style: { marginBottom: 8 } },
        h("div", { className: "dsh-title__t", style: { fontSize: 14 } }, TIT[avcSel], h("span", { className: "dsh-chip" }, `${itens.length} caso${itens.length !== 1 ? "s" : ""}`)),
        h("button", { type: "button", className: "dsh-btn dsh-btn--sm", onClick: () => setAvcSel(null) }, "Fechar")),
      h("ul", { className: "dsh-list" },
        itens.map((c, k) => h("li", { key: k, className: "dsh-list__i" },
          h("div", { className: "dsh-list__top", style: { justifyContent: "flex-start", marginBottom: 2 } },
            h("span", { className: "dsh-list__n" }, c.nome),
            c.ficha && h("span", { className: "dsh-sub" }, "ficha " + c.ficha),
            avcSel === "total" && c.cat && h("span", { className: "dsh-gchip", style: { color: SEL[c.cat][1], background: SEL[c.cat][2] } }, SEL[c.cat][0])),
          c.destino && h("div", { className: "dsh-list__m" }, "Destino: " + c.destino),
          linha("Finalização da CROSS", c.finTxt, c.faltaFin),
          linha("Solicitação da ambulância", c.pedTxt, false, rel(c.minPedido)),
          linha("Saída da ambulância", c.saiTxt, c.faltaSaida, rel(c.minSaida)),
          (c.minPedido !== null && c.minPedido >= 0 && c.minAmb !== null && c.minAmb >= 0) &&
            h("div", { style: { marginTop: 8 } }, h(DashMetaBar, { a: c.minPedido, b: c.minAmb, meta: c.meta, corte: c.prazo, rotA: "Santa Casa", rotB: "Ambulância", metaTxt: "meta " + fmtMin(c.meta) })),
          (c.medico || c.enfermeiro) && h("div", { className: "dsh-list__m" }, "Médico: " + (c.medico || "—") + " · Enfermeiro(a): " + (c.enfermeiro || "—"))))));
  })();

  return h(DashCard, { id: "bloco-avc" },
    titulo,
    h("div", { className: "dsh-chips", style: { marginBottom: 12 } },
      h("span", { className: "dsh-chip" }, "Meta total " + metaTxt),
      dividido
        ? h(React.Fragment, null,
            h("span", { className: "dsh-chip dsh-chip--warn" }, "Santa Casa pede em até " + prazoTxt),
            h("span", { className: "dsh-chip", style: { background: "#FFE4E6", color: "#9F1239" } }, "Ambulância: o resto até " + metaTxt))
        : h("span", { className: "dsh-chip" }, "Prazo próprio da Santa Casa não definido: as duas partes dividem a meta")),
    h(DashEmpilhada, { alto: "lg", segs: [
      { id: "noHorario", rot: "No horário", valor: P.noHorario, cor: "#16A34A" },
      { id: "atrasoSantaCasa", rot: "Atraso · Santa Casa", valor: P.atrasoSantaCasa, cor: "#D97706" },
      { id: "atrasoAmbulancia", rot: "Atraso · ambulância", valor: P.atrasoAmbulancia, cor: "#E11D48" },
      { id: "atrasoSemCausa", rot: "Atraso · causa não apurada", valor: P.atrasoSemCausa, cor: "#94A3B8" },
      { id: "semHorarios", rot: "Sem horário para medir", valor: P.semHorarios, cor: "#FCD34D" }] }),
    h("div", { className: "dsh-grid dsh-g4 dsh-grid--tight", style: { marginTop: 20 } },
      h(DashKpi, { label: "Protocolos de AVC", valor: P.total, cor: "#BE123C",
        sub: totalRemocoes ? `${(P.total / totalRemocoes * 100).toFixed(1).replace(".", ",")}% das linhas do período` : "",
        ativo: avcSel === "total", onClick: alterna("total"),
        tooltip: "Quantos pacientes de AVC (derrame) houve no período. Clique para ver todos." }),
      h(DashKpi, { label: "Saíram no horário", valor: P.noHorario, cor: "#15803D",
        sub: `${(P.noHorario / P.total * 100).toFixed(0)}% dos protocolos · até ${metaTxt}`,
        ativo: avcSel === "noHorario", onClick: P.noHorario ? alterna("noHorario") : undefined,
        tooltip: `A ambulância saiu em até ${metaTxt} depois que a CROSS finalizou a ficha. Cumpriu a meta.` }),
      h(DashKpi, { label: "Atraso · Santa Casa", valor: P.atrasoSantaCasa, cor: "#B45309", sub: dividido ? `pediu a ambulância depois de ${prazoTxt}` : "demorou a pedir a ambulância",
        alerta: P.atrasoSantaCasa > 0, ativo: avcSel === "atrasoSantaCasa", onClick: P.atrasoSantaCasa ? alterna("atrasoSantaCasa") : undefined,
        tooltip: `Passou da meta de ${metaTxt} e a Santa Casa levou mais de ${prazoTxt}, depois da finalização da CROSS, para pedir a ambulância.` }),
      h(DashKpi, { label: "Atraso · ambulância", valor: P.atrasoAmbulancia, cor: "#BE123C", sub: dividido ? "pedido no prazo, saída fora da meta" : `saiu depois de ${metaTxt}`,
        alerta: P.atrasoAmbulancia > 0, ativo: avcSel === "atrasoAmbulancia", onClick: P.atrasoAmbulancia ? alterna("atrasoAmbulancia") : undefined,
        tooltip: `Passou da meta de ${metaTxt} mesmo com a ambulância pedida em até ${prazoTxt}: quem demorou foi a saída da ambulância.` })),

    casos,

    h("div", { className: "dsh-sep" }),
    h("div", { className: "dsh-eyebrow", style: { marginBottom: 8 } }, "O tempo da meta dividido · quanto levou cada lado"),
    (P.santaCasa.mediana !== null && P.ambulancia.mediana !== null) &&
      h("div", { style: { marginBottom: 16 } }, h(DashMetaBar, { a: P.santaCasa.mediana, b: P.ambulancia.mediana, meta: P.metaMin, corte: P.prazoPedido, rotA: "Santa Casa", rotB: "Ambulância", metaTxt: "meta " + metaTxt })),
    h("div", { className: "dsh-grid dsh-g2 dsh-grid--tight", style: { marginBottom: 0 } },
      h(DashKpi, { label: "Santa Casa · finalização → solicitação", valor: fmtMin(P.santaCasa.mediana), cor: "#B45309",
        sub: P.santaCasa.n ? `mediana · ${P.santaCasa.n} com horário · maior: ${fmtMin(P.santaCasa.max)}` : "sem protocolos com os dois horários",
        tooltip: "O tempo do meio (mediana) entre a CROSS finalizar a ficha e a Santa Casa pedir a ambulância. É a parte do tempo que depende da Santa Casa. Entram só os pacientes que têm os dois horários." }),
      h(DashKpi, { label: "Ambulância · solicitação → saída", valor: fmtMin(P.ambulancia.mediana), cor: "#BE123C",
        sub: P.ambulancia.n ? `mediana · ${P.ambulancia.n} com horário · maior: ${fmtMin(P.ambulancia.max)}` : "sem protocolos com os dois horários",
        tooltip: `O tempo do meio (mediana) entre o pedido da ambulância e a saída dela. É a parte que depende do setor de ambulância. A meta de ${metaTxt} é a soma das duas partes.` })),

    (P.semHorarios > 0 || P.atrasoSemCausa > 0 || !P.prazoDefinido) && h("div", { className: "dsh-nota", style: { marginTop: 16 } },
      P.semHorarios > 0 && h("div", null,
        `${P.semHorarios} protocolo${P.semHorarios !== 1 ? "s" : ""} sem horário para medir (contam no total, mas não entram nas três categorias): ${P.semFinalizacao} sem finalização da CROSS · ${P.semSaida} sem data ou horário de saída da ambulância. Clique em “Protocolos de AVC” para ver quais.`),
      P.atrasoSemCausa > 0 && h("div", null,
        `${P.atrasoSemCausa} saíram depois de ${metaTxt}, mas sem o horário da solicitação da ambulância — a causa do atraso não pôde ser apurada.`),
      !P.prazoDefinido && h("div", null, "Dica: em Configurações, defina o prazo da Santa Casa para pedir a ambulância. Assim um pedido feito tarde não é contado como atraso do setor de ambulância.")));
}

/* ─── Onde o tempo é gasto: as etapas do caminho ──────────────────────────────
 * Estados (qual etapa/gravidade está aberta) ficam aqui dentro, pelo mesmo motivo do AVC. */
function DashTempos({ intervalos, total }) {
  const h = React.createElement, fmtMin = dashFmtMin;
  const [verTotal, setVerTotal] = useState(false);
  const [sel, setSel] = useState(null);     // id do intervalo aberto no modal
  const [gSel, setGSel] = useState(null);   // linha de gravidade aberta dentro do modal ("todas" ou o nome da gravidade)
  const entrou = useDashEntrou();
  const fechar = () => { setSel(null); setGSel(null); };
  const it = sel ? intervalos.find(i => i.id === sel) : null;

  const medidos = intervalos.filter(i => i.todas.mediana !== null && i.todas.mediana > 0);
  const segs = medidos.map(i => ({ id: i.id, rot: `${i.de} → ${i.ate}`, valor: i.todas.mediana, cor: i.cor, txt: fmtMin(i.todas.mediana) }));

  const linkLinha = (c, campo, curto) => c.id && h("a", { href: `remocao.html?foco=${encodeURIComponent(c.id)}&campo=${encodeURIComponent(campo || "nome_paciente")}`, className: "dsh-link" }, curto ? "abrir linha" : "abrir a linha na planilha", h(DashIcone, { n: "external", tam: 13 }));

  const modal = it && (() => {
    const grupos = [it.todas, ...it.grupos];
    const maxMed = Math.max(1, ...grupos.map(g => g.mediana || 0));
    const c0 = it.todas.casos[0];
    return h(DashModal, { titulo: it.rotulo, onClose: fechar, largura: 680,
      sub: h(React.Fragment, null, `Quanto tempo levou, por gravidade · ${it.dono} · mediana geral `, h("b", null, fmtMin(it.todas.mediana)), ` · ${it.todas.nPos} remoç${it.todas.nPos !== 1 ? "ões" : "ão"} medida${it.todas.nPos !== 1 ? "s" : ""}`) },
      c0 && h("div", { className: "dsh-banner", style: { background: "#FFF7ED", borderColor: "#FED7AA", color: "#7C2D12", marginBottom: 20, justifyContent: "space-between", flexWrap: "wrap" } },
        h("div", { style: { minWidth: 0 } },
          h("div", { className: "dsh-eyebrow", style: { color: "#9A3412" } }, "A remoção mais longa desta etapa"),
          h("div", { style: { marginTop: 4 } }, h("b", { style: { fontSize: 14 } }, c0.nome), c0.ficha && h("span", { className: "dsh-sub", style: { marginLeft: 6 } }, "ficha " + c0.ficha)),
          h("div", { className: "dsh-sub", style: { color: "#9A3412" } }, `${it.de} ${c0.de} → ${it.ate} ${c0.ate} · ${c0.grav}`),
          c0.min >= 2880 && h("div", { style: { fontSize: 12, marginTop: 6 } }, "Mais de 2 dias nesta etapa: vale conferir se não é erro de digitação em alguma data.")),
        h("div", { style: { textAlign: "right" } },
          h("div", { className: "dsh-num", style: { fontSize: 24, fontWeight: 700, color: "#9A3412" } }, fmtMin(c0.min)),
          linkLinha(c0, it.campo))),
      h("div", { className: "dsh-eyebrow", style: { marginBottom: 8 } }, "Por gravidade · clique para ver os casos"),
      h("div", { className: "dsh-rows" }, grupos.map(g => {
        const aberta = gSel === g.chave, clicavel = g.nPos > 0;
        const alterna = () => setGSel(aberta ? null : g.chave);
        return h("div", { key: g.chave },
          h("div", { role: clicavel ? "button" : undefined, tabIndex: clicavel ? 0 : undefined, "aria-expanded": clicavel ? aberta : undefined,
            onClick: clicavel ? alterna : undefined,
            onKeyDown: clicavel ? (e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alterna(); } }) : undefined,
            className: "dsh-linha", style: { cursor: clicavel ? "pointer" : "default", background: aberta ? "var(--bg)" : "transparent", borderRadius: 10, padding: "12px 10px", margin: "0 -10px" } },
            h("div", { className: "dsh-linha__n", style: { display: "flex", alignItems: "center", gap: 8, fontWeight: g.chave === "todas" ? 700 : 600 } },
              g.chave !== "todas" && h("span", { className: "dsh-dot", style: { background: g.cor } }),
              g.chave === "todas" ? "Todas" : g.chave,
              h("small", { style: { marginLeft: 4 } }, `${g.nPos} de ${g.total}`)),
            h("div", { className: "dsh-linha__bar" },
              h("div", { className: "dsh-track dsh-track--lg" }, h("i", { style: { width: entrou ? (g.mediana || 0) / maxMed * 100 + "%" : "0%", background: g.chave === "todas" ? "#0F172A" : g.cor } })),
              h("div", { className: "dsh-sub", style: { marginTop: 4 } }, g.nPos ? `maior ${fmtMin(g.max)}` : "sem medida", g.nPos && g.acima2h ? h("span", { style: { color: "var(--bad)", fontWeight: 600 } }, ` · ${g.acima2h} acima de 2h`) : null)),
            h("div", { className: "dsh-pct dsh-num", style: { color: g.nPos ? "var(--ink)" : "#CBD5E1" } }, fmtMin(g.mediana))),
          aberta && h("div", { style: { padding: "4px 0 12px" } },
            h("ul", { className: "dsh-list" },
              g.casos.slice(0, 60).map((c, k) => h("li", { key: k, className: "dsh-list__i", style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", padding: "8px 0" } },
                h("div", { style: { minWidth: 0 } },
                  h("span", { style: { fontSize: 13, fontWeight: 600 } }, c.nome),
                  c.ficha && h("span", { className: "dsh-sub", style: { marginLeft: 6 } }, "ficha " + c.ficha),
                  c.avc && h("span", { className: "dsh-gchip", style: { marginLeft: 7, background: "#FFE4E6", color: "#9F1239" } }, "AVC"),
                  g.chave === "todas" && h("span", { className: "dsh-sub", style: { marginLeft: 7 } }, c.grav),
                  h("div", { className: "dsh-list__m" }, `${it.de} ${c.de} → ${it.ate} ${c.ate}`)),
                h("div", { style: { textAlign: "right" } }, h("div", { className: "dsh-num", style: { fontWeight: 700, whiteSpace: "nowrap" } }, fmtMin(c.min)), linkLinha(c, it.campo, true))))),
            g.casos.length > 60 && h("div", { className: "dsh-nota" }, `e mais ${g.casos.length - 60} casos`)));
      })),
      h("div", { className: "dsh-nota", style: { marginTop: 12 } }, "“Medidas” são as remoções com os dois horários deste intervalo, na ordem certa. Só elas entram na mediana e no maior tempo. A barra mostra a mediana de cada gravidade."),
      (it.nNeg > 0 || it.nSem > 0) && h("div", { className: "dsh-nota", style: { marginTop: 8 } },
        it.nNeg > 0 && h("div", { className: "dsh-nota--warn" }, `${it.nNeg} remoç${it.nNeg !== 1 ? "ões" : "ão"} inconsistente${it.nNeg !== 1 ? "s" : ""} (um momento antes do anterior, ou 30 dias ou mais de diferença): conferir a digitação em “Saneamento de falhas”. Não entra${it.nNeg !== 1 ? "m" : ""} na conta.`),
        it.nSem > 0 && h("div", null, `${it.nSem} remoç${it.nSem !== 1 ? "ões" : "ão"} sem a data e o horário dos dois momentos: não entra${it.nSem !== 1 ? "m" : ""} na conta.`)));
  })();

  return h(React.Fragment, null,
    h(DashCard, { id: "bloco-tempos" },
      h(DashTitulo, {
        icone: "route",
        extra: "medianas · clique em uma etapa para ver por gravidade",
        tooltip: "Mostra em que parte do caminho o tempo é gasto. O caminho de uma remoção tem cinco momentos: pedido à CROSS → CROSS finaliza a ficha → Santa Casa pede a ambulância → ambulância sai → ambulância volta. Cada cartão é o tempo entre dois momentos seguidos, pelo tempo do meio (mediana). A faixa escura é o tempo do pedido até a volta, calculado remoção por remoção. As etapas não somam exatamente o total, porque cada uma usa só as remoções que têm os horários dela. Só entram remoções com data e horário dos dois momentos; se faltar algum, ou estiverem fora de ordem, o caso não entra e fica listado em Saneamento de falhas. O painel nunca completa nem adivinha um horário."
      }, "Onde o tempo é gasto"),
      segs.length > 0
        ? h(React.Fragment, null,
            h(DashEmpilhada, { alto: "lg", segs, legenda: false }),
            h("div", { className: "dsh-nota", style: { marginTop: 8 } }, "O tamanho de cada trecho é a mediana da etapa. As etapas não somam exatamente o tempo total: cada uma usa só as remoções que têm os seus horários."))
        : h(DashVazio, null, "Nenhuma etapa com os dois horários preenchidos no período."),
      h("div", { className: "dsh-grid dsh-g4 dsh-grid--tight", style: { marginTop: 20, marginBottom: 0 } },
        intervalos.map(i => h(DashCard, { key: i.id, onClick: () => setSel(i.id), className: i.nNeg > 0 ? "dsh-kpi dsh-kpi--alert" : "dsh-kpi" },
          h("span", { className: "dsh-kpi__bar", style: { background: i.cor } }),
          h("div", { className: "dsh-kpi__l", style: { marginTop: 4, marginBottom: 4 } }, i.rotulo, h(DashDica, { texto: i.tip + " Clique no cartão para ver a remoção mais longa e os tempos por gravidade.", rotulo: i.rotulo })),
          h("div", { className: "dsh-kpi__v dsh-num", style: { color: i.cor } }, fmtMin(i.todas.mediana)),
          h("div", { className: "dsh-kpi__s" },
            h("span", { className: "dsh-chip", style: { marginRight: 6 } }, i.dono),
            i.todas.nPos ? `${i.todas.nPos} com horário · maior ${fmtMin(i.todas.max)}` : "sem remoções com os dois horários"),
          (i.todas.acima2h > 0 || i.nNeg > 0) && h("div", { className: "dsh-chips", style: { marginTop: 8 } },
            i.todas.acima2h > 0 && h("span", { className: "dsh-chip dsh-chip--bad" }, `${i.todas.acima2h} acima de 2h`),
            i.nNeg > 0 && h("span", { className: "dsh-chip dsh-chip--warn" }, `${i.nNeg} inconsistente${i.nNeg !== 1 ? "s" : ""}`))))),
      h("div", { style: { marginTop: 16, padding: "16px 20px", background: "#0F172A", borderRadius: 14, color: "#F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" } },
        h("div", { style: { minWidth: 0 } },
          h("div", { style: { fontSize: 11, fontWeight: 650, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".05em" } }, "Tempo total · solicitação → retorno da ambulância"),
          h("div", { style: { fontSize: 12, color: "#94A3B8", marginTop: 2 } }, total.n ? `mediana de ${total.n} remoç${total.n !== 1 ? "ões" : "ão"} com todos os momentos preenchidos` : "nenhuma remoção com todos os momentos preenchidos")),
        h("div", { style: { display: "flex", alignItems: "center", gap: 16 } },
          total.top && total.top.length > 0 && h("button", { type: "button", onClick: () => setVerTotal(true), title: "Mostra as remoções mais longas, da solicitação até a volta da ambulância",
            className: "dsh-btn dsh-btn--sm", style: { background: "transparent", color: "#E2E8F0", borderColor: "#475569" } }, "Ver as mais longas"),
          h("div", { className: "dsh-num", style: { fontSize: 30, fontWeight: 700, letterSpacing: "-.02em" } }, fmtMin(total.mediana)))),
      h(DashLegenda, { itens: [
        ["Mediana (o número grande)", "O tempo do meio: metade das remoções levou menos que isso e metade levou mais. Um caso muito demorado não distorce."],
        ["Com horário", "Quantas remoções têm data e horário dos dois momentos da etapa. Só elas entram na conta."],
        ["Maior", "A remoção mais demorada daquela etapa. Clique no cartão para ver qual foi."],
        ["Acima de 2h", "Quantas remoções passaram de 2 horas naquela etapa."],
        ["Tempo total", "Da solicitação à CROSS até a ambulância voltar, remoção por remoção. Não é a soma das etapas."]] })),
    verTotal && h(DashListaModal, { titulo: "Remoções mais longas (solicitação → retorno)", subtitulo: "as 10 maiores do período, da mais longa para a menor", itens: total.top, onClose: () => setVerTotal(false) }),
    modal);
}

/* ─── Volume de remoções: gráfico misto (barras + duas linhas) ────────────────
 * Barras   = saídas da ambulância por dia (a remoção de fato)
 * Linha    = pedidos à CROSS por dia            (demanda)
 * Tracejada = finalizações da CROSS por dia     (quanto a CROSS libera)
 * Componente próprio, fora do Dashboard, pelo mesmo motivo dos outros: o estado de "o que está escondido" e "qual dia está
 * sob o cursor" fica aqui e não refaz a tela inteira. O contêiner é um <div> comum (não o Card do Dashboard, que muda de
 * identidade a cada renderização) para a medição de largura não se perder.                                              */
const DASH_VOL_SERIES = [
  { id: "saidas", nome: "Saídas da ambulância", cor: "#3B82F6" },
  { id: "pedidos", nome: "Pedidos à CROSS", cor: "#D97706" },
  { id: "finalizacoes", nome: "Finalizações da CROSS", cor: "#0F766E", tracejada: true }
];

function DashVolume({ serie, escala, rotulo, rotuloLongo, totais, notas }) {
  const h = React.createElement;
  const entrou = useDashEntrou();
  const [ocultas, setOcultas] = useState({});
  const [hover, setHover] = useState(null);
  const [larg, setLarg] = useState(720);
  const ref = React.useRef(null);
  const temDados = serie.length > 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setLarg(Math.max(280, Math.round(el.getBoundingClientRect().width)));
    medir();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", medir);
      return () => window.removeEventListener("resize", medir);
    }
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [temDados]);

  useEffect(() => { setHover(null); }, [serie]);

  const unidade = escala === "dia" ? "dia" : escala === "semana" ? "semana" : "mês";
  const titulo = h(DashTitulo, {
    icone: "bars",
    extra: escala === "dia" ? "por dia" : escala === "semana" ? "por semana" : "por mês",
    tooltip: "Três contagens, cada uma pelo seu próprio dia. Barras: quantas vezes a ambulância saiu da Santa Casa (pelo dia da saída). Linha laranja: quantos pedidos foram feitos à CROSS (pelo dia do pedido; só linhas com ficha CROSS). Linha verde tracejada: quantas fichas a CROSS finalizou (pelo dia da finalização), ou seja, quanto a CROSS libera por dia. Como cada série usa o seu dia, o mesmo paciente aparece em dias diferentes. Clique na legenda para esconder uma série; passe o mouse num dia para ver os números dele."
  }, "Volume de remoções");

  if (!temDados) return h(DashCard, { id: "bloco-volume" }, titulo, h(DashVazio, null, "Sem movimentação no período"));

  /* ── Geometria ── */
  const ALT = 230, MT = 14, MB = 30, ML = 30, MR = 8;
  const W = larg, innerW = W - ML - MR, innerH = ALT - MT - MB;
  const n = serie.length;
  const band = innerW / n;
  const visiveis = DASH_VOL_SERIES.filter(s => !ocultas[s.id]);
  const maxV = serie.reduce((m, pt) => visiveis.reduce((mm, s) => Math.max(mm, pt[s.id]), m), 0);
  const topo = Math.max(4, Math.ceil(maxV / 4) * 4);                 // múltiplo de 4: as 5 marcas do eixo são números inteiros
  const y = v => MT + innerH - (v / topo) * innerH;
  const cx = i => ML + band * i + band / 2;
  const barW = Math.max(4, Math.min(band * 0.62, 30));
  const base = MT + innerH;
  const p = hover !== null ? (serie[hover] || null) : null;
  const passoRotulo = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(innerW / 46))));
  const caminho = id => serie.map((pt, i) => `${i ? "L" : "M"}${cx(i).toFixed(1)},${y(pt[id]).toFixed(1)}`).join("");

  const swatch = s => h("svg", { width: 20, height: 12, viewBox: "0 0 20 12", "aria-hidden": "true", style: { flexShrink: 0 } },
    s.id === "saidas"
      ? h("rect", { x: 5, y: 1, width: 10, height: 10, rx: 2.5, fill: s.cor })
      : h("g", null,
          h("line", { x1: 0, x2: 20, y1: 6, y2: 6, stroke: s.cor, strokeWidth: 2, strokeDasharray: s.tracejada ? "4 3" : undefined, strokeLinecap: "round" }),
          s.tracejada
            ? h("rect", { x: 7, y: 3, width: 6, height: 6, rx: 1, fill: "#fff", stroke: s.cor, strokeWidth: 1.75 })
            : h("circle", { cx: 10, cy: 6, r: 3, fill: "#fff", stroke: s.cor, strokeWidth: 1.75 })));

  /* ── Legenda que também é o painel de números: mostra o total do período, ou o do dia sob o cursor ── */
  const legenda = h("div", null,
    h("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } },
      DASH_VOL_SERIES.map(s => {
        const off = !!ocultas[s.id];
        return h("button", {
          key: s.id, type: "button", "aria-pressed": !off,
          title: off ? "Mostrar no gráfico" : "Esconder do gráfico",
          onClick: () => setOcultas(o => Object.assign({}, o, { [s.id]: !o[s.id] })),
          style: { display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", border: "none", borderRadius: 10, cursor: "pointer",
                   fontFamily: "inherit", background: off ? "transparent" : "#F8FAFC", opacity: off ? 0.5 : 1, transition: "background .15s, opacity .15s" }
        },
          swatch(s),
          h("span", { style: { fontSize: 12, color: "#475569", textDecoration: off ? "line-through" : "none" } }, s.nome),
          h("span", { style: { fontSize: 15, fontWeight: 700, color: "#0F172A", fontVariantNumeric: "tabular-nums" } }, p ? p[s.id] : totais[s.id]));
      })),
    h("div", { style: { fontSize: 11, color: "#94A3B8", margin: "8px 0 10px", minHeight: 15 } },
      p ? rotuloLongo(p.k) : `Total do período · passe o mouse (ou toque) em um ${unidade} para ver os números dele`));

  /* ── Grade e eixo ── */
  const grade = [0, 1, 2, 3, 4].map(i => i * topo / 4).map(t => h("g", { key: "g" + t },
    h("line", { x1: ML, x2: W - MR, y1: y(t), y2: y(t), stroke: t === 0 ? "#E2E8F0" : "#F1F5F9", strokeWidth: 1 }),
    h("text", { x: ML - 6, y: y(t) + 3.5, textAnchor: "end", fontSize: 10, fill: "#94A3B8" }, t)));

  /* ── Barras: saídas ── */
  const barras = !ocultas.saidas && h("g", { key: "barras" },
    h("g", { style: { transform: entrou ? "scaleY(1)" : "scaleY(0)", transformBox: "fill-box", transformOrigin: "50% 100%", transition: "transform .7s cubic-bezier(.22,.9,.3,1)" } },
      serie.map((pt, i) => h("rect", {
        key: i, x: cx(i) - barW / 2, y: pt.saidas ? y(pt.saidas) : base - 2, width: barW, height: pt.saidas ? base - y(pt.saidas) : 2,
        rx: Math.min(4, barW / 2), fill: pt.saidas ? "#3B82F6" : "#E2E8F0", opacity: pt.saidas ? (hover === null || hover === i ? 0.9 : 0.55) : 1 }))),
    band >= 26 && h("g", { style: { opacity: entrou ? 1 : 0, transition: "opacity .5s ease .3s" } },
      serie.map((pt, i) => h("text", {
        key: i, x: cx(i), y: (pt.saidas ? y(pt.saidas) : base - 2) - 5, textAnchor: "middle", fontSize: 10,
        fill: pt.saidas ? "#64748B" : "#CBD5E1", style: { fontVariantNumeric: "tabular-nums" } }, pt.saidas))));

  /* ── Linhas: pedidos e finalizações ── */
  const linhas = DASH_VOL_SERIES.filter(s => s.id !== "saidas" && !ocultas[s.id]).map(s => h("g", {
    key: s.id, style: { opacity: entrou ? 1 : 0, transition: "opacity .6s ease .25s" } },
    h("path", { d: caminho(s.id), fill: "none", stroke: s.cor, strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round", strokeDasharray: s.tracejada ? "5 4" : undefined }),
    serie.map((pt, i) => {
      if (band < 14 && i !== hover) return null;
      const fill = i === hover ? s.cor : "#fff";
      return s.tracejada
        ? h("rect", { key: i, x: cx(i) - 3, y: y(pt[s.id]) - 3, width: 6, height: 6, rx: 1, fill, stroke: s.cor, strokeWidth: 1.75 })
        : h("circle", { key: i, cx: cx(i), cy: y(pt[s.id]), r: 3, fill, stroke: s.cor, strokeWidth: 1.75 });
    })));

  const rotulosX = serie.map((pt, i) => i % passoRotulo === 0 && h("text", {
    key: "x" + i, x: cx(i), y: ALT - 10, textAnchor: "middle", fontSize: 10, fill: hover === i ? "#0F172A" : "#94A3B8" }, rotulo(pt.k)));

  const areas = serie.map((pt, i) => h("rect", {
    key: "a" + i, x: ML + band * i, y: MT, width: band, height: innerH + MB - 6, fill: "transparent", style: { cursor: "pointer" },
    onMouseEnter: () => setHover(i), onClick: () => setHover(hover === i ? null : i) },
    h("title", null, `${rotuloLongo(pt.k)}: ${pt.saidas} saída${pt.saidas !== 1 ? "s" : ""} · ${pt.pedidos} pedido${pt.pedidos !== 1 ? "s" : ""} · ${pt.finalizacoes} finalizaç${pt.finalizacoes !== 1 ? "ões" : "ão"}`)));

  return h(DashCard, { id: "bloco-volume" },
    titulo,
    legenda,
    h("div", { ref, onMouseLeave: () => setHover(null), style: { width: "100%" } },
      h("svg", {
        width: "100%", height: ALT, viewBox: `0 0 ${W} ${ALT}`, role: "img",
        "aria-label": `Volume de remoções por ${unidade}: ${totais.saidas} saídas, ${totais.pedidos} pedidos e ${totais.finalizacoes} finalizações da CROSS no período.`,
        style: { display: "block", overflow: "visible" } },
        grade,
        hover !== null && h("rect", { x: ML + band * hover, y: MT, width: band, height: innerH, fill: "#F1F5F9", opacity: 0.7, rx: 6 }),
        barras,
        linhas,
        rotulosX,
        areas)),
    notas && notas.length > 0 && h("div", { style: { fontSize: 11, color: "#94A3B8", lineHeight: 1.6, marginTop: 8 } },
      notas.map((t, i) => h("div", { key: i }, t))),
    h(DashLegenda, { titulo: "O que cada série quer dizer", itens: [
      ["Saídas (barras)", "Quantas vezes a ambulância saiu da Santa Casa, contadas pelo dia da saída. Conta qualquer linha, CROSS ou outras."],
      ["Pedidos à CROSS (linha laranja)", "Quantos pedidos foram feitos à CROSS, contados pelo dia do pedido. Só linhas com o número da ficha CROSS."],
      ["Finalizações da CROSS (linha verde tracejada)", "Quantas fichas a CROSS finalizou, contadas pelo dia em que finalizou. Mostra o quanto a CROSS libera por dia."]] }));
}

/* ─── Saneamento de falhas ────────────────────────────────────────────────────
 * Substitui o pequeno bloco "valores a corrigir" e a parte do balão que contava esses valores.
 * O painel não completa nem adivinha dado. Tudo o que está incompleto, fora de ordem, fora da lista ou suspeito fica FORA da
 * conta e aparece aqui, com o link que abre a linha na planilha (remocao.html?foco=<id>&campo=<campo>).
 *   "corrigir"   = dado errado ou faltando, que distorce algum número
 *   "acompanhar" = pode ser normal (ainda aguardando), mas vale conferir
 * Componente próprio, fora do Dashboard, pelo mesmo motivo dos outros: abrir/fechar uma lista não refaz a tela.        */
const DASH_SANEAMENTO_SECOES = [
  { id: "fila",    titulo: "Fila e tarefas" },
  { id: "livro",   titulo: "Livro de Saída" },
  { id: "datas",   titulo: "Datas e horários" },
  { id: "fichas",  titulo: "Fichas CROSS e tipo da remoção" },
  { id: "listas",  titulo: "Valores fora da lista" },
  { id: "vazios",  titulo: "Campos vazios que distorcem indicadores" },
  { id: "avc",     titulo: "Protocolo de AVC" },
  { id: "kanban",  titulo: "Kanban" },
  { id: "aguarda", titulo: "Aguardando · pode ser normal" }
];
const DASH_CAMPOS_LISTA = [
  ["especialidade", "Especialidade"], ["instituicao_destino", "Instituição de destino"],
  ["status", "Status"], ["gravidade", "Gravidade"], ["tipo_ambulancia", "Tipo de ambulância"]
];
const DASH_PROBLEMAS_DEF = [
  { id: "sem_data_sol", secao: "datas", tipo: "corrigir", titulo: "Sem data de solicitação",
    ajuda: "A linha não pertence a período nenhum e fica fora das contagens por dia. Preencha DATA SOLIC. Esta lista olha a base inteira, não só o período escolhido." },
  { id: "data_impossivel", secao: "datas", tipo: "corrigir", titulo: "Data impossível (antes de 2020 ou depois de hoje)",
    ajuda: "Provável erro de digitação no dia, no mês ou no ano (ex.: 0002 ou 1984). A linha não entra em período nenhum e distorce gráficos e tempos. Esta lista olha a base inteira, não só o período escolhido." },
  { id: "fin_incompleta", secao: "datas", tipo: "corrigir", titulo: "Finalização da CROSS incompleta",
    ajuda: "Tem a data ou o horário da finalização, falta o outro. Sem os dois, a finalização não conta." },
  { id: "ped_incompleto", secao: "datas", tipo: "corrigir", titulo: "Solicitação da ambulância incompleta",
    ajuda: "Tem a data ou o horário (DATA/HORA SOLIC. AMB.), falta o outro. O tempo até a saída não pode ser medido." },
  { id: "saida_sem_data", secao: "datas", tipo: "corrigir", titulo: "Horário de saída sem data de saída",
    ajuda: "A saída não conta nas barras nem nos tempos. Preencha DATA SAÍDA AMB." },
  { id: "saida_sem_horario", secao: "datas", tipo: "corrigir", titulo: "Data de saída sem horário de saída",
    ajuda: "A saída não conta nas barras nem nos tempos. Preencha SAÍDA AMB. SCFM." },
  { id: "saida_deduzida", secao: "datas", tipo: "corrigir", titulo: "Data de saída deduzida (não confirmada)",
    ajuda: "A planilha preencheu DATA SAÍDA AMB. por dedução: ela não foi digitada nem confirmada pelo Livro de Saída. A saída conta nesse dia porque está na planilha, mas confira. Ao confirmar no Livro de Saída, a marca de dedução some." },
  { id: "saida_sem_pedido", secao: "datas", tipo: "corrigir", titulo: "Saída da ambulância sem solicitação da ambulância",
    ajuda: "Sem DATA/HORA SOLIC. AMB. não dá para medir a espera pela ambulância." },
  { id: "ret_incompleto", secao: "datas", tipo: "corrigir", titulo: "Retorno da ambulância incompleto",
    ajuda: "Tem a data ou o horário do retorno, falta o outro. A duração da remoção não pode ser medida." },
  { id: "retorno_deduzido", secao: "datas", tipo: "corrigir", titulo: "Data de retorno deduzida (não confirmada)",
    ajuda: "A planilha preencheu DATA RETORNO por dedução: ela não foi digitada nem confirmada pelo Livro de Saída. Confira a data. Ao confirmar no Livro de Saída, a marca de dedução some." },
  { id: "cross_saida_sem_fin", secao: "datas", tipo: "corrigir", titulo: "Ambulância saiu, mas a CROSS não finalizou",
    ajuda: "Linha com ficha CROSS e saída registrada, mas sem data e hora de finalização. Falta preencher a finalização?" },
  { id: "ordem", secao: "datas", tipo: "corrigir", titulo: "Horários fora de ordem",
    ajuda: "Um momento aparece antes do anterior, ou com mais de 30 dias de diferença. Provável erro de digitação; esse intervalo fica fora dos tempos." },

  { id: "interno_sem_motivo", secao: "fichas", tipo: "acompanhar", titulo: "Tempo interno longo, sem motivo informado",
    ajuda: "O tempo entre a finalização da CROSS e o pedido da ambulância passou do limite que você definiu em Configurações e a linha não tem o MOTIVO DO TEMPO INTERNO. Preencha para o painel mostrar onde o tempo é perdido." },
  { id: "tempo_suspeito", secao: "datas", tipo: "acompanhar", titulo: "Etapa com tempo suspeito (confira a digitação)",
    ajuda: "Alguma etapa passou do limite de horas que você definiu em Configurações. Pode ser um caso real muito demorado ou um erro de data. O painel NÃO tira a linha da conta: confira e corrija se for erro." },
  { id: "status_conflito", secao: "fichas", tipo: "corrigir", titulo: "Status diz que não houve remoção, mas há saída registrada",
    ajuda: "O status da planilha (cancelada, evasão, alta, reinserida…) contradiz a saída da ambulância. No painel vale a saída; corrija o status ou a saída." },
  { id: "reinsercao_texto", secao: "fichas", tipo: "acompanhar", titulo: "Reinserção só citada na observação",
    ajuda: "A observação fala em reinserção, mas o status não é REINSERIDA. O painel conta esta linha pelo texto livre e avisa o gestor. Troque o status para REINSERIDA para a contagem ficar estruturada." },
  { id: "ficha_formato", secao: "fichas", tipo: "corrigir", titulo: "Nº da ficha CROSS fora do padrão",
    ajuda: "O padrão é SS-número-número (ex.: SS-14774045-26). Mesmo assim a linha conta como remoção CROSS. Confira se é mesmo uma ficha." },
  { id: "ficha_repetida", secao: "fichas", tipo: "corrigir", titulo: "Ficha CROSS repetida",
    ajuda: "A mesma ficha em mais de uma linha conta duas vezes. Se for duplicidade, apague uma; se forem remoções diferentes, confira o número." },
  { id: "fin_sem_ficha", secao: "fichas", tipo: "corrigir", titulo: "Finalização da CROSS, mas sem Nº da ficha",
    ajuda: "A linha conta como “outra remoção”, mas tem data e hora de finalização da CROSS. Provavelmente falta o Nº da ficha." },
  { id: "emerg_pendente", secao: "fila", tipo: "atencao", titulo: "Emergências aguardando aceite",
    ajuda: "Cards de gravidade Emergência na coluna Pendente de aceite." },
  { id: "discrepancia_fila", secao: "fila", tipo: "atencao", titulo: "Discrepâncias de fila",
    ajuda: "Paciente menos grave com aceite confirmado, na mesma especialidade de outro mais grave ainda pendente, sem avaliação médica registrada. Pode indicar inversão de fila. Quem tem permissão registra a razão clínica em “Justificar”." },
  { id: "tarefas", secao: "fila", tipo: "acompanhar", titulo: "Tarefas de enfermagem pendentes",
    ajuda: "Tarefas pendentes, iniciadas ou pausadas. Abra o painel de tarefas para atualizar." },
  { id: "livro_pendente", secao: "livro", tipo: "corrigir", titulo: "Saídas no Livro aguardando vínculo com a planilha",
    ajuda: "A ambulância saiu e o Livro de Saída registrou, mas a entrada ainda não foi ligada a uma linha da planilha. Enquanto isso o painel NÃO enxerga essa saída: ela não entra nas barras, nos tempos nem nos indicadores. Abra o Livro de Saída e vincule." },
  { id: "livro_independente", secao: "livro", tipo: "acompanhar", titulo: "Saídas no Livro marcadas como “Sem vínculo”",
    ajuda: "Alguém decidiu que a entrada não tem linha na planilha. O painel não conta essa saída. Confirme que é isso mesmo; se a remoção existe na planilha, desfaça o “Sem vínculo” e vincule." }
].concat(DASH_CAMPOS_LISTA.map(([campo, rot]) => ({
  id: "cls_" + campo, secao: "listas", tipo: "corrigir", titulo: rot + " fora da lista",
  ajuda: "O valor não está na lista oficial e aparece como “Não classificado” nos gráficos. Troque por um valor da lista, na planilha."
}))).concat([
  { id: "vazio_tipo_amb", secao: "vazios", tipo: "corrigir", titulo: "Ambulância saiu sem tipo de ambulância",
    ajuda: "Sem o tipo (Básica ou Avançada) a saída não entra no gráfico de tipo de ambulância. Preencha TIPO AMB." },
  { id: "vazio_gravidade", secao: "vazios", tipo: "corrigir", titulo: "Sem gravidade",
    ajuda: "A linha fica de fora dos gráficos de gravidade e dos tempos por gravidade. Preencha GRAVIDADE (prioridade da ficha: 1 Vermelho, 2 Amarelo, 3 Verde, 4 Cinza)." },
  { id: "vazio_destino", secao: "vazios", tipo: "corrigir", titulo: "Finalizada pela CROSS, sem instituição de destino",
    ajuda: "Linha CROSS com finalização, que não foi cancelada nem resolvida no local, e sem INSTITUIÇÃO DESTINO. A linha fica fora do gráfico de destinos." },

  { id: "avc_sem_medida", secao: "avc", tipo: "corrigir", titulo: "Protocolo de AVC sem dados para medir a meta do AVC",
    ajuda: "Para medir a meta é preciso a finalização da CROSS e a saída da ambulância, cada uma com data e horário." },
  { id: "avc_sem_equipe", secao: "avc", tipo: "corrigir", titulo: "Protocolo de AVC que saiu sem médico ou enfermeiro(a)",
    ajuda: "O protocolo exige médico e enfermeiro(a) na ambulância. “Sem médico” e “Sem enfermeiro(a)” contam como falta. Hoje essa conferência só existe na tela do Livro de Saída; o servidor ainda não recusa." },

  { id: "kanban_sem_hospital", secao: "kanban", tipo: "corrigir", titulo: "Aceitos no Kanban sem hospital de destino",
    ajuda: "Cards nas colunas de aceite sem “Hospital de destino”. Abra o card no Kanban e preencha. Não há link direto para o card." },

  { id: "aguarda_cross", secao: "aguarda", tipo: "acompanhar", titulo: "Aguardando a CROSS finalizar",
    ajuda: "Pedidos à CROSS sem finalização e sem saída. Normal enquanto a CROSS não responde; se já respondeu, preencha a finalização." },
  { id: "aguarda_amb", secao: "aguarda", tipo: "acompanhar", titulo: "Finalizados, aguardando a ambulância",
    ajuda: "Pedidos CROSS com finalização e ainda sem saída de ambulância. Normal enquanto a ambulância não sai; se já saiu, preencha a saída." }
]);


/* ═══════════════════════════════════════════════════════════════════════════════
   BLOCOS DE GESTÃO (out/2026)
   Regra de sempre: só números da planilha, do Kanban e das metas que o gestor cadastrou. Nada de dado inventado.
   Metas, limites e frota vêm da tabela `painel_config` (cada valor com a data em que passa a valer).
   ═══════════════════════════════════════════════════════════════════════════════ */
const DASH_DATA_MIN = "2020-01-01";   // antes disto a data é impossível (erro de digitação)
const DASH_CARTAO = { background: "#fff", border: "1px solid #E8EDF3", borderRadius: 14, padding: "16px 18px", marginBottom: 18 };

const DASH_CFG_CHAVES = [
  { chave: "frota_basica",               grupo: "frota",  rotulo: "Ambulâncias básicas",                   unid: "",    inteiro: true },
  { chave: "frota_avancada",             grupo: "frota",  rotulo: "Ambulâncias avançadas",                 unid: "",    inteiro: true },
  { chave: "sla_vermelho_min",           grupo: "sla",    rotulo: "Vermelho: sair em até",                 unid: "min" },
  { chave: "sla_amarelo_min",            grupo: "sla",    rotulo: "Amarelo: sair em até",                  unid: "min" },
  { chave: "sla_verde_min",              grupo: "sla",    rotulo: "Verde: sair em até",                    unid: "min" },
  { chave: "sla_cinza_min",              grupo: "sla",    rotulo: "Cinza: sair em até",                    unid: "min" },
  { chave: "alerta_espera_min",          grupo: "alerta", rotulo: "Paciente aguardando há mais de",        unid: "min" },
  { chave: "alerta_espera_vermelho_min", grupo: "alerta", rotulo: "Vermelho aguardando há mais de",        unid: "min" },
  { chave: "alerta_sem_atualizacao_h",   grupo: "alerta", rotulo: "Card sem atualização há mais de",       unid: "h" },
  { chave: "motivo_obrigatorio_acima_min", grupo: "dados", rotulo: "Tempo interno acima de (exige motivo)", unid: "min" },
  { chave: "limite_suspeito_h",          grupo: "dados",  rotulo: "Etapa acima de (confira a digitação)",  unid: "h" },
  { chave: "avc_meta_min",               grupo: "avc",    rotulo: "AVC: tempo total até a ambulância sair", unid: "min" },
  { chave: "avc_prazo_pedido_min",       grupo: "avc",    rotulo: "AVC: prazo da Santa Casa para pedir a ambulância", unid: "min" }
];
const DASH_CFG_DICA = {
  frota_basica: "Quantas ambulâncias básicas (técnico e motorista) a Santa Casa tem a partir da data escolhida lá em cima. Quando a quantidade mudar, registre a nova com a nova data: o histórico fica guardado.",
  frota_avancada: "Quantas ambulâncias avançadas (com médico a bordo) a Santa Casa tem a partir da data escolhida lá em cima.",
  sla_vermelho_min: "Tempo máximo aceito, em minutos, entre a CROSS finalizar a ficha e a ambulância sair, para pacientes vermelhos. O painel usa para dizer quantas remoções saíram dentro ou fora da meta.",
  sla_amarelo_min: "Tempo máximo aceito, em minutos, entre a CROSS finalizar a ficha e a ambulância sair, para pacientes amarelos.",
  sla_verde_min: "Tempo máximo aceito, em minutos, entre a CROSS finalizar a ficha e a ambulância sair, para pacientes verdes.",
  sla_cinza_min: "Tempo máximo aceito, em minutos, entre a CROSS finalizar a ficha e a ambulância sair, para pacientes cinza (agendamento).",
  alerta_espera_min: "Se um paciente do Kanban esperar mais do que isso (em minutos), o painel acende o alerta de espera.",
  alerta_espera_vermelho_min: "O mesmo alerta, só para pacientes vermelhos, que costumam ter um limite menor.",
  alerta_sem_atualizacao_h: "Se o card de um paciente que aguarda ficar parado, sem ninguém mexer, por mais horas do que isso, o painel avisa.",
  motivo_obrigatorio_acima_min: "Se a espera entre a CROSS finalizar a ficha e a Santa Casa pedir a ambulância passar disto (em minutos), o painel cobra que o motivo seja preenchido na planilha. Sem valor, não cobra.",
  limite_suspeito_h: "Se alguma etapa de uma remoção passar de tantas horas, o painel avisa para conferir se não é erro de digitação. A remoção continua entrando na conta. Sem valor, não avisa.",
  avc_meta_min: "Tempo máximo, em minutos, entre a CROSS finalizar a ficha de um AVC e a ambulância sair da Santa Casa. Sem valor, vale 60 (1 hora).",
  avc_prazo_pedido_min: "Parte desse tempo que é só da Santa Casa: o prazo, em minutos, para pedir a ambulância depois da finalização da CROSS. Se a Santa Casa pedir depois desse prazo e a ambulância sair fora da meta, o atraso conta para a Santa Casa. Se pedir dentro do prazo, conta para o setor de ambulância. Precisa ser menor ou igual ao tempo total. Sem valor, as duas partes dividem o tempo total, como antes."
};
const DASH_CFG_ROTULO = DASH_CFG_CHAVES.reduce((a, c) => { a[c.chave] = c.rotulo + (c.unid ? " (" + c.unid + ")" : ""); return a; }, {});

function dashFmtBR(d) { const m = String(d || "").match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(d || ""); }
function dashMediana(arr) { if (!arr.length) return null; const o = [...arr].sort((a, b) => a - b); return o[Math.floor(o.length / 2)]; }
function dashPercentil(arr, p) { if (!arr.length) return null; const o = [...arr].sort((a, b) => a - b); return o[Math.max(0, Math.min(o.length - 1, Math.ceil(p / 100 * o.length) - 1))]; }
/* Valor da configuração que valia em `dia` (a última entrada com vigente_desde <= dia). cfg já vem ordenada por data. */
function dashCfgEm(cfg, chave, dia) {
  let v = null;
  for (const c of cfg) if (c.chave === chave && String(c.vigente_desde).slice(0, 10) <= dia) v = c;
  return v;
}
/* "29/09/2026" + "08:33" -> milissegundos (null se faltar um dos dois). Datas do Kanban são texto dd/mm/aaaa. */
function dashTsKanban(d, hh) {
  const m = String(d || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/), t = String(hh || "").trim().match(/^(\d{1,2}):(\d{2})/);
  return (m && t) ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(t[1]), Number(t[2])).getTime() : null;
}
/* Pacientes aguardando = cards do Kanban nas colunas Pendente de aceite (espera conta desde a SOLICITAÇÃO na CROSS) e Aceite
 * confirmado (conta desde a FINALIZAÇÃO da CROSS). Sem o horário de início, o card aparece como "sem horário" e não entra em maior espera. */
const DASH_COLUNAS_AGUARDANDO = { pendente: "Aguardando aceite", aceite: "Aceito, aguardando ambulância" };
function dashAguardando(cards, agora, cfg, hojeIso) {
  const lim = chave => { const c = dashCfgEm(cfg, chave, hojeIso); return c ? Number(c.valor) : null; };
  const limEspera = lim("alerta_espera_min"), limVerm = lim("alerta_espera_vermelho_min"), limAtual = lim("alerta_sem_atualizacao_h");
  const itens = (cards || []).filter(c => DASH_COLUNAS_AGUARDANDO[c.col_id]).map(c => {
    const t0 = c.col_id === "pendente" ? dashTsKanban(c.adm, c.hora_adm) : dashTsKanban(c.data_resolucao, c.hora_resolucao);
    const min = t0 === null ? null : Math.max(0, Math.round((agora - t0) / 60000));
    const parado = c.updated_at ? (agora - new Date(c.updated_at).getTime()) / 3600000 : null;
    return { c, min, vermelho: c.grav === "emergencia", parado };
  });
  return {
    itens, limEspera, limVerm, limAtual,
    acima: limEspera === null ? null : itens.filter(i => i.min !== null && i.min > limEspera),
    acimaVerm: limVerm === null ? null : itens.filter(i => i.vermelho && i.min !== null && i.min > limVerm),
    semAtualizacao: limAtual === null ? null : itens.filter(i => i.parado !== null && i.parado > limAtual)
  };
}
function dashRotuloCanon(C, campo, v, vazio) {
  if (!C) return String(v || "").trim() || vazio;
  const r = C.classificar(campo, v);
  if (r.canonico === C.NAO_INFORMADO) return vazio;
  if (r.canonico === C.NAO_CLASSIFICADO) return String(v).trim() + " (fora da lista)";
  return r.canonico;
}


/* ─── Saneamento de falhas ────────────────────────────────────────────────────
 * O painel não completa nem adivinha dado. Tudo o que está incompleto, fora de ordem, fora da lista ou suspeito fica FORA da
 * conta e aparece aqui, com o link que abre a linha na planilha (remocao.html?foco=<id>&campo=<campo>).
 *   "corrigir"   = dado errado ou faltando, que distorce algum número
 *   "atencao"    = fila e emergência
 *   "acompanhar" = pode ser normal (ainda aguardando), mas vale conferir                                              */
function DashSaneamento({ grupos, total, onAbrirCard, onAbrirAcoes, onAbrirLivro, onJustificar, podeJustificar }) {
  const h = React.createElement;
  const [expandido, setExpandido] = useState(false);   // começa recolhido: só o resumo por seção
  const [aberto, setAberto] = useState(null);          // id do grupo com a lista aberta
  const entrou = useDashEntrou();
  const LIMITE = 150;
  const comItens = grupos.filter(g => g.itens.length);
  const soma = tipo => comItens.filter(g => g.tipo === tipo).reduce((t, g) => t + g.itens.length, 0);
  const nCorr = soma("corrigir"), nAtenc = soma("atencao"), nAcomp = soma("acompanhar");
  const alerta = nCorr + nAtenc > 0;
  const COR = { corrigir: ["#92400E", "#FEF3C7"], atencao: ["#B91C1C", "#FEE2E2"], acompanhar: ["#475569", "#F1F5F9"] };
  const secs = DASH_SANEAMENTO_SECOES.map(sec => {
    const gs = comItens.filter(g => g.secao === sec.id);
    return { sec, gs, n: gs.reduce((t, g) => t + g.itens.length, 0) };
  }).filter(x => x.gs.length);
  const maxN = Math.max(1, ...secs.map(x => x.n));

  const grupo = g => {
    const ab = aberto === g.id, [corTxt, corBg] = COR[g.tipo];
    return h("div", { key: g.id, className: "dsh-san__g" },
      h("button", { type: "button", className: "dsh-san__gb", "aria-expanded": ab, onClick: () => setAberto(ab ? null : g.id) },
        h("span", null, g.titulo),
        h("span", { className: "dsh-count", style: { color: corTxt, background: corBg } }, g.itens.length),
        h("span", { style: { color: "var(--faint)", display: "inline-flex", transform: ab ? "rotate(180deg)" : "none", transition: "transform .15s" } }, h(DashIcone, { n: "chevron", tam: 16 }))),
      ab && h("div", { style: { padding: "0 2px 16px" } },
        h("div", { className: "dsh-sub", style: { marginBottom: 8 } }, g.ajuda),
        g.itens.slice(0, LIMITE).map((p, i) => {
          const botoes = [];
          if (p.justificar && podeJustificar && onJustificar) botoes.push(["Justificar", () => onJustificar(p.justificar), true]);
          if (p.card && onAbrirCard) botoes.push(["abrir card", () => onAbrirCard(p.card)]);
          if (p.tarefas && onAbrirAcoes) botoes.push(["abrir tarefas", () => onAbrirAcoes()]);
          if (p.livro && onAbrirLivro) botoes.push(["abrir o Livro", () => onAbrirLivro()]);
          const comLink = !!p.campo;
          const corpo = [
            h("span", { key: "n", style: { fontWeight: 600, color: "var(--ink)" } }, p.nome),
            p.ficha && h("span", { key: "f", className: "dsh-sub" }, p.ficha),
            h("span", { key: "m", style: { flex: "1 1 220px", color: "var(--muted)" } }, p.motivo),
            comLink && h("span", { key: "l", className: "dsh-link", style: { marginLeft: "auto", color: corTxt } }, g.tipo === "corrigir" ? "corrigir" : "abrir", h(DashIcone, { n: "external", tam: 13 })),
            botoes.map(([rot, fn, forte], k) => h("button", { key: "b" + k, type: "button", onClick: fn,
              className: "dsh-btn dsh-btn--sm" + (forte ? " dsh-btn--primary" : ""), style: { marginLeft: k === 0 && !comLink ? "auto" : 0 } }, rot))
          ];
          return comLink
            ? h("a", { key: i, className: "dsh-san__item", href: `remocao.html?foco=${encodeURIComponent(p.id)}&campo=${encodeURIComponent(p.campo)}` }, corpo)
            : h("div", { key: i, className: "dsh-san__item" }, corpo);
        }),
        g.itens.length > LIMITE && h("div", { className: "dsh-nota", style: { padding: "6px 8px" } }, `Mostrando ${LIMITE} de ${g.itens.length}. Corrija estas e a lista avança.`)));
  };

  return h(DashCard, { id: "bloco-saneamento", className: alerta ? "dsh-card--warn" : "" },
    h(DashTitulo, {
      icone: "wrench",
      extra: comItens.length
        ? h("button", { type: "button", className: "dsh-btn dsh-btn--sm", "aria-expanded": expandido, onClick: () => setExpandido(v => !v) }, expandido ? "Recolher" : "Ver detalhes",
            h("span", { style: { display: "inline-flex", transform: expandido ? "rotate(180deg)" : "none", transition: "transform .15s" } }, h(DashIcone, { n: "chevron", tam: 14 })))
        : "nada a corrigir",
      tooltip: "Tudo o que, na planilha, no Kanban, no Livro de Saída e nas tarefas, está faltando, incompleto, fora de ordem, fora da lista ou pedindo atenção, e poderia distorcer os números ou atrasar o paciente. O painel não completa nem adivinha: o que está com problema fica fora da conta e aparece aqui, com link ou botão para abrir o caso. “Para atender” é fila e emergência; “aguardando” é o que pode ser normal, mas vale conferir. Uma mesma linha pode aparecer em mais de uma lista."
    }, "Saneamento de falhas"),
    comItens.length === 0
      ? h(DashVazio, { ok: true }, `Nenhuma falha encontrada nas ${total} linhas do período.`)
      : h(React.Fragment, null,
          h(DashEmpilhada, { alto: "lg", segs: [
            { id: "corrigir", rot: "para corrigir", valor: nCorr, cor: "#D97706" },
            { id: "atencao", rot: "para atender", valor: nAtenc, cor: "#DC2626" },
            { id: "acompanhar", rot: "para acompanhar", valor: nAcomp, cor: "#94A3B8" }] }),
          !expandido
            ? h("div", { className: "dsh-grid dsh-g3 dsh-grid--tight", style: { marginTop: 20, marginBottom: 0 } },
                secs.map(({ sec, gs, n }) => h("button", { key: sec.id, type: "button", className: "dsh-san__sec", title: "Abrir os casos desta seção",
                  onClick: () => { setExpandido(true); setAberto(gs[0].id); } },
                  h("span", { style: { flex: 1, minWidth: 0 } },
                    h("b", null, sec.titulo),
                    h("span", { className: "dsh-track dsh-track--sm", style: { display: "block", marginTop: 8 } },
                      h("i", { style: { width: entrou ? n / maxN * 100 + "%" : "0%", background: sec.id === "aguarda" ? "#94A3B8" : "#D97706" } }))),
                  h("span", { className: "dsh-num", style: { fontSize: 20, fontWeight: 700 } }, n))))
            : secs.map(({ sec, gs, n }) => h("div", { key: sec.id },
                h("div", { className: "dsh-san__h", style: sec.id === "aguarda" ? { color: "var(--muted)" } : null }, h("span", null, sec.titulo), h("span", null, n)),
                gs.map(grupo)))));
}

/* ─── Tempo interno por motivo ─────────────────────────────────────────────── */
function DashMotivos({ linhas, limMotivo }) {
  const h = React.createElement, fmtMin = dashFmtMin, entrou = useDashEntrou();
  const lista = (typeof Canon !== "undefined" && Canon.MOTIVOS_TEMPO_INTERNO) || [];
  const com = linhas.filter(t => t.interno !== null);
  const g = {};
  com.forEach(t => {
    const nome = !t.motivo ? "Sem motivo informado" : (lista.includes(t.motivo) ? t.motivo : t.motivo + " (fora da lista)");
    const x = g[nome] || (g[nome] = { nome, v: [], sem: !t.motivo });
    x.v.push(t.interno);
  });
  const total = com.reduce((t, x) => t + x.interno, 0);
  const PAL = ["#B45309", "#0369A1", "#7C3AED", "#0F766E", "#BE123C", "#4D7C0F", "#C2410C", "#1D4ED8"];
  const rows = Object.values(g).map(x => ({ nome: x.nome, sem: x.sem, n: x.v.length, soma: x.v.reduce((a, b) => a + b, 0), mediana: dashMediana(x.v), maior: Math.max(...x.v) }))
    .sort((a, b) => b.soma - a.soma);
  rows.forEach((r, i) => { r.cor = r.sem ? "#CBD5E1" : PAL[i % PAL.length]; });
  const informados = com.filter(t => t.motivo).length;
  return h(DashCard, { id: "bloco-motivos" },
    h(DashTitulo, {
      icone: "hourglass",
      extra: com.length ? `${informados} de ${com.length} com motivo` : "",
      tooltip: "Tempo interno é o que passa entre a CROSS finalizar a ficha e a Santa Casa pedir a ambulância: depende só da Santa Casa. Aqui ele é separado pelo motivo anotado na planilha. “% do tempo” é a parte de cada motivo no total de tempo interno do período. Linhas sem motivo aparecem juntas, para você ver quanto falta preencher."
    }, "Tempo interno por motivo"),
    com.length === 0 ? h(DashVazio, null, "Sem remoções com o tempo interno medido no período") : h(React.Fragment, null,
      h(DashEmpilhada, { alto: "lg", legenda: false, segs: rows.map(r => ({ id: r.nome, rot: r.nome, valor: r.soma, cor: r.cor, txt: Math.round(r.soma / total * 100) + "%" })) }),
      h("div", { className: "dsh-rows", style: { marginTop: 16 } },
        rows.map(r => h("div", { key: r.nome, className: "dsh-linha dsh-linha--motivos" },
          h("div", { className: "dsh-linha__n", style: { display: "flex", gap: 8, alignItems: "flex-start" } },
            h("span", { className: "dsh-dot", style: { background: r.cor, marginTop: 6 } }),
            h("span", { style: { color: r.sem ? "var(--warn)" : "var(--ink)" } }, r.nome,
              h("small", null, `${r.n} caso${r.n !== 1 ? "s" : ""} · mediana ${fmtMin(r.mediana)} · maior ${fmtMin(r.maior)}`))),
          h("div", { className: "dsh-linha__bar" }, h("div", { className: "dsh-track" }, h("i", { style: { width: entrou ? (total ? r.soma / total * 100 : 0) + "%" : "0%", background: r.cor } }))),
          h("div", { className: "dsh-pct dsh-num" }, total ? Math.round(r.soma / total * 100) + "%" : "—")))),
      h("div", { className: "dsh-nota", style: { marginTop: 12 } },
        limMotivo === null ? "Para o painel cobrar o motivo quando o tempo interno ficar longo, defina o limite em Configurações (“Tempo interno acima de”)."
          : `Linhas com tempo interno acima de ${fmtMin(limMotivo)} e sem motivo aparecem em Saneamento de falhas.`)),
    com.length > 0 && h(DashLegenda, { itens: [
      ["Motivo", "A razão anotada na planilha para a espera entre a CROSS finalizar a ficha e a Santa Casa pedir a ambulância. “Sem motivo informado” são as linhas ainda não preenchidas."],
      ["Mediana", "O tempo do meio dessa espera, nas remoções com esse motivo. Metade esperou menos, metade esperou mais."],
      ["Maior", "A espera mais longa entre as remoções com esse motivo."],
      ["% do tempo", "A parte do tempo interno total do período que esse motivo consumiu. Os motivos estão ordenados do que mais consome ao que menos consome."]] }));
}

/* ─── Frota e capacidade ─────────────────────────────────────────────────────── */
function DashFrota({ frota, fora, longas, cobertura }) {
  const h = React.createElement, fmtMin = dashFmtMin, entrou = useDashEntrou();
  const [ver, setVer] = useState(false);
  const pct = (a, b) => b ? Math.round(a / b * 100) : null;
  const G = Object.fromEntries(DASH_GLOSSARIO);
  const maxFora = fora.max || 0;
  const barra = (rot, dica, valor, cor, nota) => h("div", { key: rot, style: { marginBottom: 12 } },
    h("div", { className: "dsh-barra__top" },
      h("span", { className: "dsh-barra__l", style: { display: "inline-flex", alignItems: "center" } }, rot, h(DashDica, { texto: dica, rotulo: rot })),
      h("span", { className: "dsh-barra__v dsh-num" }, valor === null ? "—" : fmtMin(valor))),
    h("div", { className: "dsh-track dsh-track--lg" }, h("i", { style: { width: entrou && valor !== null && maxFora ? valor / maxFora * 100 + "%" : "0%", background: cor } })),
    nota && h("div", { className: "dsh-sub", style: { marginTop: 3 } }, nota));
  const cob = (rot, a, b, cor) => { const p = pct(a, b); return h("div", { key: rot, style: { flex: "1 1 220px" } },
    h("div", { className: "dsh-barra__top" }, h("span", { className: "dsh-barra__l" }, rot), h("span", { className: "dsh-barra__v dsh-num" }, p === null ? "—" : p + "%", h("span", { className: "dsh-barra__p" }, `  ${a} de ${b}`))),
    h("div", { className: "dsh-track" }, h("i", { style: { width: entrou && p !== null ? p + "%" : "0%", background: p !== null && p < 80 ? "#F59E0B" : cor } }))); };
  return h(DashCard, { id: "bloco-frota" },
    h(DashTitulo, {
      icone: "truck",
      extra: "frota cadastrada em Configurações",
      tooltip: "A frota é o que você cadastrou em Configurações, com a data em que cada quantidade passou a valer. “Fora da unidade” é quanto tempo a ambulância fica fora da Santa Casa em cada remoção, da saída até a volta. Os três números abaixo resumem esse tempo: o do meio (mediana), o “quase pior caso” (P95) e o maior."
    }, "Frota e capacidade"),
    h("div", { className: "dsh-grid dsh-g2", style: { marginBottom: 0 } },
      h(DashCard, null,
        h("div", { className: "dsh-eyebrow", style: { marginBottom: 12, display: "flex", alignItems: "center" } }, "Frota hoje", h(DashDica, { texto: G["Frota"], rotulo: "Frota" })),
        frota
          ? h(React.Fragment, null,
              h("div", { className: "dsh-fleet" },
                h("div", { className: "dsh-fleet__i" }, h("div", { className: "dsh-fleet__v dsh-num" }, frota.basica ?? "?"), h("div", { className: "dsh-fleet__l" }, "básica" + (frota.basica === 1 ? "" : "s"))),
                h("div", { className: "dsh-fleet__i" }, h("div", { className: "dsh-fleet__v dsh-num", style: { color: "#D97706" } }, frota.avancada ?? "?"), h("div", { className: "dsh-fleet__l" }, "avançada" + (frota.avancada === 1 ? "" : "s")))),
              frota.desde && h("div", { className: "dsh-sub", style: { marginTop: 10 } }, "vale desde " + dashFmtBR(frota.desde)))
          : h("div", { style: { color: "var(--warn)", fontSize: 13 } }, "Frota não cadastrada. Cadastre em Configurações (no fim da página).")),
      h(DashCard, null,
        h("div", { className: "dsh-eyebrow", style: { marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } },
          h("span", null, "Tempo fora da unidade"),
          h("span", { className: "dsh-chip" }, fora.n ? `${fora.n} remoç${fora.n !== 1 ? "ões" : "ão"} com retorno` : "nenhuma com retorno")),
        barra("Mediana", G["Fora da unidade"] + " " + G["Mediana"], fora.mediana, "#0F766E"),
        barra("P95", G["P95"], fora.p95, "#14B8A6", fora.n >= 20 ? "95% voltam em até esse tempo" : `precisa de 20 remoções (tem ${fora.n})`),
        barra("Maior", G["Maior"], fora.max, "#5EEAD4"),
        longas && longas.length > 0 && h("button", { type: "button", className: "dsh-btn dsh-btn--sm", onClick: () => setVer(true) }, "Ver as mais longas"))),
    h("div", { className: "dsh-sep" }),
    h("div", { className: "dsh-eyebrow", style: { marginBottom: 12 } }, "Quanto da frota já dá para analisar"),
    h("div", { style: { display: "flex", gap: 24, flexWrap: "wrap" } },
      cob("Tipo de ambulância preenchido", cobertura.comTipo, cobertura.saidas, "#0F766E"),
      cob("Prefixo da ambulância preenchido", cobertura.comPrefixo, cobertura.saidas, "#0F766E")),
    h("div", { className: "dsh-banner", style: { marginTop: 16 } },
      h(DashIcone, { n: "info", tam: 16 }),
      h("div", null, h("b", null, "Ainda não calculados: "), "ambulância ocupada na hora do pedido, uso da frota e demanda × capacidade por hora. Faltam dados: a planilha não dizia qual ambulância fez cada remoção (o campo “Prefixo da ambulância” é novo e começa vazio) e o tipo ainda não está preenchido em todas as saídas. Com tipo e prefixo preenchidos, esses indicadores passam a ser calculados.")),
    h(DashLegenda, { itens: [
      ["Frota hoje", "Quantas ambulâncias existem hoje, separadas em básicas e avançadas. Você cadastra em Configurações, com a data em que a quantidade passou a valer."],
      ["Mediana", "O tempo do meio que a ambulância fica fora da Santa Casa em uma remoção (da saída até a volta). Metade das remoções levou menos, metade levou mais."],
      ["P95", "Quase o pior caso: 95 de cada 100 remoções voltam em até esse tempo; só 5 demoram mais. Só aparece com 20 remoções ou mais."],
      ["Maior", "A remoção em que a ambulância ficou mais tempo fora no período."]] }),
    ver && h(DashListaModal, { titulo: "Remoções em que a ambulância ficou mais tempo fora", subtitulo: "as 10 maiores do período (saída → retorno), da maior para a menor", itens: longas, onClose: () => setVer(false) }));
}

/* ─── Destinos ───────────────────────────────────────────────────────────────── */
function DashDestinos({ destinos }) {
  const h = React.createElement, fmtMin = dashFmtMin, entrou = useDashEntrou();
  const [todos, setTodos] = useState(false);
  const lista = todos ? destinos : destinos.slice(0, 10);
  const max = Math.max(1, ...destinos.map(d => d.n));
  return h(DashCard, { id: "bloco-destinos" },
    h(DashTitulo, {
      icone: "pin",
      extra: `${destinos.length} destino${destinos.length !== 1 ? "s" : ""}`,
      tooltip: "Para onde vão os pacientes e quanto tempo cada destino consome. Espera: do pedido da ambulância até ela sair. Fora: da saída até a volta. Cada tempo é o do meio (mediana). Destinos com menos de 5 remoções têm número instável: leia como indício, não como regra."
    }, "Destinos e tempo da remoção"),
    destinos.length === 0 ? h(DashVazio, null, "Sem dados no período") : h(React.Fragment, null,
      h("div", { className: "dsh-rows" },
        lista.map(d => h("div", { key: d.nome, className: "dsh-linha dsh-linha--dest" },
          h("div", { className: "dsh-linha__n" }, d.nome,
            d.n < 5 && h("span", { className: "dsh-tag dsh-tag--warn", title: "Menos de 5 remoções: número instável" }, "poucos casos"),
            h("small", null, `${d.saidas} saída${d.saidas !== 1 ? "s" : ""}`)),
          h("div", { className: "dsh-linha__bar", style: { display: "flex", alignItems: "center", gap: 10 } },
            h("div", { className: "dsh-track dsh-track--lg", style: { flex: 1 } }, h("i", { style: { width: entrou ? d.n / max * 100 + "%" : "0%", background: "#6366F1" } })),
            h("b", { className: "dsh-num", style: { minWidth: 28, textAlign: "right" } }, d.n)),
          h("div", { className: "dsh-linha__m" },
            h("span", { className: "dsh-chip dsh-chip--warn", title: "Espera: do pedido da ambulância até a saída" }, h(DashIcone, { n: "hourglass", tam: 12 }), fmtMin(d.espera)),
            h("span", { className: "dsh-chip", style: { background: "#CCFBF1", color: "#0F766E" }, title: "Fora: da saída até a volta" }, h(DashIcone, { n: "truck", tam: 12 }), fmtMin(d.fora)))))),
      destinos.length > 10 && h("button", { type: "button", className: "dsh-btn dsh-btn--sm", style: { marginTop: 12 }, onClick: () => setTodos(v => !v) },
        todos ? "mostrar só os 10 maiores" : `ver todos os ${destinos.length}`)),
    destinos.length > 0 && h(DashLegenda, { itens: [
      ["Destino", "O hospital ou unidade que recebeu o paciente, com o nome da lista oficial. A barra mostra quantas remoções (linhas da planilha) foram para ele."],
      ["Saídas", "Quantas dessas já tiveram a ambulância saindo (têm data e horário de saída)."],
      ["Espera (ampulheta)", "O tempo do meio (mediana) entre o pedido da ambulância e a saída dela. É quanto o paciente esperou pela ambulância."],
      ["Fora (caminhão)", "O tempo do meio (mediana) que a ambulância ficou fora da Santa Casa, da saída até a volta. Só conta as que já voltaram."],
      ["poucos casos", "Destino com menos de 5 remoções: o tempo muda muito com um único caso. Leia como indício, não como regra."]] }));
}

/* ─── Permaneceu no destino, cruzado com outros campos ───────────────────────── */
function DashPermanece({ tempos, C, geral }) {
  const h = React.createElement, fmtMin = dashFmtMin, entrou = useDashEntrou();
  const [dim, setDim] = useState("destino");
  const DIMS = [["destino", "Destino", "instituicao_destino", "Sem destino informado"], ["especialidade", "Especialidade", "especialidade", "Sem especialidade"],
                ["tipo", "Tipo de ambulância", "tipo_ambulancia", "Sem tipo informado"], ["grav", "Gravidade", "gravidade", "Sem gravidade"]];
  const [, rotDim, campo, vazio] = DIMS.find(d => d[0] === dim);
  const grupos = {};
  tempos.forEach(t => {
    const nome = dashRotuloCanon(C, campo, t.r[campo], vazio);
    const g = grupos[nome] || (grupos[nome] = { nome, n: 0, sim: 0, nao: 0, sem: 0, foraSim: [], foraNao: [] });
    g.n++;
    if (t.r.permaneceu === true) { g.sim++; if (t.fora !== null) g.foraSim.push(t.fora); }
    else if (t.r.permaneceu === false) { g.nao++; if (t.fora !== null) g.foraNao.push(t.fora); }
    else g.sem++;
  });
  const lista = Object.values(grupos).sort((a, b) => b.n - a.n).slice(0, 15);
  const nTotalCat = Object.keys(grupos).length;
  lista.forEach(g => { g.mSim = dashMediana(g.foraSim); g.mNao = dashMediana(g.foraNao); });
  const maxFora = Math.max(1, ...lista.map(g => Math.max(g.mSim || 0, g.mNao || 0)));
  const COR_SIM = "#0F766E", COR_NAO = "#64748B", COR_SEM = "#E2E8F0";
  const nao = geral ? geral.n - geral.sim - geral.semInfo : 0;
  const mini = (rot, valor, cor) => h("div", null,
    h("div", { className: "dsh-pair__l" }, h("span", null, rot), h("b", { className: "dsh-num" }, fmtMin(valor))),
    h("div", { className: "dsh-track dsh-track--sm" }, h("i", { style: { width: entrou && valor ? valor / maxFora * 100 + "%" : "0%", background: cor } })));
  return h(DashCard, { id: "bloco-permanece" },
    h(DashTitulo, {
      icone: "target",
      extra: "campo “Permaneceu” da planilha",
      tooltip: "Quantos pacientes ficaram no destino, por categoria (destino, especialidade, tipo de ambulância ou gravidade). Linha sem resposta Sim/Não aparece como “sem registro”. O tempo fora é o do meio (mediana), da saída até a volta, separado entre quem ficou e quem voltou."
    }, "Permaneceu no destino"),
    geral && geral.n > 0 && h("div", { className: "dsh-hero" },
      h("div", { className: "dsh-hero__num" },
        h("div", { className: "dsh-big dsh-num", style: { color: COR_SIM } }, h(DashNum, { valor: Math.round(geral.pct), sufixo: "%" })),
        h("div", { className: "dsh-sub" }, `permaneceram (${geral.sim} de ${geral.n} linhas)`)),
      h("div", { className: "dsh-hero__bar" },
        h(DashEmpilhada, { alto: "lg", segs: [
          { id: "sim", rot: "Permaneceu", valor: geral.sim, cor: COR_SIM },
          { id: "nao", rot: "Voltou (não permaneceu)", valor: nao, cor: COR_NAO },
          { id: "sem", rot: "Sem registro", valor: geral.semInfo, cor: COR_SEM }] }))),
    geral && geral.semInfo > 0 && h("div", { className: "dsh-nota" + (geral.semInfo / geral.n > 0.2 ? " dsh-nota--warn" : ""), style: { marginBottom: 16 } },
      `${geral.semInfo} linha${geral.semInfo !== 1 ? "s" : ""} sem registro: não contam como Sim nem como Não.`),
    h("div", { className: "dsh-seg dsh-seg--sm", role: "group", "aria-label": "Agrupar por", style: { marginBottom: 8 } },
      DIMS.map(([id, rot]) => h("button", { key: id, type: "button", "aria-pressed": dim === id, onClick: () => setDim(id) }, rot))),
    lista.length === 0 ? h(DashVazio, null, "Sem dados no período") : h(React.Fragment, null,
      h("div", { className: "dsh-rows" },
        lista.map(g => h("div", { key: g.nome, className: "dsh-linha", style: { gridTemplateColumns: "minmax(0,1fr) auto" } },
          h("div", { style: { minWidth: 0 } },
            h("div", { className: "dsh-linha__n" }, g.nome, h("small", null, `${g.n} linha${g.n !== 1 ? "s" : ""}`)),
            h("div", { style: { marginTop: 8 } },
              h(DashEmpilhada, { alto: "sm", legenda: false, segs: [
                { id: "sim", rot: "Permaneceu", valor: g.sim, cor: COR_SIM }, { id: "nao", rot: "Voltou", valor: g.nao, cor: COR_NAO }, { id: "sem", rot: "Sem registro", valor: g.sem, cor: COR_SEM }] })),
            h("div", { className: "dsh-pair" },
              mini("Fora · permaneceu", g.mSim, "#2DD4BF"), mini("Fora · voltou", g.mNao, "#94A3B8"))),
          h("div", { style: { textAlign: "right", alignSelf: "start" } },
            h("div", { className: "dsh-pct dsh-num", style: { color: COR_SIM } }, g.n ? Math.round(g.sim / g.n * 100) + "%" : "—"),
            h("div", { className: "dsh-sub" }, `${g.sim} de ${g.n}`))))),
      nTotalCat > 15 && h("div", { className: "dsh-nota", style: { marginTop: 8 } }, `Mostrando as 15 maiores de ${nTotalCat} categorias.`)),
    lista.length > 0 && h(DashLegenda, { itens: [
      [rotDim, "Os botões de cima escolhem como agrupar as remoções. Cada linha é uma categoria do grupo escolhido."],
      ["Barra de cima (verde, cinza e claro)", "A proporção das remoções da categoria em que o paciente permaneceu (verde), voltou (cinza) ou ficou sem registro (claro). Linha sem resposta não conta como Sim."],
      ["% à direita", "A parte das remoções da categoria em que o paciente permaneceu no destino."],
      ["Fora · permaneceu / Fora · voltou", "O tempo do meio (mediana) que a ambulância ficou fora, da saída até a volta, em cada um dos dois casos. As duas barras usam a mesma escala para poder comparar. Só entram remoções com a saída e o retorno anotados."]] }));
}

/* ─── Pacientes aguardando (Kanban, ao vivo) ─────────────────────────────────── */
function DashAguardando({ cards, cfg, hojeIso, onAbrirCard, aoVivo, aberto, onToggle, filtro, onFiltro }) {
  const h = React.createElement, fmtMin = dashFmtMin, entrou = useDashEntrou();
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => { const iv = setInterval(() => setAgora(Date.now()), 30000); return () => clearInterval(iv); }, []);
  const a = dashAguardando(cards, agora, cfg, hojeIso);
  const GRAVS = [["emergencia", "Vermelho", "#EF4444"], ["urgencia", "Amarelo", "#EAB308"], ["menor_gravidade", "Verde", "#22C55E"], ["agendamento", "Cinza", "#94A3B8"], ["", "Sem prioridade", "#CBD5E1"]];
  const conta = k => a.itens.filter(i => (k === "" ? !GRAVS.slice(0, 4).some(g => g[0] === i.c.grav) : i.c.grav === k)).length;
  const soVerm = filtro === "vermelhos";
  const ordenados = [...a.itens].filter(i => !soVerm || i.vermelho).sort((x, y) => (y.min === null ? -1 : y.min) - (x.min === null ? -1 : x.min));
  const maior = a.itens.reduce((m, i) => (i.min !== null && i.min > m ? i.min : m), 0);
  const gravRot = k => (GRAVS.find(g => g[0] === (GRAVS.slice(0, 4).some(x => x[0] === k) ? k : "")) || GRAVS[4]);
  const nPend = a.itens.filter(i => i.c.col_id === "pendente").length, nAc = a.itens.length - nPend;
  const stat = (rot, val, cor) => h("div", null, h("div", { className: "dsh-stat__l" }, rot), h("div", { className: "dsh-stat__v dsh-num", style: cor ? { color: cor } : null }, val));
  return h(DashCard, { id: "bloco-aguardando" },
    h(DashTitulo, {
      icone: "hourglass",
      extra: aoVivo ? h("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 } }, h("span", { className: "dsh-live" }), "Kanban ao vivo · renova a cada 30 s") : "última publicação do Kanban",
      tooltip: "Pacientes que ainda dependem de alguma ação: esperando a CROSS aceitar (o tempo conta desde o pedido) ou já aceitos e esperando a ambulância (conta desde a finalização da CROSS). Vem só do Kanban, que se atualiza sozinho a cada 30 segundos. Card sem data e hora de início aparece como “sem horário”. Os limites de alerta são os que você cadastrou em Configurações."
    }, "Pacientes aguardando agora"),
    a.itens.length === 0 ? h(DashVazio, { ok: true }, "Nenhum paciente aguardando aceite ou ambulância.") : h(React.Fragment, null,
      h("div", { className: "dsh-ag__top" },
        h("div", null,
          h("div", { className: "dsh-big dsh-num" }, h(DashNum, { valor: a.itens.length })),
          h("div", { className: "dsh-sub", style: { marginTop: 4 } }, `${nPend} aguardando aceite · ${nAc} aguardando ambulância`)),
        h("div", { className: "dsh-ag__stats" },
          stat("Maior espera", fmtMin(maior || null)),
          a.acima !== null && stat(`Acima de ${a.limEspera} min`, a.acima.length, a.acima.length ? "var(--bad)" : "var(--ok)"),
          a.acimaVerm !== null && stat(`Vermelhos acima de ${a.limVerm} min`, a.acimaVerm.length, a.acimaVerm.length ? "var(--bad)" : "var(--ok)"),
          a.limEspera === null && a.limVerm === null && h("div", { className: "dsh-sub", style: { alignSelf: "center" } }, "sem limite de alerta cadastrado"))),
      h(DashEmpilhada, { alto: "lg", segs: GRAVS.map(([k, rot, cor]) => ({ id: rot, rot, valor: conta(k), cor })) }),
      h("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", margin: "20px 0 4px" } },
        h("button", { type: "button", className: "dsh-btn dsh-btn--sm", "aria-expanded": !!aberto, onClick: onToggle },
          h("span", { style: { display: "inline-flex", transform: aberto ? "rotate(180deg)" : "none", transition: "transform .15s" } }, h(DashIcone, { n: "chevron", tam: 14 })),
          aberto ? "Ocultar a lista" : `Mostrar a lista (${a.itens.length})`),
        aberto && h("div", { className: "dsh-seg dsh-seg--sm", role: "group", "aria-label": "Filtro da lista" },
          [["todos", `Todos (${a.itens.length})`], ["vermelhos", `Só vermelhos (${a.itens.filter(i => i.vermelho).length})`]].map(([f, rot]) =>
            h("button", { key: f, type: "button", "aria-pressed": (filtro || "todos") === f, onClick: () => onFiltro(f) }, rot)))),
      aberto && ordenados.length === 0 && h(DashVazio, { ok: true }, "Nenhum vermelho aguardando."),
      aberto && ordenados.length > 0 && h("div", { style: { marginTop: 8 } },
        ordenados.slice(0, 10).map(i => {
          const [, grot, gcor] = gravRot(i.c.grav);
          const estouro = (a.limEspera !== null && i.min !== null && i.min > a.limEspera) || (i.vermelho && a.limVerm !== null && i.min !== null && i.min > a.limVerm);
          return h("div", { key: i.c.id, className: "dsh-ag__row" },
            h("span", { className: "dsh-dot", style: { background: gcor } }),
            h("div", { style: { minWidth: 0 } },
              h("div", { className: "dsh-ag__n" }, i.c.nome || "(sem nome)"),
              h("div", { className: "dsh-sub" }, DASH_COLUNAS_AGUARDANDO[i.c.col_id] + " · " + grot)),
            h("div", { className: "dsh-track" }, h("i", { style: { width: entrou && i.min !== null && maior ? i.min / maior * 100 + "%" : "0%", background: estouro ? "#DC2626" : "#94A3B8" } })),
            h("div", { style: { display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" } },
              h("span", { className: "dsh-ag__t dsh-num", style: { color: estouro ? "var(--bad)" : "var(--ink2)" } }, i.min === null ? "sem horário" : fmtMin(i.min)),
              onAbrirCard && h("button", { type: "button", className: "dsh-btn dsh-btn--sm", onClick: () => onAbrirCard(i.c.id) }, "abrir card")));
        })),
      aberto && ordenados.length > 10 && h("div", { className: "dsh-nota", style: { marginTop: 8 } }, `Mostrando os 10 que esperam há mais tempo, de ${ordenados.length}.`)));
}

/* ─── Cumprimento da meta de tempo por gravidade ─────────────────────────────── */
function DashSLA({ sla, semGrav }) {
  const h = React.createElement, fmtMin = dashFmtMin, entrou = useDashEntrou();
  const [sel, setSel] = useState(null);
  const COR = { Vermelho: "#EF4444", Amarelo: "#EAB308", Verde: "#22C55E", Cinza: "#94A3B8" };
  const aberto = sel ? sla.find(s => s.grav === sel) : null;
  const temAlgumaMeta = sla.some(s => s.alvo !== null);
  const totAval = sla.reduce((t, s) => t + s.avaliadas, 0), totDentro = sla.reduce((t, s) => t + s.dentro, 0);
  const maxMed = Math.max(1, ...sla.map(s => s.mediana || 0));
  return h(DashCard, { id: "bloco-sla" },
    h(DashTitulo, {
      icone: "target",
      extra: "finalização da CROSS → saída da ambulância",
      tooltip: "Compara, em cada remoção, o tempo entre a CROSS finalizar a ficha e a ambulância sair com a meta daquela gravidade. É a parte que a Santa Casa controla. A meta é a que você cadastrou em Configurações, valendo na data do pedido. Sem meta cadastrada, o painel só mostra o tempo, sem dizer se foi bom ou ruim. Remoções sem gravidade ou sem os dois horários ficam de fora."
    }, "Cumprimento da meta de tempo"),
    !temAlgumaMeta && h("div", { className: "dsh-aviso" }, "Nenhuma meta cadastrada. Defina o tempo máximo por gravidade em Configurações (no fim da página); até lá o painel mostra apenas os tempos."),
    temAlgumaMeta && h("div", { className: "dsh-hero" },
      h("div", { className: "dsh-hero__num" },
        h("div", { className: "dsh-big dsh-num", style: { color: totAval ? "var(--ok)" : "var(--faint)" } }, totAval ? h(DashNum, { valor: Math.round(totDentro / totAval * 100), sufixo: "%" }) : "—"),
        h("div", { className: "dsh-sub" }, totAval ? `dentro da meta (${totDentro} de ${totAval})` : "nenhuma remoção avaliada")),
      h("div", { className: "dsh-hero__bar" },
        h(DashEmpilhada, { alto: "lg", segs: [
          { id: "dentro", rot: "Dentro da meta", valor: totDentro, cor: "#16A34A" },
          { id: "fora", rot: "Fora da meta", valor: totAval - totDentro, cor: "#DC2626" }] }))),
    h("div", { className: "dsh-rows" },
      sla.map(s => {
        const foraN = s.fora.length, semMeta = s.n - s.avaliadas;
        return h("div", { key: s.grav, className: "dsh-linha" },
          h("div", { className: "dsh-linha__n", style: { display: "flex", alignItems: "center", gap: 8 } },
            h("span", { className: "dsh-dot", style: { background: COR[s.grav] } }),
            h("span", null, s.grav, h("small", null, s.alvo === null ? "sem meta" : "meta " + fmtMin(s.alvo)))),
          h("div", { className: "dsh-linha__bar" },
            s.n === 0 ? h("div", { className: "dsh-sub" }, "sem remoções medidas")
              : s.avaliadas > 0
                ? h(DashEmpilhada, { alto: "lg", legenda: false, segs: [
                    { id: "d", rot: "Dentro", valor: s.dentro, cor: "#16A34A" }, { id: "f", rot: "Fora", valor: foraN, cor: "#DC2626" }, { id: "s", rot: "Sem meta na data", valor: semMeta, cor: "#E2E8F0" }] })
                : h("div", { className: "dsh-track dsh-track--lg" }, h("i", { style: { width: entrou ? (s.mediana || 0) / maxMed * 100 + "%" : "0%", background: COR[s.grav] } })),
            h("div", { className: "dsh-sub", style: { marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" } },
              h("span", null, `${s.n} medida${s.n !== 1 ? "s" : ""}`),
              s.avaliadas > 0 && h("span", { style: { color: "var(--ok)", fontWeight: 600 } }, `${Math.round(s.dentro / s.avaliadas * 100)}% dentro`),
              foraN > 0 && h("button", { type: "button", onClick: () => setSel(s.grav), style: { background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--bad)", fontWeight: 650, fontSize: 12, textDecoration: "underline" } },
                `${foraN} fora (${Math.round(foraN / s.avaliadas * 100)}%)`))),
          h("div", { style: { textAlign: "right" } },
            h("div", { className: "dsh-pct dsh-num" }, fmtMin(s.mediana)),
            h("div", { className: "dsh-sub" }, "mediana")));
      })),
    h(DashLegenda, { itens: [
      ["Meta", "O tempo máximo aceito, para aquela gravidade, entre a finalização da ficha na CROSS e a saída da ambulância. Você define em Configurações."],
      ["Barra", "Verde: saíram dentro da meta (no tempo da meta ou antes). Vermelho: passaram da meta. Cinza claro: remoções medidas em uma data em que ainda não havia meta cadastrada."],
      ["Medidas", "Quantas remoções daquela gravidade entram na conta: as que têm data e horário da finalização e da saída."],
      ["Fora", "Quantas saíram depois da meta, e a porcentagem. Clique no número para ver quais foram."],
      ["Mediana", "O tempo do meio: metade das remoções levou menos que isso e metade levou mais. Um caso muito demorado não distorce."]] }),
    sla.some(x => x.avaliadas < x.n) && h("div", { className: "dsh-nota", style: { marginTop: 12 } }, "Dentro e Fora só contam as remoções julgadas pela meta que valia no dia do pedido; por isso podem ser menos que as Medidas quando a meta foi cadastrada depois de algumas remoções."),
    semGrav > 0 && h("div", { className: "dsh-nota", style: { marginTop: 8 } }, `${semGrav} remoç${semGrav !== 1 ? "ões" : "ão"} com os dois horários, mas sem gravidade, ficaram fora desta conta (veja Saneamento de falhas).`),
    aberto && h(DashListaModal, { titulo: `Fora da meta · ${aberto.grav}`, subtitulo: `meta de ${fmtMin(aberto.alvo)}`, itens: aberto.fora, onClose: () => setSel(null) }));
}

/* ─── Reinserção ─────────────────────────────────────────────────────────────── */
function DashReinsercao({ rein }) {
  const h = React.createElement;
  const [sel, setSel] = useState(false);
  const total = rein.porStatus.length + rein.soTexto.length;
  const itens = rein.porStatus.concat(rein.soTexto);
  return h(DashCard, { id: "bloco-reinsercao" },
    h(DashTitulo, {
      icone: "repeat",
      extra: rein.base ? `${(total / rein.base * 100).toFixed(1).replace(".", ",")}% das linhas CROSS` : "",
      tooltip: "Fichas que precisaram ser colocadas de novo na CROSS. A contagem usa o status REINSERIDA e também observações escritas à mão que citam “reinserida”. Hoje não existe um campo próprio nem o motivo da reinserção."
    }, "Reinserções"),
    h("div", { className: "dsh-hero" },
      h("div", { className: "dsh-hero__num" },
        h("div", { className: "dsh-big dsh-num", style: { color: "#EA580C" } }, h(DashNum, { valor: total })),
        h("div", { className: "dsh-sub" }, total === 1 ? "reinserção no período" : "reinserções no período")),
      h("div", { className: "dsh-hero__bar" },
        h(DashEmpilhada, { alto: "lg", segs: [
          { id: "st", rot: "pelo status REINSERIDA", valor: rein.porStatus.length, cor: "#EA580C" },
          { id: "tx", rot: "só pelo texto da observação", valor: rein.soTexto.length, cor: "#FDBA74" }] })),
      total > 0 && h("button", { type: "button", className: "dsh-btn", onClick: () => setSel(true) }, "Ver os casos")),
    h("div", { className: "dsh-banner" },
      h(DashIcone, { n: "alert", tam: 16 }),
      h("div", null, h("b", null, "Atenção, gestor: "), "parte desta contagem vem de TEXTO LIVRE e pode errar (conta quem escreveu “reinserida/reinserido”; não pega “nova ficha” nem outras grafias, e uma observação como “não foi reinserida” seria contada). ",
        "Decida como resolver: (1) usar sempre o status REINSERIDA, que já está na lista da planilha, e passar os casos do texto para ele; ou (2) criar um campo próprio com o motivo da reinserção (não encaminhado, falta de atualização, indisponibilidade…). ",
        "Os casos que só aparecem pelo texto estão em Saneamento de falhas, para você converter.")),
    sel && h(DashListaModal, { titulo: "Reinserções", subtitulo: "status REINSERIDA e observação com “reinserida/reinserido”", itens, onClose: () => setSel(false) }));
}

/* ─── Não atendidas: lista para marcar como JUSTIFICADA ───────────────────────
 * Marcar uma remoção como justificada (ex.: alta) tira ela da contagem de "não atendidas e não justificadas".
 * Quem marcou, quando e o motivo ficam gravados (tabela remocao_justificativas) e no registro de auditoria.        */
function DashNaoAtendidas({ lista, just, justOk, podeJustificar, onJustificar, onDesfazer, onFechar, onIr }) {
  const h = React.createElement;
  const [filtro, setFiltro] = useState("todas");
  const [sel, setSel] = useState({});
  const [modal, setModal] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [verJust, setVerJust] = useState(false);
  const LIM = 100;
  const pend = lista.filter(x => !just[String(x.id)]);
  const feitas = lista.filter(x => just[String(x.id)]);
  const status = Array.from(new Set(pend.map(x => x.status)));
  const filtroEf = (filtro === "todas" || status.indexOf(filtro) >= 0) ? filtro : "todas";
  const visiveis = pend.filter(x => filtroEf === "todas" || x.status === filtroEf);
  const marcadas = visiveis.filter(x => sel[String(x.id)]);
  const todasMarcadas = visiveis.length > 0 && marcadas.length === visiveis.length;
  const alterna = x => setSel(s => Object.assign({}, s, { [String(x.id)]: !s[String(x.id)] }));
  const marcaTodas = () => setSel(s => { const n = Object.assign({}, s); visiveis.forEach(x => { n[String(x.id)] = !todasMarcadas; }); return n; });
  const pode = podeJustificar && justOk !== false;
  async function confirmar() {
    setSalvando(true);
    const ok = await onJustificar(marcadas, motivo.trim());
    setSalvando(false);
    if (ok) { setModal(false); setMotivo(""); setSel({}); }
  }
  const quando = d => { try { return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
  const card = h(DashCard, { style: { marginBottom: 16, borderColor: "#CBD5E1" } },
    h("div", { role: "region", "aria-label": "Não atendidas e não justificadas" },
      h("div", { className: "dsh-title", style: { marginBottom: 8 } },
        h("div", null,
          h("div", { className: "dsh-title__t" }, "Não atendidas e não justificadas"),
          h("div", { className: "dsh-sub" }, `${pend.length} sem justificativa · ${feitas.length} justificada${feitas.length !== 1 ? "s" : ""} (já fora desta contagem)`)),
        h("button", { type: "button", className: "dsh-x", onClick: onFechar, "aria-label": "Fechar" }, h(DashIcone, { n: "x", tam: 18 }))),
      justOk === false && h("div", { className: "dsh-banner", style: { marginBottom: 12 } }, h(DashIcone, { n: "alert", tam: 16 }),
        h("div", null, h("b", null, "Justificativas ainda não disponíveis: "), "a tabela remocao_justificativas não foi encontrada. Rode o arquivo painel-auditoria-e-justificativas.sql no Supabase e recarregue a página.")),
      !podeJustificar && h("div", { className: "dsh-nota", style: { marginBottom: 8 } }, "Só quem tem permissão de justificativa pode marcar. Você pode ver a lista."),
      pend.length === 0 ? h(DashVazio, { ok: true }, "Nenhuma remoção não atendida sem justificativa.") : h(React.Fragment, null,
        status.length > 1 && h("div", { className: "dsh-seg dsh-seg--sm", role: "group", "aria-label": "Filtrar por status", style: { marginTop: 4 } },
          [["todas", `Todas (${pend.length})`]].concat(status.map(st => [st, `${st} (${pend.filter(x => x.status === st).length})`])).map(([id, rot]) =>
            h("button", { key: id, type: "button", "aria-pressed": filtroEf === id, onClick: () => setFiltro(id) }, rot))),
        h("div", { className: "dsh-nao__bar" },
          h("label", { className: "dsh-nao__all" }, h("input", { type: "checkbox", className: "dsh-cb", checked: todasMarcadas, onChange: marcaTodas, disabled: !pode }), `Selecionar todas (${visiveis.length})`),
          h("button", { type: "button", className: "dsh-btn dsh-btn--primary dsh-btn--sm", disabled: !pode || marcadas.length === 0, onClick: () => setModal(true) },
            h(DashIcone, { n: "check", tam: 14 }), marcadas.length ? `Justificar ${marcadas.length} selecionada${marcadas.length !== 1 ? "s" : ""}` : "Justificar selecionadas")),
        h("ul", { className: "dsh-list" },
          visiveis.slice(0, LIM).map(x => h("li", { key: x.id, className: "dsh-list__i", style: { padding: "2px 0" } },
            h("label", { className: "dsh-nao__row" },
              h("input", { type: "checkbox", className: "dsh-cb", checked: !!sel[String(x.id)], onChange: () => alterna(x), disabled: !pode, "aria-label": "Marcar " + x.nome }),
              h("div", { style: { minWidth: 0, flex: 1 } },
                h("div", { className: "dsh-list__top", style: { justifyContent: "flex-start", gap: 8 } },
                  h("span", { className: "dsh-list__n" }, x.nome), x.ficha && h("span", { className: "dsh-sub" }, x.ficha), h("span", { className: "dsh-chip" }, x.status)),
                h("div", { className: "dsh-list__m" }, x.texto)),
              h("a", { href: `remocao.html?foco=${encodeURIComponent(x.id)}&campo=${encodeURIComponent(x.campo || "status")}`, className: "dsh-link", onClick: e => e.stopPropagation() }, "abrir linha", h(DashIcone, { n: "external", tam: 13 })))))),
        visiveis.length > LIM && h("div", { className: "dsh-nota", style: { padding: "6px 8px" } }, `Mostrando ${LIM} de ${visiveis.length}. Justifique estas e a lista avança.`)),
      feitas.length > 0 && h("div", { style: { marginTop: 16 } },
        h("button", { type: "button", className: "dsh-btn dsh-btn--sm", "aria-expanded": verJust, onClick: () => setVerJust(v => !v) },
          h("span", { style: { display: "inline-flex", transform: verJust ? "rotate(180deg)" : "none", transition: "transform .15s" } }, h(DashIcone, { n: "chevron", tam: 14 })), `Justificadas (${feitas.length})`),
        verJust && h("ul", { className: "dsh-list", style: { marginTop: 8 } },
          feitas.slice(0, LIM).map(x => {
            const j = just[String(x.id)];
            return h("li", { key: x.id, className: "dsh-list__i" },
              h("div", { className: "dsh-list__top" },
                h("div", { style: { minWidth: 0 } },
                  h("span", { className: "dsh-list__n" }, x.nome), x.ficha && h("span", { className: "dsh-sub", style: { marginLeft: 8 } }, x.ficha), h("span", { className: "dsh-chip dsh-chip--ok", style: { marginLeft: 8 } }, x.status)),
                podeJustificar && h("button", { type: "button", className: "dsh-btn dsh-btn--sm dsh-btn--ghost dsh-btn--danger", onClick: () => onDesfazer(j, x) }, "desfazer")),
              h("div", { className: "dsh-list__m" }, (j.motivo ? "Motivo: " + j.motivo + " · " : "Sem motivo informado · ") + "por " + (j.justificado_por_nome || "—") + " em " + quando(j.created_at)));
          }))),
      h("button", { type: "button", className: "dsh-btn dsh-btn--sm", style: { marginTop: 12 }, onClick: () => onIr("bloco-desfecho") }, "ver o desfecho de todas as remoções ↓")));
  return h(React.Fragment, null, card,
    modal && h(DashModal, { titulo: "Justificar remoção não realizada", sub: `${marcadas.length} remoç${marcadas.length !== 1 ? "ões" : "ão"} · ficam fora de “não atendidas e não justificadas”`, onClose: () => { if (!salvando) setModal(false); }, largura: 520 },
      h("div", { style: { background: "var(--bg)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, maxHeight: 140, overflowY: "auto", fontSize: 13 } },
        marcadas.slice(0, 30).map(x => h("div", { key: x.id, style: { padding: "2px 0" } }, h("b", null, x.nome), h("span", { className: "dsh-sub", style: { marginLeft: 6 } }, x.status))),
        marcadas.length > 30 && h("div", { className: "dsh-sub" }, `e mais ${marcadas.length - 30}`)),
      h("label", { htmlFor: "dash-nao-motivo", style: { fontSize: 13, fontWeight: 650, display: "block", marginBottom: 6 } }, "Motivo (opcional)"),
      h("textarea", { id: "dash-nao-motivo", rows: 3, value: motivo, onChange: e => setMotivo(e.target.value), placeholder: "Ex.: alta hospitalar confirmada pelo médico",
        className: "dsh-in", style: { width: "100%", height: "auto", padding: "10px 12px", resize: "vertical", lineHeight: 1.5 } }),
      h("div", { className: "dsh-sub", style: { marginTop: 8 } }, "Fica registrado quem justificou e quando. Dá para desfazer depois, na lista de justificadas."),
      h("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 } },
        h("button", { type: "button", className: "dsh-btn", disabled: salvando, onClick: () => setModal(false) }, "Cancelar"),
        h("button", { type: "button", className: "dsh-btn dsh-btn--primary", disabled: salvando || marcadas.length === 0, onClick: confirmar }, salvando ? "Salvando…" : "Marcar como justificada"))));
}

/* ─── Alertas do gestor + qualidade dos registros ─────────────────────────────── */
/* Painel que se abre logo abaixo dos números (aba): lista curta dos casos por trás do número. */
function DashPainelLista({ titulo, sub, linhas, vazio, rodape, onFechar, onIr }) {
  const h = React.createElement;
  const LIM = 10;
  const ir = onIr || (alvo => { const el = document.getElementById(alvo); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" }); });
  return h(DashCard, { style: { marginBottom: 16, borderColor: "#CBD5E1" } },
    h("div", { role: "region", "aria-label": titulo },
      h("div", { className: "dsh-title", style: { marginBottom: 8 } },
        h("div", null, h("div", { className: "dsh-title__t" }, titulo), sub && h("div", { className: "dsh-sub" }, sub)),
        h("button", { type: "button", className: "dsh-x", onClick: onFechar, "aria-label": "Fechar" }, h(DashIcone, { n: "x", tam: 18 }))),
      linhas.length === 0 ? h(DashVazio, { ok: true }, vazio)
        : h("ul", { className: "dsh-list" },
            linhas.slice(0, LIM).map((l, i) => {
              const corpo = [
                h("span", { key: "n", style: { fontWeight: 600, color: "var(--ink)" } }, l.nome),
                l.ficha && h("span", { key: "f", className: "dsh-sub" }, l.ficha),
                h("span", { key: "t", style: { flex: "1 1 220px", color: "var(--muted)" } }, l.texto),
                l.fn && h("button", { key: "b", type: "button", onClick: l.fn, className: "dsh-btn dsh-btn--sm", style: { marginLeft: "auto" } }, l.rotFn || "abrir"),
                l.href && h("span", { key: "l", className: "dsh-link", style: { marginLeft: "auto" } }, "abrir linha", h(DashIcone, { n: "external", tam: 13 }))
              ];
              return h("li", { key: i, className: "dsh-list__i", style: { padding: "4px 0" } },
                l.href ? h("a", { href: l.href, className: "dsh-pill-link" }, corpo) : h("div", { className: "dsh-pill-link" }, corpo));
            })),
      linhas.length > LIM && h("div", { className: "dsh-nota", style: { padding: "6px 0" } }, `Mostrando ${LIM} de ${linhas.length}.`),
      rodape && h("button", { type: "button", className: "dsh-btn dsh-btn--sm", style: { marginTop: 8 }, onClick: () => ir(rodape.alvo) }, rodape.rot)));
}

function DashAlertas({ cards, cfg, hojeIso, sla, rein, qualidade, nCorrigir, emRemocao, naoAtendidas, nJustificadas, aba, agAberto, agFiltro, onTile, onIr, painel }) {
  const h = React.createElement, entrou = useDashEntrou();
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => { const iv = setInterval(() => setAgora(Date.now()), 30000); return () => clearInterval(iv); }, []);
  const a = dashAguardando(cards, agora, cfg, hojeIso);
  const foraSla = sla.reduce((t, s) => t + s.fora.length, 0), algumaMeta = sla.some(s => s.alvo !== null);
  const reinTotal = rein.porStatus.length + rein.soTexto.length;
  const chips = [
    { id: "aguardando", alvo: "bloco-aguardando", n: a.acima === null ? null : a.acima.length, rot: a.acima === null ? "Espera: limite não cadastrado" : `aguardando há mais de ${a.limEspera} min` },
    { id: "verm", alvo: "bloco-aguardando", n: a.acimaVerm === null ? null : a.acimaVerm.length, rot: a.acimaVerm === null ? "Vermelhos: limite não cadastrado" : `vermelho aguardando há mais de ${a.limVerm} min` },
    { id: "sla", alvo: "bloco-sla", n: algumaMeta ? foraSla : null, rot: algumaMeta ? "fora da meta de tempo" : "Metas de tempo não cadastradas" },
    { id: "rein", alvo: "bloco-reinsercao", n: reinTotal, rot: reinTotal === 1 ? "reinserção no período" : "reinserções no período", neutro: true },
    { id: "parado", alvo: "bloco-aguardando", n: a.semAtualizacao === null ? null : a.semAtualizacao.length, rot: a.semAtualizacao === null ? "Card parado: limite não cadastrado" : `card sem atualização há mais de ${a.limAtual} h` }
  ];
  const ir = onIr || (alvo => { const el = document.getElementById(alvo); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" }); });
  const nVerm = a.itens.filter(i => i.vermelho).length;
  const nAlertas = chips.filter(c => c.n !== null && c.n > 0 && !c.neutro).length;
  const maiorVerm = a.itens.filter(i => i.vermelho && i.min !== null).reduce((m, i) => Math.max(m, i.min), 0);
  const faixa = [
    { id: "aguardando", rot: "Aguardando", ic: "hourglass", n: a.itens.length, sub: `${a.itens.filter(i => i.c.col_id === "pendente").length} aceite · ${a.itens.filter(i => i.c.col_id === "aceite").length} ambulância`, cor: "#0F172A", tom: "#F1F5F9", ativa: agAberto && agFiltro === "todos" },
    { id: "verm", rot: "Vermelhos aguardando", ic: "zap", n: nVerm, sub: nVerm && maiorVerm ? "maior espera " + dashFmtMin(maiorVerm) : "ninguém esperando", cor: nVerm ? "#B91C1C" : "#0F172A", tom: nVerm ? "#FEE2E2" : "#F1F5F9", ativa: agAberto && agFiltro === "vermelhos" },
    { id: "remocao", rot: "Em remoção", ic: "truck", n: emRemocao, sub: "ambulância na rua (Kanban)", cor: "#0F172A", tom: "#DBEAFE", ativa: aba === "remocao" },
    { id: "nao", rot: "Não atendidas e não justificadas", ic: "x", n: naoAtendidas, sub: nJustificadas ? `+ ${nJustificadas} justificada${nJustificadas !== 1 ? "s" : ""}` : "no período, pelo status", cor: naoAtendidas ? "#C2410C" : "#0F172A", tom: naoAtendidas ? "#FFEDD5" : "#F1F5F9", ativa: aba === "nao" },
    { id: "alertas", rot: "Alertas ativos", ic: "alert", n: nAlertas, sub: nAlertas ? "clique para ver quais" : "tudo dentro dos limites", cor: nAlertas ? "#B91C1C" : "#15803D", tom: nAlertas ? "#FEE2E2" : "#DCFCE7", ativa: aba === "alertas" },
    { id: "falhas", rot: "Falhas a corrigir", ic: "wrench", n: nCorrigir, sub: "nos registros", cor: nCorrigir ? "#B45309" : "#15803D", tom: nCorrigir ? "#FEF3C7" : "#DCFCE7", ativa: aba === "falhas" }
  ];
  return h("div", { id: "bloco-alertas", style: { marginBottom: 16 } },
    h("div", { role: "tablist", "aria-label": "Situação agora", className: "dsh-grid dsh-grid--tight", style: { gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))", marginBottom: 12 } },
      faixa.map(f => h("div", { key: f.id, role: "tab", tabIndex: 0, "aria-selected": f.ativa, className: "dsh-tile", onClick: () => onTile(f.id),
        onKeyDown: e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onTile(f.id); } },
        },
        h("div", { className: "dsh-tile__h" },
          h("span", { className: "dsh-tile__ic", style: { background: f.tom, color: f.cor } }, h(DashIcone, { n: f.ic, tam: 16 })),
          h("span", { className: "dsh-tile__lbl" }, f.rot, h(DashDica, { texto: (DASH_GLOSSARIO.find(g => g[0] === f.rot) || [])[1] || f.rot, rotulo: f.rot }))),
        h("div", { className: "dsh-tile__v dsh-num", style: { color: f.cor } }, h(DashNum, { valor: f.n })),
        h("div", { className: "dsh-tile__s" }, f.sub)))),
    qualidade.pct !== null && h("div", { className: "dsh-qual", title: "Linhas do período sem nenhuma falha de dados a corrigir (as com falha ficam fora de parte das contas)" },
      h("span", { style: { fontWeight: 600, color: "var(--ink2)" } }, "Qualidade dos registros"),
      h("div", { className: "dsh-track" }, h("i", { style: { width: entrou ? qualidade.pct + "%" : "0%", background: qualidade.pct >= 95 ? "#16A34A" : "#F59E0B" } })),
      h("b", { className: "dsh-num", style: { color: qualidade.pct >= 95 ? "var(--ok)" : "var(--warn)" } }, qualidade.pct.toFixed(0) + "%"),
      h("span", null, `${qualidade.comFalha} linha${qualidade.comFalha !== 1 ? "s" : ""} com falha`)),
    aba === "alertas" && h(DashCard, { style: { marginBottom: 16, borderColor: "#CBD5E1" } },
      h("div", { role: "region", "aria-label": "Alertas do gestor" },
        h("div", { className: "dsh-title", style: { marginBottom: 12 } },
          h("div", { className: "dsh-title__t" }, "Alertas do gestor"),
          h("button", { type: "button", className: "dsh-x", onClick: () => onTile("alertas"), "aria-label": "Fechar" }, h(DashIcone, { n: "x", tam: 18 }))),
        h("div", { className: "dsh-chips" },
          chips.map(c => {
            const semLimite = c.n === null, ativo = !semLimite && c.n > 0 && !c.neutro;
            const cor = semLimite ? ["#64748B", "#F1F5F9"] : ativo ? ["#B91C1C", "#FEE2E2"] : c.neutro && c.n > 0 ? ["#C2410C", "#FFEDD5"] : ["#15803D", "#DCFCE7"];
            return h("button", { key: c.id, type: "button", className: "dsh-chipbtn", onClick: () => ir(c.alvo), title: semLimite ? "Cadastre o limite em Configurações (no fim da página)" : "Ir para o bloco com os casos",
              style: { background: cor[1], color: cor[0] } },
              !semLimite && h("span", { className: "dsh-num", style: { fontSize: 16, fontWeight: 800 } }, c.n),
              h("span", null, c.rot));
          })))),
    painel);
}

/* ─── Registro de auditoria (dentro de Configurações): quem mudou o quê, quando, valor antes e depois ─── */
const DASH_AUD_ROT = { config_registrar: "Configuração", config_excluir: "Configuração excluída", justificar_discrepancia: "Discrepância justificada",
  remocao_justificar: "Remoção justificada", remocao_desjustificar: "Justificativa desfeita" };
function DashAuditoria() {
  const h = React.createElement;
  const [aberto, setAberto] = useState(false);
  const [linhas, setLinhas] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  async function carregar() {
    setCarregando(true);
    try {
      const r = await fetch(`${SB_URL}/rest/v1/painel_auditoria?select=*&order=criado_em.desc&limit=200`, { headers: H() });
      if (!r.ok) throw new Error(await r.text());
      setLinhas(await r.json()); setErro("");
    } catch (e) { setErro(e.message); }
    setCarregando(false);
  }
  useEffect(() => { if (aberto && linhas === null) carregar(); }, [aberto]);
  const quando = d => { try { return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
  return h("div", null,
    h("div", { className: "dsh-sep" }),
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" } },
      h("div", null, h("div", { style: { fontSize: 14, fontWeight: 650 } }, "Registro de auditoria"),
        h("div", { className: "dsh-sub" }, "Quem mudou o quê e quando: configurações, justificativas de fila e remoções justificadas. Mostra as 200 mais recentes; não dá para editar nem apagar por aqui.")),
      h("div", { style: { display: "flex", gap: 8 } },
        aberto && h("button", { type: "button", className: "dsh-btn dsh-btn--sm", disabled: carregando, onClick: carregar }, carregando ? "Atualizando…" : "Atualizar"),
        h("button", { type: "button", className: "dsh-btn dsh-btn--sm", "aria-expanded": aberto, onClick: () => setAberto(v => !v) }, aberto ? "Recolher" : "Ver registro"))),
    aberto && (erro
      ? h("div", { className: "dsh-banner", style: { marginTop: 12 } }, h(DashIcone, { n: "alert", tam: 16 }), h("div", null, h("b", null, "Não consegui ler o registro: "), erro, " (se a tabela painel_auditoria ainda não existe, rode o arquivo painel-auditoria-e-justificativas.sql no Supabase)."))
      : linhas === null ? h("div", { className: "dsh-sub", style: { padding: "12px 0" } }, "Carregando…")
      : linhas.length === 0 ? h(DashVazio, null, "Nenhuma alteração registrada ainda.")
      : h("div", { style: { maxHeight: 380, overflowY: "auto", marginTop: 8 }, "data-auditoria": "lista" },
          linhas.map(l => h("div", { key: l.id, className: "dsh-aud__i" },
            h("span", { className: "dsh-sub dsh-num" }, quando(l.criado_em)),
            h("span", null, h("b", null, l.usuario_nome || "—"), " ", h("span", { className: "dsh-chip", style: { marginLeft: 4 } }, DASH_AUD_ROT[l.acao] || l.acao)),
            h("span", { style: { color: "var(--ink2)" } }, l.resumo || ""))))));
}

/* ─── Configurações do painel: frota, metas e limites, cada valor com a data em que passa a valer ─── */
function DashConfig({ cfg, userNome, recarregar, showT, hojeIso }) {
  const h = React.createElement;
  const [aberto, setAberto] = useState(false);
  const [vigencia, setVigencia] = useState(hojeIso);
  const [campos, setCampos] = useState({});
  const [salvando, setSalvando] = useState(false);
  const GRUPOS = [["frota", "Frota de ambulâncias", "Quantas ambulâncias existem a partir da data escolhida."],
                  ["sla", "Meta de tempo por gravidade", "Tempo máximo entre a finalização da CROSS e a saída da ambulância."],
                  ["alerta", "Limites dos alertas", "Quando o painel deve acusar espera ou card parado."],
                  ["dados", "Qualidade dos dados", "Quando o painel deve cobrar o motivo do tempo interno e apontar tempos que parecem erro de digitação. Sem valor, não cobra."],
                  ["avc", "Protocolo de AVC", "O tempo total para a ambulância sair e, dentro dele, o prazo que a Santa Casa tem para pedi-la. Sem o prazo da Santa Casa, as duas partes dividem o tempo total."]];
  async function salvar() {
    const linhas = DASH_CFG_CHAVES.filter(c => String(campos[c.chave] == null ? "" : campos[c.chave]).trim() !== "")
      .map(c => ({ chave: c.chave, valor: Number(String(campos[c.chave]).trim().replace(",", ".")), vigente_desde: vigencia, criado_por: userNome || null }));
    if (!linhas.length) { showT("Preencha ao menos um valor.", "err"); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vigencia)) { showT("Escolha a data em que os valores passam a valer.", "err"); return; }
    const ruim = linhas.find(l => !isFinite(l.valor) || l.valor < 0 || (DASH_CFG_CHAVES.find(c => c.chave === l.chave).inteiro && !Number.isInteger(l.valor)));
    if (ruim) { showT(`Valor inválido em “${DASH_CFG_ROTULO[ruim.chave]}”. Use número maior ou igual a zero${DASH_CFG_CHAVES.find(c => c.chave === ruim.chave).inteiro ? ", inteiro" : ""}.`, "err"); return; }
    const efetivo = ch => { const l = linhas.find(x => x.chave === ch); if (l) return l.valor; const c = dashCfgEm(cfg, ch, vigencia); return c ? Number(c.valor) : null; };
    const aM = efetivo("avc_meta_min"), aP = efetivo("avc_prazo_pedido_min");
    if (linhas.some(l => (l.chave === "avc_meta_min" || l.chave === "avc_prazo_pedido_min") && l.valor <= 0)) { showT("Os tempos do AVC precisam ser maiores que zero.", "err"); return; }
    if (aP !== null && aP > (aM !== null ? aM : 60)) { showT(`O prazo da Santa Casa (${aP} min) não pode ser maior que o tempo total do AVC (${aM !== null ? aM : 60} min).`, "err"); return; }
    setSalvando(true);
    try {
      const r = await fetch(`${SB_URL}/rest/v1/painel_config?on_conflict=chave,vigente_desde`, {
        method: "POST", headers: Object.assign({}, H(), { Prefer: "resolution=merge-duplicates,return=minimal" }), body: JSON.stringify(linhas) });
      if (!r.ok) throw new Error(await r.text());
      const aud = await dashAuditar(linhas.map(l => { const ant = dashCfgEm(cfg, l.chave, vigencia); return { acao: "config_registrar", entidade: "painel_config", entidade_id: l.chave,
        resumo: `${DASH_CFG_ROTULO[l.chave]}: ${ant ? ant.valor + " → " : ""}${l.valor}, valendo desde ${dashFmtBR(vigencia)}`,
        antes: ant ? { valor: Number(ant.valor), vigente_desde: String(ant.vigente_desde).slice(0, 10) } : null, depois: { valor: l.valor, vigente_desde: vigencia } }; }), userNome || "");
      setCampos({}); await recarregar();
      showT((aud.ok ? "" : "ATENÇÃO — não foi registrado na auditoria: " + aud.erro + ". ") + `${linhas.length} valor${linhas.length !== 1 ? "es" : ""} registrado${linhas.length !== 1 ? "s" : ""}, valendo desde ${dashFmtBR(vigencia)}.`, aud.ok ? undefined : "err");
    } catch (e) { showT("Não consegui salvar: " + e.message, "err"); }
    setSalvando(false);
  }
  async function excluir(c) {
    if (!window.confirm(`Excluir este registro?\n\n${DASH_CFG_ROTULO[c.chave]}: ${c.valor}, desde ${dashFmtBR(String(c.vigente_desde).slice(0, 10))}`)) return;
    try {
      const r = await fetch(`${SB_URL}/rest/v1/painel_config?id=eq.${c.id}`, { method: "DELETE", headers: H() });
      if (!r.ok) throw new Error(await r.text());
      const aud = await dashAuditar({ acao: "config_excluir", entidade: "painel_config", entidade_id: c.chave,
        resumo: `Excluiu ${DASH_CFG_ROTULO[c.chave]}: ${c.valor}, que valia desde ${dashFmtBR(String(c.vigente_desde).slice(0, 10))}`,
        antes: { valor: Number(c.valor), vigente_desde: String(c.vigente_desde).slice(0, 10), criado_por: c.criado_por || null } }, userNome || "");
      await recarregar(); showT("Registro excluído." + (aud.ok ? "" : " ATENÇÃO: não foi registrado na auditoria (" + aud.erro + ")."), aud.ok ? undefined : "err");
    } catch (e) { showT("Não consegui excluir: " + e.message, "err"); }
  }
  const historico = [...cfg].sort((a, b) => String(b.vigente_desde).localeCompare(String(a.vigente_desde)) || String(b.criado_em || "").localeCompare(String(a.criado_em || "")));
  return h(DashCard, { id: "bloco-config", className: "dash-no-print" },
    h("button", { type: "button", "aria-expanded": aberto, onClick: () => setAberto(v => !v),
      style: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", color: "inherit" } },
      h("span", { className: "dsh-title__t" }, h("span", { className: "dsh-title__icon" }, h(DashIcone, { n: "sliders", tam: 16 })), "Configurações do painel"),
      h("span", { className: "dsh-title__x", style: { display: "inline-flex", alignItems: "center", gap: 6 } }, "frota, metas de tempo e limites de alerta",
        h("span", { style: { display: "inline-flex", transform: aberto ? "rotate(180deg)" : "none", transition: "transform .15s" } }, h(DashIcone, { n: "chevron", tam: 16 })))),
    aberto && h("div", { style: { marginTop: 20 } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 16px", background: "var(--bg)", borderRadius: 12, marginBottom: 16 } },
        h("label", { style: { fontSize: 13, fontWeight: 600, color: "var(--ink2)" }, htmlFor: "cfg-vigencia" }, "Os valores abaixo passam a valer em"),
        h("input", { id: "cfg-vigencia", type: "date", className: "dsh-in", value: vigencia, onChange: e => setVigencia(e.target.value) }),
        h("span", { className: "dsh-sub" }, "Pode ser uma data futura. Os períodos antigos continuam usando os valores que valiam na época.")),
      h("div", { className: "dsh-grid dsh-g2" },
        GRUPOS.map(([g, titulo, ajuda]) => h("div", { key: g, className: "dsh-cfg__g" },
          h("div", { style: { fontSize: 14, fontWeight: 650 } }, titulo),
          h("div", { className: "dsh-sub", style: { marginBottom: 12 } }, ajuda),
          h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 } },
            DASH_CFG_CHAVES.filter(c => c.grupo === g).map(c => {
              const atual = dashCfgEm(cfg, c.chave, hojeIso);
              return h("div", { key: c.chave, className: "dsh-cfg__f" },
                h("div", { style: { display: "flex", alignItems: "center" } },
                  h("label", { htmlFor: "cfg-" + c.chave }, c.rotulo + (c.unid ? " (" + c.unid + ")" : "")),
                  h(DashDica, { texto: DASH_CFG_DICA[c.chave], rotulo: c.rotulo })),
                h("input", { id: "cfg-" + c.chave, type: "text", inputMode: "decimal", className: "dsh-in", value: campos[c.chave] == null ? "" : campos[c.chave], placeholder: atual ? String(atual.valor) : "—",
                  onChange: e => setCampos(p => Object.assign({}, p, { [c.chave]: e.target.value })) }),
                h("span", { className: "dsh-sub" }, atual ? `hoje: ${atual.valor} (desde ${dashFmtBR(String(atual.vigente_desde).slice(0, 10))})` : "não cadastrado"));
            }))))),
      h("div", { style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 4 } },
        h("button", { type: "button", className: "dsh-btn dsh-btn--primary", disabled: salvando, onClick: salvar }, salvando ? "Salvando…" : "Registrar valores"),
        h("span", { className: "dsh-sub" }, "Só os campos preenchidos são registrados.")),
      h("div", { className: "dsh-sep" }),
      h("div", { style: { fontSize: 14, fontWeight: 650 } }, `Histórico (${historico.length})`),
      historico.length === 0 ? h("div", { className: "dsh-sub", style: { padding: "8px 0" } }, "Nada cadastrado ainda.")
        : h("div", { style: { maxHeight: 280, overflowY: "auto", marginTop: 8 } },
            historico.map(c => h("div", { key: c.id, className: "dsh-cfg__hist" },
              h("span", { style: { fontWeight: 600, color: "var(--ink)", minWidth: 220 } }, DASH_CFG_ROTULO[c.chave] || c.chave),
              h("b", null, String(c.valor)),
              h("span", { className: "dsh-sub" }, "desde " + dashFmtBR(String(c.vigente_desde).slice(0, 10)) + (c.criado_por ? " · por " + c.criado_por : "")),
              h("button", { type: "button", className: "dsh-btn dsh-btn--sm dsh-btn--ghost dsh-btn--danger", style: { marginLeft: "auto" }, onClick: () => excluir(c) }, "excluir")))),
      h(DashAuditoria, null)));
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ORGANIZAÇÃO DA TELA (out/2026): seis seções, na ordem em que o gestor pergunta
   1 Situação agora · 2 O que está atrasando · 3 Capacidade · 4 Problemas · 5 Análise · 6 Exceções
   ═══════════════════════════════════════════════════════════════════════════════ */
const DASH_SECOES = [
  { id: "sec-agora",      n: 1, rot: "Agora",      titulo: "Situação agora",           sub: "Quem está esperando, o que está em andamento e o que pede atenção. Vem do Kanban, ao vivo." },
  { id: "sec-atrasos",    n: 2, rot: "Atrasos",    titulo: "O que está atrasando",     sub: "Em qual etapa o tempo é gasto e se a meta de cada gravidade está sendo cumprida." },
  { id: "sec-capacidade", n: 3, rot: "Capacidade", titulo: "Capacidade",               sub: "Frota, tempo da ambulância fora da unidade e o volume de pedidos, finalizações e saídas." },
  { id: "sec-problemas",  n: 4, rot: "Problemas",  titulo: "Problemas",                sub: "Remoções que não aconteceram, reinserções e tudo o que está errado ou faltando nos registros." },
  { id: "sec-analise",    n: 5, rot: "Análise",    titulo: "Análise",                  sub: "Números do período, destinos, permanência no destino e distribuições." },
  { id: "sec-excecoes",   n: 6, rot: "Exceções",   titulo: "Tabela de exceções",       sub: "Os casos individuais que geraram os alertas, do mais urgente ao menos urgente." }
];

/* Em qual aba mora cada bloco: um alerta ou botão "ver detalhes" troca de aba e só então rola até o bloco. */
const DASH_SECAO_DO_BLOCO = {
  "bloco-alertas": "sec-agora", "bloco-aguardando": "sec-agora", "bloco-fila": "sec-agora",
  "bloco-tempos": "sec-atrasos", "bloco-sla": "sec-atrasos", "bloco-motivos": "sec-atrasos",
  "bloco-frota": "sec-capacidade",
  "bloco-reinsercao": "sec-problemas", "bloco-saneamento": "sec-problemas",
  "bloco-destinos": "sec-analise", "bloco-permanece": "sec-analise", "bloco-desfecho": "sec-analise",
  "bloco-excecoes": "sec-excecoes"
};

/* ═══════════════════════════════════════════════════════════════════════════════
   EXPLICAÇÕES EM LINGUAGEM SIMPLES
   Cada número e cada coluna do painel tem uma explicação para quem não conhece os termos. Três formas:
   1) o "?" ao lado do nome (DashDica): passa o mouse, toca ou clica;  2) legendas escritas embaixo das tabelas (DashLegenda);
   3) o Glossário (botão no topo), com todos os termos juntos.
   ═══════════════════════════════════════════════════════════════════════════════ */
const DASH_GLOSSARIO = [
  ["Mediana", "O tempo do meio. Se todas as remoções fossem colocadas em fila, da mais rápida para a mais demorada, a mediana é a que está no meio: metade levou menos que esse tempo e metade levou mais. É melhor que a média porque um caso muito demorado não estraga o resultado."],
  ["P95", "Quase o pior caso. De cada 100 remoções, 95 levaram esse tempo ou menos, e só 5 levaram mais. Mostra quanto a espera chega a durar nos dias ruins, sem contar os casos fora do comum. Só aparece com 20 remoções ou mais, porque com poucas o número não é confiável."],
  ["Maior", "A remoção mais demorada do período naquela etapa. Clique para ver qual foi, com o nome do paciente e o link para abrir a linha na planilha."],
  ["Acima de 2h", "Quantas remoções levaram mais de 2 horas naquela etapa."],
  ["Fora da unidade", "Quanto tempo a ambulância fica fora da Santa Casa em cada remoção: da hora em que sai até a hora em que volta. É também o tempo que o paciente passa no destino. Só conta remoções que têm a saída e o retorno anotados."],
  ["Tempo CROSS", "Quanto a CROSS demora para responder: da hora em que a Santa Casa faz o pedido até a hora em que a CROSS finaliza a ficha."],
  ["Tempo interno", "A parte que depende só da Santa Casa: da finalização da ficha na CROSS até a Santa Casa pedir a ambulância."],
  ["Espera pela ambulância", "Do pedido da ambulância até ela sair da Santa Casa."],
  ["Tempo total", "Da solicitação à CROSS até a ambulância voltar. É calculado remoção por remoção, só nas que têm todos os horários preenchidos; por isso não é a soma das etapas."],
  ["Pedidos à CROSS", "Quantas remoções foram pedidas à CROSS no período, contadas pelo dia do pedido. Só entra linha que tem o número da ficha CROSS e a data da solicitação."],
  ["Finalizações da CROSS", "Quantas fichas a CROSS finalizou no período, contadas pelo dia da finalização. Pedido e finalização acontecem em dias diferentes, por isso os dois números quase nunca são iguais."],
  ["Saídas de ambulância", "Quantas vezes a ambulância saiu da Santa Casa no período (qualquer linha, CROSS ou outras, com data e horário de saída)."],
  ["Remoção CROSS e outras remoções", "Remoção CROSS é a linha que tem o número da ficha da CROSS. As outras (exames, retornos, transferências sem ficha) são as “outras remoções”. As duas somam o total de linhas."],
  ["Meta, Medidas, Dentro, Fora", "Meta: o tempo máximo aceito entre a finalização da CROSS e a saída da ambulância, por gravidade. Medidas: quantas remoções entram na conta. Dentro: as que saíram no tempo da meta ou antes. Fora: as que passaram da meta."],
  ["Gravidade", "A prioridade da ficha CROSS: Vermelho (1) é emergência, Amarelo (2) urgência, Verde (3) menos grave, Cinza (4) agendamento."],
  ["Ambulância básica e avançada", "Básica: técnico e motorista. Avançada: tem médico a bordo, usada em casos graves. A UTI móvel conta como avançada."],
  ["Permaneceu no destino", "Paciente que ficou no hospital de destino e não voltou à Santa Casa."],
  ["Protocolo de AVC", "Atendimento de AVC (derrame) com meta de a ambulância sair em até 1 hora (ou o tempo que você definir em Configurações) depois da finalização da ficha na CROSS. Dentro da meta, a Santa Casa pode ter um prazo só dela para pedir a ambulância; passado esse prazo, o atraso é da Santa Casa."],
  ["Aguardando", "Pacientes do Kanban que ainda dependem de alguma ação: esperando a CROSS aceitar ou esperando a ambulância."],
  ["Vermelhos aguardando", "Dos pacientes que aguardam, quantos são de gravidade vermelha (emergência)."],
  ["Em remoção", "Pacientes cuja ambulância já está a caminho, na coluna “Remoção em andamento” do Kanban."],
  ["Não atendidas e não justificadas", "Linhas cujo status diz que a remoção não aconteceu (cancelada, evasão, alta, reinserida, paciente instável…) e que ainda NÃO foram marcadas como justificadas. Quando você justifica uma remoção, ela sai desta contagem e passa para “justificadas” (o número menor abaixo)."],
  ["Justificada", "Remoção não realizada que a equipe já explicou (por exemplo, uma alta). Quem tem permissão marca na lista de não atendidas; fica registrado quem marcou e quando, e dá para desfazer."],
  ["Alertas ativos", "Quantos avisos estão acesos agora: esperas acima do limite, atrasos da meta, cards parados. Os limites você define em Configurações."],
  ["Reinserção", "Quando a ficha precisa ser colocada de novo no sistema da CROSS."],
  ["Saneamento de falhas", "A lista do que está errado ou faltando nos registros. O painel não completa nem adivinha: o que tem problema fica fora da conta e aparece ali, com link para corrigir."],
  ["Qualidade dos registros", "A porcentagem de linhas do período que não têm nenhuma falha a corrigir."],
  ["Frota", "Quantas ambulâncias a Santa Casa tem, separadas em básicas e avançadas, com a data em que cada quantidade passou a valer. Você cadastra em Configurações."],
  ["Período e escala", "Período: quais remoções entram (Tudo, hoje, 7 dias, um mês ou datas à sua escolha). Escala: se o gráfico mostra um ponto por dia, por semana ou por mês."],
  ["Kanban e Livro de Saída", "Kanban: o quadro dos pedidos em andamento (pendente, aceito, em remoção…). Livro de Saída: o registro feito pela equipe quando a ambulância sai e volta, que pode ser ligado à planilha."]
];


const DASH_CSS_IMPRESSAO = `
.dash-print-only { display: none; }
@media print {
  @page { size: A4; margin: 12mm; }
  html, body { background: #fff !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .dash-no-print, .dash-dica { display: none !important; }
  .dash-print-only { display: block !important; }
  .dash-secao + .dash-secao { break-before: page; }
  [id^="bloco-"] { break-inside: avoid; }
  #dash-print-root { padding: 0 !important; opacity: 1 !important; }
  .dash-print-chain.dsh-grid { display: block !important; }
  .dash-print-chain.dsh-grid > * { margin-bottom: 16px !important; }
  .dsh-card { box-shadow: none !important; }
  .dsh-click:hover, .dsh-tile:hover { transform: none !important; box-shadow: none !important; }
}`;
/* Imprimir / salvar em PDF: esconde, só durante a impressão, tudo o que não é o painel (cabeçalho, menus, botões flutuantes).
 * Com `alvo`, esconde também tudo o que não é aquele bloco (o cabeçalho do relatório continua). As explicações
 * "Como ler esta parte" abrem durante a impressão e voltam a fechar depois.                                              */
function dashIsolarParaImpressao(raiz, alvo) {
  const ocultos = [], abertas = [], marcados = [];
  let no = alvo || raiz;
  while (no && no.parentElement && no !== document.body) {
    if (alvo) { no.classList.add("dash-print-chain"); marcados.push(no); }
    Array.prototype.forEach.call(no.parentElement.children, irm => {
      if (irm === no || irm.tagName === "STYLE" || irm.tagName === "SCRIPT" || irm.style.display === "none") return;
      if (alvo && irm.classList.contains("dash-print-only")) return;
      ocultos.push([irm, irm.style.display]); irm.style.display = "none";
    });
    no = no.parentElement;
  }
  (alvo || raiz).querySelectorAll("details.dsh-legenda").forEach(d => { if (!d.open) { d.open = true; abertas.push(d); } });
  return () => {
    ocultos.forEach(([el, d]) => { el.style.display = d; });
    abertas.forEach(d => { d.open = false; });
    marcados.forEach(el => el.classList.remove("dash-print-chain"));
  };
}

/* Botão "Imprimir / PDF" com escolha: só a aba aberta ou o painel inteiro. Para um bloco só, use o ícone no título dele. */
function DashMenuImprimir({ imprimindo, secaoRot, onTudo, onAba }) {
  const h = React.createElement;
  const [aberto, setAberto] = useState(false);
  const ref = React.useRef(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = e => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
    const esc = e => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);
  const item = (rot, sub, fn) => h("button", { type: "button", role: "menuitem", className: "dsh-menu__i", onClick: () => { setAberto(false); fn(); } }, h("b", null, rot), h("span", null, sub));
  return h("div", { ref, className: "dsh-menu" },
    h("button", { type: "button", className: "dsh-btn", "aria-haspopup": "menu", "aria-expanded": aberto, disabled: imprimindo, onClick: () => setAberto(v => !v),
      title: "Imprimir ou salvar em PDF. Escolha “Salvar como PDF” na janela de impressão para gerar o arquivo." },
      h(DashIcone, { n: "printer", tam: 15 }), imprimindo ? "Preparando…" : "Imprimir / PDF", h(DashIcone, { n: "chevron", tam: 14 })),
    aberto && h("div", { role: "menu", className: "dsh-menu__p" },
      item("Só a aba aberta", secaoRot || "", onAba),
      item("Painel inteiro", "todas as abas, uma por página", onTudo),
      h("div", { className: "dsh-menu__d" }, "Para imprimir só um bloco, use o ícone de impressora no título dele.")));
}

function DashSecao({ id, ativa, children }) {
  const imp = React.useContext(DashImpCtx);
  if (!ativa) return null;   // aba: só o conteúdo da seção escolhida existe na tela
  const h = React.createElement;
  const s = DASH_SECOES.find(x => x.id === id);
  return h("section", { id, className: "dash-secao", role: "tabpanel", "aria-labelledby": "tab-" + id, style: { scrollMarginTop: 12, marginBottom: 32 } },
    h("div", { className: "dsh-sec__h dsh-sec__top" },
      h("div", null, h("h2", { id: id + "-t", className: "dsh-sec__t" }, s.titulo), h("div", { className: "dsh-sec__s" }, s.sub)),
      imp && h("button", { type: "button", className: "dsh-btn dsh-btn--sm dash-no-print", title: "Imprimir só esta aba", onClick: () => imp.secao(id, s.titulo) },
        h(DashIcone, { n: "printer", tam: 14 }), "Imprimir aba")),
    React.Children.toArray(children));   // toArray dá uma chave a cada filho (sem aviso do React)
}

/* A linha de abas (1 Agora · 2 Atrasos · 3 Capacidade…): clicar mostra só aquela seção, sem rolar a página.
 * `badges` põe um número em uma aba (ex.: pacientes aguardando, falhas a corrigir).                         */
function DashNavSecoes({ ativa, onSelect, badges }) {
  const h = React.createElement;
  const teclas = (e, i) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const alvo = DASH_SECOES[(i + d + DASH_SECOES.length) % DASH_SECOES.length];
    onSelect(alvo.id);
    const el = document.getElementById("tab-" + alvo.id); if (el && el.focus) el.focus();
  };
  return h("div", { role: "tablist", "aria-label": "Seções do painel", className: "dsh-tabs dash-no-print" },
    DASH_SECOES.map((sc, i) => {
      const on = sc.id === ativa, b = badges && badges[sc.id];
      return h("button", { key: sc.id, id: "tab-" + sc.id, type: "button", role: "tab", "aria-selected": on, "aria-controls": sc.id, tabIndex: on ? 0 : -1,
        className: "dsh-tab", onClick: () => onSelect(sc.id), onKeyDown: e => teclas(e, i) },
        h("span", { style: { opacity: 0.5, fontWeight: 700, fontSize: 12 } }, sc.n),
        sc.rot,
        b && h("span", { className: "dsh-tab__n" + (b.tom === "warn" ? " dsh-tab__n--warn" : "") }, b.n));
    }));
}

/* ─── Tabela de exceções: um só lugar com os casos individuais, do mais urgente ao menos urgente ─── */
function DashExcecoes({ cards, cfg, hojeIso, plan, onAbrirCard }) {
  const h = React.createElement, fmtMin = dashFmtMin;
  const [agora, setAgora] = useState(() => Date.now());
  const [filtro, setFiltro] = useState("todas");
  const [todos, setTodos] = useState(false);
  useEffect(() => { const iv = setInterval(() => setAgora(Date.now()), 30000); return () => clearInterval(iv); }, []);
  const a = dashAguardando(cards, agora, cfg, hojeIso);
  const GR = { emergencia: "Vermelho", urgencia: "Amarelo", menor_gravidade: "Verde", agendamento: "Cinza" };
  const kanban = a.itens.filter(i => i.min !== null && ((a.limEspera !== null && i.min > a.limEspera) || (i.vermelho && a.limVerm !== null && i.min > a.limVerm)))
    .map(i => ({ origem: "aguardando", pri: i.vermelho ? 1 : 2, nome: i.c.nome || "(sem nome)", ficha: i.c.ficha_cross || "", grav: GR[i.c.grav] || "Sem prioridade",
      situacao: DASH_COLUNAS_AGUARDANDO[i.c.col_id], min: i.min, motivo: `aguardando há mais que o limite (${i.vermelho && a.limVerm !== null && i.min > a.limVerm ? a.limVerm : a.limEspera} min)`, card: i.c.id }));
  const todas = kanban.concat(plan).sort((x, y) => x.pri - y.pri || (y.min === null ? -1 : y.min) - (x.min === null ? -1 : x.min));
  const ORIGENS = [["todas", "Todas"], ["aguardando", "Aguardando"], ["meta", "Fora da meta"], ["avc", "AVC"], ["nao", "Não justificadas"]];
  const conta = o => o === "todas" ? todas.length : todas.filter(x => x.origem === o).length;
  const lista = (filtro === "todas" ? todas : todas.filter(x => x.origem === filtro));
  const vista = todos ? lista : lista.slice(0, 15);
  const COR = { 1: ["#B91C1C", "#FEE2E2", "urgente", "#DC2626"], 2: ["#C2410C", "#FFEDD5", "alta", "#F97316"], 3: ["#92400E", "#FEF3C7", "média", "#F59E0B"] };
  const GCOR = { Vermelho: "#EF4444", Amarelo: "#EAB308", Verde: "#22C55E", Cinza: "#94A3B8" };
  return h(DashCard, { id: "bloco-excecoes" },
    h(DashTitulo, {
      icone: "list",
      extra: `${todas.length} caso${todas.length !== 1 ? "s" : ""}`,
      tooltip: "Os casos, um a um, por trás dos alertas, numa só lista: pacientes esperando mais que o limite, remoções que saíram fora da meta, atrasos do protocolo de AVC e remoções não realizadas. A ordem vai do mais urgente (vermelho ou AVC) ao menos urgente; dentro de cada nível, a que espera há mais tempo. Sem limites ou metas cadastrados em Configurações, esses casos não são apontados."
    }, "Casos para atenção"),
    h("div", { className: "dsh-seg dsh-seg--sm", role: "group", "aria-label": "Filtrar casos", style: { marginBottom: 12 } },
      ORIGENS.map(([id, rot]) => h("button", { key: id, type: "button", "aria-pressed": filtro === id, onClick: () => { setFiltro(id); setTodos(false); } },
        rot, h("span", { className: "dsh-num", style: { marginLeft: 6, opacity: 0.6 } }, conta(id))))),
    lista.length === 0
      ? h(DashVazio, { ok: true }, "Nenhum caso nesta categoria.")
      : h("ul", { className: "dsh-list", "aria-label": "Casos para atenção" },
          vista.map((x, i) => {
            const [cor, bg, rot, faixa] = COR[x.pri] || COR[3];
            return h("li", { key: i, className: "dsh-exc" },
              h("span", { className: "dsh-exc__bar", style: { background: faixa } }),
              h("div", { style: { minWidth: 0 } },
                h("div", null, h("span", { className: "dsh-exc__n" }, x.nome), x.ficha && h("span", { className: "dsh-sub", style: { marginLeft: 8 } }, x.ficha)),
                h("div", { className: "dsh-exc__m" },
                  h("span", { className: "dsh-exc__t dsh-num", style: { color: cor } }, x.min === null || x.min === undefined ? "—" : fmtMin(x.min)),
                  h("span", { className: "dsh-chip", style: { color: cor, background: bg } }, rot),
                  h("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 } }, h("span", { className: "dsh-dot", style: { background: GCOR[x.grav] || "#CBD5E1" } }), x.grav),
                  h("span", null, x.situacao),
                  h("span", null, x.motivo))),
              h("div", { className: "dsh-exc__act" },
                x.card && onAbrirCard ? h("button", { type: "button", className: "dsh-btn dsh-btn--sm", onClick: () => onAbrirCard(x.card) }, "abrir card")
                  : x.id ? h("a", { href: `remocao.html?foco=${encodeURIComponent(x.id)}&campo=${encodeURIComponent(x.campo || "nome_paciente")}`, className: "dsh-btn dsh-btn--sm" }, "abrir linha", h(DashIcone, { n: "external", tam: 13 })) : null));
          })),
    lista.length > 15 && h("button", { type: "button", className: "dsh-btn dsh-btn--sm", style: { marginTop: 12 }, onClick: () => setTodos(v => !v) },
      todos ? "mostrar só os 15 primeiros" : `ver todos os ${lista.length}`),
    todas.length > 0 && h(DashLegenda, { itens: [
      ["Prioridade", "Urgente: paciente vermelho ou protocolo de AVC. Alta: amarelo ou reinserção. Média: os demais. Dentro de cada nível, o mais demorado vem primeiro."],
      ["Paciente", "O nome e o número da ficha da CROSS."],
      ["Situação", "Em que ponto o caso está: aguardando aceite, aguardando ambulância, fora da meta, protocolo de AVC ou o status de não realizada."],
      ["Tempo", "Há quanto tempo o paciente espera, ou quanto tempo a etapa levou."],
      ["Motivo", "Por que o caso está nesta lista."]] }));
}

/* Status da planilha que dizem que NÃO houve remoção (o motivo é o próprio status). Nomes canônicos de canon.js. */
const DASH_STATUS_NAO_REALIZADA = {
  "Cancelada pelo solicitante": "#2563EB", "Cancelada pela CROSS": "#1D4ED8", "Evasão / alta a pedido": "#64748B", "Alta hospitalar": "#475569",
  "Resolvido com recursos locais": "#0F766E", "Não realizada (ambulância indisponível)": "#BE123C", "Sem atualização médica há 48 horas": "#92400E",
  "Reinserida": "#EA580C", "Paciente instável / remoção não liberada": "#7C3AED"
};
function dashFmtMin(m) {
  if (m === null || m === undefined) return "—";
  const t = Math.round(m), hh = Math.floor(t / 60);
  return hh > 0 ? `${hh}h ${String(t % 60).padStart(2, "0")}min` : `${t}min`;
}

function Dashboard({ cards, cols, dashMode, setDashMode, isAdmin, lastPub, currentUser, discrepancias, onAbrirCard, onAbrirAcoes, onAbrirLivro, userNome, showT: showTProp }) {
  const showT = showTProp || function () {};
  const [remocoes, setRemocoes] = useState([]);
  const [carregando, setCarregando] = useState(true);   // só a 1ª carga troca a tela inteira por "Carregando…"
  const [atualizando, setAtualizando] = useState(false); // trocas de período: mantém a tela e mostra "atualizando…"
  const [erro, setErro] = useState("");
  const [escala, setEscala] = useState("dia");
  // Períodos: "tudo" (padrão) · "hoje" · "7d" (últimos 7 dias) · "mes" (mês e ano escolhidos) · "custom" (de dd/mm/aaaa a dd/mm/aaaa).
  // "Tudo" traz TODAS as linhas da planilha (é o que fecha com o total de linhas). Datas impossíveis (antes de 2020 ou depois
  // de hoje) não entram nos gráficos e tempos: ficam listadas em Saneamento de falhas.
  const [periodo, setPeriodo] = useState("tudo");
  const [mesSel, setMesSel] = useState(() => new Date().getMonth());
  const [anoSel, setAnoSel] = useState(() => new Date().getFullYear());
  const [ini, setIni] = useState("");
  const [fim, setFim] = useState("");
  // Buscas à parte (independem do período escolhido). Se uma delas falhar (sem permissão, sem rede), o painel segue e só não lista aquele grupo.
  const [anomalas, setAnomalas] = useState([]);          // linhas sem data de solicitação ou com data impossível, de TODA a base
  const [tarefas, setTarefas] = useState([]);            // tarefas de enfermagem pendentes
  const [livroSemVinculo, setLivroSemVinculo] = useState([]);   // saídas do Livro sem linha na planilha
  const [justModal, setJustModal] = useState(null);
  const [justTexto, setJustTexto] = useState("");
  const [justSaving, setJustSaving] = useState(false);
  const [secao, setSecao] = useState("sec-agora");   // aba (seção) aberta: Agora é a primeira
  const [verGlossario, setVerGlossario] = useState(false);
  const [imprimindo, setImprimindo] = useState(false); // ao imprimir, todas as seções aparecem de uma vez
  const [impEscopo, setImpEscopo] = useState("tudo");   // o que está sendo impresso: "tudo" · id de uma aba · "bloco"
  const [impRotulo, setImpRotulo] = useState("");       // nome da aba ou do bloco impresso (vai no cabeçalho do papel)
  const [aba, setAba] = useState(null);              // painel aberto logo abaixo dos números: remocao | nao | alertas | falhas
  const [agAberto, setAgAberto] = useState(false);     // lista dos pacientes aguardando: COMEÇA minimizada
  const [agFiltro, setAgFiltro] = useState("todos");   // todos | vermelhos
  const [cfg, setCfg] = useState([]);   // frota, metas e limites (tabela painel_config), cada um com a data em que passa a valer
  async function recarregarCfg() {
    try { setCfg(await sbGetTodas("painel_config?select=*&order=vigente_desde.asc,criado_em.asc")); }
    catch (e) { /* tabela ainda não criada ou sem permissão: o painel segue, só não tem metas nem limites */ }
  }
  useEffect(() => { recarregarCfg(); }, []);
  const [justRem, setJustRem] = useState([]);   // remoções não atendidas já JUSTIFICADAS (tabela remocao_justificativas)
  const [justOk, setJustOk] = useState(null);   // null = carregando · true = tabela existe · false = tabela ainda não criada
  async function recarregarJustRem() {
    try { setJustRem(await sbGetTodas("remocao_justificativas?select=*&order=created_at.desc")); setJustOk(true); }
    catch (e) { setJustOk(false); }
  }
  useEffect(() => { recarregarJustRem(); }, []);
  /* A lista de pacientes aguardando COMEÇA minimizada e volta a minimizar quando a pessoa sai da aba Agora. */
  useEffect(() => { if (secao !== "sec-agora") { setAgAberto(false); setAgFiltro("todos"); setAba(null); } }, [secao]);

  async function justificarRemocoes(itens, motivo) {
    const quem = (currentUser && currentUser.nome) || userNome || "";
    const linhas = itens.map(x => ({ remocao_id: String(x.id), nome_paciente: x.nome || null, ficha_cross: x.ficha || null, status_na_data: x.status || null, motivo: motivo || null, justificado_por_nome: quem || null }));
    try {
      const r = await fetch(`${SB_URL}/rest/v1/remocao_justificativas?on_conflict=remocao_id`, { method: "POST", headers: Object.assign({}, H(), { Prefer: "resolution=merge-duplicates,return=minimal" }), body: JSON.stringify(linhas) });
      if (!r.ok) throw new Error(await r.text());
    } catch (e) { showT("Não consegui salvar a justificativa: " + e.message, "err"); return false; }
    const aud = await dashAuditar(itens.map(x => ({ acao: "remocao_justificar", entidade: "remocao", entidade_id: x.id,
      resumo: `Justificou a remoção não atendida de ${x.nome || "(sem nome)"} (${x.status})${motivo ? " — " + motivo : ""}`, depois: { status: x.status, motivo: motivo || null, ficha_cross: x.ficha || null } })), quem);
    await recarregarJustRem();
    showT(`${itens.length} remoç${itens.length !== 1 ? "ões justificadas" : "ão justificada"}.` + (aud.ok ? "" : " ATENÇÃO: não foi registrado na auditoria (" + aud.erro + ")."), aud.ok ? undefined : "err");
    return true;
  }
  async function desjustificarRemocao(j, x) {
    const quem = (currentUser && currentUser.nome) || userNome || "";
    try {
      const r = await fetch(`${SB_URL}/rest/v1/remocao_justificativas?remocao_id=eq.${encodeURIComponent(j.remocao_id)}`, { method: "DELETE", headers: H() });
      if (!r.ok) throw new Error(await r.text());
    } catch (e) { showT("Não consegui desfazer: " + e.message, "err"); return false; }
    const nome = (x && x.nome) || j.nome_paciente || "(sem nome)";
    const aud = await dashAuditar({ acao: "remocao_desjustificar", entidade: "remocao", entidade_id: j.remocao_id, resumo: `Desfez a justificativa da remoção não atendida de ${nome}`,
      antes: { status: j.status_na_data || null, motivo: j.motivo || null, justificado_por: j.justificado_por_nome || null, justificado_em: j.created_at || null } }, quem);
    await recarregarJustRem();
    showT("Justificativa desfeita: a remoção voltou para “não justificadas”." + (aud.ok ? "" : " ATENÇÃO: não foi registrado na auditoria (" + aud.erro + ")."), aud.ok ? undefined : "err");
    return true;
  }
  const desfazIsolamento = React.useRef(null);
  const restauraImpressao = () => { if (desfazIsolamento.current) { desfazIsolamento.current(); desfazIsolamento.current = null; } setImprimindo(false); setImpEscopo("tudo"); setImpRotulo(""); };
  useEffect(() => {   // se o navegador avisar que a impressão acabou (ou a janela voltar a ter foco), tudo volta ao normal
    window.addEventListener("afterprint", restauraImpressao);
    return () => { window.removeEventListener("afterprint", restauraImpressao); if (desfazIsolamento.current) desfazIsolamento.current(); };
  }, []);
  /* escopo: "tudo" (todas as abas) · id de uma aba (ex.: "sec-atrasos") · "bloco" (só o bloco `alvoId`) */
  const imprimir = (escopo, rotulo, alvoId) => {
    if (imprimindo) return;
    setImpEscopo(escopo || "tudo"); setImpRotulo(rotulo || ""); setImprimindo(true);
    setTimeout(() => {
      const raiz = document.getElementById("dash-print-root");
      const alvo = alvoId ? document.getElementById(alvoId) : null;
      if (raiz) desfazIsolamento.current = dashIsolarParaImpressao(raiz, alvo);
      try { window.print(); } finally { setTimeout(restauraImpressao, 1200); }
    }, 350);
  };
  const podeJustificar = isAdmin || !!(currentUser && currentUser.can_justificativa);

  /* ── Recorte temporal ─────────────────────────────────────────────────── */
  // Datas em horário LOCAL. Antes usava toISOString (UTC): depois das 21h de
  // Brasília a "data de hoje" virava a de amanhã e a janela deslocava um dia.
  const hoje = new Date();
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hojeIso = iso(hoje);
  // "7 dias" = hoje + os 6 anteriores (7 datas). Antes pegava 8.
  // Faixa de datas do período escolhido. null = Período com datas faltando ou invertidas (nada é carregado até corrigir).
  const faixa = periodo === "tudo" ? { ini: "", fim: "", tudo: true }
    : periodo === "hoje" ? { ini: hojeIso, fim: hojeIso }
    : periodo === "7d" ? { ini: iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6)), fim: hojeIso }
    : periodo === "mes" ? { ini: iso(new Date(anoSel, mesSel, 1)), fim: iso(new Date(anoSel, mesSel + 1, 0)) }
    : (ini && fim && ini <= fim) ? { ini, fim } : null;
  const fIni = faixa ? faixa.ini : "", fFim = faixa ? faixa.fim : "";
  const tudo = !!(faixa && faixa.tudo);

  /* ── Carga das remoções ───────────────────────────────────────────────────
   * O período vai para o SERVIDOR, então a tela baixa só o que vai mostrar, e a leitura é feita em páginas de 1.000
   * (sbGetTodas), então nada é cortado em silêncio. Como o gráfico conta saídas, pedidos e finalizações cada um no seu dia,
   * a linha vem se QUALQUER uma das três datas cair na janela (or=): um paciente pedido dia 27 que saiu dia 1º precisa vir.
   * O filtro do navegador (`dados`, mais abaixo) continua valendo para as demais seções: ele usa só a data do pedido.
   * Linhas sem data de solicitação não pertencem a período nenhum: aparecem em Saneamento de falhas (busca à parte, abaixo).
   * Fica DEPOIS de `faixa` porque usa os limites dela na lista de dependências.                                          */
  useEffect(() => {
    let vivo = true;
    if (!faixa) { setCarregando(false); setAtualizando(false); return; }
    (async () => {
      setAtualizando(true);
      try {
        const filtro = tudo ? "" : `&or=(${DASH_CAMPOS_DATA.map(c => `and(${c}.gte.${fIni},${c}.lte.${fFim})`).join(",")})`;
        const r = await sbGetTodas("remocoes?select=*&order=data_solicitacao.desc,id.asc" + filtro);
        if (vivo) { setRemocoes(r); setErro(""); }
      } catch (e) { if (vivo) setErro(e.message); }
      finally { if (vivo) { setCarregando(false); setAtualizando(false); } }
    })();
    return () => { vivo = false; };
  }, [periodo, fIni, fFim]);

  useEffect(() => {
    let vivo = true;
    const lim = "2020-01-01", campos = ["data_solicitacao", "data_resposta_cross", "data_saida_ambulancia", "data_saida_real", "data_retorno"];
    const cond = ["data_solicitacao.is.null"].concat(campos.reduce((acc, c) => acc.concat([`${c}.lt.${lim}`, `${c}.gt.${hojeIso}`]), []));
    sbGetTodas(`remocoes?select=id,nome_paciente,ficha_cross,${campos.join(",")}&or=(${cond.join(",")})&order=id.asc`)
      .then(r => { if (vivo) setAnomalas(r); }).catch(() => {});
    sbGetTodas("acoes_enfermagem?status=in.(pendente,iniciada,pausada)&select=id,titulo,status,prioridade,responsavel_nome,prazo&order=prioridade.asc.nullslast,created_at.asc")
      .then(r => { if (vivo) setTarefas(r); }).catch(() => {});
    // registros apagados do Livro não contam. Se o banco ainda não tem a coluna `apagado_em`, repete sem o filtro.
    const qLivro = "livro_saida?status_vinculo=in.(pendente,independente)&select=id,nome_paciente,data_saida,hora_saida,destino,status_vinculo,created_at&order=created_at.desc";
    sbGetTodas(qLivro + "&apagado_em=is.null").catch(() => sbGetTodas(qLivro))
      .then(r => { if (vivo) setLivroSemVinculo(r.filter(x => x.hora_saida || x.data_saida)); }).catch(() => {});
    return () => { vivo = false; };
  }, [hojeIso]);

  const dados = useMemo(() => {
    if (!faixa) return [];
    if (tudo) return remocoes;
    return remocoes.filter(r => { const d = r.data_solicitacao || ""; return d >= fIni && d <= fFim; });
  }, [remocoes, periodo, fIni, fFim]);

  /* ── Amplitude real da base: decide quais escalas fazem sentido ───────────
   * Calculada sobre `dados` (pedidos dentro do período), como antes, e não sobre tudo o que veio do servidor: a busca agora
   * traz também linhas de pedidos mais antigos que saíram dentro da janela, e elas não devem esticar a amplitude. */
  const amplitude = useMemo(() => {
    const ds = dados.map(r => r.data_solicitacao).filter(d => d && d >= DASH_DATA_MIN && d <= hojeIso).sort();   // só datas possíveis
    if (!ds.length) return { dias: 0, meses: 0, min: null, max: null };
    const min = ds[0], max = ds[ds.length - 1];
    const dias = Math.round((new Date(max) - new Date(min)) / 86400000) + 1;
    // Meses COMPLETOS: um mês parcial comparado a um completo distorce a leitura
    const mesesSet = new Set(ds.map(d => d.slice(0, 7)));
    return { dias, meses: mesesSet.size, min, max, mesesSet };
  }, [dados, hojeIso]);

  // Quantos dias o período realmente cobre (denominador do "por dia").
  // Antes dividia pelo tamanho da BASE INTEIRA, subestimando em qualquer recorte.
  const diasNoPeriodo = (!amplitude.min || !faixa) ? 0 : (() => {
    const a = fIni > amplitude.min ? fIni : amplitude.min;   // base mais curta que o período
    const b = (fFim && fFim < hojeIso) ? fFim : hojeIso;     // período em andamento: conta até hoje
    return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000) + 1);
  })();

  const escalaLiberada = {
    dia: true,
    semana: amplitude.dias >= 28,
    mes: amplitude.meses >= 3
  };
  const motivoBloqueio = {
    semana: `precisa de 4 semanas (hoje: ${amplitude.dias} dias)`,
    mes: `precisa de 3 meses completos (hoje: ${amplitude.meses})`
  };
  const escalaEfetiva = escalaLiberada[escala] ? escala : "dia";

  /* ── Volume de remoções: três séries, cada uma no seu dia ─────────────────
   * Limites da janela (null = sem limite). Valem para as três séries, então um evento fora da janela não entra.        */
  const limInf = !faixa ? "9999-12-31" : tudo ? DASH_DATA_MIN : fIni;   // sem período válido, nada entra; em "Tudo", só datas possíveis
  const limSup = !faixa ? "0000-01-01" : tudo ? hojeIso : fFim;

  const eventos = useMemo(() => {
    const dentro = d => !!d && d >= limInf && d <= limSup;
    const out = { saidas: [], pedidos: [], finalizacoes: [] };
    remocoes.forEach(r => {
      const p = dashDiaIso(r.data_solicitacao), f = dashDiaIso(r.data_resposta_cross), s = dashDiaDaSaida(r);
      if (dashTemFicha(r) && dentro(p)) out.pedidos.push(p);   // pedido à CROSS exige ficha CROSS
      if (dentro(f)) out.finalizacoes.push(f);
      if (dentro(s)) out.saidas.push(s);
    });
    return out;
  }, [remocoes, limInf, limSup]);

  const totaisGraf = { saidas: eventos.saidas.length, pedidos: eventos.pedidos.length, finalizacoes: eventos.finalizacoes.length };

  const serie = useMemo(() => {
    const chave = d => {
      if (escalaEfetiva === "mes") return d.slice(0, 7);
      if (escalaEfetiva === "semana") {
        const dt = new Date(d + "T00:00:00");
        const seg = new Date(dt); seg.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
        return iso(seg);
      }
      return d;
    };
    const m = {};
    const somar = (lista, campo) => lista.forEach(d => {
      const k = chave(d);
      (m[k] || (m[k] = { saidas: 0, pedidos: 0, finalizacoes: 0 }))[campo]++;
    });
    somar(eventos.saidas, "saidas"); somar(eventos.pedidos, "pedidos"); somar(eventos.finalizacoes, "finalizacoes");
    // Preenche com zero os dias/semanas/meses sem movimento: uma pausa de dias
    // não pode parecer volume contínuo.
    const keys = Object.keys(m).sort();
    if (!keys.length) return [];
    // Na escala diária o gráfico vai do primeiro ao último dia do período escolhido, mesmo que as pontas não tenham movimento;
    // sem isso o gráfico cortava o dia de hoje (e dias vazios no começo) e parecia menor que o período escolhido.
    const ini0 = (escalaEfetiva === "dia" && !tudo) ? limInf : keys[0];
    const fim0 = escalaEfetiva === "dia" ? (limSup < hojeIso ? limSup : hojeIso) : keys[keys.length - 1];   // não desenha dias que ainda não chegaram
    const prox = k => {
      if (escalaEfetiva === "mes") {
        const [y, mo] = k.split("-").map(Number);
        const d = new Date(y, mo, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }
      const d = new Date(k + "T00:00:00");
      d.setDate(d.getDate() + (escalaEfetiva === "semana" ? 7 : 1));
      return iso(d);
    };
    const vazio = { saidas: 0, pedidos: 0, finalizacoes: 0 };
    const out = [];
    let k = ini0, guarda = 0;
    while (k <= fim0 && guarda++ < 1000) { out.push({ k, ...(m[k] || vazio) }); k = prox(k); }
    return out;
  }, [eventos, escalaEfetiva, limInf, limSup, hojeIso, tudo]);

  // Tipo da linha: CROSS (com ficha) + outras (sem ficha) = total de linhas do período. Divide `dados` em dois, então a soma fecha sempre.
  const tipos = useMemo(() => {
    const cross = dados.filter(dashTemFicha).length;
    return { total: dados.length, cross, outras: dados.length - cross };
  }, [dados]);

  /* ── Agregações canonicalizadas ───────────────────────────────────────── */
  const C = typeof Canon !== "undefined" ? Canon : null;
  // Protocolo de AVC. Vem do checkbox do Livro de Remoção (coluna `protocolo_avc` da planilha, que chega à planilha quando
  // o registro do Livro é vinculado). Meta: sair em até 1h da FINALIZAÇÃO da ficha na CROSS (data/horario_resposta_cross,
  // os mesmos campos do indicador "Pedido → finalização"). Cada protocolo cai em UMA categoria, nesta ordem:
  //   noHorario        saída em até 60 min da finalização
  //   atrasoSantaCasa  saiu depois de 1h E o pedido da ambulância foi feito mais de 60 min depois da finalização
  //   atrasoAmbulancia saiu depois de 1h e o pedido da ambulância foi feito em até 60 min (o atraso é do setor de ambulância)
  //   atrasoSemCausa   saiu depois de 1h, mas falta o horário do pedido da ambulância (a causa não pode ser apurada)
  //   semHorarios      falta a finalização da CROSS ou a saída (ainda não saiu, ou dado incompleto): não dá para medir
  const fmtBR = d => { const m = String(d || "").match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(d || ""); };
  const quando = (d, h) => {
    const dia = String(d || "").slice(0, 10);
    const m = String(h || "").trim().match(/^(\d{1,2}):(\d{2})/);   // aceita "14:30" e "14:30:00"
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || !m) return null;
    const t = new Date(`${dia}T${m[1].padStart(2, "0")}:${m[2]}:00`);
    return isNaN(t) ? null : t.getTime();
  };
  // "02/10 10:50". Se o valor existe mas o painel não consegue ler, mostra o valor cru (ajuda a achar erro de formato).
  const dm = (d, h) => {
    const a = String(d || "").match(/^(\d{4})-(\d{2})-(\d{2})/), b = String(h || "").trim().match(/^(\d{1,2}):(\d{2})/);
    if (a && b) return `${a[3]}/${a[2]} ${b[1].padStart(2, "0")}:${b[2]}`;
    const cru = [String(d || "").trim(), String(h || "").trim()].filter(Boolean).join(" ");
    return cru ? `ilegível (${cru})` : "—";
  };
  // Minutos entre a FINALIZAÇÃO da ficha na CROSS e o PEDIDO da ambulância (parte da hora que depende da Santa Casa).
  // Fonte: coluna `min_finalizacao_pedido_amb` da planilha ("T. FINALIZ. → SOLIC. AMB."), calculada pelo banco (tempo-pedido-ambulancia.sql).
  // O painel só LÊ o valor que está na planilha; não recalcula. Vazio (null/ausente) = a planilha não tem o número = sem medida.
  // Negativo = pedido antes da finalização.
  const parMin = (d1, h1, d2, h2) => {   // minutos entre dois momentos, sem suposição (a mesma conta de "Tempos do caminho")
    const a = quando(d1, h1), b = quando(d2, h2);
    if (a === null || b === null) return { v: null, neg: false };
    const diff = (b - a) / 60000;
    if (diff < 0 || diff >= 43200) return { v: null, neg: true };
    return { v: diff, neg: false };
  };
  const minFinPed = x => (x.min_finalizacao_pedido_amb === undefined ? null : x.min_finalizacao_pedido_amb);
  const protocolos = useMemo(() => {
    // Meta total e prazo da Santa Casa valem pela data do caso (Configurações guarda cada valor com a data em que passa a valer).
    // Sem prazo cadastrado, o prazo é a própria meta: as duas partes dividem o tempo, como antes.
    const parAvc = dia => {
      const m = dashCfgEm(cfg, "avc_meta_min", dia), p = dashCfgEm(cfg, "avc_prazo_pedido_min", dia);
      const meta = m ? Number(m.valor) : 60;
      return { meta, prazo: p ? Math.min(Number(p.valor), meta) : meta };
    };
    const r = { total: 0, noHorario: 0, atrasoSantaCasa: 0, atrasoAmbulancia: 0, atrasoSemCausa: 0, semHorarios: 0, semFinalizacao: 0, semSaida: 0, lista: [] };
    dados.forEach(x => {
      if (x.protocolo_avc !== true) return;
      r.total++;
      const { meta: META, prazo: PRAZO } = parAvc(dashDiaIso(x.data_resposta_cross) || dashDiaIso(x.data_solicitacao) || hojeIso);
      const HORA = META * 60000;
      const fin = quando(x.data_resposta_cross, x.horario_resposta_cross);
      // Dia da saída: só a data de saída preenchida na planilha (data_saida_real), e só com o horário de saída. Sem uma das duas,
      // o caso fica em "sem horário para medir" em vez de o painel adivinhar o dia (antes caía na data do pedido e, se a saída foi
      // depois da meia-noite, o tempo dava negativo e o caso entrava como "no horário").
      const dSaida = dashDiaDaSaida(x);
      const sai = quando(dSaida, x.horario_saida_ambulancia);
      const ped = quando(x.data_saida_ambulancia, x.hora_solic_ambulancia);   // pedido da ambulância pela Santa Casa
      const caso = {
        cat: null, meta: META, prazo: PRAZO, id: x.id, grav: dashRotuloCanon(C, "gravidade", x.gravidade, "Sem gravidade"), nome: x.nome_paciente || "(sem nome)", ficha: x.ficha_cross || "", destino: x.instituicao_destino || "",
        medico: x.medico || "", enfermeiro: x.enfermeiro || "",
        finTxt: dm(x.data_resposta_cross, x.horario_resposta_cross),
        pedTxt: dm(x.data_saida_ambulancia, x.hora_solic_ambulancia),
        saiTxt: dm(dSaida, x.horario_saida_ambulancia),
        faltaFin: fin === null, faltaSaida: sai === null,
        minSaida: fin !== null && sai !== null ? (sai - fin) / 60000 : null,     // finalização → saída
        minPedido: minFinPed(x),                                                 // finalização → pedido da ambulância (parte da Santa Casa)
        minAmb: ped !== null && sai !== null ? (sai - ped) / 60000 : null        // pedido → saída (parte do setor de ambulância)
      };
      r.lista.push(caso);
      if (fin === null || sai === null) {
        r.semHorarios++; caso.cat = "semHorarios";
        if (fin === null) r.semFinalizacao++;
        if (sai === null) r.semSaida++;
        return;
      }
      if (sai - fin <= HORA) { r.noHorario++; caso.cat = "noHorario"; return; }
      if (caso.minPedido === null) { r.atrasoSemCausa++; caso.cat = "atrasoSemCausa"; return; }
      if (caso.minPedido > PRAZO) { r.atrasoSantaCasa++; caso.cat = "atrasoSantaCasa"; }
      else { r.atrasoAmbulancia++; caso.cat = "atrasoAmbulancia"; }
    });
    // As duas partes da hora: Santa Casa (finalização → pedido) e setor de ambulância (pedido → saída).
    // Pedido ANTES da finalização dá intervalo negativo: não entra na mediana (não é um tempo de espera).
    const med = a => { if (!a.length) return null; const o = [...a].sort((x, y) => x - y); return o[Math.floor(o.length / 2)]; };
    const resumo = a => ({ mediana: med(a), n: a.length, max: a.length ? Math.max(...a) : null });
    r.santaCasa = resumo(r.lista.map(c => c.minPedido).filter(v => v !== null && v >= 0));
    r.ambulancia = resumo(r.lista.map(c => c.minAmb).filter(v => v !== null && v >= 0));
    const atual = parAvc(hojeIso);
    r.metaMin = atual.meta; r.prazoPedido = atual.prazo; r.prazoDefinido = !!dashCfgEm(cfg, "avc_prazo_pedido_min", hojeIso);
    return r;
  }, [dados, cfg, hojeIso]);
  /* ── Saneamento de falhas ────────────────────────────────────────────────
   * Só LÊ os campos da planilha e aponta o que está incompleto, fora de ordem ou suspeito. Não corrige, não completa, não adivinha.
   * Cada grupo é uma lista com o link da linha. Definições e textos: DASH_PROBLEMAS_DEF.
   * Linhas olhadas: as do período (`dados`). Exceções: "sem data" e "data no futuro" olham tudo o que veio do servidor
   * (`remocoes`), porque essas linhas não entram em período nenhum; e a conferência de ficha repetida compara com tudo o que veio. */
  const limMotivo = (() => { const c = dashCfgEm(cfg, "motivo_obrigatorio_acima_min", hojeIso); return c ? Number(c.valor) : null; })();
  const limSusp = (() => { const c = dashCfgEm(cfg, "limite_suspeito_h", hojeIso); return c ? Number(c.valor) : null; })();
  const problemas = useMemo(() => {
    const G = {};
    const add = (id, r, campo, motivo) => (G[id] || (G[id] = [])).push({
      id: r.id, campo, nome: r.nome_paciente || "(sem nome)", ficha: r.ficha_cross || "", motivo });
    const temData = v => !!dashDiaIso(v);
    const temHora = v => /^\d{1,2}:\d{2}/.test(String(v || "").trim());

    // linhas que não entram em período nenhum (busca à parte, da base inteira)
    const ROT_DATA = { data_solicitacao: "Data da solicitação", data_resposta_cross: "Data da finalização da CROSS", data_saida_ambulancia: "Data da solicitação da ambulância", data_saida_real: "Data da saída", data_retorno: "Data do retorno" };
    anomalas.forEach(r => {
      if (!r.data_solicitacao) add("sem_data_sol", r, "data_solicitacao", "DATA SOLIC. vazia.");
      Object.keys(ROT_DATA).forEach(c => {
        const d = r[c];
        if (d && (d < "2020-01-01" || d > hojeIso)) add("data_impossivel", r, c, `${ROT_DATA[c]} ${fmtBR(String(d).slice(0, 10))} é impossível.`);
      });
    });

    // fichas repetidas: compara com tudo o que veio do servidor
    const norm = f => String(f == null ? "" : f).trim().toUpperCase();
    const cont = {};
    remocoes.forEach(r => { const f = norm(r.ficha_cross); if (f) cont[f] = (cont[f] || 0) + 1; });

    const momentos = r => [
      { nome: "solicitação", campo: "data_solicitacao", d: r.data_solicitacao, h: r.horario_solicitacao },
      { nome: "finalização da CROSS", campo: "data_resposta_cross", d: r.data_resposta_cross, h: r.horario_resposta_cross },
      { nome: "solicitação da ambulância", campo: "data_saida_ambulancia", d: r.data_saida_ambulancia, h: r.hora_solic_ambulancia },
      { nome: "saída da ambulância", campo: "data_saida_real", d: r.data_saida_real, h: r.horario_saida_ambulancia },
      { nome: "retorno", campo: "data_retorno", d: r.data_retorno, h: r.horario_retorno }
    ];

    const vazio = (campo, v) => C ? C.classificar(campo, v).canonico === C.NAO_INFORMADO : !String(v == null ? "" : v).trim();
    const semEquipe = v => !String(v == null ? "" : v).trim() || !!(C && C.ehSemEquipe && C.ehSemEquipe(v));

    dados.forEach(r => {
      const cross = dashTemFicha(r);
      const finD = temData(r.data_resposta_cross), finH = temHora(r.horario_resposta_cross);
      const pedD = temData(r.data_saida_ambulancia), pedH = temHora(r.hora_solic_ambulancia);
      const saiD = temData(r.data_saida_real), saiH = temHora(r.horario_saida_ambulancia);
      const retD = temData(r.data_retorno), retH = temHora(r.horario_retorno);
      const fin = finD && finH, sai = saiD && saiH;

      // tempo interno sem motivo / etapas com tempo suspeito (só cobra se o limite foi cadastrado em Configurações)
      if (limMotivo !== null) {
        const fp = minFinPed(r);
        if (fp !== null && fp !== undefined && fp > limMotivo && !String(r.motivo_demora_interna || "").trim()) add("interno_sem_motivo", r, "motivo_demora_interna", `Tempo interno de ${dashFmtMin(fp)} (limite ${dashFmtMin(limMotivo)}) sem motivo.`);
      }
      if (limSusp !== null) {
        const ETAPAS = [["Solicitação → finalização da CROSS", parMin(r.data_solicitacao, r.horario_solicitacao, r.data_resposta_cross, r.horario_resposta_cross).v, "data_resposta_cross"],
          ["Finalização → pedido da ambulância", minFinPed(r), "hora_solic_ambulancia"],
          ["Pedido da ambulância → saída", (dashHMemMin(r.tempo_espera) !== null ? dashHMemMin(r.tempo_espera) : parMin(r.data_saida_ambulancia, r.hora_solic_ambulancia, r.data_saida_real, r.horario_saida_ambulancia).v), "horario_saida_ambulancia"],
          ["Saída → retorno", (dashHMemMin(r.duracao_remocao) !== null ? dashHMemMin(r.duracao_remocao) : parMin(r.data_saida_real, r.horario_saida_ambulancia, r.data_retorno, r.horario_retorno).v), "horario_retorno"]];
        ETAPAS.forEach(([nome, v, campo]) => { if (v !== null && v !== undefined && v > limSusp * 60) add("tempo_suspeito", r, campo, `${nome}: ${dashFmtMin(v)} (limite ${limSusp} h).`); });
      }
      // status que contradiz a saída / reinserção só no texto
      const stCan = C ? C.classificar("status", r.status).canonico : "";
      if (sai && DASH_STATUS_NAO_REALIZADA[stCan]) add("status_conflito", r, "status", `Status “${stCan}”, mas a ambulância saiu em ${dm(r.data_saida_real, r.horario_saida_ambulancia)}.`);
      if (stCan !== "Reinserida" && /reinserid[oa]/i.test(String(r.observacao || ""))) add("reinsercao_texto", r, "status", `Observação: “${String(r.observacao).trim().slice(0, 90)}”.`);
      // valores fora da lista (canon.js): vão para "Não classificado" nos gráficos
      if (C) DASH_CAMPOS_LISTA.forEach(([campo, rot]) => {
        const res = C.classificar(campo, r[campo]);
        if (res.canonico === C.NAO_CLASSIFICADO)
          add("cls_" + campo, r, campo, `“${String(r[campo]).trim()}” não está na lista${res.vazamento ? " — parece ser de " + res.vazamento.pertenceA.join(" ou ") : ""}.`);
      });
      // campos vazios que tiram a linha de um indicador
      if (sai && vazio("tipo_ambulancia", r.tipo_ambulancia)) add("vazio_tipo_amb", r, "tipo_ambulancia", `Saiu em ${dm(r.data_saida_real, r.horario_saida_ambulancia)} sem tipo de ambulância.`);
      if (vazio("gravidade", r.gravidade)) add("vazio_gravidade", r, "gravidade", "Gravidade vazia.");
      if (cross && fin && vazio("instituicao_destino", r.instituicao_destino)) {
        const st = C ? C.classificar("status", r.status).canonico : "";
        if (st !== "Cancelada pelo solicitante" && st !== "Resolvido com recursos locais")
          add("vazio_destino", r, "instituicao_destino", `Finalizada pela CROSS em ${dm(r.data_resposta_cross, r.horario_resposta_cross)}, sem instituição de destino.`);
      }
      // protocolo de AVC
      if (r.protocolo_avc === true) {
        if (!fin) add("avc_sem_medida", r, finD ? "horario_resposta_cross" : "data_resposta_cross", "Sem finalização da CROSS completa (data e horário): a meta do AVC não pode ser medida.");
        else if (!sai) add("avc_sem_medida", r, saiD ? "horario_saida_ambulancia" : "data_saida_real", "Sem data e horário de saída da ambulância: não entra na meta do AVC.");
        if (sai && semEquipe(r.medico)) add("avc_sem_equipe", r, "medico", "Saiu sem médico registrado.");
        if (sai && semEquipe(r.enfermeiro)) add("avc_sem_equipe", r, "enfermeiro", "Saiu sem enfermeiro(a) registrado(a).");
      }

      if (cross) {
        const f = norm(r.ficha_cross);
        if (!/^SS-\d+-\d+$/.test(f)) add("ficha_formato", r, "ficha_cross", `Nº da ficha “${String(r.ficha_cross).trim()}” não segue SS-número-número.`);
        if (cont[f] > 1) add("ficha_repetida", r, "ficha_cross", `Esta ficha aparece em ${cont[f]} linhas.`);
      } else if (fin) {
        add("fin_sem_ficha", r, "ficha_cross", `Finalizada pela CROSS em ${dm(r.data_resposta_cross, r.horario_resposta_cross)}, sem Nº da ficha.`);
      }
      if (finD !== finH) add("fin_incompleta", r, finD ? "horario_resposta_cross" : "data_resposta_cross", finD ? "Tem a data da finalização, falta o horário." : "Tem o horário da finalização, falta a data.");
      if (pedD !== pedH) add("ped_incompleto", r, pedD ? "hora_solic_ambulancia" : "data_saida_ambulancia", pedD ? "Tem a data da solicitação da ambulância, falta o horário." : "Tem o horário da solicitação da ambulância, falta a data.");
      if (retD !== retH) add("ret_incompleto", r, retD ? "horario_retorno" : "data_retorno", retD ? "Tem a data do retorno, falta o horário." : "Tem o horário do retorno, falta a data.");
      if (saiH && !saiD) add("saida_sem_data", r, "data_saida_real", `Saída às ${String(r.horario_saida_ambulancia).trim().slice(0, 5)} sem data de saída.`);
      if (r.data_saida_real_inferida === true && saiD) add("saida_deduzida", r, "data_saida_real", `Saída em ${dm(r.data_saida_real, r.horario_saida_ambulancia)} com data deduzida pela planilha.`);
      if (r.data_retorno_inferida === true && retD) add("retorno_deduzido", r, "data_retorno", `Retorno em ${dm(r.data_retorno, r.horario_retorno)} com data deduzida pela planilha.`);
      if (saiD && !saiH) add("saida_sem_horario", r, "horario_saida_ambulancia", `Data de saída ${fmtBR(dashDiaIso(r.data_saida_real))} sem horário.`);
      if (sai && !pedD && !pedH) add("saida_sem_pedido", r, "data_saida_ambulancia", `Saiu em ${dm(r.data_saida_real, r.horario_saida_ambulancia)}, sem data/hora de solicitação da ambulância.`);
      if (cross && !finD && !finH && sai) add("cross_saida_sem_fin", r, "data_resposta_cross", `Saiu em ${dm(r.data_saida_real, r.horario_saida_ambulancia)}, sem finalização da CROSS.`);
      if (cross && !saiD && !saiH) {
        if (!finD && !finH) add("aguarda_cross", r, "data_resposta_cross", `Pedido em ${dm(r.data_solicitacao, r.horario_solicitacao)}, sem finalização da CROSS.`);
        else if (fin) add("aguarda_amb", r, "data_saida_real", `Finalizado em ${dm(r.data_resposta_cross, r.horario_resposta_cross)}, sem saída de ambulância.`);
      }

      // ordem dos momentos: só entre momentos seguidos e completos (data + horário)
      const m = momentos(r);
      for (let i = 0; i < m.length - 1; i++) {
        const a = quando(m[i].d, m[i].h), b = quando(m[i + 1].d, m[i + 1].h);
        if (a === null || b === null) continue;
        const diff = (b - a) / 60000;
        const ta = dm(m[i].d, m[i].h), tb = dm(m[i + 1].d, m[i + 1].h);
        if (diff < 0) add("ordem", r, m[i + 1].campo, `${m[i + 1].nome} (${tb}) é anterior a ${m[i].nome} (${ta}).`);
        else if (diff >= 43200) add("ordem", r, m[i + 1].campo, `Mais de 30 dias entre ${m[i].nome} (${ta}) e ${m[i + 1].nome} (${tb}).`);
      }
    });

    const rotuloCol = id => (cols.find(x => x.id === id) || {}).label || id;
    const gcRot = g => (GC[g] || (typeof GC_SEM !== "undefined" ? GC_SEM : { label: "Sem prioridade" })).label;
    const addX = (id, o) => (G[id] || (G[id] = [])).push(o);
    // Kanban: cards nas colunas de aceite sem hospital de destino (os pendentes ainda não têm destino, então não entram)
    cards.filter(x => !(x.hosp || "").trim() && DASH_COLUNAS_ACEITAS.includes(x.col_id)).forEach(x =>
      addX("kanban_sem_hospital", { id: x.id, card: x.id, nome: x.nome || "(sem nome)", ficha: x.ficha_cross || "",
        motivo: `Na coluna “${rotuloCol(x.col_id)}” sem hospital de destino.` }));
    // Fila: emergências pendentes e discrepâncias (o que o balão mostrava)
    cards.filter(x => x.grav === "emergencia" && x.col_id === "pendente").forEach(x =>
      addX("emerg_pendente", { id: x.id, card: x.id, nome: x.nome || "(sem nome)", ficha: x.ficha_cross || "",
        motivo: `Emergência aguardando aceite${x.created_at ? " desde " + new Date(x.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}.` }));
    (discrepancias || []).forEach(d => addX("discrepancia_fila", { id: d.id, card: d.aceitado.id, justificar: d, nome: d.aceitado.nome || "(sem nome)", ficha: "",
      motivo: `${gcRot(d.aceitado.grav)} aceito (${d.aceitado.rec || "sem recurso"}) antes de ${gcRot(d.pendente.grav)} ${d.pendente.nome || ""} que ainda aguarda.` }));
    tarefas.forEach(t => addX("tarefas", { id: t.id, tarefas: true, nome: t.titulo || "(sem título)", ficha: "",
      motivo: [t.status, t.responsavel_nome ? "responsável: " + t.responsavel_nome : "sem responsável",
               t.prazo ? "prazo " + new Date(t.prazo).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + (new Date(t.prazo) < new Date() ? " (vencido)" : "") : null].filter(Boolean).join(" · ") }));
    // Livro de Saída: saídas que o painel não enxerga (sem linha na planilha)
    livroSemVinculo.forEach(l => addX(l.status_vinculo === "pendente" ? "livro_pendente" : "livro_independente", { id: l.id, livro: true, nome: l.nome_paciente || "(sem nome)", ficha: "",
      motivo: `Saída ${l.data_saida ? fmtBR(String(l.data_saida).slice(0, 10)) : "sem data"}${l.hora_saida ? " às " + String(l.hora_saida).slice(0, 5) : ""}${l.destino ? " → " + l.destino : ""}.` }));

    return {
      grupos: DASH_PROBLEMAS_DEF.map(def => Object.assign({}, def, { itens: G[def.id] || [] })),
      n: id => (G[id] || []).length
    };
  }, [remocoes, dados, hojeIso, cards, cols, discrepancias, tarefas, livroSemVinculo, anomalas, limMotivo, limSusp]);
  const qualidade = useMemo(() => {
    const ids = new Set(), noPeriodo = new Set(dados.map(r => r.id));
    let nCorrigir = 0;
    problemas.grupos.forEach(g => { if (g.tipo !== "corrigir") return; nCorrigir += g.itens.length; g.itens.forEach(i => { if (i.campo && noPeriodo.has(i.id)) ids.add(i.id); }); });
    return { comFalha: ids.size, nCorrigir, pct: dados.length ? (1 - ids.size / dados.length) * 100 : null };
  }, [problemas, dados]);
  const ag = campo => C ? C.agrupar(dados, campo)
    : { itens: [], total: dados.length, informados: 0, cobertura: 0, naoClassificados: [] };

  const gGrav   = useMemo(() => ag("gravidade"),           [dados]);
  const gEspec  = useMemo(() => ag("especialidade"),       [dados]);
  const gAmb    = useMemo(() => ag("tipo_ambulancia"),     [dados]);
  const gStatus = useMemo(() => ag("status"),              [dados]);

  /* ── Tempos do caminho da remoção ─────────────────────────────────────────
   * Os 6 momentos, em ordem:
   *   solicitação (Santa Casa → CROSS) → finalização (CROSS; o aceite é o mesmo momento)
   *   → solicitação da ambulância (Santa Casa) → saída da ambulância → retorno
   * e os 4 intervalos entre momentos seguidos. Cada um é calculado das datas/horas (os campos tempo_espera e
   * duracao_remocao são texto de formato variável: servem para exibir, não para calcular).
   * Por intervalo guarda: mediana geral e, para o modal, a mesma conta por gravidade e os casos.
   * "Fora de ordem" = o momento de depois com horário ANTERIOR ao de antes (provável erro de digitação):
   * não entra na mediana, mas é contado e mostrado. */
  const intervalos = useMemo(() => {
    // Mesmos nomes, ordem e cores que o dashboard já usa para gravidade (canon.js). Sem o canon.js, usa o mapa local.
    const ORDEM = (C && C.GRAVIDADE_ORDEM) ? C.GRAVIDADE_ORDEM : ["EMERGÊNCIA", "URGÊNCIA", "MENOR GRAVIDADE", "AGENDAMENTO"];
    const COR = (C && C.GRAVIDADE_COR) ? C.GRAVIDADE_COR : { "EMERGÊNCIA": "#EF4444", "URGÊNCIA": "#EAB308", "MENOR GRAVIDADE": "#22C55E", "AGENDAMENTO": "#94A3B8" };
    const LOCAL = { VERMELHO: "EMERGÊNCIA", emergencia: "EMERGÊNCIA", AMARELO: "URGÊNCIA", urgencia: "URGÊNCIA",
                    VERDE: "MENOR GRAVIDADE", menor_gravidade: "MENOR GRAVIDADE", CINZA: "AGENDAMENTO", agendamento: "AGENDAMENTO" };
    const SEM = "Sem gravidade informada";
    const grupoDe = v => {
      const g = (C && C.classificar) ? (C.classificar("gravidade", v) || {}).canonico : LOCAL[String(v || "").trim()];
      return ORDEM.includes(g) ? g : SEM;
    };
    // Minutos entre dois momentos. SEM suposição: cada momento precisa ter a SUA data e o SEU horário preenchidos; se faltar
    // um, o intervalo não é medido (conta em "sem os dois horários"). Fora de ordem, ou com 30 dias ou mais de diferença, é
    // provável erro de digitação: não entra na conta e é contado como "inconsistente". Os dois casos aparecem, com link, em
    // "Saneamento de falhas".
    const par = parMin;
    const DEFS = [
      { id: "sol_fin", campo: "data_resposta_cross", de: "Solicitação", ate: "Finalização", dono: "CROSS", cor: "#0369A1",
        tip: "O tempo do meio (mediana) que a CROSS levou para responder: do pedido da Santa Casa até a CROSS finalizar a ficha.",
        calc: x => par(x.data_solicitacao, x.horario_solicitacao, x.data_resposta_cross, x.horario_resposta_cross, false),
        pts: x => [dm(x.data_solicitacao, x.horario_solicitacao), dm(x.data_resposta_cross, x.horario_resposta_cross)] },
      { id: "fin_ped", campo: "hora_solic_ambulancia", de: "Finalização", ate: "Solicitação da ambulância", dono: "Santa Casa", cor: "#B45309",
        tip: "O tempo do meio (mediana) entre a CROSS finalizar a ficha e a Santa Casa pedir a ambulância. É o que depende só da Santa Casa antes de chamar a ambulância.",
        calc: x => { const m = minFinPed(x); return m === null ? { v: null, neg: false } : (m < 0 || m >= 43200) ? { v: null, neg: true } : { v: m, neg: false }; },
        pts: x => [dm(x.data_resposta_cross, x.horario_resposta_cross), dm(x.data_saida_ambulancia, x.hora_solic_ambulancia)] },
      { id: "ped_sai", campo: "horario_saida_ambulancia", de: "Solicitação da ambulância", ate: "Saída", dono: "Santa Casa", cor: "#BE123C",
        tip: "O tempo do meio (mediana) entre o pedido da ambulância e ela sair da Santa Casa. É a espera pela ambulância.",
        calc: x => { const g = dashHMemMin(x.tempo_espera); return g !== null ? { v: g, neg: false } : par(x.data_saida_ambulancia, x.hora_solic_ambulancia, x.data_saida_real, x.horario_saida_ambulancia); },
        pts: x => [dm(x.data_saida_ambulancia, x.hora_solic_ambulancia), dm(x.data_saida_real, x.horario_saida_ambulancia)] },
      { id: "sai_ret", campo: "horario_retorno", de: "Saída", ate: "Retorno", dono: "Santa Casa", cor: "#0F766E",
        tip: "O tempo do meio (mediana) que a ambulância ficou fora da Santa Casa: da saída até a volta. É também o tempo que o paciente passa no destino. Só conta remoções que têm a saída e o retorno anotados.",
        calc: x => { const g = dashHMemMin(x.duracao_remocao); return g !== null ? { v: g, neg: false } : par(x.data_saida_real, x.horario_saida_ambulancia, x.data_retorno, x.horario_retorno); },
        pts: x => [dm(x.data_saida_real, x.horario_saida_ambulancia), dm(x.data_retorno, x.horario_retorno)] },
    ];
    const novo = (chave, cor) => ({ chave, cor, total: 0, nPos: 0, mediana: null, max: null, casos: [], v: [] });
    return DEFS.map(def => {
      const grupos = new Map([...ORDEM, SEM].map(g => [g, novo(g, COR[g] || "#94A3B8")]));
      const todas = novo("todas", "#0F172A");
      let nNeg = 0, nSem = 0;
      dados.forEach(x => {
        const g = grupos.get(grupoDe(x.gravidade));
        g.total++; todas.total++;
        const r = def.calc(x);
        if (r.v === null) { if (r.neg) nNeg++; else nSem++; return; }
        const p = def.pts(x);
        const caso = { id: x.id, campo: def.campo, nome: x.nome_paciente || "(sem nome)", ficha: x.ficha_cross || "", avc: x.protocolo_avc === true,
                       min: r.v, grav: g.chave, de: p[0], ate: p[1] };
        [g, todas].forEach(o => { o.nPos++; o.v.push(r.v); o.casos.push(caso); });
      });
      [...grupos.values(), todas].forEach(o => {
        o.v.sort((p, q) => p - q);
        o.mediana = o.v.length ? o.v[Math.floor(o.v.length / 2)] : null;
        o.max = o.v.length ? o.v[o.v.length - 1] : null;
        o.casos.sort((p, q) => q.min - p.min);
        o.acima2h = o.v.filter(m => m > 120).length;
        delete o.v;
      });
      return { id: def.id, campo: def.campo, de: def.de, ate: def.ate, dono: def.dono, cor: def.cor, tip: def.tip,
               rotulo: `${def.de} → ${def.ate}`, nNeg, nSem, todas, grupos: [...grupos.values()].filter(g => g.total > 0) };
    });
  }, [dados]);

  /* ── Permaneceu no destino ────────────────────────────────────────────────
   * Denominador: TODAS as remoções do período. Campo vazio (null) = ninguém
   * registrou; conta como "não permaneceu" no percentual, mas o número de
   * "sem registro" aparece ao lado para o valor não parecer mais firme do que é. */
  const perm = useMemo(() => {
    const n = dados.length;
    const sim = dados.filter(r => r.permaneceu === true).length;
    const semInfo = dados.filter(r => r.permaneceu !== true && r.permaneceu !== false).length;
    return { n, sim, semInfo, pct: n ? sim / n * 100 : 0 };
  }, [dados]);

  /* ── Tempos remoção a remoção: a MESMA conta estrita de "Tempos do caminho" (sem supor dia nem horário) ── */
  const temposLinha = useMemo(() => dados.map(r => {
    const v = (d1, h1, d2, h2) => parMin(d1, h1, d2, h2).v;
    const gE = dashHMemMin(r.tempo_espera), gD = dashHMemMin(r.duracao_remocao);   // o número que a planilha mostra, quando existe
    return {
      r,
      finSai: v(r.data_resposta_cross, r.horario_resposta_cross, r.data_saida_real, r.horario_saida_ambulancia),
      interno: (() => { const m = minFinPed(r); return (m === null || m === undefined || m < 0) ? null : m; })(),
      motivo: String(r.motivo_demora_interna || "").trim(),
      espera: gE !== null ? gE : v(r.data_saida_ambulancia, r.hora_solic_ambulancia, r.data_saida_real, r.horario_saida_ambulancia),
      fora: gD !== null ? gD : v(r.data_saida_real, r.horario_saida_ambulancia, r.data_retorno, r.horario_retorno),
      total: v(r.data_solicitacao, r.horario_solicitacao, r.data_retorno, r.horario_retorno),
      grav: C ? C.classificar("gravidade", r.gravidade).canonico : "",
      saiu: !!dashDiaDaSaida(r)
    };
  }), [dados]);

  const tempoTotal = useMemo(() => {   // solicitação → retorno, remoção por remoção (não é a soma das medianas)
    const tot = temposLinha.map(t => t.total).filter(x => x !== null);
    const top = temposLinha.filter(t => t.total !== null).sort((a, b) => b.total - a.total).slice(0, 10).map(t => ({ id: t.r.id, campo: "horario_retorno", nome: t.r.nome_paciente || "(sem nome)", ficha: t.r.ficha_cross || "",
      texto: `Solicitação ${dm(t.r.data_solicitacao, t.r.horario_solicitacao)} → retorno ${dm(t.r.data_retorno, t.r.horario_retorno)} = ${dashFmtMin(t.total)}` }));
    return { mediana: dashMediana(tot), n: tot.length, top };
  }, [temposLinha]);

  const longasFora = useMemo(() => temposLinha.filter(t => t.fora !== null).sort((a, b) => b.fora - a.fora).slice(0, 10).map(t => ({
    id: t.r.id, campo: "horario_retorno", nome: t.r.nome_paciente || "(sem nome)", ficha: t.r.ficha_cross || "",
    texto: `Saída ${dm(t.r.data_saida_real, t.r.horario_saida_ambulancia)} → retorno ${dm(t.r.data_retorno, t.r.horario_retorno)} = ${dashFmtMin(t.fora)}` })), [temposLinha]);
  const foraStats = useMemo(() => {   // (ver também: DashMotivos)
    const v = temposLinha.map(t => t.fora).filter(x => x !== null);
    return { n: v.length, mediana: dashMediana(v), p95: v.length >= 20 ? dashPercentil(v, 95) : null, max: v.length ? Math.max(...v) : null };
  }, [temposLinha]);
  const frotaHoje = useMemo(() => {
    const b = dashCfgEm(cfg, "frota_basica", hojeIso), a = dashCfgEm(cfg, "frota_avancada", hojeIso);
    if (!b && !a) return null;
    return { basica: b ? Number(b.valor) : null, avancada: a ? Number(a.valor) : null, desde: [b, a].filter(Boolean).map(x => String(x.vigente_desde).slice(0, 10)).sort().pop() };
  }, [cfg, hojeIso]);
  const coberturaFrota = useMemo(() => {
    const sai = temposLinha.filter(t => t.saiu);
    return { saidas: sai.length,
      comTipo: sai.filter(t => C ? C.classificar("tipo_ambulancia", t.r.tipo_ambulancia).canonico !== C.NAO_INFORMADO : !!String(t.r.tipo_ambulancia || "").trim()).length,
      comPrefixo: sai.filter(t => String(t.r.prefixo_ambulancia || "").trim()).length };
  }, [temposLinha]);

  const destinos = useMemo(() => {
    const g = {};
    temposLinha.forEach(t => {
      const nome = dashRotuloCanon(C, "instituicao_destino", t.r.instituicao_destino, "Sem destino informado");
      const x = g[nome] || (g[nome] = { nome, n: 0, saidas: 0, espera: [], fora: [] });
      x.n++; if (t.saiu) x.saidas++;
      if (t.espera !== null) x.espera.push(t.espera);
      if (t.fora !== null) x.fora.push(t.fora);
    });
    return Object.values(g).map(x => ({ nome: x.nome, n: x.n, saidas: x.saidas, espera: dashMediana(x.espera), fora: dashMediana(x.fora) })).sort((a, b) => b.n - a.n);
  }, [temposLinha]);

  const sla = useMemo(() => {
    const CH = { Vermelho: "sla_vermelho_min", Amarelo: "sla_amarelo_min", Verde: "sla_verde_min", Cinza: "sla_cinza_min" };
    return Object.keys(CH).map(grav => {
      const ls = temposLinha.filter(t => t.grav === grav && t.finSai !== null);
      let dentro = 0, avaliadas = 0;
      const fora = [];
      ls.forEach(t => {
        const c = dashCfgEm(cfg, CH[grav], dashDiaIso(t.r.data_solicitacao) || hojeIso);   // a meta que valia no dia da solicitação
        if (!c) return;
        avaliadas++;
        if (t.finSai <= Number(c.valor)) dentro++;
        else fora.push({ grav, min: t.finSai, id: t.r.id, campo: "horario_saida_ambulancia", nome: t.r.nome_paciente || "(sem nome)", ficha: t.r.ficha_cross || "",
          texto: `Finalização ${dm(t.r.data_resposta_cross, t.r.horario_resposta_cross)} → saída ${dm(t.r.data_saida_real, t.r.horario_saida_ambulancia)} = ${dashFmtMin(t.finSai)} (meta ${dashFmtMin(Number(c.valor))}).` });
      });
      const atual = dashCfgEm(cfg, CH[grav], hojeIso);
      return { grav, alvo: atual ? Number(atual.valor) : null, n: ls.length, avaliadas, dentro, fora, mediana: dashMediana(ls.map(t => t.finSai)) };
    });
  }, [temposLinha, cfg, hojeIso]);
  const slaSemGrav = temposLinha.filter(t => t.finSai !== null && !["Vermelho", "Amarelo", "Verde", "Cinza"].includes(t.grav)).length;

  const reinsercao = useMemo(() => {
    const porStatus = [], soTexto = [];
    dados.forEach(r => {
      const st = C ? C.classificar("status", r.status).canonico : "";
      if (st === "Reinserida") porStatus.push({ id: r.id, campo: "status", nome: r.nome_paciente || "(sem nome)", ficha: r.ficha_cross || "", texto: "Status REINSERIDA." });
      else if (/reinserid[oa]/i.test(String(r.observacao || ""))) soTexto.push({ id: r.id, campo: "observacao", nome: r.nome_paciente || "(sem nome)", ficha: r.ficha_cross || "", texto: `Só no texto da observação: “${String(r.observacao).trim().slice(0, 90)}”.` });
    });
    return { porStatus, soTexto, base: dados.filter(dashTemFicha).length };
  }, [dados]);

  /* ── Situação de cada linha: UMA só, e a soma fecha com o total de linhas (regra no tooltip do bloco) ── */
  const situacao = useMemo(() => {
    const cl = {};
    const def = (id, rotulo, cor, bloco, ajuda, fixa) => { cl[id] = { id, rotulo, cor, bloco, ajuda, fixa: !!fixa, itens: [] }; };
    def("realizada", "Remoções realizadas", "#15803D", "Realizadas", "A ambulância saiu: data e horário de saída preenchidos.", true);
    def("aguarda_amb", "Aguardando ambulância (a CROSS já finalizou)", "#B45309", "Em andamento", "Finalização da CROSS preenchida e ainda sem saída da ambulância.", true);
    def("aguarda_cross", "Aguardando a CROSS finalizar", "#0369A1", "Em andamento", "Linha com ficha CROSS, sem finalização e sem saída.", true);
    def("outras_sem_saida", "Outras remoções ainda sem saída", "#64748B", "Em andamento", "Linha sem ficha CROSS e sem saída registrada.", true);
    Object.keys(DASH_STATUS_NAO_REALIZADA).forEach(n => def("st:" + n, n, DASH_STATUS_NAO_REALIZADA[n], "Não realizadas · motivo pelo status", `Status da planilha: ${n}.`));
    dados.forEach(r => {
      const st = C ? C.classificar("status", r.status).canonico : "";
      const grav = dashRotuloCanon(C, "gravidade", r.gravidade, "sem gravidade"), dest = dashRotuloCanon(C, "instituicao_destino", r.instituicao_destino, "sem destino");
      const base = `Solicitada ${dm(r.data_solicitacao, r.horario_solicitacao)} · ${grav} · ${dest}`;
      const item = (campo, extra) => ({ grav, id: r.id, campo, nome: r.nome_paciente || "(sem nome)", ficha: r.ficha_cross || "", texto: base + (extra ? " · " + extra : "") });
      const fin = !!dashDiaIso(r.data_resposta_cross) && /^\d{1,2}:\d{2}/.test(String(r.horario_resposta_cross || "").trim());
      if (dashDiaDaSaida(r)) cl.realizada.itens.push(item("horario_saida_ambulancia", `saiu ${dm(r.data_saida_real, r.horario_saida_ambulancia)}`));
      else if (DASH_STATUS_NAO_REALIZADA[st]) cl["st:" + st].itens.push(item("status", r.observacao ? "obs.: " + String(r.observacao).trim().slice(0, 70) : ""));
      else if (fin) cl.aguarda_amb.itens.push(item("horario_saida_ambulancia", `finalizada ${dm(r.data_resposta_cross, r.horario_resposta_cross)}`));
      else if (dashTemFicha(r)) cl.aguarda_cross.itens.push(item("data_resposta_cross", ""));
      else cl.outras_sem_saida.itens.push(item("horario_saida_ambulancia", ""));
    });
    return Object.values(cl);
  }, [dados]);

  const justMap = useMemo(() => { const m = {}; justRem.forEach(j => { m[String(j.remocao_id)] = j; }); return m; }, [justRem]);
  const naoLista = useMemo(() => situacao.filter(c => c.id.startsWith("st:")).flatMap(c => c.itens.map(it => Object.assign({}, it, { status: c.rotulo }))), [situacao]);
  const nNaoJust = naoLista.filter(x => !justMap[String(x.id)]).length, nJust = naoLista.length - nNaoJust;
  const excecoesPlan = useMemo(() => {
    const out = [];
    sla.forEach(s => s.fora.forEach(f => out.push({ origem: "meta", pri: f.grav === "Vermelho" ? 1 : f.grav === "Amarelo" ? 2 : 3, nome: f.nome, ficha: f.ficha, grav: f.grav,
      situacao: "Saiu fora da meta", min: f.min, motivo: `meta de ${dashFmtMin(s.alvo)} para ${f.grav}: levou ${dashFmtMin(f.min)}`, id: f.id, campo: f.campo })));
    protocolos.lista.filter(c => ["atrasoSantaCasa", "atrasoAmbulancia", "atrasoSemCausa"].includes(c.cat)).forEach(c => out.push({ origem: "avc", pri: 1, nome: c.nome, ficha: c.ficha, grav: c.grav || "Vermelho",
      situacao: "Protocolo de AVC", min: c.minSaida, motivo: ({ atrasoSantaCasa: `passou de ${dashFmtMin(c.meta)}: Santa Casa demorou a pedir a ambulância`, atrasoAmbulancia: `passou de ${dashFmtMin(c.meta)}: ambulância demorou a sair`, atrasoSemCausa: `passou de ${dashFmtMin(c.meta)}: sem horário do pedido da ambulância` })[c.cat], id: c.id, campo: "horario_saida_ambulancia" }));
    situacao.filter(c => c.id.startsWith("st:")).forEach(c => c.itens.filter(it => !justMap[String(it.id)]).forEach(it => out.push({ origem: "nao", pri: c.id === "st:Reinserida" || c.id === "st:Não realizada (ambulância indisponível)" || c.id === "st:Paciente instável / remoção não liberada" ? 2 : 3,
      nome: it.nome, ficha: it.ficha, grav: String(it.grav || "").replace(/^./, m => m.toUpperCase()), situacao: c.rotulo, min: null, motivo: c.ajuda.replace(/^Status da planilha: /, "status: ").replace(/\.$/, ""), id: it.id, campo: it.campo })));
    return out;
  }, [sla, protocolos, situacao, justMap]);

  /* ═══ Montagem da tela ═══════════════════════════════════════════════════
   * Tudo acima (estados, filtros e contas) é o mesmo de antes; daqui para baixo é só a apresentação. Nenhum hook novo
   * depois dos `return` de carregamento: a ordem dos hooks tem que ser sempre a mesma.                                */
  const h = React.createElement;

  /* ─── Estados de carga ─────────────────────────────────────────────── */
  if (carregando) return h("div", { className: "dsh dsh-estado" }, "Carregando indicadores…");

  if (erro) return h("div", { className: "dsh", style: { padding: 20 } },
    h("div", { className: "dsh-banner", style: { background: "#FEF2F2", borderColor: "#FECACA", color: "#991B1B" } },
      h(DashIcone, { n: "alert", tam: 16 }), h("div", null, h("b", null, "Não foi possível carregar as remoções."), " ", erro)));

  const fmtDia = d => new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
  const [deDia, ateDia] = tudo ? [amplitude.min, amplitude.max] : [fIni, fFim];
  // Sempre com a unidade escrita: "5h 22min" (5 horas e 22 minutos) ou "22min". Nunca "5:22", que não diz se são horas ou minutos.
  const fmtMin = dashFmtMin;
  const rotuloSerie = k => escalaEfetiva === "mes"
    ? new Date(k + "-01T00:00:00").toLocaleDateString("pt-BR", { month: "short" })
    : new Date(k + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const rotuloLongoSerie = k => escalaEfetiva === "mes"
    ? new Date(k + "-01T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : escalaEfetiva === "semana"
      ? "Semana de " + new Date(k + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
      : new Date(k + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });

  // Avisos sob o gráfico: pedidos do período que ainda não têm saída ou finalização (não aparecem nas barras/linhas)
  const GRAV_NOME = { emergencia: "Vermelho", urgencia: "Amarelo", menor_gravidade: "Verde", agendamento: "Cinza" };
  const fecharAba = () => setAba(null);
  const ativaSec = id => {
    if (imprimindo && impEscopo === "tudo") return true;                                    // painel inteiro: todas as abas
    if (imprimindo && String(impEscopo).indexOf("sec-") === 0) return id === impEscopo;      // só uma aba
    return secao === id;                                                                    // tela normal e impressão de um bloco: a aba aberta
  };
  const irParaBloco = id => {   // troca para a aba onde o bloco mora e só então rola até ele
    const sec = DASH_SECAO_DO_BLOCO[id];
    if (sec) setSecao(sec);
    setTimeout(() => { const el = document.getElementById(id); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80);
  };
  const painelAba = aba === "remocao" ? React.createElement(DashPainelLista, {
      titulo: "Em remoção agora", sub: "cards na coluna “Remoção em andamento” do Kanban", onFechar: fecharAba, onIr: irParaBloco, vazio: "Nenhuma remoção em andamento.",
      linhas: cards.filter(c => c.col_id === "andamento").map(c => ({ nome: c.nome || "(sem nome)", ficha: c.ficha_cross || "", texto: `${GRAV_NOME[c.grav] || "Sem prioridade"} · ${c.hosp ? "→ " + c.hosp : "sem hospital de destino"}`, fn: onAbrirCard ? () => onAbrirCard(c.id) : null, rotFn: "abrir card →" })) })
    : aba === "nao" ? React.createElement(DashNaoAtendidas, { lista: naoLista, just: justMap, justOk, podeJustificar, onJustificar: justificarRemocoes, onDesfazer: desjustificarRemocao, onFechar: fecharAba, onIr: irParaBloco })
    : aba === "falhas" ? React.createElement(DashPainelLista, {
      titulo: "Falhas a corrigir", sub: "o que está errado ou faltando nos registros, por tipo", onFechar: fecharAba, onIr: irParaBloco, vazio: "Nenhuma falha a corrigir.",
      rodape: { rot: "ver os casos, com link para corrigir ↓", alvo: "bloco-saneamento" },
      linhas: problemas.grupos.filter(g => g.tipo === "corrigir" && g.itens.length).sort((x, y) => y.itens.length - x.itens.length).map(g => ({ nome: g.titulo, ficha: "", texto: `${g.itens.length} caso${g.itens.length !== 1 ? "s" : ""}` })) })
    : null;
  const notasGraf = [];
  const nSemSaida = problemas.n("aguarda_cross") + problemas.n("aguarda_amb");
  const nSemFin = problemas.n("aguarda_cross") + problemas.n("cross_saida_sem_fin");
  const nSaidaSemData = problemas.n("saida_sem_data");
  if (nSemSaida > 0) notasGraf.push(`${nSemSaida} de ${tipos.cross} remoções CROSS do período (linhas com ficha) ainda sem saída de ambulância registrada.`);
  if (nSemFin > 0) notasGraf.push(`${nSemFin} de ${tipos.cross} remoções CROSS do período (linhas com ficha) sem finalização da CROSS.`);
  if (nSaidaSemData > 0) notasGraf.push(`${nSaidaSemData} linha${nSaidaSemData !== 1 ? "s" : ""} com horário de saída mas sem data de saída: não entra${nSaidaSemData !== 1 ? "m" : ""} nas barras.`);
  const nSaidaDeduz = problemas.n("saida_deduzida");
  if (nSaidaDeduz > 0) notasGraf.push(`${nSaidaDeduz} saída${nSaidaDeduz !== 1 ? "s" : ""} com data deduzida pela planilha (entra${nSaidaDeduz !== 1 ? "m" : ""} nas barras, mas vale confirmar a data).`);
  if (notasGraf.length > 0) notasGraf.push("As listas, com link para abrir cada linha na planilha, estão em “Saneamento de falhas”, logo abaixo.");
  const pctCross = tipos.total ? Math.round(tipos.cross / tipos.total * 100) : 0;
  const pctOutras = tipos.total ? 100 - pctCross : 0;

  const clinicas = gEspec.itens.filter(i => i.grupo === "clinica");
  const recursos = gEspec.itens.filter(i => i.grupo === "recurso");
  const naoClass = gEspec.itens.filter(i => !i.grupo);

  /* ─── Controles de período e escala ─── */
  const DICA_PERIODO = { tudo: "Todas as remoções da planilha, de qualquer data.", hoje: "Só as remoções pedidas hoje.", "7d": "Os últimos 7 dias, contando hoje.", mes: "Um mês inteiro, que você escolhe ao lado.", custom: "Um período à sua escolha: de uma data a outra." };
  const DICA_ESCALA = { dia: "O gráfico mostra um ponto por dia.", semana: "O gráfico mostra um ponto por semana (de segunda a domingo).", mes: "O gráfico mostra um ponto por mês." };
  const btnEscala = (id, txt) => {
    const on = escalaEfetiva === id, livre = escalaLiberada[id];
    return h("button", { key: id, type: "button", "aria-pressed": on, disabled: !livre, onClick: () => livre && setEscala(id), title: livre ? DICA_ESCALA[id] : motivoBloqueio[id] }, txt);
  };
  const btnPeriodo = (id, txt) => h("button", { key: id, type: "button", "aria-pressed": periodo === id, title: DICA_PERIODO[id],
    onClick: () => {
      setPeriodo(id);
      if (id === "custom" && (!ini || !fim)) { setIni(iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29))); setFim(hojeIso); }
    } }, txt);
  const NOMES_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const anos = []; for (let y = 2025; y <= hoje.getFullYear(); y++) anos.push(y);

  /* ─── Números de apoio para o resumo do topo e para as abas ─── */
  const porDia = diasNoPeriodo ? (totaisGraf.saidas / diasNoPeriodo).toFixed(1).replace(".", ",") : null;
  const slaAval = sla.reduce((t, s) => t + s.avaliadas, 0), slaDentro = sla.reduce((t, s) => t + s.dentro, 0);
  const nAguardando = cards.filter(c => DASH_COLUNAS_AGUARDANDO[c.col_id]).length;
  const badges = {
    "sec-agora": nAguardando > 0 ? { n: nAguardando } : null,
    "sec-problemas": qualidade.nCorrigir > 0 ? { n: qualidade.nCorrigir, tom: "warn" } : null
  };
  const periodoTxt = deDia ? `${fmtDia(deDia)}${ateDia && ateDia !== deDia ? " a " + fmtDia(ateDia) : ""}` : "";

  const impCtx = {
    secao: (id, rot) => imprimir(id, rot, null),
    bloco: el => {
      const blk = el && el.closest ? el.closest('[id^="bloco-"]') : null;
      if (!blk) return;
      const t = blk.querySelector(".dsh-title__t > span:not(.dsh-title__icon)");
      imprimir("bloco", t ? t.textContent : "", blk.id);
    }
  };
  return h(DashImpCtx.Provider, { value: impCtx }, h("div", { id: "dash-print-root", className: "dsh",
    // ao trocar de período a tela fica visível, só mais clara, até chegar o dado novo
    style: { padding: "4px 0 40px", opacity: atualizando ? 0.6 : 1, transition: "opacity .15s" } },
    h("style", null, DASH_CSS_IMPRESSAO),
    h("div", { className: "dash-print-only", style: { marginBottom: 14, paddingBottom: 8, borderBottom: "2px solid #0F172A" } },
      h("div", { style: { fontSize: 16, fontWeight: 700, color: "#0F172A" } }, "Gerência de Enfermagem · Santa Casa de Francisco Morato — Painel de regulação"),
      impRotulo && h("div", { style: { fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 4 } }, (impEscopo === "bloco" ? "Bloco: " : "Aba: ") + impRotulo),
      h("div", { style: { fontSize: 11.5, color: "#475569", marginTop: 3 } },
        `${periodo === "tudo" ? "Todos os registros" : "Período"}${deDia ? ": " + fmtDia(deDia) + (ateDia && ateDia !== deDia ? " a " + fmtDia(ateDia) : "") : ""} · ${totaisGraf.saidas} saídas de ambulância${diasNoPeriodo ? " (" + porDia + " por dia)" : ""} · ${dados.length} linhas · gerado em ${new Date().toLocaleString("pt-BR")}`)),

    /* ══ Barra de controles ══ */
    h("div", { className: "dsh-bar-tools dash-no-print" },
      h("div", { className: "dsh-seg", role: "group", "aria-label": "Período" }, [["tudo", "Tudo"], ["hoje", "Hoje"], ["7d", h(React.Fragment, null, h("span", { className: "dsh-hide-sm" }, "Últimos "), "7 dias")], ["mes", "Mês"], ["custom", "Período"]].map(([id, txt]) => btnPeriodo(id, txt))),
      periodo === "mes" && h("div", { style: { display: "flex", gap: 6 } },
        h("select", { "aria-label": "Mês", className: "dsh-in", value: mesSel, onChange: e => setMesSel(Number(e.target.value)) }, NOMES_MES.map((n, i) => h("option", { key: i, value: i }, n))),
        h("select", { "aria-label": "Ano", className: "dsh-in", value: anoSel, onChange: e => setAnoSel(Number(e.target.value)) }, anos.map(y => h("option", { key: y, value: y }, y)))),
      periodo === "custom" && h("div", { style: { display: "flex", gap: 6, alignItems: "center", fontSize: 13, color: "var(--muted)" } },
        "de", h("input", { type: "date", className: "dsh-in", "aria-label": "Data inicial", value: ini, max: fim || undefined, onChange: e => setIni(e.target.value) }),
        "a", h("input", { type: "date", className: "dsh-in", "aria-label": "Data final", value: fim, min: ini || undefined, onChange: e => setFim(e.target.value) })),
      h("div", { className: "dsh-seg", role: "group", "aria-label": "Escala do gráfico" }, [["dia", "Diária"], ["semana", "Semanal"], ["mes", "Mensal"]].map(([i, t]) => btnEscala(i, t))),
      h("span", { className: "dsh-bar-tools__sp" }),
      h("button", { type: "button", className: "dsh-btn", onClick: () => setVerGlossario(true), title: "Explica, em palavras simples, cada termo do painel (mediana, P95, fora da unidade…)." }, h(DashIcone, { n: "book", tam: 15 }), "Glossário"),
      h(DashMenuImprimir, { imprimindo, secaoRot: (DASH_SECOES.find(x => x.id === secao) || {}).titulo,
        onTudo: () => imprimir("tudo", "", null), onAba: () => imprimir(secao, (DASH_SECOES.find(x => x.id === secao) || {}).titulo, null) })),

    !faixa && h("div", { className: "dsh-aviso" }, "Escolha a data inicial e a final do período (a inicial não pode ser depois da final)."),
    /* Escala indisponível: diz o porquê em vez de esconder o botão */
    !escalaLiberada[escala] && escala !== "dia" && h("div", { className: "dsh-aviso" },
      "Escala ", escala === "mes" ? "mensal" : "semanal", " ainda não disponível — ", motivoBloqueio[escala], ". Mostrando a diária."),

    /* ══ Resumo do período: os quatro números que respondem "como estamos?" ══ */
    h("div", { className: "dsh-grid dsh-g4 dsh-grid--tight dsh-resumo-grid", style: { marginBottom: 8 } },
      h(DashKpi, { label: "Remoções no período", valor: tipos.total, sub: `${tipos.cross} CROSS · ${tipos.outras} outras`,
        tooltip: "Todas as linhas da planilha no período escolhido (remoções CROSS + outras remoções)." }),
      h(DashKpi, { label: "Saídas de ambulância", valor: totaisGraf.saidas, cor: "#2563EB", sub: porDia ? `${porDia} por dia` : "no período",
        tooltip: "Quantas vezes a ambulância saiu da Santa Casa no período (qualquer linha, CROSS ou outras, com data e horário de saída)." }),
      h(DashKpi, { label: "Dentro da meta", valor: slaAval ? Math.round(slaDentro / slaAval * 100) + "%" : "—", cor: slaAval ? "#15803D" : "#94A3B8",
        sub: slaAval ? `${slaDentro} de ${slaAval} remoções avaliadas` : "sem meta cadastrada ou sem remoções medidas",
        tooltip: "Das remoções que têm gravidade e os dois horários, quantas saíram no tempo da meta cadastrada em Configurações para a gravidade delas." }),
      h(DashKpi, { label: "Tempo total (mediana)", valor: fmtMin(tempoTotal.mediana), cor: "#0F766E",
        sub: tempoTotal.n ? `solicitação → retorno · ${tempoTotal.n} remoç${tempoTotal.n !== 1 ? "ões" : "ão"}` : "nenhuma remoção com todos os momentos",
        tooltip: "Da solicitação à CROSS até a ambulância voltar, remoção por remoção, só nas que têm todos os horários preenchidos." })),
    periodoTxt && h("div", { className: "dsh-resumo dash-no-print", style: { marginBottom: 16 } }, `${periodo === "tudo" ? "Todos os registros" : "Período"}: ${periodoTxt}${atualizando ? " · atualizando…" : ""}`),

    h(DashNavSecoes, { ativa: secao, onSelect: setSecao, badges }),

    /* ══ 1 · Agora ══ */
    h(DashSecao, { id: "sec-agora", ativa: ativaSec("sec-agora") },
      h(DashAlertas, {
        aba, agAberto, agFiltro, painel: painelAba, onIr: irParaBloco,
        onTile: id => {
          if (id === "aguardando" || id === "verm") {   // estes dois abrem a lista de aguardando, que fica logo abaixo
            const f = id === "verm" ? "vermelhos" : "todos";
            if (agAberto && agFiltro === f) setAgAberto(false); else { setAgAberto(true); setAgFiltro(f); }
            setAba(null);
          } else setAba(x => x === id ? null : id);
        },
        cards, cfg, hojeIso, sla, rein: reinsercao, qualidade, nCorrigir: qualidade.nCorrigir, emRemocao: cards.filter(c => c.col_id === "andamento").length,
        naoAtendidas: nNaoJust, nJustificadas: nJust
      }),
      h(DashAguardando, { cards, cfg, hojeIso, onAbrirCard, aoVivo: isAdmin, aberto: agAberto, onToggle: () => setAgAberto(v => !v), filtro: agFiltro, onFiltro: setAgFiltro }),
      h(DashFilaKanban, { cols, cards, titulo: isAdmin ? "Agora · fila do Kanban" : "Última publicação · fila do Kanban" })),

    /* ══ 2 · Atrasos ══ */
    h(DashSecao, { id: "sec-atrasos", ativa: ativaSec("sec-atrasos") },
      h(DashTempos, { intervalos, total: tempoTotal }),
      h("div", { className: "dsh-grid dsh-g2" },
        h(DashSLA, { sla, semGrav: slaSemGrav }),
        h(DashMotivos, { linhas: temposLinha, limMotivo })),
      h(DashProtocoloAVC, { protocolos, totalRemocoes: dados.length })),

    /* ══ 3 · Capacidade ══ */
    h(DashSecao, { id: "sec-capacidade", ativa: ativaSec("sec-capacidade") },
      h(DashFrota, { frota: frotaHoje, fora: foraStats, longas: longasFora, cobertura: coberturaFrota }),
      h(DashVolume, { serie, escala: escalaEfetiva, rotulo: rotuloSerie, rotuloLongo: rotuloLongoSerie, totais: totaisGraf, notas: notasGraf })),

    /* ══ 4 · Problemas ══ */
    h(DashSecao, { id: "sec-problemas", ativa: ativaSec("sec-problemas") },
      h(DashReinsercao, { rein: reinsercao }),
      h(DashSaneamento, {
        grupos: problemas.grupos, total: dados.length,
        onAbrirCard, onAbrirAcoes, onAbrirLivro, podeJustificar,
        onJustificar: d => { setJustModal(d); setJustTexto(""); }
      })),

    /* ══ 5 · Análise ══ */
    h(DashSecao, { id: "sec-analise", ativa: ativaSec("sec-analise") },
      /* Remoções na planilha: CROSS + outras = total de linhas */
      h(DashCard, { id: "bloco-planilha" },
        h(DashTitulo, {
          icone: "list", extra: "CROSS + outras = total de linhas",
          tooltip: "Cada linha da planilha é uma remoção. Remoção CROSS é a que tem o número da ficha da CROSS; as outras (altas, hemodiálise, exames…) não têm ficha. As duas somam o total de linhas do período. Para comparar com a planilha inteira, escolha Tudo."
        }, "Remoções na planilha"),
        h("div", { className: "dsh-hero", style: { marginBottom: 0 } },
          h("div", { className: "dsh-hero__num" },
            h("div", { className: "dsh-big dsh-num" }, h(DashNum, { valor: tipos.total })),
            h("div", { className: "dsh-sub" }, "linhas no período")),
          h("div", { className: "dsh-hero__bar" },
            h(DashEmpilhada, { alto: "lg", segs: [
              { id: "cross", rot: "Remoções CROSS (com ficha)", valor: tipos.cross, cor: "#0369A1" },
              { id: "outras", rot: "Outras remoções (sem ficha)", valor: tipos.outras, cor: "#CBD5E1" }] }))),
        !tudo && anomalas.some(r => !r.data_solicitacao) && h("div", { className: "dsh-nota dsh-nota--warn", style: { marginTop: 12 } },
          `${anomalas.filter(r => !r.data_solicitacao).length} linha${anomalas.filter(r => !r.data_solicitacao).length !== 1 ? "s" : ""} da planilha sem data de solicitação não pertence${anomalas.filter(r => !r.data_solicitacao).length !== 1 ? "m" : ""} a período nenhum e não entra${anomalas.filter(r => !r.data_solicitacao).length !== 1 ? "m" : ""} nestes totais (veja Saneamento de falhas).`)),
      h(DashDestinos, { destinos }),
      h(DashPermanece, { tempos: temposLinha, C, geral: perm }),

      /* Distribuições */
      h("div", { className: "dsh-grid dsh-g2" },
        /* Gravidade — proporção importa mais que valor absoluto */
        h(DashCard, { id: "bloco-gravidade" },
          h(DashTitulo, { icone: "alert", extra: h(DashCobertura, { g: gGrav }), tooltip: "Quantos pacientes há em cada nível de urgência, segundo a prioridade da ficha da CROSS: vermelho = emergência, amarelo = urgência, verde = menos grave, cinza = agendamento." }, "Gravidade"),
          gGrav.itens.length === 0 ? h(DashVazio, null, "Sem dados") : (() => {
            const ordem = (C ? C.GRAVIDADE_ORDEM : []).map(g => ({ g, it: gGrav.itens.find(i => i.canonico === g) })).filter(x => x.it);
            return h("div", { className: "dsh-rosca-box" },
              h(DashRosca, { centro: gGrav.informados, sub: "com gravidade", segs: ordem.map(({ g, it }) => ({ id: g, rot: g, valor: it.n, cor: C.GRAVIDADE_COR[g] })) }),
              h("div", { className: "dsh-lista-leg" },
                ordem.map(({ g, it }) => h("div", { key: g },
                  h("span", { className: "dsh-dot", style: { background: C.GRAVIDADE_COR[g] } }),
                  h("span", { className: "dsh-lista-leg__n" }, g),
                  h("b", { className: "dsh-num" }, it.n),
                  h("span", { className: "dsh-leg__p", style: { minWidth: 36, textAlign: "right" } }, Math.round(it.pct) + "%")))));
          })()),

        /* Especialidades — recursos apartados das clínicas */
        h(DashCard, { id: "bloco-recursos" },
          h(DashTitulo, { icone: "bars", extra: h(DashCobertura, { g: gEspec }), tooltip: "O que foi pedido à CROSS: especialidades médicas (clínica, ortopedia…) e recursos (exames, procedimentos). Os recursos ficam separados porque não disputam as mesmas vagas dos leitos." }, "Recursos solicitados"),
          gEspec.itens.length === 0 ? h(DashVazio, null, "Sem dados") :
          h(React.Fragment, null,
            recursos.length > 0 && h(React.Fragment, null,
              recursos.map(i => h(DashBarra, { key: i.canonico, label: i.canonico, n: i.n, pct: i.pct, tag: "recurso", max: Math.max(...gEspec.itens.map(x => x.n)), cor: "#8B5CF6" })),
              h("div", { className: "dsh-sep", style: { margin: "12px 0" } })),
            clinicas.map(i => h(DashBarra, { key: i.canonico, label: i.canonico, n: i.n, pct: i.pct, max: Math.max(...gEspec.itens.map(x => x.n)), cor: "#6366F1" })),
            naoClass.map(i => h(DashBarra, { key: "nc", label: "Não classificado", n: i.n, pct: i.pct, max: Math.max(...gEspec.itens.map(x => x.n)), cor: "#CBD5E1" })))),

        /* Status */
        h(DashCard, { id: "bloco-desfecho" },
          h(DashTitulo, { icone: "check", extra: h(DashCobertura, { g: gStatus }), tooltip: "O que aconteceu com cada pedido, segundo o status da planilha: finalizada pela CROSS, cancelada, paciente evadiu, resolvido no próprio hospital etc." }, "Desfecho"),
          gStatus.itens.length === 0 ? h(DashVazio, null, "Sem dados") :
          gStatus.itens.map(i => h(DashBarra, { key: i.canonico, label: i.canonico === (C && C.NAO_CLASSIFICADO) ? "Não classificado" : i.canonico,
            n: i.n, pct: i.pct, max: gStatus.itens[0].n, cor: i.canonico === (C && C.NAO_CLASSIFICADO) ? "#CBD5E1" : "#64748B" }))),

        /* Ambulância */
        h(DashCard, { id: "bloco-ambulancia" },
          h(DashTitulo, { icone: "truck", extra: h(DashCobertura, { g: gAmb }), tooltip: "Básica: técnico e motorista. Avançada: tem médico a bordo, usada em casos graves; a UTI móvel conta como avançada. A porcentagem é sobre as linhas que têm o tipo preenchido (o número aparece no canto do cartão); as linhas sem tipo ficam de fora." }, "Tipo de ambulância"),
          gAmb.itens.length === 0 ? h(DashVazio, null, "Sem dados") :
          h(DashEmpilhada, { alto: "lg", segs: gAmb.itens.map(i => ({
            id: i.canonico, rot: i.canonico === (C && C.NAO_CLASSIFICADO) ? "Outro / não classificado" : i.canonico, valor: i.n,
            cor: i.canonico === (C && C.NAO_CLASSIFICADO) ? "#CBD5E1" : i.canonico === "AVANÇADA" ? "#F59E0B" : "#64748B" })) }),
          gAmb.total - gAmb.informados > 0 && h("div", { className: "dsh-nota" + (gAmb.cobertura < 80 ? " dsh-nota--warn" : ""), style: { marginTop: 12 } },
            `${gAmb.total - gAmb.informados} linha${gAmb.total - gAmb.informados !== 1 ? "s" : ""} sem tipo de ambulância ficam fora desta conta${gAmb.cobertura < 80 ? ", então a porcentagem de avançadas pode estar subestimada" : ""}.`)))),

    /* ══ 6 · Exceções ══ */
    h(DashSecao, { id: "sec-excecoes", ativa: ativaSec("sec-excecoes") },
      h(DashExcecoes, { cards, cfg, hojeIso, plan: excecoesPlan, onAbrirCard })),

    /* ── Modal de justificativa ── */
    justModal && h(DashModal, { titulo: "Por que este paciente tem prioridade?", sub: "Justificativa de discrepância", onClose: () => setJustModal(null), largura: 480 },
      h("div", { style: { background: "var(--bg)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13 } },
        h("div", { style: { fontWeight: 700 } }, justModal.aceitado.nome,
          h("span", { className: "dsh-sub", style: { marginLeft: 6 } }, "(" + ((GC[justModal.aceitado.grav] && GC[justModal.aceitado.grav].label) || "") + ") • " + (justModal.aceitado.rec || ""))),
        h("div", { className: "dsh-sub", style: { marginTop: 4 } }, "Aguarda: ", justModal.pendente.nome, " (", (GC[justModal.pendente.grav] && GC[justModal.pendente.grav].label) || "", ")")),
      h("label", { htmlFor: "dash-just-texto", style: { fontSize: 13, fontWeight: 650, display: "block", marginBottom: 6 } }, "Justificativa clínica *"),
      h("textarea", { id: "dash-just-texto", rows: 4, value: justTexto, onChange: e => setJustTexto(e.target.value),
        placeholder: "Ex: Protocolo de dor torácica, aguarda exame. Complicação aguda justifica prioridade...",
        className: "dsh-in", style: { width: "100%", height: "auto", padding: "10px 12px", resize: "vertical", lineHeight: 1.5 } }),
      h("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 } },
        h("button", { type: "button", className: "dsh-btn", onClick: () => setJustModal(null) }, "Cancelar"),
        h("button", { type: "button", className: "dsh-btn dsh-btn--primary", disabled: !justTexto.trim() || justSaving,
          onClick: async () => {
            if (!justTexto.trim()) return; setJustSaving(true);
            const d = justModal;
            try {
              const rj = await fetch(SB_URL + "/rest/v1/discrepancia_justificativas", { method: "POST", headers: Object.assign({}, H(), { Prefer: "return=minimal" }),
                body: JSON.stringify({ card_id: d.aceitado.id, card_nome: d.aceitado.nome, card_grav: d.aceitado.grav, conflito_card_id: d.pendente.id, conflito_card_nome: d.pendente.nome, conflito_card_grav: d.pendente.grav, justificativa: justTexto.trim(), justificado_por_nome: (currentUser && currentUser.nome) || "" }) });
              if (!rj.ok) throw new Error(await rj.text());
              const aud = await dashAuditar({ acao: "justificar_discrepancia", entidade: "card", entidade_id: d.aceitado.id,
                resumo: `Justificou a prioridade de ${d.aceitado.nome} sobre ${d.pendente.nome}: ${justTexto.trim()}`, depois: { card_id: d.aceitado.id, conflito_card_id: d.pendente.id, justificativa: justTexto.trim() } },
                (currentUser && currentUser.nome) || userNome || "");
              setJustModal(null); showT("Justificativa registrada." + (aud.ok ? "" : " ATENÇÃO: não foi registrado na auditoria (" + aud.erro + ")."), aud.ok ? undefined : "err");
            } catch (ex) { showT("Erro ao salvar: " + ex.message, "err"); }
            setJustSaving(false);
          } }, justSaving ? "Salvando..." : "Registrar"))),

    /* ══ Configurações do painel (frota, metas e limites): só administrador ══ */
    isAdmin && h(DashConfig, { cfg, userNome, recarregar: recarregarCfg, showT, hojeIso }),
    verGlossario && h(DashGlossario, { onClose: () => setVerGlossario(false) }),

    /* Rodapé honesto sobre a base */
    h("div", { className: "dsh-nota", style: { marginTop: 24, color: "var(--faint)" } },
      "Indicadores calculados sobre a planilha de remoções. ",
      "Percentuais usam como denominador os registros que informaram cada campo — o número aparece ao lado de cada bloco.")
  ));
}

function PublicationsHistory({
  onRestoreSnapshot
}) {
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  useEffect(() => {
    sbGet("publications", "order=created_at.desc&limit=50").then(rows => {
      setPubs(rows);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  function handleRestore(pub) {
    if (!window.confirm(`Restaurar o kanban para a versão de "${pub.label}"?

Isso vai substituir a visualização atual pelos dados desse snapshot.`)) return;
    const snap = pub.snapshot || {};
    onRestoreSnapshot(snap.cards || [], snap.cols || []);
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 16,
      color: "#0F172A",
      marginBottom: 4
    }
  }, "Histórico de publicações"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#64748B",
      marginBottom: 16
    }
  }, "Todas as versões publicadas — clique para expandir e restaurar"), loading && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: 32,
      color: "#94A3B8"
    }
  }, "Carregando…"), !loading && pubs.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: 32,
      color: "#CBD5E1",
      fontSize: 13
    }
  }, "Nenhuma publicação registrada."), pubs.map((pub, i) => {
    const isAuto = pub.label?.includes("automático");
    const snap = pub.snapshot || {};
    const cards = snap.cards || [];
    const isExp = expanded === pub.id;
    const cols = snap.cols || [];
    return /*#__PURE__*/React.createElement("div", {
      key: pub.id,
      style: {
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        marginBottom: 8,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => setExpanded(isExp ? null : pub.id),
      style: {
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        background: isExp ? "#F8FAFC" : "#fff"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center",
        marginBottom: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: "#0F172A"
      }
    }, isAuto?(pub.label||"Snapshot automático"):("Publicação " + new Date(pub.created_at).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}))), isAuto && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontWeight: 700,
        padding: "1px 5px",
        borderRadius: 3,
        background: "#F1F5F9",
        color: "#94A3B8"
      }
    }, "AUTO")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#94A3B8"
      }
    }, new Date(pub.created_at).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }), pub.published_by_nome && /*#__PURE__*/React.createElement("span", null, " · por ", pub.published_by_nome), /*#__PURE__*/React.createElement("span", null, " · ", cards.length, " pacientes"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        handleRestore(pub);
      },
      style: {
        padding: "4px 12px",
        border: "1px solid #BFDBFE",
        borderRadius: 6,
        background: "none",
        color: "#1E40AF",
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 600
      }
    }, "Restaurar"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#CBD5E1",
        fontSize: 13
      }
    }, isExp ? "▲" : "▼"))), isExp && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "0 16px 14px",
        borderTop: "1px solid #F1F5F9"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        marginTop: 10
      }
    }, cols.map(col => {
      const n = cards.filter(c => c.col_id === col.id).length;
      return /*#__PURE__*/React.createElement("div", {
        key: col.id,
        style: {
          background: "#F8FAFC",
          borderRadius: 7,
          padding: "6px 12px",
          display: "flex",
          gap: 6,
          alignItems: "center"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12
        }
      }, col.emoji), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "#374151"
        }
      }, col.label), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          fontWeight: 700,
          color: "#0F172A"
        }
      }, n));
    })), cards.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        maxHeight: 200,
        overflowY: "auto"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 600,
        color: "#94A3B8",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: ".05em"
      }
    }, "Pacientes neste snapshot"), cards.slice(0, 20).map((c, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        fontSize: 11,
        color: "#374151",
        padding: "3px 0",
        borderBottom: "1px solid #F8FAFC"
      }
    }, c.nome, " ", c.idade ? "· " + c.idade : "", " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#94A3B8"
      }
    }, "(", c.hd, ")"))), cards.length > 20 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#94A3B8",
        marginTop: 4
      }
    }, "…e mais ", cards.length - 20, " pacientes"))));
  }));
}
