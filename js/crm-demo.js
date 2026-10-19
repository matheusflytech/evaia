/* ===== CRM demo: o atendimento virando negócio, em cenário ensaiado =====
   Uma única história (Camila, de uma clínica) conta a jornada inteira:
   conversa no WhatsApp, qualificação automática, reunião agendada, equipe
   assumindo, proposta e fechamento. O cartão é um só e atravessa as colunas.
   Nada aqui fala com servidor: é a vitrine do que o sistema faz de verdade.
   Começa quando a seção aparece na tela; "Reiniciar" recomeça a história. */
(function () {
  var root = document.getElementById("crmDemo");
  if (!root) return;

  var chatBody = document.getElementById("crmChatBody");
  var board = document.getElementById("crmBoard");
  var toasts = document.getElementById("crmToasts");
  var stepsEl = document.getElementById("crmSteps");
  var restartBtn = document.getElementById("crmRestart");
  var kpiResp = document.getElementById("crmKpiResp");
  var kpiLeads = document.getElementById("crmKpiLeads");
  var kpiOpen = document.getElementById("crmKpiOpen");
  var kpiWon = document.getElementById("crmKpiWon");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COLS = [
    { id: "novo", name: "Novo lead" },
    { id: "qual", name: "Qualificado" },
    { id: "reuniao", name: "Reunião agendada" },
    { id: "proposta", name: "Proposta enviada" },
    { id: "ganho", name: "Fechado", won: true }
  ];
  var STEPS = ["Conversa", "Qualifica", "Agenda", "Equipe assume", "Fecha"];

  // cartões "de fundo", só para o funil parecer vivo
  var GHOSTS = [
    { col: "novo", name: "Rafael M.", sub: "Site institucional" },
    { col: "qual", name: "Studio Aura", sub: "Agente de IA · R$ 9.500" },
    { col: "proposta", name: "Grupo Lumen", sub: "Automação · R$ 24.000" },
    { col: "ganho", name: "Casa Verde", sub: "Landing page · R$ 6.200" }
  ];

  var runId = 0;
  var colLists = {};
  var colCounts = {};
  var card = null;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function sleep(ms, id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === runId ? resolve() : reject(new Error("cancelado")); }, reduced ? 0 : ms);
    });
  }

  function buildBoard() {
    board.innerHTML = "";
    COLS.forEach(function (c) {
      var col = el("div", "crm-col" + (c.won ? " crm-col--won" : ""));
      col.dataset.col = c.id;
      var head = el("div", "crm-col-head", "<b>" + c.name + "</b>");
      var count = el("em", null, "0");
      head.appendChild(count);
      var list = el("div", "crm-list");
      col.appendChild(head);
      col.appendChild(list);
      board.appendChild(col);
      colLists[c.id] = list;
      colCounts[c.id] = count;
    });
    GHOSTS.forEach(function (g) {
      var c = el("div", "crm-card crm-card--ghost", "<b>" + g.name + "</b><div class=\"crm-card-sub\">" + g.sub + "</div>");
      colLists[g.col].appendChild(c);
    });
    updateCounts();
  }

  function updateCounts() {
    COLS.forEach(function (c) {
      colCounts[c.id].textContent = colLists[c.id].children.length;
    });
  }

  function scrollChat() {
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function say(who, text) {
    var label = who === "bot" ? "Eva, assistente" : who === "human" ? "Marina, equipe" : "";
    var m = el("div", "crm-msg crm-msg--" + who, (label ? "<small>" + label + "</small>" : "") + text);
    chatBody.appendChild(m);
    scrollChat();
  }

  function typing() {
    var t = el("div", "crm-typing", "<i></i><i></i><i></i>");
    chatBody.appendChild(t);
    scrollChat();
    return t;
  }

  async function botSays(id, text, who) {
    var t = typing();
    await sleep(900, id);
    t.remove();
    say(who || "bot", text);
  }

  function skip(text) {
    chatBody.appendChild(el("div", "crm-skip", text));
    scrollChat();
  }

  function toast(title, text) {
    var t = el("div", "crm-toast", "<b>" + title + "</b>" + text);
    toasts.appendChild(t);
    setTimeout(function () { t.remove(); }, reduced ? 6000 : 3900);
  }

  function setStep(i) {
    var items = stepsEl.children;
    for (var k = 0; k < items.length; k++) {
      items[k].className = k < i ? "is-done" : k === i ? "is-active" : "";
    }
  }

  // FLIP: o cartão desliza da coluna antiga para a nova em vez de teleportar
  function moveCard(colId) {
    var first = card.getBoundingClientRect();
    colLists[colId].insertBefore(card, colLists[colId].firstChild);
    updateCounts();
    var colEl = colLists[colId].parentNode;
    var last = card.getBoundingClientRect();
    if (!reduced) {
      var dx = first.left - last.left;
      var dy = first.top - last.top;
      card.style.transition = "none";
      card.style.transform = "translate(" + dx + "px," + dy + "px)";
      card.getBoundingClientRect();
      card.style.transition = "transform .7s cubic-bezier(.2,.8,.2,1)";
      card.style.transform = "";
    }
    var cols = board.children;
    for (var k = 0; k < cols.length; k++) cols[k].classList.toggle("is-target", cols[k] === colEl);
    // centraliza a coluna ativa no quadro (importante no celular, onde o quadro rola)
    var target = colEl.offsetLeft - (board.clientWidth - colEl.offsetWidth) / 2;
    board.scrollLeft = Math.max(0, target);
  }

  function addField(label, value) {
    var f = card.querySelector(".crm-fields");
    f.appendChild(el("div", "crm-field", "<span>" + label + "</span><strong>" + value + "</strong>"));
  }

  function addTag(text, cls) {
    card.querySelector(".crm-tags").appendChild(el("span", "crm-tag" + (cls ? " crm-tag--" + cls : ""), text));
  }

  function bump(node, text) {
    node.textContent = text;
    node.classList.add("is-up");
    setTimeout(function () { node.classList.remove("is-up"); }, 1200);
  }

  function resetKpis() {
    kpiResp.textContent = "—";
    kpiLeads.textContent = "12";
    kpiOpen.textContent = "R$ 33.500";
    kpiWon.textContent = "R$ 6.200";
    [kpiResp, kpiLeads, kpiOpen, kpiWon].forEach(function (k) { k.classList.remove("is-up"); });
  }

  function reset() {
    chatBody.innerHTML = "";
    toasts.innerHTML = "";
    colLists = {};
    colCounts = {};
    card = null;
    buildBoard();
    resetKpis();
    setStep(-1);
  }

  async function play(id) {
    reset();
    await sleep(700, id);

    // 1. Conversa: a mensagem chega e o cartão nasce sozinho
    setStep(0);
    say("client", "Oi! Vi o site de vocês. Queria automatizar o atendimento da minha clínica.");
    card = el(
      "div",
      "crm-card crm-card--live",
      "<b>Contato WhatsApp</b><div class=\"crm-card-sub\">+55 21 9•••• ••12</div><div class=\"crm-fields\"></div><div class=\"crm-tags\"></div>"
    );
    colLists.novo.insertBefore(card, colLists.novo.firstChild);
    updateCounts();
    toast("CRM", "Novo contato criado automaticamente");
    bump(kpiLeads, "13");
    await sleep(1100, id);
    kpiResp.textContent = "8 s";
    kpiResp.classList.add("is-up");
    await botSays(id, "Olá! Sou a Eva. Posso te ajudar com isso. Quantos atendimentos vocês fazem por semana?");
    await sleep(1300, id);

    // 2. Qualifica: respostas viram campos, o cartão avança sozinho
    setStep(1);
    say("client", "Uns 200, mais ou menos. Sou a Camila, da Clínica Vida.");
    await sleep(900, id);
    card.querySelector("b").textContent = "Camila Duarte";
    card.querySelector(".crm-card-sub").textContent = "Clínica Vida";
    addField("Segmento", "Clínica");
    await sleep(500, id);
    addField("Volume", "~200 por semana");
    moveCard("qual");
    toast("CRM", "Lead qualificado: segmento e volume preenchidos");
    await sleep(1100, id);
    await botSays(id, "Entendi, Camila. Qual o prazo que você imagina para colocar isso no ar?");
    await sleep(1200, id);
    say("client", "Preciso em 30 dias. Meu orçamento é por volta de 18 mil.");
    await sleep(900, id);
    addField("Prazo", "30 dias");
    await sleep(450, id);
    addField("Orçamento", "R$ 18.000");
    addTag("Urgente", "warm");
    addTag("Agente de IA");
    bump(kpiOpen, "R$ 51.500");
    await sleep(1400, id);

    // 3. Agenda: a conversa fecha um horário e o CRM cria a tarefa
    setStep(2);
    await botSays(id, "Perfeito. Posso marcar uma conversa com nosso especialista amanhã às 10h?");
    await sleep(1100, id);
    say("client", "Pode sim!");
    await sleep(800, id);
    moveCard("reuniao");
    addTag("Reunião amanhã 10h", "ok");
    toast("Tarefa criada", "Reunião com Camila, amanhã 10h");
    await botSays(id, "Combinado! Anotei amanhã às 10h. A equipe confirma o horário com você por aqui.");
    await sleep(1500, id);

    // 4. Equipe assume: o humano entra na mesma conversa, o cartão ganha dono
    setStep(3);
    skip("Dia seguinte");
    await sleep(1100, id);
    moveCard("proposta");
    card.appendChild(el("div", "crm-owner", "<i></i>Marina assumiu a conversa"));
    toast("Atendimento", "Equipe humana assumiu, a IA fica em silêncio");
    await botSays(id, "Oi, Camila! Aqui é a Marina. Segue a proposta que conversamos, com prazo de 30 dias.", "human");
    await sleep(1100, id);
    toast("Automação", "Follow-up agendado para daqui a 48h");
    await sleep(1500, id);
    say("client", "Gostei! Pode fechar.");
    await sleep(1200, id);

    // 5. Fecha: ganho, números do funil se atualizam
    setStep(4);
    moveCard("ganho");
    card.classList.add("is-won");
    addTag("Fechado ✓", "ok");
    bump(kpiWon, "R$ 24.200");
    bump(kpiOpen, "R$ 33.500");
    toast("Negócio fechado", "R$ 18.000 · Agente de IA para clínica");
    await botSays(id, "Fechado! Bem-vinda, Camila. Nosso time já vai começar o seu projeto.", "human");
    await sleep(1200, id);
    setStep(5);
    for (var k = 0; k < stepsEl.children.length; k++) stepsEl.children[k].className = "is-done";
  }

  var timer = null;
  function start() {
    runId += 1;
    var id = runId;
    clearTimeout(timer);
    play(id).then(function () {
      // fim da história: respira e recomeça sozinha, a menos que o usuário tenha reiniciado antes
      if (reduced) return;
      timer = setTimeout(function () { if (id === runId && isVisible()) start(); }, 7000);
    }).catch(function (err) { if (!err || err.message !== "cancelado") console.error("[demo]", err); });
  }

  function isVisible() {
    var r = root.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  stepsEl.innerHTML = "";
  STEPS.forEach(function (s) { stepsEl.appendChild(el("li", null, "<i></i>" + s)); });
  reset();

  restartBtn.addEventListener("click", start);

  // só começa quando boa parte da seção está na tela. Dois gatilhos (observador e
  // checagem na rolagem) porque nem todo ambiente entrega o observador na hora.
  var started = false;
  function visibleEnough() {
    var r = root.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var seen = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    return seen > Math.min(r.height, vh) * 0.4;
  }
  function tryStart() {
    if (started || !visibleEnough()) return;
    started = true;
    window.removeEventListener("scroll", tryStart);
    start();
  }
  window.addEventListener("scroll", tryStart, { passive: true });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) tryStart(); });
    }, { threshold: [0.1, 0.4] }).observe(root);
  }
  tryStart();
})();
