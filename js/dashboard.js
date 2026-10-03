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

/* ─── Fila do Kanban: cartões clicáveis que abrem a lista dos pacientes ───────
 * Componente próprio (fora do Dashboard) de propósito: abrir/fechar a janela
 * não re-renderiza o Dashboard inteiro, então os números não reanimam do zero.
 * "Aceitos sem hospital" conta só pacientes nas colunas abaixo. Pediatria e
 * Psiquiatria não são colunas — são marcas dentro delas, então já entram.
 * Para incluir outra coluna, acrescente o id dela aqui.                      */
const DASH_COLUNAS_ACEITAS = ["aceite", "andamento"];

function DashFilaKanban({ cols, cards, Card, Num, titulo }) {
  const h = React.createElement;
  const [sel, setSel] = useState(null); // { titulo, chave }
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

  useEffect(() => {
    if (!sel) return;
    const f = e => { if (e.key === "Escape") setSel(null); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [sel]);

  const catRotulo = c => (c.categoria && c.categoria !== "normal")
    ? (c.categoria.charAt(0).toUpperCase() + c.categoria.slice(1)) : (c.is_rn ? "RN" : null);

  return h(React.Fragment, null,
    h("div", { style: { marginBottom: 22 } },
      h("div", { style: { fontSize: 10.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 } }, titulo),
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 11 } },
        cols.map(c => h(Card, { key: c.id, style: { padding: "13px 15px" }, onClick: abrir(c.label, c.id, (porCol[c.id] || []).length) },
          h("div", { style: { fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, c.label),
          h("div", { style: { fontSize: 23, fontWeight: 700, color: c.accent || "#64748B", lineHeight: 1 } },
            h(Num, { valor: (porCol[c.id] || []).length })))),
        semHosp.length > 0 && h(Card, {
          key: "sh", style: { padding: "13px 15px", borderColor: "#FDE68A", background: "#FFFBEB" },
          onClick: abrir("Aceitos sem hospital de destino", "__semhosp", semHosp.length)
        },
          h("div", { style: { fontSize: 10, fontWeight: 600, color: "#B45309", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 } }, "Aceitos sem hospital"),
          h("div", { style: { fontSize: 23, fontWeight: 700, color: "#B45309", lineHeight: 1 } }, h(Num, { valor: semHosp.length }))))),

    sel && h("div", {
      onClick: e => { if (e.target === e.currentTarget) setSel(null); },
      style: { position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }
    },
      h("div", { role: "dialog", "aria-modal": "true", style: { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.25)", overflow: "hidden" } },
        h("div", { style: { padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" } },
          h("div", null,
            h("div", { style: { fontWeight: 700, fontSize: 15, color: "#0F172A" } }, sel.titulo),
            h("div", { style: { fontSize: 11, color: "#94A3B8", marginTop: 2 } }, lista.length + " paciente" + (lista.length !== 1 ? "s" : ""))),
          h("button", { onClick: () => setSel(null), "aria-label": "Fechar", style: { background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 20, padding: 4 } }, "✕")),
        h("div", { style: { overflowY: "auto", padding: "8px 20px 16px" } },
          lista.length === 0
            ? h("div", { style: { padding: "24px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 } }, "Nenhum paciente aqui agora.")
            : lista.map((c, i) => {
                const g = GC[c.grav] || (typeof GC_SEM !== "undefined" ? GC_SEM : GC.urgencia);
                const cat = catRotulo(c);
                const meta = [c.setor, c.rec, sel.chave === "__semhosp" ? rotuloCol(c.col_id) : (c.hosp ? "→ " + c.hosp : null)].filter(Boolean).join(" · ");
                return h("div", { key: c.id, style: { padding: "11px 0", borderTop: i ? "1px solid #F1F5F9" : "none" } },
                  h("div", { style: { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" } },
                    h("span", { style: { fontWeight: 600, fontSize: 13, color: "#0F172A" } }, c.nome,
                      cat && h("span", { style: { marginLeft: 6, fontSize: 9.5, fontWeight: 700, color: "#6D28D9", background: "#F5F3FF", borderRadius: 4, padding: "1px 5px", verticalAlign: "middle" } }, cat)),
                    h("span", { style: { fontSize: 10, fontWeight: 700, color: g.text, background: g.bg, border: "1px solid " + g.border, borderRadius: 99, padding: "1px 8px", whiteSpace: "nowrap" } }, g.label)),
                  c.hd && h("div", { style: { fontSize: 11.5, color: "#475569", marginTop: 3 } }, "HD: " + c.hd),
                  meta && h("div", { style: { fontSize: 11, color: "#94A3B8", marginTop: 3 } }, meta));
              })))));
}

/* ─── Protocolo de AVC e Tempos do caminho: componentes PRÓPRIOS, fora do Dashboard ───────────────────────
 * Mesmo motivo do DashFilaKanban: Card/Kpi/Titulo são criados dentro do Dashboard, então qualquer estado
 * guardado lá refaz todos os cartões a cada clique e os números reanimam do zero. Aqui o estado de
 * "qual card/linha está aberto" fica no próprio componente e o resto da tela não é tocado.            */
function DashProtocoloAVC({ protocolos, totalRemocoes, Card, Kpi, Titulo, Vazio, fmtMin }) {
  const [avcSel, setAvcSel] = useState(null);   // card aberto: "total" | "noHorario" | "atrasoSantaCasa" | "atrasoAmbulancia"
  useEffect(() => {
    if (!avcSel) return;
    const f = e => { if (e.key === "Escape") setAvcSel(null); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [avcSel]);
  return /*#__PURE__*/React.createElement("div", { style: { marginBottom: 22 } },
      /*#__PURE__*/React.createElement(Titulo, {
        extra: "meta: sair com médico e enfermeiro em até 1h da finalização da CROSS",
        tooltip: "Só entram remoções marcadas como Protocolo de AVC no Livro de Remoção (a partir de outubro/2026; antes disso não há registro). O tempo conta da finalização da ficha na CROSS até a saída da ambulância. Cada protocolo aparece em uma categoria só: no horário; atraso porque a Santa Casa demorou a solicitar a ambulância (solicitação feita mais de 1h depois da finalização); ou atraso da ambulância (a Santa Casa solicitou em até 1h, mas a saída passou de 1h). O protocolo só aparece aqui depois que a administração vincula o registro do Livro à planilha de remoção. Clique em um card para ver os casos."
      }, "Protocolo de AVC"),
      protocolos.total === 0
        ? /*#__PURE__*/React.createElement(Card, null,
            /*#__PURE__*/React.createElement(Vazio, null, "Nenhum protocolo de AVC no período. Marque “Protocolo de AVC” ao lançar o pedido no Livro de Remoção."))
        : /*#__PURE__*/React.createElement(React.Fragment, null,
            /*#__PURE__*/React.createElement("div", {
              style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 12 }
            },
              /*#__PURE__*/React.createElement(Kpi, {
                label: "Protocolos de AVC", valor: protocolos.total, cor: "#BE123C",
                sub: totalRemocoes ? `${(protocolos.total / totalRemocoes * 100).toFixed(1).replace(".", ",")}% das linhas do período · clique para ver` : "clique para ver",
                ativo: avcSel === "total", onClick: () => setAvcSel(avcSel === "total" ? null : "total"),
                tooltip: "Total de remoções marcadas como Protocolo de AVC no período selecionado. Clique para ver todos os casos." }),
              /*#__PURE__*/React.createElement(Kpi, {
                label: "Saíram no horário", valor: protocolos.noHorario, cor: "#15803D",
                sub: `${(protocolos.noHorario / protocolos.total * 100).toFixed(0)}% dos protocolos · até 1h`,
                ativo: avcSel === "noHorario", onClick: protocolos.noHorario ? () => setAvcSel(avcSel === "noHorario" ? null : "noHorario") : undefined,
                tooltip: "A ambulância saiu em até 1 hora depois da finalização da ficha na CROSS." }),
              /*#__PURE__*/React.createElement(Kpi, {
                label: "Atraso · Santa Casa", valor: protocolos.atrasoSantaCasa, cor: "#B45309",
                sub: "demorou a pedir a ambulância",
                alerta: protocolos.atrasoSantaCasa > 0,
                ativo: avcSel === "atrasoSantaCasa", onClick: protocolos.atrasoSantaCasa ? () => setAvcSel(avcSel === "atrasoSantaCasa" ? null : "atrasoSantaCasa") : undefined,
                tooltip: "Saíram depois de 1h porque a solicitação da ambulância foi feita mais de 1 hora depois da finalização da CROSS." }),
              /*#__PURE__*/React.createElement(Kpi, {
                label: "Atraso · ambulância", valor: protocolos.atrasoAmbulancia, cor: "#BE123C",
                sub: "chegou depois de 1h",
                alerta: protocolos.atrasoAmbulancia > 0,
                ativo: avcSel === "atrasoAmbulancia", onClick: protocolos.atrasoAmbulancia ? () => setAvcSel(avcSel === "atrasoAmbulancia" ? null : "atrasoAmbulancia") : undefined,
                tooltip: "Saíram depois de 1h mesmo com a solicitação feita em até 1 hora da finalização da CROSS: o atraso foi do setor de ambulância." })),

            /* ── A hora dividida: quanto levou cada lado ── */
            /*#__PURE__*/React.createElement("div", {
              style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12, marginTop: 12 }
            },
              /*#__PURE__*/React.createElement(Kpi, {
                label: "Santa Casa · finalização → solicitação", valor: fmtMin(protocolos.santaCasa.mediana), cor: "#B45309",
                sub: protocolos.santaCasa.n ? `mediana · ${protocolos.santaCasa.n} com horário · maior: ${fmtMin(protocolos.santaCasa.max)}` : "sem protocolos com os dois horários",
                tooltip: "Tempo mediano entre a finalização da ficha na CROSS e a solicitação da ambulância pela Santa Casa. É a parte da hora que depende da Santa Casa. Solicitação registrada antes da finalização não entra. Só entram protocolos com os dois horários." }),
              /*#__PURE__*/React.createElement(Kpi, {
                label: "Ambulância · solicitação → saída", valor: fmtMin(protocolos.ambulancia.mediana), cor: "#BE123C",
                sub: protocolos.ambulancia.n ? `mediana · ${protocolos.ambulancia.n} com horário · maior: ${fmtMin(protocolos.ambulancia.max)}` : "sem protocolos com os dois horários",
                tooltip: "Tempo mediano entre a solicitação da ambulância e a saída dela. É a parte da hora que depende do setor de ambulância. A meta de 1h é a soma das duas partes: se a Santa Casa gasta 45 min para solicitar, sobram 15 min para a ambulância sair. Só entram protocolos com os dois horários." })),

            /* ── Casos do card selecionado ── */
            avcSel && (() => {
              const TIT = { total: "Todos os protocolos de AVC", noHorario: "Saíram no horário", atrasoSantaCasa: "Atraso · Santa Casa demorou a pedir a ambulância", atrasoAmbulancia: "Atraso · ambulância saiu depois de 1h" };
              const SEL = { noHorario: ["No horário", "#15803D", "#DCFCE7"], atrasoSantaCasa: ["Atraso · Santa Casa", "#92400E", "#FEF3C7"],
                atrasoAmbulancia: ["Atraso · ambulância", "#9F1239", "#FFE4E6"], atrasoSemCausa: ["Atraso · causa não apurada", "#475569", "#F1F5F9"],
                semHorarios: ["Sem horário para medir", "#92400E", "#FFFBEB"] };
              const itens = avcSel === "total" ? protocolos.lista : protocolos.lista.filter(c => c.cat === avcSel);
              const rel = m => m === null ? "" : m >= 0 ? ` (${fmtMin(m)} após a finalização)` : ` (${fmtMin(-m)} antes da finalização)`;
              const linha = (rot, valor, falta, extra) => /*#__PURE__*/React.createElement("div", { style: { fontSize: 11.5, color: falta ? "#B45309" : "#475569", lineHeight: 1.55 } },
                rot + ": ", /*#__PURE__*/React.createElement("b", { style: { fontWeight: 600 } }, valor), falta ? " — falta" : "", extra || "");
              return /*#__PURE__*/React.createElement(Card, { style: { marginTop: 12 } },
                /*#__PURE__*/React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 10 } },
                  /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#0F172A" } }, TIT[avcSel],
                    /*#__PURE__*/React.createElement("span", { style: { fontWeight: 500, color: "#94A3B8", marginLeft: 8 } }, `${itens.length} caso${itens.length !== 1 ? "s" : ""}`)),
                  /*#__PURE__*/React.createElement("button", { onClick: () => setAvcSel(null), style: { background: "none", border: "1px solid #E2E8F0", color: "#64748B", borderRadius: 8, padding: "4px 12px", fontSize: 11.5, cursor: "pointer" } }, "Fechar")),
                itens.map((c, k) => /*#__PURE__*/React.createElement("div", { key: k, style: { padding: "10px 0", borderTop: k ? "1px solid #F1F5F9" : "none" } },
                  /*#__PURE__*/React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 } },
                    /*#__PURE__*/React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "#0F172A" } }, c.nome),
                    c.ficha && /*#__PURE__*/React.createElement("span", { style: { fontSize: 11, color: "#94A3B8" } }, "ficha " + c.ficha),
                    avcSel === "total" && c.cat && /*#__PURE__*/React.createElement("span", { style: { fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "2px 9px", color: SEL[c.cat][1], background: SEL[c.cat][2] } }, SEL[c.cat][0])),
                  c.destino && /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#94A3B8", marginBottom: 2 } }, "Destino: " + c.destino),
                  linha("Finalização da CROSS", c.finTxt, c.faltaFin),
                  linha("Solicitação da ambulância", c.pedTxt, false, rel(c.minPedido)),
                  linha("Saída da ambulância", c.saiTxt, c.faltaSaida, rel(c.minSaida)),
                  (c.minPedido !== null && c.minPedido >= 0 && c.minAmb !== null && c.minAmb >= 0) && (() => {
                    const total = c.minPedido + c.minAmb, escala = Math.max(60, total);
                    return /*#__PURE__*/React.createElement("div", { style: { marginTop: 7 } },
                      /*#__PURE__*/React.createElement("div", { style: { position: "relative", display: "flex", height: 8, borderRadius: 99, overflow: "hidden", background: "#F1F5F9" } },
                        /*#__PURE__*/React.createElement("div", { title: `Santa Casa: ${fmtMin(c.minPedido)}`, style: { width: `${c.minPedido / escala * 100}%`, background: "#F59E0B" } }),
                        /*#__PURE__*/React.createElement("div", { title: `Ambulância: ${fmtMin(c.minAmb)}`, style: { width: `${c.minAmb / escala * 100}%`, background: "#E11D48" } })),
                      /*#__PURE__*/React.createElement("div", { style: { position: "relative", height: 0 } },
                        /*#__PURE__*/React.createElement("div", { title: "Meta: 1h", style: { position: "absolute", left: `${60 / escala * 100}%`, top: -10, width: 2, height: 12, background: "#0F172A", borderRadius: 1 } })),
                      /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#64748B", marginTop: 4 } },
                        /*#__PURE__*/React.createElement("span", { style: { color: "#B45309", fontWeight: 600 } }, "Santa Casa " + fmtMin(c.minPedido)), " · ",
                        /*#__PURE__*/React.createElement("span", { style: { color: "#BE123C", fontWeight: 600 } }, "Ambulância " + fmtMin(c.minAmb)),
                        ` · total ${fmtMin(total)} (meta 1h)`));
                  })(),
                  (c.medico || c.enfermeiro) && /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#94A3B8", marginTop: 2 } },
                    "Médico: " + (c.medico || "—") + " · Enfermeiro(a): " + (c.enfermeiro || "—")))));
            })(),

            (protocolos.semHorarios > 0 || protocolos.atrasoSemCausa > 0) && /*#__PURE__*/React.createElement("div", {
              style: { fontSize: 11.5, color: "#64748B", lineHeight: 1.6, marginTop: 10 } },
              protocolos.semHorarios > 0 && /*#__PURE__*/React.createElement("div", null,
                `${protocolos.semHorarios} protocolo${protocolos.semHorarios !== 1 ? "s" : ""} sem horário para medir (contam no total, mas não entram nas três categorias): ${protocolos.semFinalizacao} sem finalização da CROSS · ${protocolos.semSaida} sem data ou horário de saída da ambulância. Clique em “Protocolos de AVC” para ver quais.`),
              protocolos.atrasoSemCausa > 0 && /*#__PURE__*/React.createElement("div", null,
                `${protocolos.atrasoSemCausa} saíram depois de 1h, mas sem o horário da solicitação da ambulância — a causa do atraso não pôde ser apurada.`))
          ));
}

