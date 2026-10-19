/* ===== CRM demo: o atendimento virando negócio, em cenário ensaiado =====
   Uma única história (Camila, de uma clínica) conta a jornada inteira:
   conversa no WhatsApp, qualificação automática, reunião marcada, equipe
   assumindo, proposta e fechamento. O cartão é um só e atravessa as colunas.
   Nada aqui fala com servidor: é a vitrine do que o sistema faz de verdade.
   Textos em português, inglês e espanhol; trocar o idioma reinicia a história. */
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

  var L = {
    pt: {
      cols: ["Novo lead", "Qualificado", "Reunião agendada", "Proposta enviada", "Fechado"],
      steps: ["Conversa", "Qualifica", "Agenda", "Equipe assume", "Fecha"],
      ghosts: ["Site institucional", "Agente de IA · R$ 9.500", "Automação · R$ 24.000", "Landing page · R$ 6.200"],
      bot: "Eva, assistente", human: "Marina, equipe",
      cardName: "Contato WhatsApp", cardSub: "Clínica Vida",
      toastCrm: "CRM", toastNew: "Novo contato criado automaticamente",
      c1: "Oi! Vi o site de vocês. Queria automatizar o atendimento da minha clínica.",
      b1: "Olá! Sou a Eva. Posso te ajudar com isso. Quantos atendimentos vocês fazem por semana?",
      c2: "Uns 200, mais ou menos. Sou a Camila, da Clínica Vida.",
      fSeg: "Segmento", vSeg: "Clínica", fVol: "Volume", vVol: "~200 por semana",
      toastQual: "Lead qualificado: segmento e volume preenchidos",
      b2: "Entendi, Camila. Qual o prazo que você imagina para colocar isso no ar?",
      c3: "Preciso em 30 dias. Meu orçamento é por volta de 18 mil.",
      fPrazo: "Prazo", vPrazo: "30 dias", fOrc: "Orçamento", vOrc: "R$ 18.000",
      tagUrg: "Urgente", tagAi: "Agente de IA",
      b3: "Perfeito. Posso marcar uma conversa com nosso especialista amanhã às 10h?",
      c4: "Pode sim!",
      tagMeet: "Reunião amanhã 10h",
      toastTask: "Tarefa criada", toastTaskTxt: "Reunião com Camila, amanhã 10h",
      b4: "Combinado! Anotei amanhã às 10h. A equipe confirma o horário com você por aqui.",
      skip: "Dia seguinte", owner: "Marina assumiu a conversa",
      toastAt: "Atendimento", toastAtTxt: "Equipe humana assumiu, a IA fica em silêncio",
      h1: "Oi, Camila! Aqui é a Marina. Segue a proposta que conversamos, com prazo de 30 dias.",
      toastAuto: "Automação", toastAutoTxt: "Follow-up agendado para daqui a 48h",
      c5: "Gostei! Pode fechar.",
      tagWon: "Fechado ✓",
      toastWon: "Negócio fechado", toastWonTxt: "R$ 18.000 · Agente de IA para clínica",
      h2: "Fechado! Bem-vinda, Camila. Nosso time já vai começar o seu projeto.",
      sec: " s"
    },
    en: {
      cols: ["New lead", "Qualified", "Meeting scheduled", "Proposal sent", "Closed won"],
      steps: ["Conversation", "Qualifies", "Schedules", "Team takes over", "Closes"],
      ghosts: ["Company website", "AI agent · R$ 9,500", "Automation · R$ 24,000", "Landing page · R$ 6,200"],
      bot: "Eva, assistant", human: "Marina, team",
      cardName: "WhatsApp contact", cardSub: "Vida Clinic",
      toastCrm: "CRM", toastNew: "New contact created automatically",
      c1: "Hi! I saw your website. I'd like to automate customer service at my clinic.",
      b1: "Hi! I'm Eva. I can help with that. How many customer conversations do you handle per week?",
      c2: "Around 200, give or take. I'm Camila, from Vida Clinic.",
      fSeg: "Segment", vSeg: "Clinic", fVol: "Volume", vVol: "~200 per week",
      toastQual: "Lead qualified: segment and volume filled in",
      b2: "Got it, Camila. What timeline do you have in mind to go live?",
      c3: "I need it in 30 days. My budget is around R$ 18,000.",
      fPrazo: "Deadline", vPrazo: "30 days", fOrc: "Budget", vOrc: "R$ 18,000",
      tagUrg: "Urgent", tagAi: "AI agent",
      b3: "Perfect. Can I set up a call with our specialist tomorrow at 10 am?",
      c4: "Yes, that works!",
      tagMeet: "Meeting tomorrow 10 am",
      toastTask: "Task created", toastTaskTxt: "Meeting with Camila, tomorrow 10 am",
      b4: "Done! I've noted tomorrow at 10 am. The team will confirm the time with you here.",
      skip: "Next day", owner: "Marina took over the conversation",
      toastAt: "Customer service", toastAtTxt: "A human took over, the AI stays silent",
      h1: "Hi, Camila! This is Marina. Here's the proposal we discussed, with a 30-day timeline.",
      toastAuto: "Automation", toastAutoTxt: "Follow-up scheduled in 48 hours",
      c5: "I like it! Let's close.",
      tagWon: "Closed ✓",
      toastWon: "Deal closed", toastWonTxt: "R$ 18,000 · AI agent for a clinic",
      h2: "Deal! Welcome aboard, Camila. Our team will start your project right away.",
      sec: " s"
    },
    es: {
      cols: ["Nuevo lead", "Calificado", "Reunión agendada", "Propuesta enviada", "Cerrado"],
      steps: ["Conversación", "Califica", "Agenda", "El equipo asume", "Cierra"],
      ghosts: ["Sitio institucional", "Agente de IA · R$ 9.500", "Automatización · R$ 24.000", "Landing page · R$ 6.200"],
      bot: "Eva, asistente", human: "Marina, equipo",
      cardName: "Contacto de WhatsApp", cardSub: "Clínica Vida",
      toastCrm: "CRM", toastNew: "Nuevo contacto creado automáticamente",
      c1: "¡Hola! Vi su sitio. Quisiera automatizar la atención de mi clínica.",
      b1: "¡Hola! Soy Eva. Puedo ayudarte con eso. ¿Cuántas atenciones realizan por semana?",
      c2: "Unas 200, más o menos. Soy Camila, de la Clínica Vida.",
      fSeg: "Segmento", vSeg: "Clínica", fVol: "Volumen", vVol: "~200 por semana",
      toastQual: "Lead calificado: segmento y volumen completados",
      b2: "Entendido, Camila. ¿Qué plazo imaginas para ponerlo en marcha?",
      c3: "Lo necesito en 30 días. Mi presupuesto es de unos R$ 18.000.",
      fPrazo: "Plazo", vPrazo: "30 días", fOrc: "Presupuesto", vOrc: "R$ 18.000",
      tagUrg: "Urgente", tagAi: "Agente de IA",
      b3: "Perfecto. ¿Puedo agendar una conversación con nuestro especialista mañana a las 10 h?",
      c4: "¡Sí, claro!",
      tagMeet: "Reunión mañana 10 h",
      toastTask: "Tarea creada", toastTaskTxt: "Reunión con Camila, mañana 10 h",
      b4: "¡Acordado! Anoté mañana a las 10 h. El equipo confirma el horario contigo por aquí.",
      skip: "Al día siguiente", owner: "Marina asumió la conversación",
      toastAt: "Atención", toastAtTxt: "Una persona asumió, la IA queda en silencio",
      h1: "¡Hola, Camila! Soy Marina. Te comparto la propuesta que conversamos, con plazo de 30 días.",
      toastAuto: "Automatización", toastAutoTxt: "Seguimiento programado para dentro de 48 h",
      c5: "¡Me gustó! Podemos cerrar.",
      tagWon: "Cerrado ✓",
      toastWon: "Negocio cerrado", toastWonTxt: "R$ 18.000 · Agente de IA para clínica",
      h2: "¡Hecho! Bienvenida, Camila. Nuestro equipo ya va a empezar tu proyecto.",
      sec: " s"
    }
  };

  function lang() {
    var l = window.EvaI18n && window.EvaI18n.getLang ? window.EvaI18n.getLang() : "pt";
    return L[l] ? l : "pt";
  }
  function T(k) { return L[lang()][k]; }
  // R$ 33.500 em português e espanhol; R$ 33,500 em inglês
  function money(n) {
    var s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, lang() === "en" ? "," : ".");
    return "R$ " + s;
  }

  var COL_IDS = ["novo", "qual", "reuniao", "proposta", "ganho"];
  var GHOST_DATA = [
    { col: "novo", name: "Rafael M.", i: 0 },
    { col: "qual", name: "Studio Aura", i: 1 },
    { col: "proposta", name: "Grupo Lumen", i: 2 },
    { col: "ganho", name: "Casa Verde", i: 3 }
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
    COL_IDS.forEach(function (id, idx) {
      var col = el("div", "crm-col" + (id === "ganho" ? " crm-col--won" : ""));
      col.dataset.col = id;
      var head = el("div", "crm-col-head", "<b>" + T("cols")[idx] + "</b>");
      var count = el("em", null, "0");
      head.appendChild(count);
      var list = el("div", "crm-list");
      col.appendChild(head);
      col.appendChild(list);
      board.appendChild(col);
      colLists[id] = list;
      colCounts[id] = count;
    });
    GHOST_DATA.forEach(function (g) {
      var c = el("div", "crm-card crm-card--ghost", "<b>" + g.name + "</b><div class=\"crm-card-sub\">" + T("ghosts")[g.i] + "</div>");
      colLists[g.col].appendChild(c);
    });
    updateCounts();
  }

  function updateCounts() {
    COL_IDS.forEach(function (id) { colCounts[id].textContent = colLists[id].children.length; });
  }

  function scrollChat() { chatBody.scrollTop = chatBody.scrollHeight; }

  function say(who, text) {
    var label = who === "bot" ? T("bot") : who === "human" ? T("human") : "";
    chatBody.appendChild(el("div", "crm-msg crm-msg--" + who, (label ? "<small>" + label + "</small>" : "") + text));
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
    card.querySelector(".crm-fields").appendChild(el("div", "crm-field", "<span>" + label + "</span><strong>" + value + "</strong>"));
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
    kpiOpen.textContent = money(33500);
    kpiWon.textContent = money(6200);
    [kpiResp, kpiLeads, kpiOpen, kpiWon].forEach(function (k) { k.classList.remove("is-up"); });
  }

  function buildSteps() {
    stepsEl.innerHTML = "";
    T("steps").forEach(function (s) { stepsEl.appendChild(el("li", null, "<i></i>" + s)); });
  }

  function reset() {
    chatBody.innerHTML = "";
    toasts.innerHTML = "";
    colLists = {};
    colCounts = {};
    card = null;
    buildBoard();
    buildSteps();
    resetKpis();
    setStep(-1);
  }

  async function play(id) {
    reset();
    await sleep(700, id);

    // 1. Conversa: a mensagem chega e o cartão nasce sozinho
    setStep(0);
    say("client", T("c1"));
    card = el(
      "div",
      "crm-card crm-card--live",
      "<b>" + T("cardName") + "</b><div class=\"crm-card-sub\">+55 21 9•••• ••12</div><div class=\"crm-fields\"></div><div class=\"crm-tags\"></div>"
    );
    colLists.novo.insertBefore(card, colLists.novo.firstChild);
    updateCounts();
    toast(T("toastCrm"), T("toastNew"));
    bump(kpiLeads, "13");
    await sleep(1100, id);
    kpiResp.textContent = "8" + T("sec");
    kpiResp.classList.add("is-up");
    await botSays(id, T("b1"));
    await sleep(1300, id);

    // 2. Qualifica: respostas viram campos, o cartão avança sozinho
    setStep(1);
    say("client", T("c2"));
    await sleep(900, id);
    card.querySelector("b").textContent = "Camila Duarte";
    card.querySelector(".crm-card-sub").textContent = T("cardSub");
    addField(T("fSeg"), T("vSeg"));
    await sleep(500, id);
    addField(T("fVol"), T("vVol"));
    moveCard("qual");
    toast(T("toastCrm"), T("toastQual"));
    await sleep(1100, id);
    await botSays(id, T("b2"));
    await sleep(1200, id);
    say("client", T("c3"));
    await sleep(900, id);
    addField(T("fPrazo"), T("vPrazo"));
    await sleep(450, id);
    addField(T("fOrc"), T("vOrc"));
    addTag(T("tagUrg"), "warm");
    addTag(T("tagAi"));
    bump(kpiOpen, money(51500));
    await sleep(1400, id);

    // 3. Marca a reunião: a conversa fecha um horário e o CRM cria a tarefa
    setStep(2);
    await botSays(id, T("b3"));
    await sleep(1100, id);
    say("client", T("c4"));
    await sleep(800, id);
    moveCard("reuniao");
    addTag(T("tagMeet"), "ok");
    toast(T("toastTask"), T("toastTaskTxt"));
    await botSays(id, T("b4"));
    await sleep(1500, id);

    // 4. Equipe assume: o humano entra na mesma conversa, o cartão ganha dono
    setStep(3);
    skip(T("skip"));
    await sleep(1100, id);
    moveCard("proposta");
    card.appendChild(el("div", "crm-owner", "<i></i>" + T("owner")));
    toast(T("toastAt"), T("toastAtTxt"));
    await botSays(id, T("h1"), "human");
    await sleep(1100, id);
    toast(T("toastAuto"), T("toastAutoTxt"));
    await sleep(1500, id);
    say("client", T("c5"));
    await sleep(1200, id);

    // 5. Fecha: ganho, números do funil se atualizam
    setStep(4);
    moveCard("ganho");
    card.classList.add("is-won");
    addTag(T("tagWon"), "ok");
    bump(kpiWon, money(24200));
    bump(kpiOpen, money(33500));
    toast(T("toastWon"), T("toastWonTxt"));
    await botSays(id, T("h2"), "human");
    await sleep(1200, id);
    setStep(5);
    for (var k = 0; k < stepsEl.children.length; k++) stepsEl.children[k].className = "is-done";
  }

  var timer = null;
  var started = false;
  function start() {
    runId += 1;
    var id = runId;
    clearTimeout(timer);
    play(id).then(function () {
      // fim da história: respira e recomeça sozinha, a menos que o usuário tenha reiniciado antes
      if (reduced) return;
      timer = setTimeout(function () { if (id === runId && visibleEnough()) start(); }, 7000);
    }).catch(function (err) { if (!err || err.message !== "cancelado") console.error("[demo]", err); });
  }

  function visibleEnough() {
    var r = root.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var seen = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    return seen > Math.min(r.height, vh) * 0.4;
  }

  reset();
  restartBtn.addEventListener("click", start);

  // trocar o idioma refaz a história na língua nova
  document.addEventListener("evalangchange", function () {
    runId += 1;
    clearTimeout(timer);
    reset();
    if (started) start();
  });

  // só começa quando boa parte da seção está na tela. Dois gatilhos (observador e
  // checagem na rolagem) porque nem todo ambiente entrega o observador na hora.
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
