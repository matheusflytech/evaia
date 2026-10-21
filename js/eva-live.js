/* ===== Eva ao vivo =====
   Conversa de verdade com o agente da Eva (o mesmo do balão) e, ao lado, o que acontece por trás
   de cada mensagem: etapas, sistemas acionados e tempo de resposta (medido de verdade).
   As etapas são derivadas da intenção da mensagem; a resposta vem do agente real. */
(function () {
  "use strict";

  var root = document.getElementById("evaLive");
  if (!root) return;

  var body = document.getElementById("liveBody");
  var form = document.getElementById("liveForm");
  var input = document.getElementById("liveInput");
  var sendBtn = document.getElementById("liveSend");
  var chipsBox = document.getElementById("liveChips");
  var stepsEl = document.getElementById("liveSteps");
  var nodesEl = document.getElementById("liveNodes");
  var mResp = document.getElementById("liveMResp");
  var mIntent = document.getElementById("liveMIntent");
  var mSteps = document.getElementById("liveMSteps");
  var mSys = document.getElementById("liveMSys");

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SESSION_KEY = "eva_live_session";
  var sessionId = null;
  try { sessionId = sessionStorage.getItem(SESSION_KEY); } catch (e) {}
  if (!sessionId) {
    sessionId = "site-live-" + Math.random().toString(36).slice(2);
    try { sessionStorage.setItem(SESSION_KEY, sessionId); } catch (e) {}
  }

  var busy = false;
  var runId = 0;
  var last = 0;

  function lang() { var l = (window.EvaI18n && window.EvaI18n.getLang && window.EvaI18n.getLang()) || "pt"; return l === "en" || l === "es" ? l : "pt"; }
  function pick(o) { return o[lang()] || o.pt; }

  var ICONS = {
    canal: "M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z",
    agente: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z",
    base: "M4 5c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2zM4 5v6c0 1.1 3.6 2 8 2s8-.9 8-2V5M4 11v6c0 1.1 3.6 2 8 2s8-.9 8-2v-6",
    automacao: "M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9",
    infra: "M3 5h18v6H3zM3 13h18v6H3zM7 8h.01M7 16h.01",
    crm: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
    equipe: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8"
  };
  var NODE_NAMES = {
    canal: { pt: "Canal", en: "Channel", es: "Canal" },
    agente: { pt: "Eva AI", en: "Eva AI", es: "Eva AI" },
    base: { pt: "Base de conhecimento", en: "Knowledge base", es: "Base de conocimiento" },
    automacao: { pt: "Automação", en: "Automation", es: "Automatización" },
    infra: { pt: "Infraestrutura", en: "Infrastructure", es: "Infraestructura" },
    crm: { pt: "CRM", en: "CRM", es: "CRM" },
    equipe: { pt: "Equipe", en: "Team", es: "Equipo" }
  };
  var NODE_ORDER = ["canal", "agente", "base", "automacao", "infra", "crm", "equipe"];

  var UI = {
    pt: {
      status: "online agora", name: "Eva", sub: "agente de IA da Eva Holding",
      placeholder: "Escreva sua mensagem", send: "Enviar",
      greeting: "Oi! Eu sou a Eva. Me conta o que a sua empresa precisa e acompanhe, ao lado, o que acontece por trás de cada resposta.",
      barTitle: "Eva por dentro", live: "ao vivo",
      mResp: "Tempo de resposta", mIntent: "Intenção", mSteps: "Etapas", mSys: "Sistemas acionados",
      empty: "Mande uma mensagem ou escolha uma sugestão. As etapas aparecem aqui, em tempo real.",
      error: "Não consegui responder agora. Tente de novo ou fale com a gente pelo WhatsApp.",
      errDetail: "Sem resposta do agente",
      intentWait: "aguardando"
    },
    en: {
      status: "online now", name: "Eva", sub: "Eva Holding's AI agent",
      placeholder: "Type your message", send: "Send",
      greeting: "Hi! I'm Eva. Tell me what your company needs and watch, next to the chat, what happens behind each answer.",
      barTitle: "Eva inside", live: "live",
      mResp: "Response time", mIntent: "Intent", mSteps: "Steps", mSys: "Systems used",
      empty: "Send a message or pick a suggestion. The steps show up here, in real time.",
      error: "I couldn't answer right now. Try again or reach us on WhatsApp.",
      errDetail: "No answer from the agent",
      intentWait: "waiting"
    },
    es: {
      status: "en línea ahora", name: "Eva", sub: "agente de IA de Eva Holding",
      placeholder: "Escribe tu mensaje", send: "Enviar",
      greeting: "¡Hola! Soy Eva. Cuéntame qué necesita tu empresa y mira, al lado, lo que ocurre detrás de cada respuesta.",
      barTitle: "Eva por dentro", live: "en vivo",
      mResp: "Tiempo de respuesta", mIntent: "Intención", mSteps: "Etapas", mSys: "Sistemas activados",
      empty: "Envía un mensaje o elige una sugerencia. Las etapas aparecen aquí, en tiempo real.",
      error: "No pude responder ahora. Inténtalo de nuevo o escríbenos por WhatsApp.",
      errDetail: "Sin respuesta del agente",
      intentWait: "esperando"
    }
  };

  var CHIPS = {
    pt: ["Quero automatizar o atendimento da minha empresa", "Preciso de um site novo", "Como vocês cuidam da infraestrutura?", "Quanto custa um agente de IA?"],
    en: ["I want to automate my company's support", "I need a new website", "How do you handle infrastructure?", "How much does an AI agent cost?"],
    es: ["Quiero automatizar la atención de mi empresa", "Necesito un sitio web nuevo", "¿Cómo manejan la infraestructura?", "¿Cuánto cuesta un agente de IA?"]
  };

  // intenções: palavras (pt, en, es), rótulo, etapa específica e quais sistemas acendem em cada etapa
  var INTENTS = [
    { id: "humano", re: /humano|pessoa|atendente|vendedor|falar com (alguem|algu[eé]m)|human|person|agent\b|representative|persona|alguien/i,
      label: { pt: "Falar com uma pessoa", en: "Talk to a person", es: "Hablar con una persona" },
      step: { t: { pt: "Chamando uma pessoa do time", en: "Calling someone from the team", es: "Llamando a alguien del equipo" }, d: { pt: "Aviso enviado à equipe", en: "Alert sent to the team", es: "Aviso enviado al equipo" } },
      nodes: { 3: [], 5: ["equipe"], 6: ["crm"] }, skipBase: true },
    { id: "preco", re: /pre[cç]o|quanto|custa|valor|or[cç]amento|investimento|price|cost|quote|pricing|precio|cu[aá]nto/i,
      label: { pt: "Orçamento e valores", en: "Quote and pricing", es: "Presupuesto y valores" },
      step: { t: { pt: "Separando dados para a proposta", en: "Gathering data for the proposal", es: "Reuniendo datos para la propuesta" }, d: { pt: "Necessidade, porte e prazo", en: "Need, size and timeline", es: "Necesidad, tamaño y plazo" } },
      nodes: { 5: [], 6: ["crm", "equipe"] } },
    { id: "infra", re: /infra|servidor|cloud|nuvem|deploy|backup|seguran[cç]a|monitor|hosting|server|security|servidores|seguridad/i,
      label: { pt: "Infraestrutura", en: "Infrastructure", es: "Infraestructura" },
      step: { t: { pt: "Avaliando a infraestrutura", en: "Assessing the infrastructure", es: "Evaluando la infraestructura" }, d: { pt: "Servidores, segurança e monitoramento", en: "Servers, security and monitoring", es: "Servidores, seguridad y monitoreo" } },
      nodes: { 5: ["infra"], 6: ["crm", "equipe"] } },
    { id: "automacao", re: /automa|integra|planilha|fluxo|processo|workflow|rpa|spreadsheet|process|hoja de c[aá]lculo|proceso/i,
      label: { pt: "Automação de processos", en: "Process automation", es: "Automatización de procesos" },
      step: { t: { pt: "Mapeando o fluxo a automatizar", en: "Mapping the flow to automate", es: "Mapeando el flujo a automatizar" }, d: { pt: "Gatilho, tarefas e sistemas envolvidos", en: "Trigger, tasks and systems involved", es: "Disparador, tareas y sistemas involucrados" } },
      nodes: { 5: ["automacao"], 6: ["crm", "equipe"] } },
    { id: "ia", re: /agente|\bia\b|intelig[eê]ncia|chatbot|atendimento|whatsapp|assistente|\bbot\b|\bai\b|agent|support|atenci[oó]n|asistente|inteligencia/i,
      label: { pt: "Agente de IA", en: "AI agent", es: "Agente de IA" },
      step: { t: { pt: "Preparando a resposta do agente", en: "Preparing the agent's answer", es: "Preparando la respuesta del agente" }, d: { pt: "Atendimento, canais e integrações", en: "Support, channels and integrations", es: "Atención, canales e integraciones" } },
      nodes: { 5: [], 6: ["crm", "equipe"] } },
    { id: "web", re: /\bsite\b|web|loja|landing|p[aá]gina|plataforma|\bapp\b|website|ecommerce|e-commerce|store|platform|sitio|tienda/i,
      label: { pt: "Site e produto digital", en: "Website and digital product", es: "Sitio y producto digital" },
      step: { t: { pt: "Montando o escopo do produto", en: "Building the product scope", es: "Armando el alcance del producto" }, d: { pt: "Páginas, painel e integrações", en: "Pages, admin panel and integrations", es: "Páginas, panel e integraciones" } },
      nodes: { 5: ["infra"], 6: ["equipe"] } }
  ];
  var GENERAL = {
    id: "geral",
    label: { pt: "Conversa geral", en: "General conversation", es: "Conversación general" },
    step: { t: { pt: "Escolhendo o melhor caminho", en: "Choosing the best path", es: "Eligiendo el mejor camino" }, d: { pt: "Soluções que se encaixam", en: "Solutions that fit", es: "Soluciones que encajan" } },
    nodes: { 5: [], 6: ["crm"] }
  };

  function detect(txt) {
    for (var i = 0; i < INTENTS.length; i++) if (INTENTS[i].re.test(txt)) return INTENTS[i];
    return GENERAL;
  }

  function stepsFor(intent, txt) {
    var l = lang(), n = txt.length;
    var s = [
      { t: { pt: "Mensagem recebida", en: "Message received", es: "Mensaje recibido" }, d: { pt: "Canal: site, " + n + " caracteres", en: "Channel: website, " + n + " characters", es: "Canal: sitio web, " + n + " caracteres" }, nodes: ["canal"] },
      { t: { pt: "Entendendo a intenção", en: "Understanding the intent", es: "Entendiendo la intención" }, d: intent.label, nodes: ["agente"], intent: true }
    ];
    if (!intent.skipBase) s.push({ t: { pt: "Consultando a base de conhecimento", en: "Searching the knowledge base", es: "Consultando la base de conocimiento" }, d: { pt: "Soluções e perguntas frequentes", en: "Solutions and FAQ", es: "Soluciones y preguntas frecuentes" }, nodes: ["base"] });
    s.push({ t: { pt: "Conferindo as regras do negócio", en: "Checking the business rules", es: "Revisando las reglas del negocio" }, d: { pt: "Escopo, tom de voz e limites", en: "Scope, tone of voice and limits", es: "Alcance, tono de voz y límites" }, nodes: [] });
    s.push({ t: intent.step.t, d: intent.step.d, nodes: intent.nodes[5] || [] });
    s.push(intent.id === "humano"
      ? { t: { pt: "Registrando a conversa no CRM", en: "Logging the conversation in the CRM", es: "Registrando la conversación en el CRM" }, d: { pt: "Contato e histórico salvos", en: "Contact and history saved", es: "Contacto e historial guardados" }, nodes: intent.nodes[6] || [] }
      : { t: { pt: "Registrando a conversa no CRM", en: "Logging the conversation in the CRM", es: "Registrando la conversación en el CRM" }, d: { pt: "Contato e histórico salvos", en: "Contact and history saved", es: "Contacto e historial guardados" }, nodes: intent.nodes[6] || [] });
    s.push({ t: { pt: "Gerando a resposta", en: "Writing the answer", es: "Redactando la respuesta" }, d: { pt: "Aguardando o agente", en: "Waiting for the agent", es: "Esperando al agente" }, nodes: [], final: true });
    return s;
  }

  // ---- construção da interface ----
  function svg(path) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '"/></svg>'; }

  function buildNodes() {
    nodesEl.innerHTML = NODE_ORDER.map(function (k) {
      return '<span class="live-node" data-node="' + k + '">' + svg(ICONS[k]) + '<span>' + pick(NODE_NAMES[k]) + "</span></span>";
    }).join("");
  }
  function paintStatic() {
    var u = UI[lang()];
    document.getElementById("liveName").textContent = u.name;
    document.getElementById("liveSubTxt").textContent = u.sub + " · " + u.status;
    document.getElementById("liveBarTitle").textContent = u.barTitle;
    document.getElementById("liveBarLive").textContent = u.live;
    document.getElementById("liveLblResp").textContent = u.mResp;
    document.getElementById("liveLblIntent").textContent = u.mIntent;
    document.getElementById("liveLblSteps").textContent = u.mSteps;
    document.getElementById("liveLblSys").textContent = u.mSys;
    input.placeholder = u.placeholder;
    sendBtn.setAttribute("aria-label", u.send);
    buildNodes();
  }
  function paintChips() {
    chipsBox.innerHTML = "";
    CHIPS[lang()].forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "live-chip"; b.textContent = c;
      b.addEventListener("click", function () { enviar(c); });
      chipsBox.appendChild(b);
    });
  }
  function emptyTrace() {
    var u = UI[lang()];
    stepsEl.innerHTML = '<li class="live-empty">' + '<svg viewBox="0 0 24 24"><path d="' + ICONS.agente + '"/></svg>' + u.empty + "</li>";
    mResp.textContent = "—"; mResp.classList.remove("is-up");
    mIntent.textContent = u.intentWait; mSteps.textContent = "0/0"; mSys.textContent = "0";
  }
  function reset() {
    runId++; busy = false;
    body.innerHTML = "";
    var m = document.createElement("div");
    m.className = "live-msg live-msg--bot";
    m.textContent = UI[lang()].greeting;
    body.appendChild(m);
    paintStatic(); paintChips(); emptyTrace();
    chipsBox.hidden = false;
    setBusy(false);
  }

  function setBusy(v) {
    busy = v;
    input.disabled = v; sendBtn.disabled = v;
    [].slice.call(chipsBox.children).forEach(function (c) { c.disabled = v; });
    if (!v) { try { input.focus({ preventScroll: true }); } catch (e) {} }
  }

  function addMsg(who, html, asText) {
    var m = document.createElement("div");
    m.className = "live-msg live-msg--" + who;
    if (asText) m.textContent = html; else m.innerHTML = html;
    body.appendChild(m);
    if (who === "bot" && m.offsetHeight > body.clientHeight * 0.6) body.scrollTop = Math.max(0, m.offsetTop - 10);
    else body.scrollTop = body.scrollHeight;
    return m;
  }
  function typing() {
    var t = document.createElement("div");
    t.className = "live-typing"; t.innerHTML = "<i></i><i></i><i></i>";
    body.appendChild(t); body.scrollTop = body.scrollHeight;
    return t;
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduced ? Math.min(ms, 60) : ms); }); }

  function renderBot(text) {
    if (window.EvaChatUtil && window.EvaChatUtil.renderMarkdown) return window.EvaChatUtil.renderMarkdown(text);
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>");
  }

  function endpoint() { return (window.EvaChatUtil && window.EvaChatUtil.webhook) || "https://evapp.vercel.app/api/widget/d7a79443-3a8b-40c9-b493-743127938986/message"; }

  async function pedir(payload) {
    var t0 = performance.now();
    var res = await fetch(endpoint(), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ contactId: sessionId, lang: lang() }, payload))
    });
    var data = await res.json();
    return { data: data, ms: performance.now() - t0 };
  }

  // ---- uma rodada completa: mensagem, etapas por trás e resposta ----
  async function enviar(texto) {
    texto = (texto || "").trim().slice(0, 500);
    if (!texto || busy) return;
    if (Date.now() - last < 900) return;
    last = Date.now();
    var id = ++runId;
    setBusy(true);
    chipsBox.hidden = true;
    addMsg("user", texto, true);
    input.value = "";

    var intent = detect(texto);
    var steps = stepsFor(intent, texto);
    var u = UI[lang()];

    stepsEl.innerHTML = steps.map(function (s, i) {
      return '<li class="live-step" data-i="' + i + '"><span class="live-st"></span><div><b>' + pick(s.t) + "</b><small>" + pick(s.d) + "</small></div></li>";
    }).join("");
    [].slice.call(nodesEl.children).forEach(function (n) { n.classList.remove("is-on", "is-done"); });
    var acesos = {};
    mResp.textContent = "…"; mResp.classList.remove("is-up");
    mIntent.textContent = pick(intent.label); mSteps.textContent = "0/" + steps.length; mSys.textContent = "0";

    var tTyping = typing();
    var promessa = pedir({ text: texto }).then(function (r) { return { ok: true, r: r }; }, function (e) { return { ok: false, e: e }; });

    function marca(i, estado) {
      var li = stepsEl.children[i]; if (!li) return;
      li.classList.remove("is-run", "is-done", "is-error"); li.classList.add(estado);
    }
    function acende(lista, estado) {
      (lista || []).forEach(function (k) {
        var el = nodesEl.querySelector('[data-node="' + k + '"]'); if (!el) return;
        el.classList.remove("is-on", "is-done"); el.classList.add(estado);
        if (estado === "is-done") acesos[k] = true;
      });
      var sistemas = Object.keys(acesos).filter(function (k) { return k !== "canal" && k !== "agente"; }).length;
      mSys.textContent = String(sistemas);
    }

    // etapas "ensaiadas" andam enquanto a resposta real chega
    for (var i = 0; i < steps.length - 1; i++) {
      if (id !== runId) return;
      marca(i, "is-run"); acende(steps[i].nodes, "is-on");
      await sleep(i === 0 ? 380 : 520);
      if (id !== runId) return;
      marca(i, "is-done"); acende(steps[i].nodes, "is-done");
      mSteps.textContent = (i + 1) + "/" + steps.length;
    }
    var ultimo = steps.length - 1;
    marca(ultimo, "is-run");

    var resultado = await promessa;
    if (id !== runId) return;
    tTyping.remove();

    if (!resultado.ok || !resultado.r.data || !(resultado.r.data.messages || []).length) {
      marca(ultimo, "is-error");
      stepsEl.children[ultimo].querySelector("small").textContent = u.errDetail;
      mResp.textContent = "—";
      addMsg("bot", u.error, true);
      setBusy(false);
      return;
    }

    var seg = resultado.r.ms / 1000;
    marca(ultimo, "is-done");
    mSteps.textContent = steps.length + "/" + steps.length;
    var tempo = seg.toFixed(1).replace(".", lang() === "en" ? "." : ",") + " s";
    stepsEl.children[ultimo].querySelector("small").textContent = tempo;
    mResp.textContent = tempo; mResp.classList.add("is-up");

    var msgs = resultado.r.data.messages;
    for (var k = 0; k < msgs.length; k++) {
      if (id !== runId) return;
      if (k > 0) { var t2 = typing(); await sleep(650); t2.remove(); }
      var el = addMsg("bot", renderBot(msgs[k].text || ""));
      if (msgs[k].options && msgs[k].options.length) {
        var wrap = document.createElement("div"); wrap.className = "live-chips"; wrap.style.padding = "4px 0 0";
        msgs[k].options.forEach(function (op) {
          var b = document.createElement("button");
          b.type = "button"; b.className = "live-chip"; b.textContent = op.label;
          b.addEventListener("click", function () { wrap.remove(); enviarOpcao(op); });
          wrap.appendChild(b);
        });
        el.appendChild(wrap);
      }
    }
    setBusy(false);
  }

  async function enviarOpcao(op) {
    if (busy) return;
    setBusy(true);
    addMsg("user", op.label, true);
    var t = typing();
    try {
      var r = await pedir({ optionId: op.id });
      t.remove();
      (r.data.messages || []).forEach(function (m) { addMsg("bot", renderBot(m.text || "")); });
    } catch (e) { t.remove(); addMsg("bot", UI[lang()].error, true); }
    setBusy(false);
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); enviar(input.value); });
  document.addEventListener("evalangchange", reset);
  reset();
})();