function DashTempos({ intervalos, Card, Kpi, Titulo, fmtMin }) {
  const h = React.createElement;
  const [sel, setSel] = useState(null);     // id do intervalo aberto no modal
  const [gSel, setGSel] = useState(null);   // linha de gravidade aberta dentro do modal ("todas" ou o nome da gravidade)
  const fechar = () => { setSel(null); setGSel(null); };
  useEffect(() => {
    if (!sel) return;
    const f = e => { if (e.key === "Escape") fechar(); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [sel]);
  const it = sel ? intervalos.find(i => i.id === sel) : null;
  const COLS_GRID = "minmax(150px,2fr) repeat(4,minmax(62px,1fr))";
  const cel = (txt, extra) => h("span", { style: { textAlign: "right", fontSize: 12, color: "#64748B", fontVariantNumeric: "tabular-nums", ...extra } }, txt);

  return h(React.Fragment, null,
    h("div", { style: { marginBottom: 22 } },
      h(Titulo, {
        extra: "clique em um card para ver por gravidade",
        tooltip: "A ordem dos momentos é: solicitação (da Santa Casa à CROSS) → finalização (CROSS; o aceite é o mesmo momento) → solicitação da ambulância (Santa Casa) → saída da ambulância → retorno. Cada card é o intervalo entre dois momentos seguidos, pela mediana (para um caso extremo não distorcer). Só entram remoções com os dois horários. Se faltar data ou horário de um dos momentos, ou se estiverem fora de ordem (ou com 30 dias ou mais de diferença), o caso não entra e é contado no card; a lista com link está em “Saneamento de falhas”. O painel não completa nem adivinha nenhum horário."
      }, "Tempos do caminho da remoção"),
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 12 } },
        intervalos.map(i => h(Kpi, {
          key: i.id, label: i.rotulo, valor: fmtMin(i.todas.mediana), cor: i.cor,
          sub: (i.todas.nPos ? `${i.dono} · mediana · ${i.todas.nPos} com horário` : `${i.dono} · sem remoções com os dois horários`) + (i.nNeg ? ` · ${i.nNeg} inconsistente${i.nNeg !== 1 ? "s" : ""}` : ""),
          alerta: i.nNeg > 0,
          onClick: () => setSel(i.id),
          tooltip: i.tip + " Clique para ver por gravidade." })))),

    it && h("div", {
      onClick: e => { if (e.target === e.currentTarget) fechar(); },
      style: { position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }
    },
      h("div", { role: "dialog", "aria-modal": "true", "aria-label": it.rotulo,
        style: { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,.35)", overflow: "hidden" } },
        h("div", { style: { padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 } },
          h("div", null,
            h("div", { style: { fontWeight: 700, fontSize: 15, color: "#0F172A" } }, it.rotulo),
            h("div", { style: { fontSize: 11.5, color: "#64748B", marginTop: 3, lineHeight: 1.5 } },
              `Quanto tempo levou, por gravidade · ${it.dono} · mediana geral `, h("b", null, fmtMin(it.todas.mediana)), ` · ${it.todas.nPos} remoç${it.todas.nPos !== 1 ? "ões" : "ão"} medida${it.todas.nPos !== 1 ? "s" : ""}`)),
          h("button", { onClick: fechar, "aria-label": "Fechar", style: { background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 22, lineHeight: 1, padding: 4 } }, "×")),
        h("div", { style: { overflowY: "auto", padding: "14px 20px 18px" } },
          h("div", { style: { display: "grid", gridTemplateColumns: COLS_GRID, gap: "0 10px", alignItems: "center", fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".05em", padding: "0 8px 6px" } },
            h("span", null, "Gravidade"), cel("Remoções"), cel("Medidas"), cel("Mediana"), cel("Maior")),
          [it.todas, ...it.grupos].map(g => {
            const aberta = gSel === g.chave, clicavel = g.nPos > 0;
            const alterna = () => setGSel(aberta ? null : g.chave);
            return h("div", { key: g.chave,
              role: clicavel ? "button" : undefined, tabIndex: clicavel ? 0 : undefined,
              onClick: clicavel ? alterna : undefined,
              onKeyDown: clicavel ? (e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alterna(); } }) : undefined,
              style: { display: "grid", gridTemplateColumns: COLS_GRID, gap: "0 10px", alignItems: "center", padding: "9px 8px", borderRadius: 10,
                       cursor: clicavel ? "pointer" : "default", background: aberta ? "#F8FAFC" : "transparent",
                       border: `1px solid ${aberta ? "#CBD5E1" : "transparent"}`, transition: "background .15s,border-color .15s" } },
              h("span", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: g.chave === "todas" ? 700 : 600, color: "#0F172A", minWidth: 0 } },
                g.chave !== "todas" && h("span", { style: { width: 8, height: 8, borderRadius: 99, background: g.cor, flexShrink: 0 } }),
                g.chave === "todas" ? "Todas" : g.chave),
              cel(g.total), cel(g.nPos),
              cel(fmtMin(g.mediana), { fontSize: 13, fontWeight: 700, color: g.nPos ? "#0F172A" : "#CBD5E1" }),
              cel(fmtMin(g.max), { color: g.nPos ? "#64748B" : "#CBD5E1" }));
          }),
          h("div", { style: { fontSize: 11, color: "#94A3B8", lineHeight: 1.55, margin: "8px 8px 0" } },
            "“Medidas” são as remoções com os dois horários deste intervalo, na ordem certa. Só elas entram na mediana e no maior tempo. Clique numa linha para ver os casos, do maior para o menor."),
          (it.nNeg > 0 || it.nSem > 0) && h("div", { style: { fontSize: 11.5, color: "#64748B", lineHeight: 1.6, margin: "8px 8px 0" } },
            it.nNeg > 0 && h("div", { style: { color: "#B45309" } }, `${it.nNeg} remoç${it.nNeg !== 1 ? "ões" : "ão"} inconsistente${it.nNeg !== 1 ? "s" : ""} (um momento antes do anterior, ou 30 dias ou mais de diferença): conferir a digitação em “Saneamento de falhas”. Não entra${it.nNeg !== 1 ? "m" : ""} na conta.`),
            it.nSem > 0 && h("div", null, `${it.nSem} remoç${it.nSem !== 1 ? "ões" : "ão"} sem a data e o horário dos dois momentos: não entra${it.nSem !== 1 ? "m" : ""} na conta.`)),

          gSel && (() => {
            const g = gSel === "todas" ? it.todas : it.grupos.find(x => x.chave === gSel);
            if (!g) return null;
            return h("div", { style: { marginTop: 14, paddingTop: 12, borderTop: "1px solid #F1F5F9" } },
              h("div", { style: { fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 8 } },
                `Casos · ${g.chave === "todas" ? "todas as gravidades" : g.chave}`,
                h("span", { style: { fontWeight: 500, color: "#94A3B8", marginLeft: 8 } }, `${g.casos.length} caso${g.casos.length !== 1 ? "s" : ""}`)),
              g.casos.slice(0, 60).map((c, k) => h("div", { key: k, style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, padding: "7px 0", borderBottom: "1px solid #F1F5F9" } },
                h("div", { style: { minWidth: 0 } },
                  h("span", { style: { fontSize: 12.5, fontWeight: 600, color: "#0F172A" } }, c.nome),
                  c.ficha && h("span", { style: { fontSize: 11, color: "#94A3B8", marginLeft: 6 } }, "ficha " + c.ficha),
                  c.avc && h("span", { style: { fontSize: 9.5, fontWeight: 800, marginLeft: 7, padding: "1px 7px", borderRadius: 99, background: "#FFE4E6", color: "#9F1239" } }, "AVC"),
                  gSel === "todas" && h("span", { style: { fontSize: 10, marginLeft: 7, color: "#64748B" } }, c.grav),
                  h("div", { style: { fontSize: 11, color: "#64748B", marginTop: 1 } }, `${it.de} ${c.de} → ${it.ate} ${c.ate}`)),
                h("span", { style: { fontSize: 13, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" } }, fmtMin(c.min)))),
              g.casos.length > 60 && h("div", { style: { fontSize: 11, color: "#94A3B8", marginTop: 6 } }, `e mais ${g.casos.length - 60} casos`));
          })()))));
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

function DashVolume({ serie, escala, rotulo, rotuloLongo, entrou, totais, notas, Titulo, Vazio }) {
  const h = React.createElement;
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

  const cartao = { background: "#fff", border: "1px solid #E8EDF3", borderRadius: 14, padding: "16px 18px", marginBottom: 14 };
  const unidade = escala === "dia" ? "dia" : escala === "semana" ? "semana" : "mês";
  const titulo = h(Titulo, {
    extra: escala === "dia" ? "por dia" : escala === "semana" ? "por semana" : "por mês",
    tooltip: "Barras: saídas de ambulância (CROSS e outras), contadas pelo dia da saída (data e horário de saída preenchidos na planilha). Linha laranja: pedidos feitos à CROSS (só linhas com ficha CROSS), pelo dia da solicitação. Linha tracejada verde: finalizações da CROSS, pelo dia em que a ficha foi finalizada, ou seja, quanto a CROSS libera por dia. Cada série usa a própria data, então o mesmo paciente pode aparecer em dias diferentes. Clique na legenda para esconder uma série."
  }, "Volume de remoções");

  if (!temDados) return h("div", { style: cartao }, titulo, h(Vazio, null, "Sem movimentação no período"));

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

  return h("div", { style: cartao },
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
      notas.map((t, i) => h("div", { key: i }, t))));
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
  ["especialidade", "Especialidade"], ["instituicao_destino", "Instituição de destino"], ["setor", "Setor"],
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
    ajuda: "Sem o tipo (Básica ou Avançada) a saída não entra no indicador de ambulância avançada. Preencha TIPO AMB." },
  { id: "vazio_gravidade", secao: "vazios", tipo: "corrigir", titulo: "Sem gravidade",
    ajuda: "A linha fica de fora dos gráficos de gravidade e dos tempos por gravidade. Preencha GRAVIDADE (prioridade da ficha: 1 Vermelho, 2 Amarelo, 3 Verde, 4 Cinza)." },
  { id: "vazio_destino", secao: "vazios", tipo: "corrigir", titulo: "Finalizada pela CROSS, sem instituição de destino",
    ajuda: "Linha CROSS com finalização, que não foi cancelada nem resolvida no local, e sem INSTITUIÇÃO DESTINO. A linha fica fora do gráfico de destinos." },

  { id: "avc_sem_medida", secao: "avc", tipo: "corrigir", titulo: "Protocolo de AVC sem dados para medir a meta de 1h",
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

function DashSaneamento({ grupos, total, Titulo, onAbrirCard, onAbrirAcoes, onAbrirLivro, onJustificar, podeJustificar }) {
  const h = React.createElement;
  const [expandido, setExpandido] = useState(false);   // começa recolhido: só o resumo por seção
  const [aberto, setAberto] = useState(null);          // id do grupo com a lista aberta
  const LIMITE = 150;
  const comItens = grupos.filter(g => g.itens.length);
  const soma = tipo => comItens.filter(g => g.tipo === tipo).reduce((t, g) => t + g.itens.length, 0);
  const nCorr = soma("corrigir"), nAtenc = soma("atencao"), nAcomp = soma("acompanhar");
  const alerta = nCorr + nAtenc > 0;
  const linhaAlerta = alerta ? "#FDE68A" : "#F1F5F9";
  const COR = { corrigir: ["#92400E", "#FEF3C7"], atencao: ["#B91C1C", "#FEE2E2"], acompanhar: ["#475569", "#F1F5F9"] };
  const resumo = [nCorr && `${nCorr} para corrigir`, nAtenc && `${nAtenc} para atender`, nAcomp && `${nAcomp} para acompanhar`].filter(Boolean).join(" · ");

  const grupo = g => {
    const ab = aberto === g.id, [corTxt, corBg] = COR[g.tipo];
    return h("div", { key: g.id, style: { borderTop: "1px solid " + linhaAlerta } },
      h("button", {
        type: "button", "aria-expanded": ab, onClick: () => setAberto(ab ? null : g.id),
        style: { width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 2px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }
      },
        h("span", { style: { flex: 1, fontSize: 12.5, fontWeight: 600, color: "#0F172A" } }, g.titulo),
        h("span", { style: { fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "1px 9px", color: corTxt, background: corBg } }, g.itens.length),
        h("span", { style: { fontSize: 11, color: "#94A3B8", width: 12 } }, ab ? "▾" : "▸")),
      ab && h("div", { style: { padding: "0 2px 12px" } },
        h("div", { style: { fontSize: 11, color: "#78716C", lineHeight: 1.55, marginBottom: 8 } }, g.ajuda),
        g.itens.slice(0, LIMITE).map((p, i) => {
          const botoes = [];
          if (p.justificar && podeJustificar && onJustificar) botoes.push(["Justificar", () => onJustificar(p.justificar), true]);
          if (p.card && onAbrirCard) botoes.push(["abrir card →", () => onAbrirCard(p.card)]);
          if (p.tarefas && onAbrirAcoes) botoes.push(["abrir tarefas →", () => onAbrirAcoes()]);
          if (p.livro && onAbrirLivro) botoes.push(["abrir o Livro →", () => onAbrirLivro()]);
          const comLink = !!p.campo;
          const corpo = [
            h("span", { key: "n", style: { fontWeight: 600, color: "#0F172A" } }, p.nome),
            p.ficha && h("span", { key: "f", style: { color: "#94A3B8" } }, p.ficha),
            h("span", { key: "m", style: { flex: "1 1 220px" } }, p.motivo),
            comLink && h("span", { key: "l", style: { marginLeft: "auto", fontWeight: 700, color: corTxt, whiteSpace: "nowrap" } }, g.tipo === "corrigir" ? "corrigir →" : "abrir →"),
            botoes.map(([rot, fn, forte], k) => h("button", { key: "b" + k, type: "button", onClick: fn,
              style: { marginLeft: k === 0 && !comLink ? "auto" : 0, padding: "3px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                       border: forte ? "none" : "1px solid #CBD5E1", background: forte ? "#0F172A" : "transparent", color: forte ? "#fff" : "#475569" } }, rot))
          ];
          const estilo = { display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", fontSize: 11.5, padding: "7px 8px", textDecoration: "none", borderRadius: 8, color: "#475569", transition: "background .15s" };
          return comLink
            ? h("a", { key: i, href: `remocao.html?foco=${encodeURIComponent(p.id)}&campo=${encodeURIComponent(p.campo)}`, style: estilo,
                onMouseEnter: e => { e.currentTarget.style.background = alerta ? "#FEF3C7" : "#F8FAFC"; },
                onMouseLeave: e => { e.currentTarget.style.background = "transparent"; } }, corpo)
            : h("div", { key: i, style: estilo }, corpo);
        }),
        g.itens.length > LIMITE && h("div", { style: { fontSize: 11, color: "#94A3B8", padding: "6px 8px" } }, `Mostrando ${LIMITE} de ${g.itens.length}. Corrija estas e a lista avança.`)));
  };

  return h("div", { style: { background: alerta ? "#FFFBEB" : "#fff", border: "1px solid " + (alerta ? "#FDE68A" : "#E8EDF3"), borderRadius: 14, padding: "16px 18px", marginBottom: 18 } },
    h("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, cursor: comItens.length ? "pointer" : "default" },
        onClick: () => comItens.length && setExpandido(v => !v) },
      h("div", { style: { flex: 1 } }, h(Titulo, {
        extra: comItens.length ? "" : "nada a corrigir",
        tooltip: "Tudo o que, na planilha, no Kanban, no Livro de Saída e nas tarefas, está faltando, incompleto, fora de ordem, fora da lista ou pedindo atenção, e poderia distorcer os números ou atrasar o paciente. O painel não completa nem adivinha: o que está com problema fica fora da conta e aparece aqui, com link ou botão para abrir o caso. “Para atender” é fila e emergência; “aguardando” é o que pode ser normal, mas vale conferir. Uma mesma linha pode aparecer em mais de uma lista."
      }, "Saneamento de falhas")),
      comItens.length > 0 && h("div", { style: { fontSize: 11, color: alerta ? "#B45309" : "#64748B", whiteSpace: "nowrap" } }, resumo + (expandido ? "  ▴" : "  ▾"))),
    comItens.length === 0
      ? h("div", { style: { fontSize: 12, color: "#15803D", padding: "4px 0 2px" } }, `Nenhuma falha encontrada nas ${total} linhas do período.`)
      : DASH_SANEAMENTO_SECOES.map(sec => {
          const gs = comItens.filter(g => g.secao === sec.id);
          if (!gs.length) return null;
          const n = gs.reduce((t, g) => t + g.itens.length, 0);
          if (!expandido) return h("div", { key: sec.id, style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", padding: "4px 0" } },
            h("span", null, sec.titulo), h("span", { style: { fontWeight: 700, color: "#0F172A" } }, n));
          return h("div", { key: sec.id, style: { marginTop: 12 } },
            h("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 10.5, fontWeight: 700, color: sec.id === "aguarda" ? "#64748B" : "#92400E", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 } },
              h("span", null, sec.titulo), h("span", { style: { fontWeight: 600, opacity: 0.8 } }, n)),
            gs.map(grupo));
        }));
}

function Dashboard({ cards, cols, dashMode, setDashMode, isAdmin, lastPub, currentUser, discrepancias, onAbrirCard, onAbrirAcoes, onAbrirLivro, showT: showTProp }) {
  const showT = showTProp || function () {};
  const [remocoes, setRemocoes] = useState([]);
  const [carregando, setCarregando] = useState(true);   // só a 1ª carga troca a tela inteira por "Carregando…"
  const [atualizando, setAtualizando] = useState(false); // trocas de período: mantém a tela e mostra "atualizando…"
  const [erro, setErro] = useState("");
  const [escala, setEscala] = useState("dia");
  // Períodos: "hoje" · "7d" (últimos 7 dias) · "mes" (mês e ano escolhidos) · "custom" (de dd/mm/aaaa a dd/mm/aaaa).
  // Abre no mês atual. Não existe mais "Tudo": para ver a base inteira, use Período cobrindo todas as datas.
  const [periodo, setPeriodo] = useState("mes");
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
  const podeJustificar = isAdmin || !!(currentUser && currentUser.can_justificativa);

  /* ── Recorte temporal ─────────────────────────────────────────────────── */
  // Datas em horário LOCAL. Antes usava toISOString (UTC): depois das 21h de
  // Brasília a "data de hoje" virava a de amanhã e a janela deslocava um dia.
  const hoje = new Date();
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hojeIso = iso(hoje);
  // "7 dias" = hoje + os 6 anteriores (7 datas). Antes pegava 8.
  // Faixa de datas do período escolhido. null = Período com datas faltando ou invertidas (nada é carregado até corrigir).
  const faixa = periodo === "hoje" ? { ini: hojeIso, fim: hojeIso }
    : periodo === "7d" ? { ini: iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6)), fim: hojeIso }
    : periodo === "mes" ? { ini: iso(new Date(anoSel, mesSel, 1)), fim: iso(new Date(anoSel, mesSel + 1, 0)) }
    : (ini && fim && ini <= fim) ? { ini, fim } : null;
  const fIni = faixa ? faixa.ini : "", fFim = faixa ? faixa.fim : "";

  /* ── Carga das remoções ───────────────────────────────────────────────────
   * O período vai para o SERVIDOR, então a tela baixa só o que vai mostrar, e a leitura é feita em páginas de 1.000
   * (sbGetTodas), então nada é cortado em silêncio. Como o gráfico conta saídas, pedidos e finalizações cada um no seu dia,
   * a linha vem se QUALQUER uma das três datas cair na janela (or=): um paciente pedido dia 27 que saiu dia 1º precisa vir.
   * O filtro do navegador (`dados`, mais abaixo) continua valendo para as demais seções: ele usa só a data do pedido.
   * Linhas sem data de solicitação não pertencem a período nenhum: aparecem em Saneamento de falhas (busca à parte, abaixo).
   * Fica DEPOIS de `faixa` porque usa os limites dela na lista de dependências.                                          */
  useEffect(() => {
    let vivo = true;
    if (!fIni || !fFim) { setCarregando(false); setAtualizando(false); return; }
    (async () => {
      setAtualizando(true);
      try {
        const filtro = `&or=(${DASH_CAMPOS_DATA.map(c => `and(${c}.gte.${fIni},${c}.lte.${fFim})`).join(",")})`;
        const r = await sbGetTodas("remocoes?select=*&order=data_solicitacao.desc,id.asc" + filtro);
        if (vivo) { setRemocoes(r); setErro(""); }
      } catch (e) { if (vivo) setErro(e.message); }
      finally { if (vivo) { setCarregando(false); setAtualizando(false); } }
    })();
    return () => { vivo = false; };
  }, [fIni, fFim]);

  useEffect(() => {
    let vivo = true;
    const lim = "2020-01-01", campos = ["data_solicitacao", "data_resposta_cross", "data_saida_ambulancia", "data_saida_real", "data_retorno"];
    const cond = ["data_solicitacao.is.null"].concat(campos.reduce((acc, c) => acc.concat([`${c}.lt.${lim}`, `${c}.gt.${hojeIso}`]), []));
    sbGetTodas(`remocoes?select=id,nome_paciente,ficha_cross,${campos.join(",")}&or=(${cond.join(",")})&order=id.asc`)
      .then(r => { if (vivo) setAnomalas(r); }).catch(() => {});
    sbGetTodas("acoes_enfermagem?status=in.(pendente,iniciada,pausada)&select=id,titulo,status,prioridade,responsavel_nome,prazo&order=prioridade.asc.nullslast,created_at.asc")
      .then(r => { if (vivo) setTarefas(r); }).catch(() => {});
    sbGetTodas("livro_saida?status_vinculo=in.(pendente,independente)&select=id,nome_paciente,data_saida,hora_saida,destino,status_vinculo,created_at&order=created_at.desc")
      .then(r => { if (vivo) setLivroSemVinculo(r.filter(x => x.hora_saida || x.data_saida)); }).catch(() => {});
    return () => { vivo = false; };
  }, [hojeIso]);

  const dados = useMemo(() => {
    if (!fIni || !fFim) return [];
    return remocoes.filter(r => { const d = r.data_solicitacao || ""; return d >= fIni && d <= fFim; });
  }, [remocoes, fIni, fFim]);

  /* ── Amplitude real da base: decide quais escalas fazem sentido ───────────
   * Calculada sobre `dados` (pedidos dentro do período), como antes, e não sobre tudo o que veio do servidor: a busca agora
   * traz também linhas de pedidos mais antigos que saíram dentro da janela, e elas não devem esticar a amplitude. */
  const amplitude = useMemo(() => {
    const ds = dados.map(r => r.data_solicitacao).filter(Boolean).sort();
    if (!ds.length) return { dias: 0, meses: 0, min: null, max: null };
    const min = ds[0], max = ds[ds.length - 1];
    const dias = Math.round((new Date(max) - new Date(min)) / 86400000) + 1;
    // Meses COMPLETOS: um mês parcial comparado a um completo distorce a leitura
    const mesesSet = new Set(ds.map(d => d.slice(0, 7)));
    return { dias, meses: mesesSet.size, min, max, mesesSet };
  }, [dados]);

  // Quantos dias o período realmente cobre (denominador do "por dia").
  // Antes dividia pelo tamanho da BASE INTEIRA, subestimando em qualquer recorte.
  const diasNoPeriodo = (!amplitude.min || !fIni) ? 0 : (() => {
    const a = fIni > amplitude.min ? fIni : amplitude.min;   // base mais curta que o período
    const b = fFim < hojeIso ? fFim : hojeIso;               // período em andamento: conta até hoje
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
  const limInf = fIni || "9999-12-31";   // sem período válido, nada entra
  const limSup = fFim || "0000-01-01";

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
    const ini0 = escalaEfetiva === "dia" ? limInf : keys[0];
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
  }, [eventos, escalaEfetiva, limInf, limSup, hojeIso]);

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
  const minFinPed = x => (x.min_finalizacao_pedido_amb === undefined ? null : x.min_finalizacao_pedido_amb);
  const protocolos = useMemo(() => {
    const HORA = 60 * 60000;
    const r = { total: 0, noHorario: 0, atrasoSantaCasa: 0, atrasoAmbulancia: 0, atrasoSemCausa: 0, semHorarios: 0, semFinalizacao: 0, semSaida: 0, lista: [] };
    dados.forEach(x => {
      if (x.protocolo_avc !== true) return;
      r.total++;
      const fin = quando(x.data_resposta_cross, x.horario_resposta_cross);
      // Dia da saída: só a data de saída preenchida na planilha (data_saida_real), e só com o horário de saída. Sem uma das duas,
      // o caso fica em "sem horário para medir" em vez de o painel adivinhar o dia (antes caía na data do pedido e, se a saída foi
      // depois da meia-noite, o tempo dava negativo e o caso entrava como "no horário").
      const dSaida = dashDiaDaSaida(x);
      const sai = quando(dSaida, x.horario_saida_ambulancia);
      const ped = quando(x.data_saida_ambulancia, x.hora_solic_ambulancia);   // pedido da ambulância pela Santa Casa
      const caso = {
        cat: null, nome: x.nome_paciente || "(sem nome)", ficha: x.ficha_cross || "", destino: x.instituicao_destino || "",
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
      if (caso.minPedido > 60) { r.atrasoSantaCasa++; caso.cat = "atrasoSantaCasa"; }
      else { r.atrasoAmbulancia++; caso.cat = "atrasoAmbulancia"; }
    });
    // As duas partes da hora: Santa Casa (finalização → pedido) e setor de ambulância (pedido → saída).
    // Pedido ANTES da finalização dá intervalo negativo: não entra na mediana (não é um tempo de espera).
    const med = a => { if (!a.length) return null; const o = [...a].sort((x, y) => x - y); return o[Math.floor(o.length / 2)]; };
    const resumo = a => ({ mediana: med(a), n: a.length, max: a.length ? Math.max(...a) : null });
    r.santaCasa = resumo(r.lista.map(c => c.minPedido).filter(v => v !== null && v >= 0));
    r.ambulancia = resumo(r.lista.map(c => c.minAmb).filter(v => v !== null && v >= 0));
    return r;
  }, [dados]);
  /* ── Saneamento de falhas ────────────────────────────────────────────────
   * Só LÊ os campos da planilha e aponta o que está incompleto, fora de ordem ou suspeito. Não corrige, não completa, não adivinha.
   * Cada grupo é uma lista com o link da linha. Definições e textos: DASH_PROBLEMAS_DEF.
   * Linhas olhadas: as do período (`dados`). Exceções: "sem data" e "data no futuro" olham tudo o que veio do servidor
   * (`remocoes`), porque essas linhas não entram em período nenhum; e a conferência de ficha repetida compara com tudo o que veio. */
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
        if (!fin) add("avc_sem_medida", r, finD ? "horario_resposta_cross" : "data_resposta_cross", "Sem finalização da CROSS completa (data e horário): a meta de 1h não pode ser medida.");
        else if (!sai) add("avc_sem_medida", r, saiD ? "horario_saida_ambulancia" : "data_saida_real", "Sem data e horário de saída da ambulância: não entra na meta de 1h.");
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
  }, [remocoes, dados, hojeIso, cards, cols, discrepancias, tarefas, livroSemVinculo, anomalas]);
  const ag = campo => C ? C.agrupar(dados, campo)
    : { itens: [], total: dados.length, informados: 0, cobertura: 0, naoClassificados: [] };

  const gGrav   = useMemo(() => ag("gravidade"),           [dados]);
  const gEspec  = useMemo(() => ag("especialidade"),       [dados]);
  const gHosp   = useMemo(() => ag("instituicao_destino"), [dados]);
  const gSetor  = useMemo(() => ag("setor"),               [dados]);
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
    const par = (d1, h1, d2, h2) => {
      const a = quando(d1, h1), b = quando(d2, h2);
      if (a === null || b === null) return { v: null, neg: false };
      const diff = (b - a) / 60000;
      if (diff < 0 || diff >= 43200) return { v: null, neg: true };
      return { v: diff, neg: false };
    };
    const DEFS = [
      { id: "sol_fin", de: "Solicitação", ate: "Finalização", dono: "CROSS", cor: "#0369A1",
        tip: "Tempo mediano entre a solicitação da Santa Casa à CROSS e a finalização da ficha na CROSS (o aceite é o mesmo momento da finalização).",
        calc: x => par(x.data_solicitacao, x.horario_solicitacao, x.data_resposta_cross, x.horario_resposta_cross, false),
        pts: x => [dm(x.data_solicitacao, x.horario_solicitacao), dm(x.data_resposta_cross, x.horario_resposta_cross)] },
      { id: "fin_ped", de: "Finalização", ate: "Solicitação da ambulância", dono: "Santa Casa", cor: "#B45309",
        tip: "Tempo mediano entre a finalização da ficha na CROSS e a solicitação da ambulância pela Santa Casa. Vem da coluna min_finalizacao_pedido_amb da planilha de remoção.",
        calc: x => { const m = minFinPed(x); return m === null ? { v: null, neg: false } : (m < 0 || m >= 43200) ? { v: null, neg: true } : { v: m, neg: false }; },
        pts: x => [dm(x.data_resposta_cross, x.horario_resposta_cross), dm(x.data_saida_ambulancia, x.hora_solic_ambulancia)] },
      { id: "ped_sai", de: "Solicitação da ambulância", ate: "Saída", dono: "Santa Casa", cor: "#B45309",
        tip: "Tempo mediano entre a solicitação da ambulância e a saída dela, como está na coluna T. ESPERA da planilha. Se a célula estiver vazia, usa a mesma conta da planilha: data e horário dos dois momentos, sem supor dia. Se faltar algum, o caso fica de fora e aparece em “Saneamento de falhas”.",
        calc: x => { const g = dashHMemMin(x.tempo_espera); return g !== null ? { v: g, neg: false } : par(x.data_saida_ambulancia, x.hora_solic_ambulancia, x.data_saida_real, x.horario_saida_ambulancia); },
        pts: x => [dm(x.data_saida_ambulancia, x.hora_solic_ambulancia), dm(x.data_saida_real, x.horario_saida_ambulancia)] },
      { id: "sai_ret", de: "Saída", ate: "Retorno", dono: "Santa Casa", cor: "#0F766E",
        tip: "Tempo mediano que a ambulância ficou fora: da saída ao retorno, como está na coluna DURAÇÃO da planilha. Se a célula estiver vazia, usa a mesma conta da planilha: data e horário dos dois momentos, sem supor dia. Se faltar algum, o caso fica de fora e aparece em “Saneamento de falhas”.",
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
        const caso = { nome: x.nome_paciente || "(sem nome)", ficha: x.ficha_cross || "", avc: x.protocolo_avc === true,
                       min: r.v, grav: g.chave, de: p[0], ate: p[1] };
        [g, todas].forEach(o => { o.nPos++; o.v.push(r.v); o.casos.push(caso); });
      });
      [...grupos.values(), todas].forEach(o => {
        o.v.sort((p, q) => p - q);
        o.mediana = o.v.length ? o.v[Math.floor(o.v.length / 2)] : null;
        o.max = o.v.length ? o.v[o.v.length - 1] : null;
        o.casos.sort((p, q) => q.min - p.min);
        delete o.v;
      });
      return { id: def.id, de: def.de, ate: def.ate, dono: def.dono, cor: def.cor, tip: def.tip,
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

  /* ═══ Animação de entrada ═════════════════════════════════════════════
   * Números sobem até o valor e barras preenchem ao montar. easeOutCubic:
   * começa rápido e desacelera — dá a sensação de chegar ao número, em vez
   * de contar mecanicamente. ~900ms, curto o bastante para não atrasar a
   * leitura de quem só quer conferir um dado.
   * Respeita prefers-reduced-motion: quem pediu menos movimento no sistema
   * recebe o valor final direto, sem animação nenhuma.
   */
  const semMovimento = typeof window !== "undefined" && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function useContagem(alvo, dur = 900) {
    const [v, setV] = useState(semMovimento ? alvo : 0);
    useEffect(() => {
      if (semMovimento || typeof alvo !== "number" || !isFinite(alvo)) { setV(alvo); return; }
      let raf, t0 = null;
      const passo = t => {
        if (t0 === null) t0 = t;
        const p = Math.min((t - t0) / dur, 1);
        setV(alvo * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(passo);
      };
      raf = requestAnimationFrame(passo);
      return () => cancelAnimationFrame(raf);
    }, [alvo, dur]);
    return v;
  }

  // Dispara uma vez, logo após a montagem: as barras saem de 0 e crescem.
  const [entrou, setEntrou] = useState(semMovimento);
  useEffect(() => {
    if (semMovimento) return;
    const t = setTimeout(() => setEntrou(true), 40);
    return () => clearTimeout(t);
  }, []);

  const Num = ({ valor, sufixo = "", casas = 0 }) => {
    const v = useContagem(typeof valor === "number" ? valor : null);
    if (typeof valor !== "number") return valor;
    return /*#__PURE__*/React.createElement(React.Fragment, null, v.toFixed(casas), sufixo);
  };

  /* ═══ Primitivas visuais ══════════════════════════════════════════════ */
  const Card = ({ children, style, onClick }) => /*#__PURE__*/React.createElement("div", {
    onClick, className: onClick ? "ge-click" : undefined,
    role: onClick ? "button" : undefined, tabIndex: onClick ? 0 : undefined,
    onKeyDown: onClick ? (e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }) : undefined,
    style: { background: "#fff", border: "1px solid #E8EDF3", borderRadius: 14,
             padding: "16px 18px", cursor: onClick ? "pointer" : undefined,
             transition: "box-shadow .15s, transform .15s", ...style }
  }, children);

  const Titulo = ({ children, extra, tooltip }) => /*#__PURE__*/React.createElement("div", {
    style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }
  },
    /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#0F172A", letterSpacing: ".01em", display:"flex", alignItems:"center", gap:3 } }, children, tooltip && React.createElement(TipIcon,{texto:tooltip})),
    extra && /*#__PURE__*/React.createElement("div", { style: { fontSize: 10.5, color: "#94A3B8" } }, extra)
  );

  // Cobertura: quantos registros informaram o campo. Sem isto, um percentual
  // sobre 56% da base parece um fato sobre 100%.
  const Cobertura = ({ g }) => {
    const baixa = g.cobertura < 80;
    return /*#__PURE__*/React.createElement("div", {
      title: `${g.informados} de ${g.total} registros informaram este campo`,
      style: { fontSize: 10.5, color: baixa ? "#B45309" : "#94A3B8",
               background: baixa ? "#FFFBEB" : "transparent",
               border: baixa ? "1px solid #FDE68A" : "1px solid transparent",
               borderRadius: 6, padding: baixa ? "1px 6px" : "1px 0" }
    }, `${g.informados}/${g.total} informados`);
  };

  const Barra = ({ label, n, pct, max, cor, tag }) => /*#__PURE__*/React.createElement("div", {
    style: { marginBottom: 9 }
  },
    /*#__PURE__*/React.createElement("div", {
      style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, gap: 8 }
    },
      /*#__PURE__*/React.createElement("span", {
        style: { fontSize: 12, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
      }, label,
        tag && /*#__PURE__*/React.createElement("span", {
          style: { marginLeft: 6, fontSize: 9, fontWeight: 700, color: "#6D28D9",
                   background: "#F5F3FF", borderRadius: 4, padding: "1px 5px", verticalAlign: "middle" }
        }, tag)),
      /*#__PURE__*/React.createElement("span", {
        style: { fontSize: 11.5, color: "#64748B", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }
      }, /*#__PURE__*/React.createElement(Num, { valor: n }),
         /*#__PURE__*/React.createElement("span", { style: { color: "#CBD5E1" } },
           "  ", /*#__PURE__*/React.createElement(Num, { valor: pct, sufixo: "%" })))),
    /*#__PURE__*/React.createElement("div", { style: { height: 6, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" } },
      /*#__PURE__*/React.createElement("div", {
        style: { height: "100%", width: entrou ? `${max ? (n / max * 100) : 0}%` : "0%",
                 background: cor, borderRadius: 99,
                 transition: "width .75s cubic-bezier(.22,.9,.3,1)" } }))
  );

  const Vazio = ({ children }) => /*#__PURE__*/React.createElement("div", {
    style: { fontSize: 11.5, color: "#CBD5E1", padding: "14px 0", textAlign: "center" }
  }, children);

  function TipIcon(props) {
    return React.createElement("span", {className:"tip", style:{marginLeft:4,color:"#CBD5E1",fontSize:10,fontWeight:700,verticalAlign:"middle",userSelect:"none"}},
      "?", React.createElement("span", {className:"tipbox"}, props.texto));
  }
  const Kpi = ({ label, valor, sub, cor, alerta, tooltip, onClick, ativo }) => /*#__PURE__*/React.createElement(Card, {
    onClick,
    style: { ...(alerta ? { borderColor: "#FDE68A", background: "#FFFBEB" } : null), ...(ativo ? { borderColor: cor || "#0F172A", boxShadow: `0 0 0 1px ${cor || "#0F172A"}` } : null) }
  },
    /*#__PURE__*/React.createElement("div", {
      style: { fontSize: 10.5, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8, display:"flex", alignItems:"center", gap:2 }
    }, label, tooltip && React.createElement(TipIcon, {texto: tooltip})),
    /*#__PURE__*/React.createElement("div", {
      style: { fontSize: 27, fontWeight: 700, color: cor || "#0F172A", lineHeight: 1, fontVariantNumeric: "tabular-nums" }
    }, typeof valor === "number" ? /*#__PURE__*/React.createElement(Num, { valor }) : valor),
    sub && /*#__PURE__*/React.createElement("div", { style: { fontSize: 10.5, color: "#94A3B8", marginTop: 6 } }, sub)
  );

  /* ─── Estados de carga ─────────────────────────────────────────────── */
  if (carregando) return /*#__PURE__*/React.createElement("div", {
    style: { padding: 60, textAlign: "center", color: "#94A3B8", fontSize: 13 }
  }, "Carregando indicadores…");

  if (erro) return /*#__PURE__*/React.createElement("div", {
    style: { padding: 28, margin: 20, background: "#FEF2F2", border: "1px solid #FECACA",
             borderRadius: 12, color: "#991B1B", fontSize: 13, lineHeight: 1.6 }
  }, /*#__PURE__*/React.createElement("b", null, "Não foi possível carregar as remoções."), " ", erro);

  const fmtDia = d => new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
  const [deDia, ateDia] = [fIni, fFim];
  // Sempre com a unidade escrita: "5h 22min" (5 horas e 22 minutos) ou "22min". Nunca "5:22", que não diz se são horas ou minutos.
  const fmtMin = m => {
    if (m === null) return "—";
    const t = Math.round(m), h = Math.floor(t / 60);
    return h > 0 ? `${h}h ${String(t % 60).padStart(2, "0")}min` : `${t}min`;
  };
  const rotuloSerie = k => escalaEfetiva === "mes"
    ? new Date(k + "-01T00:00:00").toLocaleDateString("pt-BR", { month: "short" })
    : new Date(k + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const rotuloLongoSerie = k => escalaEfetiva === "mes"
    ? new Date(k + "-01T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : escalaEfetiva === "semana"
      ? "Semana de " + new Date(k + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
      : new Date(k + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });

  // Avisos sob o gráfico: pedidos do período que ainda não têm saída ou finalização (não aparecem nas barras/linhas)
  const notasGraf = [];
  const nSemSaida = problemas.n("aguarda_cross") + problemas.n("aguarda_amb");
  const nSemFin = problemas.n("aguarda_cross") + problemas.n("cross_saida_sem_fin");
  const nSaidaSemData = problemas.n("saida_sem_data");
  if (nSemSaida > 0) notasGraf.push(`${nSemSaida} de ${tipos.cross} pedidos à CROSS do período ainda sem saída de ambulância registrada.`);
  if (nSemFin > 0) notasGraf.push(`${nSemFin} de ${tipos.cross} pedidos à CROSS do período sem finalização da CROSS.`);
  if (nSaidaSemData > 0) notasGraf.push(`${nSaidaSemData} linha${nSaidaSemData !== 1 ? "s" : ""} com horário de saída mas sem data de saída: não entra${nSaidaSemData !== 1 ? "m" : ""} nas barras.`);
  const nSaidaDeduz = problemas.n("saida_deduzida");
  if (nSaidaDeduz > 0) notasGraf.push(`${nSaidaDeduz} saída${nSaidaDeduz !== 1 ? "s" : ""} com data deduzida pela planilha (entra${nSaidaDeduz !== 1 ? "m" : ""} nas barras, mas vale confirmar a data).`);
  if (notasGraf.length > 0) notasGraf.push("As listas, com link para abrir cada linha na planilha, estão em “Saneamento de falhas”, logo abaixo.");
  const pctCross = tipos.total ? Math.round(tipos.cross / tipos.total * 100) : 0;
  const pctOutras = tipos.total ? 100 - pctCross : 0;

  const clinicas = gEspec.itens.filter(i => i.grupo === "clinica");
  const recursos = gEspec.itens.filter(i => i.grupo === "recurso");
  const naoClass = gEspec.itens.filter(i => !i.grupo);

  const btnEscala = (id, txt) => {
    const on = escalaEfetiva === id, livre = escalaLiberada[id];
    return /*#__PURE__*/React.createElement("button", {
      key: id, onClick: () => livre && setEscala(id), disabled: !livre,
      title: livre ? "" : motivoBloqueio[id],
      style: { padding: "5px 13px", borderRadius: 7, border: "none", fontSize: 12,
               fontWeight: on ? 650 : 450, cursor: livre ? "pointer" : "not-allowed",
               background: on ? "#0F172A" : "transparent",
               color: on ? "#fff" : livre ? "#64748B" : "#CBD5E1", fontFamily: "inherit" }
    }, txt);
  };

  const btnPeriodo = (id, txt) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => {
      setPeriodo(id);
      if (id === "custom" && (!ini || !fim)) { setIni(iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29))); setFim(hojeIso); }
    },
    style: { padding: "5px 13px", borderRadius: 7, border: "none", fontSize: 12,
             fontWeight: periodo === id ? 650 : 450, cursor: "pointer",
             background: periodo === id ? "#E2E8F0" : "transparent",
             color: periodo === id ? "#0F172A" : "#64748B", fontFamily: "inherit" }
  }, txt);
  const NOMES_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const anos = []; for (let y = 2025; y <= hoje.getFullYear(); y++) anos.push(y);
  const estiloSel = { padding: "5px 9px", border: "1px solid #E2E8F0", borderRadius: 7, fontSize: 12, background: "#fff", color: "#0F172A", fontFamily: "inherit" };

  return /*#__PURE__*/React.createElement("div", {
    // ao trocar de período a tela fica visível, só mais clara, até chegar o dado novo
    style: { padding: "4px 0 40px", opacity: atualizando ? 0.6 : 1, transition: "opacity .15s" }
  },

    /* ══ Controles ══ */
    /*#__PURE__*/React.createElement("div", {
      style: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }
    },
      /*#__PURE__*/React.createElement("div", {
        style: { display: "flex", gap: 2, background: "#F1F5F9", borderRadius: 9, padding: 3 }
      }, [["hoje", "Hoje"], ["7d", "Últimos 7 dias"], ["mes", "Mês"], ["custom", "Período"]].map(([id, txt]) => btnPeriodo(id, txt))),

      periodo === "mes" && /*#__PURE__*/React.createElement("div", { style: { display: "flex", gap: 6 } },
        /*#__PURE__*/React.createElement("select", { "aria-label": "Mês", value: mesSel, onChange: e => setMesSel(Number(e.target.value)), style: estiloSel },
          NOMES_MES.map((n, i) => /*#__PURE__*/React.createElement("option", { key: i, value: i }, n))),
        /*#__PURE__*/React.createElement("select", { "aria-label": "Ano", value: anoSel, onChange: e => setAnoSel(Number(e.target.value)), style: estiloSel },
          anos.map(y => /*#__PURE__*/React.createElement("option", { key: y, value: y }, y)))),

      periodo === "custom" && /*#__PURE__*/React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "#64748B" } },
        "de", /*#__PURE__*/React.createElement("input", { type: "date", "aria-label": "Data inicial", value: ini, max: fim || undefined, onChange: e => setIni(e.target.value), style: estiloSel }),
        "a", /*#__PURE__*/React.createElement("input", { type: "date", "aria-label": "Data final", value: fim, min: ini || undefined, onChange: e => setFim(e.target.value), style: estiloSel })),

      /*#__PURE__*/React.createElement("div", {
        style: { display: "flex", gap: 2, background: "#F1F5F9", borderRadius: 9, padding: 3 }
      }, [["dia", "Diária"], ["semana", "Semanal"], ["mes", "Mensal"]].map(([i, t]) => btnEscala(i, t))),

      /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#94A3B8", marginLeft: "auto" } },
        totaisGraf.saidas, " saídas de ambulância · ", dados.length, " linhas",
        deDia && ` · ${fmtDia(deDia)}${ateDia && ateDia !== deDia ? " a " + fmtDia(ateDia) : ""}`,
        atualizando && " · atualizando…")
    ),

    !faixa && /*#__PURE__*/React.createElement("div", {
      style: { fontSize: 11.5, color: "#92400E", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 9, padding: "9px 13px", marginBottom: 16 }
    }, "Escolha a data inicial e a final do período (a inicial não pode ser depois da final)."),

    /* Escala indisponível: diz o porquê em vez de esconder o botão */
    !escalaLiberada[escala] && escala !== "dia" && /*#__PURE__*/React.createElement("div", {
      style: { fontSize: 11.5, color: "#92400E", background: "#FFFBEB", border: "1px solid #FDE68A",
               borderRadius: 9, padding: "9px 13px", marginBottom: 16 }
    }, "Escala ", escala === "mes" ? "mensal" : "semanal", " ainda não disponível — ", motivoBloqueio[escala],
       ". Mostrando a diária."),

    /* ══ Saneamento de falhas: substitui o balão. Tudo o que ficou fora da conta ou pede atenção, com link ou botão para abrir ══ */
    /*#__PURE__*/React.createElement(DashSaneamento, {
      grupos: problemas.grupos, total: dados.length, Titulo,
      onAbrirCard, onAbrirAcoes, onAbrirLivro, podeJustificar,
      onJustificar: d => { setJustModal(d); setJustTexto(""); }
    }),

    /* ══ Pulso operacional — única seção que vem do Kanban (cartões clicáveis) ══ */
    /*#__PURE__*/React.createElement(DashFilaKanban, {
      cols, cards, Card, Num,
      titulo: isAdmin ? "Agora · fila do Kanban" : "Última publicação · fila do Kanban"
    }),

    /* ══ Remoções na planilha: CROSS + outras = total de linhas ══ */
    /*#__PURE__*/React.createElement("div", { style: { marginBottom: 22 } },
      /*#__PURE__*/React.createElement(Titulo, {
        extra: "CROSS + outras = total de linhas",
        tooltip: "Cada linha da planilha é uma remoção. Remoção CROSS é a linha com o Nº da ficha CROSS preenchido; outras remoções são as linhas sem ficha CROSS (altas, hemodiálise, exames etc.). A soma dos dois é sempre o total de linhas do período escolhido. Para comparar com a planilha inteira, escolha Período cobrindo do primeiro ao último dia dos dados."
      }, "Remoções na planilha"),
      /*#__PURE__*/React.createElement("div", {
        style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 12 }
      },
        /*#__PURE__*/React.createElement(Kpi, {
          label: "Total de linhas", valor: tipos.total, sub: "remoções CROSS + outras remoções",
          tooltip: "Todas as linhas da planilha no período escolhido. Sempre igual à soma dos dois cards ao lado." }),
        /*#__PURE__*/React.createElement(Kpi, {
          label: "Remoções CROSS", valor: tipos.cross, cor: "#0369A1", sub: `${pctCross}% do total · com ficha CROSS`,
          tooltip: "Linhas com o Nº da ficha CROSS preenchido." }),
        /*#__PURE__*/React.createElement(Kpi, {
          label: "Outras remoções", valor: tipos.outras, cor: "#475569", sub: `${pctOutras}% do total · sem ficha CROSS`,
          tooltip: "Linhas sem ficha CROSS: altas, hemodiálise, exames etc." })),
      tipos.total > 0 && /*#__PURE__*/React.createElement("div", {
        title: `${tipos.cross} com ficha CROSS · ${tipos.outras} sem ficha`,
        style: { display: "flex", height: 8, borderRadius: 99, overflow: "hidden", background: "#F1F5F9", marginTop: 12 }
      },
        /*#__PURE__*/React.createElement("div", { style: { width: entrou ? `${tipos.cross / tipos.total * 100}%` : "0%", background: "#0369A1", transition: "width .8s cubic-bezier(.22,.9,.3,1)" } }),
        /*#__PURE__*/React.createElement("div", { style: { flex: 1, background: "#CBD5E1" } })),
      anomalas.some(r => !r.data_solicitacao) && /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#B45309", marginTop: 8 } },
        `${anomalas.filter(r => !r.data_solicitacao).length} linha${anomalas.filter(r => !r.data_solicitacao).length !== 1 ? "s" : ""} da planilha sem data de solicitação não pertence${anomalas.filter(r => !r.data_solicitacao).length !== 1 ? "m" : ""} a período nenhum e não entra${anomalas.filter(r => !r.data_solicitacao).length !== 1 ? "m" : ""} nestes totais (veja Saneamento de falhas).`)),

    /* ══ KPIs do período (remocoes) ══ */
    /*#__PURE__*/React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 12, marginBottom: 22 }
    },
      /*#__PURE__*/React.createElement(Kpi, {
        label: "Saídas de ambulância", valor: totaisGraf.saidas,
        sub: diasNoPeriodo ? `${(totaisGraf.saidas / diasNoPeriodo).toFixed(1)} por dia` : "no período",
        tooltip: "Saídas de ambulância no período, de todas as linhas (CROSS e outras): conta o dia da saída (data e horário de saída preenchidos na planilha). Linha ainda sem saída não entra. A saída conta no dia da saída e as linhas, no dia do pedido; por isso, nos períodos curtos, os dois números podem não coincidir (num período que cobre toda a base, coincidem). Fonte: planilha de remoções." }),
      /*#__PURE__*/React.createElement(Kpi, {
        label: "Ambulância avançada",
        valor: gAmb.informados ? `${((gAmb.itens.find(i => i.canonico === "AVANÇADA")?.n || 0) / gAmb.informados * 100).toFixed(0)}%` : "—",
        sub: `${gAmb.informados} de ${gAmb.total} informados`,
        alerta: gAmb.cobertura < 80,
        tooltip: "% de remoções que usaram SAV (Suporte Avançado de Vida). Inclui UTI móvel, que a gestão decidiu contar como Avançada (01/10/2026): na planilha o valor pode aparecer como UTI. Calculado só sobre registros com tipo de ambulância preenchido — o denominador aparece abaixo." }),
      /*#__PURE__*/React.createElement(Kpi, {
        label: "Permaneceu no destino", valor: perm.n ? `${perm.pct.toFixed(0)}%` : "—",
        sub: `${perm.sim} de ${perm.n} linhas · ${perm.semInfo} sem registro`,
        alerta: perm.n > 0 && perm.semInfo / perm.n > 0.2,
        tooltip: "% das linhas do período em que o paciente ficou no hospital de destino e não voltou à Santa Casa. O denominador é o total de linhas do período; os sem registro (campo vazio) contam como não-permaneceu, então o valor real pode ser maior." })
    ),

    /* ══ Tempos do caminho da remoção: 5 intervalos, clique para ver por gravidade ══ */
    /*#__PURE__*/React.createElement(DashTempos, { intervalos, Card, Kpi, Titulo, fmtMin }),

    /* ══ Protocolo de AVC (Livro de Remoção): meta de saída em até 1h da finalização da CROSS ══ */
    /*#__PURE__*/React.createElement(DashProtocoloAVC, { protocolos, totalRemocoes: dados.length, Card, Kpi, Titulo, Vazio, fmtMin }),

    /* ══ Volume: saídas (barras) + pedidos à CROSS e finalizações da CROSS (linhas) ══ */
    /*#__PURE__*/React.createElement(DashVolume, {
      serie, escala: escalaEfetiva, rotulo: rotuloSerie, rotuloLongo: rotuloLongoSerie, entrou,
      totais: totaisGraf, notas: notasGraf, Titulo, Vazio
    }),


    /* ══ Distribuições ══ */
    /*#__PURE__*/React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 14 }
    },

      /* Gravidade — proporção importa mais que valor absoluto */
      /*#__PURE__*/React.createElement(Card, null,
        /*#__PURE__*/React.createElement(Titulo, { extra: /*#__PURE__*/React.createElement(Cobertura, { g: gGrav }), tooltip: "Distribuição por nível de urgência do paciente conforme registrado na planilha. VERMELHO=emergência, AMARELO=urgência, VERDE=menor gravidade." }, "Gravidade"),
        gGrav.itens.length === 0 ? /*#__PURE__*/React.createElement(Vazio, null, "Sem dados") :
        /*#__PURE__*/React.createElement(React.Fragment, null,
          /*#__PURE__*/React.createElement("div", {
            style: { display: "flex", height: 10, borderRadius: 99, overflow: "hidden", marginBottom: 14, background: "#F1F5F9" }
          }, (C ? C.GRAVIDADE_ORDEM : []).map(g => {
            const it = gGrav.itens.find(i => i.canonico === g); if (!it) return null;
            return /*#__PURE__*/React.createElement("div", {
              key: g, title: `${g}: ${it.n} (${it.pct.toFixed(0)}%)`,
              style: { width: entrou ? `${it.pct}%` : "0%", background: C.GRAVIDADE_COR[g],
                       transition: "width .8s cubic-bezier(.22,.9,.3,1)" } });
          })),
          (C ? C.GRAVIDADE_ORDEM : []).map(g => {
            const it = gGrav.itens.find(i => i.canonico === g); if (!it) return null;
            return /*#__PURE__*/React.createElement(Barra, {
              key: g, label: g, n: it.n, pct: it.pct,
              max: Math.max(...gGrav.itens.map(i => i.n)), cor: C.GRAVIDADE_COR[g] });
          }))),

      /* Especialidades — recursos apartados das clínicas */
      /*#__PURE__*/React.createElement(Card, null,
        /*#__PURE__*/React.createElement(Titulo, { extra: /*#__PURE__*/React.createElement(Cobertura, { g: gEspec }), tooltip: "Especialidades e exames solicitados à CROSS. Recursos (exames, procedimentos) ficam separados das especialidades clínicas pois não competem pelas mesmas vagas." }, "Recursos solicitados"),
        gEspec.itens.length === 0 ? /*#__PURE__*/React.createElement(Vazio, null, "Sem dados") :
        /*#__PURE__*/React.createElement(React.Fragment, null,
          recursos.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null,
            recursos.map(i => /*#__PURE__*/React.createElement(Barra, {
              key: i.canonico, label: i.canonico, n: i.n, pct: i.pct, tag: "recurso",
              max: Math.max(...gEspec.itens.map(x => x.n)), cor: "#8B5CF6" })),
            /*#__PURE__*/React.createElement("div", {
              style: { height: 1, background: "#F1F5F9", margin: "12px 0 13px" } })),
          clinicas.map(i => /*#__PURE__*/React.createElement(Barra, {
            key: i.canonico, label: i.canonico, n: i.n, pct: i.pct,
            max: Math.max(...gEspec.itens.map(x => x.n)), cor: "#6366F1" })),
          naoClass.map(i => /*#__PURE__*/React.createElement(Barra, {
            key: "nc", label: "Não classificado", n: i.n, pct: i.pct,
            max: Math.max(...gEspec.itens.map(x => x.n)), cor: "#CBD5E1" })))),

      /* Hospitais */
      /*#__PURE__*/React.createElement(Card, null,
        /*#__PURE__*/React.createElement(Titulo, { extra: /*#__PURE__*/React.createElement(Cobertura, { g: gHosp }), tooltip: "Hospitais e unidades que receberam os pacientes. Mostra para onde a Santa Casa mais encaminha." }, "Instituições de destino"),
        gHosp.itens.length === 0 ? /*#__PURE__*/React.createElement(Vazio, null, "Sem dados") :
        gHosp.itens.map(i => /*#__PURE__*/React.createElement(Barra, {
          key: i.canonico,
          label: i.canonico === (C && C.NAO_CLASSIFICADO) ? "Não classificado" : i.canonico,
          n: i.n, pct: i.pct, max: gHosp.itens[0].n,
          cor: i.canonico === (C && C.NAO_CLASSIFICADO) ? "#CBD5E1" : "#0EA5E9" }))),

      /* Setor — rótulo honesto: é o que a CROSS informa, não a unidade real */
      /*#__PURE__*/React.createElement(Card, null,
        /*#__PURE__*/React.createElement(Titulo, { extra: /*#__PURE__*/React.createElement(Cobertura, { g: gSetor }), tooltip: "Setor/especialidade solicitante informado na ficha CROSS. Atencao: Clinica Medica indica quem fez o pedido, nao onde o paciente esta internado." }, "Setor informado na CROSS"),
        /*#__PURE__*/React.createElement("div", {
          style: { fontSize: 10.5, color: "#94A3B8", marginTop: -8, marginBottom: 12, lineHeight: 1.5 }
        }, '"Clínica Médica" na ficha indica a especialidade solicitante, não onde o paciente está.'),
        gSetor.itens.length === 0 ? /*#__PURE__*/React.createElement(Vazio, null, "Sem dados") :
        gSetor.itens.map(i => /*#__PURE__*/React.createElement(Barra, {
          key: i.canonico,
          label: i.canonico === (C && C.NAO_CLASSIFICADO) ? "Não classificado" : i.canonico,
          n: i.n, pct: i.pct, max: gSetor.itens[0].n,
          cor: i.canonico === (C && C.NAO_CLASSIFICADO) ? "#CBD5E1" : "#14B8A6" }))),

      /* Status */
      /*#__PURE__*/React.createElement(Card, null,
        /*#__PURE__*/React.createElement(Titulo, { extra: /*#__PURE__*/React.createElement(Cobertura, { g: gStatus }), tooltip: "O que aconteceu com cada remocao: paciente transferido, evadiu, resolvido localmente etc. Campo status da planilha." }, "Desfecho"),
        gStatus.itens.length === 0 ? /*#__PURE__*/React.createElement(Vazio, null, "Sem dados") :
        gStatus.itens.map(i => /*#__PURE__*/React.createElement(Barra, {
          key: i.canonico,
          label: i.canonico === (C && C.NAO_CLASSIFICADO) ? "Não classificado" : i.canonico,
          n: i.n, pct: i.pct, max: gStatus.itens[0].n,
          cor: i.canonico === (C && C.NAO_CLASSIFICADO) ? "#CBD5E1" : "#64748B" }))),

      /* Ambulância */
      /*#__PURE__*/React.createElement(Card, null,
        /*#__PURE__*/React.createElement(Titulo, { extra: /*#__PURE__*/React.createElement(Cobertura, { g: gAmb }), tooltip: "Básica (SBV) = apenas técnico e motorista. Avançada (SAV) = médico a bordo, usada em casos críticos. O percentual de avançada é um indicador de gravidade da demanda." }, "Tipo de ambulância"),
        gAmb.itens.length === 0 ? /*#__PURE__*/React.createElement(Vazio, null, "Sem dados") :
        gAmb.itens.map(i => /*#__PURE__*/React.createElement(Barra, {
          key: i.canonico, label: i.canonico === (C && C.NAO_CLASSIFICADO) ? "Outro / não classificado" : i.canonico, n: i.n, pct: i.pct, max: gAmb.itens[0].n,
          cor: i.canonico === "AVANÇADA" ? "#F59E0B" : "#64748B" })))
    ),

    /* ── Modal de justificativa ── */
    justModal && React.createElement("div", {
      onClick:function(e){if(e.target===e.currentTarget)setJustModal(null);},
      style:{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16}
    },
      React.createElement("div", {style:{background:"#fff",borderRadius:16,width:"100%",maxWidth:460,boxShadow:"0 20px 60px rgba(0,0,0,.25)",overflow:"hidden"}},
        React.createElement("div", {style:{padding:"14px 20px",borderBottom:"1px solid #F1F5F9",background:"#FEF2F2"}},
          React.createElement("div", {style:{fontSize:10,fontWeight:700,color:"#B91C1C",textTransform:"uppercase",letterSpacing:".05em"}}, "Justificativa de discrepância"),
          React.createElement("div", {style:{fontWeight:700,fontSize:14,color:"#0F172A",marginTop:2}}, "Por que este paciente tem prioridade?")
        ),
        React.createElement("div", {style:{padding:"16px 20px"}},
          React.createElement("div", {style:{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 12px",marginBottom:14,fontSize:12}},
            React.createElement("div", {style:{fontWeight:700,marginBottom:2}}, justModal.aceitado.nome,
              React.createElement("span", {style:{fontWeight:400,color:"#94A3B8",marginLeft:6,fontSize:11}},
                "(" + ((GC[justModal.aceitado.grav]&&GC[justModal.aceitado.grav].label)||"") + ") \u2022 " + (justModal.aceitado.rec||""))),
            React.createElement("div", {style:{fontSize:11,color:"#64748B",marginTop:4}},
              "Aguarda: ", justModal.pendente.nome, " (", (GC[justModal.pendente.grav]&&GC[justModal.pendente.grav].label)||"", ")")
          ),
          React.createElement("label", {style:{fontSize:11,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}, "Justificativa cl\xednica *"),
          React.createElement("textarea", {
            rows:4, value:justTexto,
            onChange:function(e){setJustTexto(e.target.value);},
            placeholder:"Ex: Protocolo de dor tor\xe1cica, aguarda exame. Complicação aguda justifica prioridade...",
            style:{width:"100%",padding:"9px 11px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",lineHeight:1.5}
          })
        ),
        React.createElement("div", {style:{padding:"10px 20px",borderTop:"1px solid #F1F5F9",display:"flex",gap:8,justifyContent:"flex-end"}},
          React.createElement("button", {onClick:function(){setJustModal(null);},style:{padding:"7px 16px",borderRadius:8,border:"1px solid #E2E8F0",background:"none",color:"#64748B",fontWeight:600,fontSize:13,cursor:"pointer"}}, "Cancelar"),
          React.createElement("button", {
            disabled:!justTexto.trim()||justSaving,
            onClick:async function(){
              if(!justTexto.trim())return; setJustSaving(true);
              var d=justModal;
              try{
                const rj=await fetch(SB_URL+"/rest/v1/discrepancia_justificativas",{method:"POST",headers:Object.assign({},H(),{Prefer:"return=minimal"}),body:JSON.stringify({card_id:d.aceitado.id,card_nome:d.aceitado.nome,card_grav:d.aceitado.grav,conflito_card_id:d.pendente.id,conflito_card_nome:d.pendente.nome,conflito_card_grav:d.pendente.grav,justificativa:justTexto.trim(),justificado_por_nome:(currentUser&&currentUser.nome)||""})});
                if(!rj.ok) throw new Error(await rj.text());
                setJustModal(null); showT("Justificativa registrada.");
              }catch(ex){showT("Erro ao salvar: "+ex.message,"err");}
              setJustSaving(false);
            },
            style:{padding:"7px 20px",borderRadius:8,border:"none",background:"#0F172A",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",opacity:(!justTexto.trim()||justSaving)?0.6:1}
          }, justSaving?"Salvando...":"Registrar")
        )
      )
    ),

    /* Rodapé honesto sobre a base */
    /*#__PURE__*/React.createElement("div", {
      style: { fontSize: 10.5, color: "#CBD5E1", marginTop: 18, lineHeight: 1.6 }
    }, "Indicadores calculados sobre a planilha de remoções. ",
       "Percentuais usam como denominador os registros que informaram cada campo — o número aparece ao lado de cada bloco.")
  );
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
