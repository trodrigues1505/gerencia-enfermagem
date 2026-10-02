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
                const g = GC[c.grav] || GC.urgencia;
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
                sub: totalRemocoes ? `${(protocolos.total / totalRemocoes * 100).toFixed(1).replace(".", ",")}% das remoções do período · clique para ver` : "clique para ver",
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
                `${protocolos.semHorarios} protocolo${protocolos.semHorarios !== 1 ? "s" : ""} sem horário para medir (contam no total, mas não entram nas três categorias): ${protocolos.semFinalizacao} sem finalização da CROSS · ${protocolos.semSaida} sem saída da ambulância. Clique em “Protocolos de AVC” para ver quais.`),
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
        tooltip: "A ordem dos momentos é: solicitação (da Santa Casa à CROSS) → finalização (CROSS; o aceite é o mesmo momento) → solicitação da ambulância (Santa Casa) → saída da ambulância → retorno. Cada card é o intervalo entre dois momentos seguidos, pela mediana (para um caso extremo não distorcer). Só entram remoções com os dois horários. Horário fora de ordem (o de depois anterior ao de antes) não entra e é contado no card."
      }, "Tempos do caminho da remoção"),
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 12 } },
        intervalos.map(i => h(Kpi, {
          key: i.id, label: i.rotulo, valor: fmtMin(i.todas.mediana), cor: i.cor,
          sub: (i.todas.nPos ? `${i.dono} · mediana · ${i.todas.nPos} com horário` : `${i.dono} · sem remoções com os dois horários`) + (i.nNeg ? ` · ${i.nNeg} fora de ordem` : ""),
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
            it.nNeg > 0 && h("div", { style: { color: "#B45309" } }, `${it.nNeg} remoç${it.nNeg !== 1 ? "ões" : "ão"} com horário fora de ordem (o momento de depois anterior ao de antes): conferir a digitação. Não entra${it.nNeg !== 1 ? "m" : ""} na conta.`),
            it.nSem > 0 && h("div", null, `${it.nSem} remoç${it.nSem !== 1 ? "ões" : "ão"} sem os dois horários: não entra${it.nSem !== 1 ? "m" : ""} na conta.`)),

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

function Dashboard({ cards, cols, dashMode, setDashMode, isAdmin, lastPub, currentUser, discrepancias, onPendenciasChange, showT: showTProp }) {
  const showT = showTProp || function () {};
  const [remocoes, setRemocoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [escala, setEscala] = useState("dia");
  const [periodo, setPeriodo] = useState("tudo");
  const [ini, setIni] = useState("");
  const [fim, setFim] = useState("");
  const [verPendencias, setVerPendencias] = useState(false);
  const [verDiscrep, setVerDiscrep] = useState(false);
  const [justModal, setJustModal] = useState(null);
  const [justTexto, setJustTexto] = useState("");
  const [justSaving, setJustSaving] = useState(false);
  const podeJustificar = isAdmin || !!(currentUser && currentUser.can_justificativa);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await sbGet("remocoes", "select=*&order=data_solicitacao.desc&limit=5000");
        if (vivo) setRemocoes(r);
      } catch (e) { if (vivo) setErro(e.message); }
      finally { if (vivo) setCarregando(false); }
    })();
    return () => { vivo = false; };
  }, []);

  /* ── Recorte temporal ─────────────────────────────────────────────────── */
  // Datas em horário LOCAL. Antes usava toISOString (UTC): depois das 21h de
  // Brasília a "data de hoje" virava a de amanhã e a janela deslocava um dia.
  const hoje = new Date();
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hojeIso = iso(hoje);
  // "7 dias" = hoje + os 6 anteriores (7 datas). Antes pegava 8.
  const diasJanela = { hoje: 1, "7d": 7, "30d": 30, "90d": 90 }[periodo] || 0;
  const inicioJanela = diasJanela
    ? iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (diasJanela - 1))) : null;
  const dados = useMemo(() => {
    if (periodo === "tudo") return remocoes;
    if (periodo === "custom") {
      if (!ini || !fim) return remocoes;
      return remocoes.filter(r => r.data_solicitacao >= ini && r.data_solicitacao <= fim);
    }
    return remocoes.filter(r => { const d = r.data_solicitacao || ""; return d >= inicioJanela && d <= hojeIso; });
  }, [remocoes, periodo, ini, fim, inicioJanela, hojeIso]);

  /* ── Amplitude real da base: decide quais escalas fazem sentido ───────── */
  const amplitude = useMemo(() => {
    const ds = remocoes.map(r => r.data_solicitacao).filter(Boolean).sort();
    if (!ds.length) return { dias: 0, meses: 0, min: null, max: null };
    const min = ds[0], max = ds[ds.length - 1];
    const dias = Math.round((new Date(max) - new Date(min)) / 86400000) + 1;
    // Meses COMPLETOS: um mês parcial comparado a um completo distorce a leitura
    const mesesSet = new Set(ds.map(d => d.slice(0, 7)));
    return { dias, meses: mesesSet.size, min, max, mesesSet };
  }, [remocoes]);

  // Quantos dias o período realmente cobre (denominador do "por dia").
  // Antes dividia pelo tamanho da BASE INTEIRA, subestimando em qualquer recorte.
  const diasNoPeriodo = !amplitude.min ? 0
    : periodo === "tudo" ? amplitude.dias
    : periodo === "custom" ? ((ini && fim) ? Math.max(1, Math.round((new Date(fim) - new Date(ini)) / 86400000) + 1) : amplitude.dias)
    : (() => {
        const a = inicioJanela > amplitude.min ? inicioJanela : amplitude.min; // base mais curta que a janela
        return Math.max(1, Math.round((new Date(hojeIso) - new Date(a)) / 86400000) + 1);
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

  /* ── Série temporal ───────────────────────────────────────────────────── */
  const serie = useMemo(() => {
    const chave = d => {
      if (!d) return null;
      if (escalaEfetiva === "mes") return d.slice(0, 7);
      if (escalaEfetiva === "semana") {
        const dt = new Date(d + "T00:00:00");
        const seg = new Date(dt); seg.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
        return iso(seg);
      }
      return d;
    };
    const m = {};
    dados.forEach(r => { const k = chave(r.data_solicitacao); if (k) m[k] = (m[k] || 0) + 1; });
    // Preenche com zero os dias/semanas/meses sem remoção: uma pausa de dias
    // não pode parecer volume contínuo.
    const keys = Object.keys(m).sort();
    if (!keys.length) return [];
    // Janelas (Hoje, 7, 30, 90 dias) vão de inicioJanela até hoje, mesmo que os primeiros/últimos dias não tenham remoção;
    // sem isso o gráfico cortava o dia de hoje (e dias vazios no começo) e parecia menor que o período escolhido.
    const ini0 = inicioJanela && escalaEfetiva === "dia" ? inicioJanela : keys[0];
    const fim0 = inicioJanela && escalaEfetiva === "dia" ? hojeIso : keys[keys.length - 1];
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
    const out = [];
    let k = ini0, guarda = 0;
    while (k <= fim0 && guarda++ < 1000) { out.push({ k, n: m[k] || 0 }); k = prox(k); }
    return out;
  }, [dados, escalaEfetiva, inicioJanela, hojeIso]);

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
  // Fonte: coluna `min_finalizacao_pedido_amb` da planilha, calculada pelo banco (tempo-pedido-ambulancia.sql).
  // Se a coluna ainda não existe (SQL não rodou), calcula aqui com os mesmos quatro campos. Negativo = pedido antes da finalização.
  const minFinPed = x => {
    if (x.min_finalizacao_pedido_amb !== undefined) return x.min_finalizacao_pedido_amb;   // null = falta algum dos quatro campos
    const f = quando(x.data_resposta_cross, x.horario_resposta_cross), p = quando(x.data_saida_ambulancia, x.hora_solic_ambulancia);
    return f !== null && p !== null ? Math.round((p - f) / 60000) : null;
  };
  const protocolos = useMemo(() => {
    const HORA = 60 * 60000;
    const r = { total: 0, noHorario: 0, atrasoSantaCasa: 0, atrasoAmbulancia: 0, atrasoSemCausa: 0, semHorarios: 0, semFinalizacao: 0, semSaida: 0, lista: [] };
    dados.forEach(x => {
      if (x.protocolo_avc !== true) return;
      r.total++;
      const fin = quando(x.data_resposta_cross, x.horario_resposta_cross);
      // Dia da saída: o mesmo critério do indicador "Espera pela ambulância" (data real > data do pedido da ambulância > data do pedido na CROSS)
      const dSaida = x.data_saida_real || x.data_saida_ambulancia || x.data_solicitacao;
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
    // minutos entre dois momentos. viraMeiaNoite: só quando falta a data de um dos lados (horário "menor" = dia seguinte).
    // Com datas reais, negativo é erro de digitação: vira "fora de ordem". Acima do limite (3 dias sem datas / 30 dias com datas) é ignorado.
    const par = (d1, h1, d2, h2, vira) => {
      const a = quando(d1, h1), b = quando(d2, h2);
      if (a === null || b === null) return { v: null, neg: false };
      let diff = (b - a) / 60000;
      if (vira && diff < 0 && diff > -1440) diff += 1440;
      if (diff < 0) return { v: null, neg: true };
      return { v: diff < (vira ? 4320 : 43200) ? diff : null, neg: false };
    };
    // dia da saída: data real > data do pedido da ambulância > data do pedido na CROSS
    const dSaidaDe = x => x.data_saida_real || x.data_saida_ambulancia || x.data_solicitacao;
    const DEFS = [
      { id: "sol_fin", de: "Solicitação", ate: "Finalização", dono: "CROSS", cor: "#0369A1",
        tip: "Tempo mediano entre a solicitação da Santa Casa à CROSS e a finalização da ficha na CROSS (o aceite é o mesmo momento da finalização).",
        calc: x => par(x.data_solicitacao, x.horario_solicitacao, x.data_resposta_cross, x.horario_resposta_cross, false),
        pts: x => [dm(x.data_solicitacao, x.horario_solicitacao), dm(x.data_resposta_cross, x.horario_resposta_cross)] },
      { id: "fin_ped", de: "Finalização", ate: "Solicitação da ambulância", dono: "Santa Casa", cor: "#B45309",
        tip: "Tempo mediano entre a finalização da ficha na CROSS e a solicitação da ambulância pela Santa Casa. Vem da coluna min_finalizacao_pedido_amb da planilha de remoção.",
        calc: x => { const m = minFinPed(x); return m === null ? { v: null, neg: false } : m < 0 ? { v: null, neg: true } : { v: m < 43200 ? m : null, neg: false }; },
        pts: x => [dm(x.data_resposta_cross, x.horario_resposta_cross), dm(x.data_saida_ambulancia, x.hora_solic_ambulancia)] },
      { id: "ped_sai", de: "Solicitação da ambulância", ate: "Saída", dono: "Santa Casa", cor: "#B45309",
        tip: "Tempo mediano entre a solicitação da ambulância e a saída dela. Com as duas datas, usa-as (solicitação num dia, saída no outro); sem elas, assume o mesmo dia ou o dia seguinte.",
        calc: x => { const d = dSaidaDe(x);
          return (x.data_saida_ambulancia && x.data_saida_real)
            ? par(x.data_saida_ambulancia, x.hora_solic_ambulancia, x.data_saida_real, x.horario_saida_ambulancia, false)
            : par(d, x.hora_solic_ambulancia, d, x.horario_saida_ambulancia, true); },
        pts: x => [dm(x.data_saida_ambulancia || dSaidaDe(x), x.hora_solic_ambulancia), dm(dSaidaDe(x), x.horario_saida_ambulancia)] },
      { id: "sai_ret", de: "Saída", ate: "Retorno", dono: "Santa Casa", cor: "#0F766E",
        tip: "Tempo mediano que a ambulância ficou fora: da saída ao retorno à Santa Casa. Com a data do retorno registrada, usa as duas datas; sem ela, assume o mesmo dia ou o dia seguinte.",
        calc: x => { const d = dSaidaDe(x);
          return x.data_retorno
            ? par(d, x.horario_saida_ambulancia, x.data_retorno, x.horario_retorno, false)
            : par(d, x.horario_saida_ambulancia, d, x.horario_retorno, true); },
        pts: x => [dm(dSaidaDe(x), x.horario_saida_ambulancia), dm(x.data_retorno || dSaidaDe(x), x.horario_retorno)] },
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

  // Percorre os registros (nao os agregados) para levar o id junto: sem ele
  // o aviso diz que existe um valor invalido mas nao onde corrigir.
  const pendencias = useMemo(() => {
    if (!C) return [];
    const out = [];
    ["especialidade", "instituicao_destino", "setor", "status"].forEach(campo => {
      dados.forEach(r => {
        const res = C.classificar(campo, r[campo]);
        if (res.canonico === C.NAO_CLASSIFICADO)
          out.push({ id: r.id, campo, valor: r[campo],
                     paciente: r.nome_paciente, ficha: r.ficha_cross,
                     data: r.data_solicitacao,
                     sugestao: res.vazamento ? res.vazamento.pertenceA.join(" ou ") : null });
      });
    });
    return out;
  }, [dados]);
  useEffect(() => { if(onPendenciasChange) onPendenciasChange(pendencias.length); }, [pendencias.length]);

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
  const [deDia, ateDia] = periodo === "custom" && ini && fim ? [ini, fim]
    : (periodo === "tudo" || periodo === "custom") ? [amplitude.min, amplitude.max]
    : [inicioJanela, hojeIso];
  // Sempre com a unidade escrita: "5h 22min" (5 horas e 22 minutos) ou "22min". Nunca "5:22", que não diz se são horas ou minutos.
  const fmtMin = m => {
    if (m === null) return "—";
    const t = Math.round(m), h = Math.floor(t / 60);
    return h > 0 ? `${h}h ${String(t % 60).padStart(2, "0")}min` : `${t}min`;
  };
  const rotuloSerie = k => escalaEfetiva === "mes"
    ? new Date(k + "-01T00:00:00").toLocaleDateString("pt-BR", { month: "short" })
    : new Date(k + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const maxSerie = Math.max(...serie.map(s => s.n), 1);

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
    key: id, onClick: () => setPeriodo(id),
    style: { padding: "5px 13px", borderRadius: 7, border: "none", fontSize: 12,
             fontWeight: periodo === id ? 650 : 450, cursor: "pointer",
             background: periodo === id ? "#E2E8F0" : "transparent",
             color: periodo === id ? "#0F172A" : "#64748B", fontFamily: "inherit" }
  }, txt);

  return /*#__PURE__*/React.createElement("div", { style: { padding: "4px 0 40px" } },

    /* ══ Controles ══ */
    /*#__PURE__*/React.createElement("div", {
      style: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }
    },
      /*#__PURE__*/React.createElement("div", {
        style: { display: "flex", gap: 2, background: "#F1F5F9", borderRadius: 9, padding: 3 }
      }, ["tudo", "90d", "30d", "7d", "hoje"].map(p =>
        btnPeriodo(p, p === "tudo" ? "Tudo" : p === "90d" ? "90 dias" : p === "30d" ? "30 dias" : p === "7d" ? "7 dias" : "Hoje"))),

      /*#__PURE__*/React.createElement("div", {
        style: { display: "flex", gap: 2, background: "#F1F5F9", borderRadius: 9, padding: 3 }
      }, [["dia", "Diária"], ["semana", "Semanal"], ["mes", "Mensal"]].map(([i, t]) => btnEscala(i, t))),

      /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#94A3B8", marginLeft: "auto" } },
        dados.length, " remoções",
        deDia && ` · ${fmtDia(deDia)}${ateDia && ateDia !== deDia ? " a " + fmtDia(ateDia) : ""}`)
    ),

    /* Escala indisponível: diz o porquê em vez de esconder o botão */
    !escalaLiberada[escala] && escala !== "dia" && /*#__PURE__*/React.createElement("div", {
      style: { fontSize: 11.5, color: "#92400E", background: "#FFFBEB", border: "1px solid #FDE68A",
               borderRadius: 9, padding: "9px 13px", marginBottom: 16 }
    }, "Escala ", escala === "mes" ? "mensal" : "semanal", " ainda não disponível — ", motivoBloqueio[escala],
       ". Mostrando a diária."),

    /* ══ Pulso operacional — única seção que vem do Kanban (cartões clicáveis) ══ */
    /*#__PURE__*/React.createElement(DashFilaKanban, {
      cols, cards, Card, Num,
      titulo: isAdmin ? "Agora · fila do Kanban" : "Última publicação · fila do Kanban"
    }),

    /* ══ KPIs do período (remocoes) ══ */
    /*#__PURE__*/React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 12, marginBottom: 22 }
    },
      /*#__PURE__*/React.createElement(Kpi, {
        label: "Remoções", valor: dados.length,
        sub: diasNoPeriodo ? `${(dados.length / diasNoPeriodo).toFixed(1)} por dia · ${diasNoPeriodo} dia${diasNoPeriodo !== 1 ? "s" : ""}` : null,
        tooltip: "Total de saídas registradas na planilha no período selecionado. Fonte: planilha de remoções." }),
      /*#__PURE__*/React.createElement(Kpi, {
        label: "Ambulância avançada",
        valor: gAmb.informados ? `${((gAmb.itens.find(i => i.canonico === "AVANÇADA")?.n || 0) / gAmb.informados * 100).toFixed(0)}%` : "—",
        sub: `${gAmb.informados} de ${gAmb.total} informados`,
        alerta: gAmb.cobertura < 80,
        tooltip: "% de remoções que usaram SAV (Suporte Avançado de Vida). Calculado só sobre registros com tipo de ambulância preenchido — o denominador aparece abaixo." }),
      /*#__PURE__*/React.createElement(Kpi, {
        label: "Permaneceu no destino", valor: perm.n ? `${perm.pct.toFixed(0)}%` : "—",
        sub: `${perm.sim} de ${perm.n} remoções · ${perm.semInfo} sem registro`,
        alerta: perm.n > 0 && perm.semInfo / perm.n > 0.2,
        tooltip: "% das remoções do período em que o paciente ficou no hospital de destino e não voltou à Santa Casa. O denominador é o total de remoções; as sem registro (campo vazio) contam como não-permaneceu, então o valor real pode ser maior." })
    ),

    /* ══ Tempos do caminho da remoção: 5 intervalos, clique para ver por gravidade ══ */
    /*#__PURE__*/React.createElement(DashTempos, { intervalos, Card, Kpi, Titulo, fmtMin }),

    /* ══ Protocolo de AVC (Livro de Remoção): meta de saída em até 1h da finalização da CROSS ══ */
    /*#__PURE__*/React.createElement(DashProtocoloAVC, { protocolos, totalRemocoes: dados.length, Card, Kpi, Titulo, Vazio, fmtMin }),

    /* ══ Série temporal ══ */
    /*#__PURE__*/React.createElement(Card, { style: { marginBottom: 14 } },
      /*#__PURE__*/React.createElement(Titulo, {
        extra: escalaEfetiva === "dia" ? "por dia" : escalaEfetiva === "semana" ? "por semana" : "por mês"
      }, "Volume de remoções"),
      serie.length === 0 ? /*#__PURE__*/React.createElement(Vazio, null, "Sem remoções no período") :
      /*#__PURE__*/React.createElement("div", {
        style: { display: "flex", alignItems: "flex-end", gap: 3, height: 130, paddingTop: 8 }
      }, serie.map(s => /*#__PURE__*/React.createElement("div", {
        key: s.k, title: `${rotuloSerie(s.k)}: ${s.n}`,
        style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 0 }
      },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 9.5, color: "#94A3B8", fontVariantNumeric: "tabular-nums" } }, s.n),
        /*#__PURE__*/React.createElement("div", {
          style: { width: "100%", height: entrou ? `${s.n / maxSerie * 92}px` : "0px", minHeight: entrou ? 3 : 0,
                   background: "#3B82F6", borderRadius: "4px 4px 2px 2px", opacity: .85,
                   transition: "height .7s cubic-bezier(.22,.9,.3,1)" } }),
        /*#__PURE__*/React.createElement("div", {
          style: { fontSize: 8.5, color: "#CBD5E1", whiteSpace: "nowrap", overflow: "hidden" }
        }, rotuloSerie(s.k)))))
    ),

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

    /* ══ Pendências de qualidade ══ */
    pendencias.length > 0 && /*#__PURE__*/React.createElement(Card, {
      style: { marginTop: 14, borderColor: "#FDE68A", background: "#FFFBEB" }
    },
      /*#__PURE__*/React.createElement("div", {
        style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" },
        onClick: () => setVerPendencias(v => !v)
      },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#92400E" } },
          pendencias.length, " valor", pendencias.length !== 1 ? "es" : "", " a corrigir"),
        /*#__PURE__*/React.createElement("span", { style: { fontSize: 11, color: "#B45309" } },
          verPendencias ? "ocultar" : "ver e corrigir")),
      verPendencias && /*#__PURE__*/React.createElement("div", { style: { marginTop: 12 } },
        /*#__PURE__*/React.createElement("div", {
          style: { fontSize: 11, color: "#78350F", marginBottom: 10, lineHeight: 1.55 }
        }, "Cada item abre a planilha na linha exata. Enquanto não forem corrigidos, ficam de fora dos indicadores."),
        pendencias.map((p, i) => /*#__PURE__*/React.createElement("a", {
          key: i,
          href: `remocao.html?foco=${encodeURIComponent(p.id)}&campo=${encodeURIComponent(p.campo)}`,
          style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                   fontSize: 11.5, color: "#92400E", padding: "8px 10px", textDecoration: "none",
                   borderTop: i ? "1px solid #FDE68A" : "none", borderRadius: 6,
                   transition: "background .15s" },
          onMouseEnter: e => e.currentTarget.style.background = "#FEF3C7",
          onMouseLeave: e => e.currentTarget.style.background = "transparent"
        },
          /*#__PURE__*/React.createElement("code", {
            style: { background: "#FEF3C7", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 600 }
          }, p.valor),
          /*#__PURE__*/React.createElement("span", { style: { color: "#B45309" } }, "em ", p.campo),
          p.sugestao && /*#__PURE__*/React.createElement("span", {
            style: { fontSize: 10.5, color: "#9A3412", background: "#FFEDD5",
                     border: "1px solid #FED7AA", borderRadius: 5, padding: "1px 6px" }
          }, "parece ser de ", p.sugestao),
          /*#__PURE__*/React.createElement("span", {
            style: { marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", color: "#A16207", fontSize: 10.5 }
          },
            p.paciente && /*#__PURE__*/React.createElement("span", null, p.paciente),
            p.ficha && /*#__PURE__*/React.createElement("span", { style: { color: "#CA8A04" } }, p.ficha),
            /*#__PURE__*/React.createElement("span", { style: { fontWeight: 700, color: "#B45309" } }, "corrigir →"))))))
    ,

    /* ══ Discrepâncias de fila ══ */
    discrepancias && discrepancias.length > 0 && React.createElement("div", {
      style:{marginTop:14,background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:12,overflow:"hidden"}
    },
      React.createElement("div", {
        onClick:function(){setVerDiscrep(function(v){return !v;});},
        style:{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}
      },
        React.createElement("div", {style:{display:"flex",alignItems:"center",gap:8}},
          React.createElement("span", {style:{fontSize:13,fontWeight:700,color:"#B91C1C"}},
            "\u26A0\uFE0F " + discrepancias.length + " discrepânci" + (discrepancias.length===1?"a":"as") + " de fila"),
          React.createElement("span", {className:"tip"},
            React.createElement("span", {style:{fontSize:10,color:"#EF4444",border:"1px solid #FCA5A5",borderRadius:99,padding:"1px 6px"}},"?"),
            React.createElement("span", {className:"tipbox"}, "Paciente menos grave com aceite confirmado, mesma especialidade que outro mais grave ainda pendente, sem avaliação médica registrada. Pode indicar inversão de fila.")
          )
        ),
        React.createElement("span", {style:{fontSize:11,color:"#94A3B8"}}, verDiscrep?"ocultar":"ver casos")
      ),
      verDiscrep && React.createElement("div", {style:{padding:"0 16px 14px"}},
        React.createElement("div", {style:{fontSize:11,color:"#64748B",marginBottom:10,lineHeight:1.55}},
          "Cada caso: paciente de menor gravidade teve aceite antes de um mais grave da mesma especialidade, sem prioridade médica definida. ",
          podeJustificar?"Clique em Justificar para registrar a razão clínica.":"Peça ao coordenador médico para justificar."
        ),
        (discrepancias||[]).map(function(disc,i){
          var a=disc.aceitado, b=disc.pendente;
          var gcA=GC[a.grav]||GC.urgencia, gcB=GC[b.grav]||GC.urgencia;
          return React.createElement("div", {
            key:disc.id,
            style:{padding:"10px 0",borderTop:i?"1px solid #FEE2E2":"none",display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap"}
          },
            React.createElement("div", {style:{flex:1,minWidth:180}},
              React.createElement("div", {style:{fontSize:11,color:"#374151",marginBottom:3}},
                React.createElement("span", {style:{fontWeight:700,color:gcA.text,background:gcA.bg,border:"1px solid "+gcA.border,borderRadius:4,padding:"1px 5px",fontSize:10}}, gcA.label),
                " ", a.nome, React.createElement("span", {style:{color:"#94A3B8",marginLeft:4,fontSize:10}}, "(aceito \u2022 "+a.rec+")")
              ),
              React.createElement("div", {style:{fontSize:11,color:"#374151"}},
                "espera: ", React.createElement("span", {style:{fontWeight:700,color:gcB.text,background:gcB.bg,border:"1px solid "+gcB.border,borderRadius:4,padding:"1px 5px",fontSize:10}}, gcB.label),
                " ", b.nome
              )
            ),
            podeJustificar && React.createElement("button", {
              onClick:function(){setJustModal(disc);setJustTexto("");},
              style:{flexShrink:0,padding:"5px 14px",border:"none",borderRadius:7,background:"#0F172A",color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer"}
            }, "Justificar")
          );
        })
      )
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
