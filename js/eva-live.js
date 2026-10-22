/* ===== Eva ao vivo =====
   Conversa de verdade com o agente da Eva (o mesmo do balão), por texto ou por áudio, e, ao lado,
   o que acontece por trás de cada mensagem: etapas, sistemas acionados e tempo de resposta (medido
   de verdade). As etapas são derivadas da intenção; a resposta e a transcrição vêm do agente real. */
(function () {
  "use strict";

  var root = document.getElementById("evaLive");
  if (!root) return;

  var body = document.getElementById("liveBody");
  var form = document.getElementById("liveForm");
  var input = document.getElementById("liveInput");
  var sendBtn = document.getElementById("liveSend");
  var micBtn = document.getElementById("liveMic");
  var recBar = document.getElementById("liveRec");
  var recTime = document.getElementById("liveRecTime");
  var recCancel = document.getElementById("liveRecCancel");
  var hp = document.getElementById("liveHp");
  var attachBtn = document.getElementById("liveAttach");
  var fileInput = document.getElementById("liveFile");
  var pendBox = document.getElementById("livePend");
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
  var acesos = {};
  var MAX_REC_MS = 60000;
  // tetos por visita: protegem o agente contra abuso (o servidor tem os seus próprios limites)
  var MAX_MSGS = 25, MAX_AUDIOS = 5, MAX_ANEXOS = 4, enviadas = 0, audios = 0, anexos = 0;
  var MAX_DOC_BYTES = 3 * 1024 * 1024, MAX_IMG_ORIGINAL = 15 * 1024 * 1024, ALVO_IMG_BYTES = 1.4 * 1024 * 1024;
  var pendente = null; // arquivo escolhido, esperando o envio

  function lang() { var l = (window.EvaI18n && window.EvaI18n.getLang && window.EvaI18n.getLang()) || "pt"; return l === "en" || l === "es" ? l : "pt"; }
  function pick(o) { return o[lang()] || o.pt; }

  var ICONS = {
    canal: "M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z",
    agente: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z",
    base: "M4 5c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2zM4 5v6c0 1.1 3.6 2 8 2s8-.9 8-2V5M4 11v6c0 1.1 3.6 2 8 2s8-.9 8-2v-6",
    automacao: "M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9",
    infra: "M3 5h18v6H3zM3 13h18v6H3zM7 8h.01M7 16h.01",
    crm: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
    equipe: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
    arquivo: "M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h6",
    clipe: "M21 11.5l-8.6 8.6a5 5 0 01-7.1-7.1l8.6-8.6a3.4 3.4 0 014.8 4.8l-8.6 8.6a1.7 1.7 0 01-2.4-2.4l7.9-7.9"
  };
  var NODE_NAMES = {
    canal: { pt: "Canal", en: "Channel", es: "Canal" },
    agente: { pt: "Eva AI", en: "Eva AI", es: "Eva AI" },
    base: { pt: "Base de conhecimento", en: "Knowledge base", es: "Base de conocimiento" },
    automacao: { pt: "Automação", en: "Automation", es: "Automatización" },
    infra: { pt: "Infraestrutura", en: "Infrastructure", es: "Infraestructura" },
    crm: { pt: "CRM", en: "CRM", es: "CRM" },
    equipe: { pt: "Equipe", en: "Team", es: "Equipo" },
    arquivo: { pt: "Leitura de arquivos", en: "File reading", es: "Lectura de archivos" }
  };
  var NODE_ORDER = ["canal", "agente", "arquivo", "base", "automacao", "infra", "crm", "equipe"];

  var UI = {
    pt: {
      status: "online agora", name: "Eva", sub: "agente de IA da Eva Holding",
      nudge: "Sua vez: escreva aqui", askPh: "Pergunte algo sobre a Eva", heroRec: "Gravando", askS: ["Quanto custa um agente de IA?", "Quero automatizar o atendimento da empresa", "Como vocês cuidam da infraestrutura?"], askBtn: "Enviar", placeholder: "Escreva sua mensagem", send: "Enviar", mic: "Gravar áudio", cancel: "Cancelar gravação", stopSend: "Enviar áudio",
      recording: "Gravando", voice: "Mensagem de voz", youSaid: "Você disse",
      greeting: "Oi! Eu sou a Eva. Me conta o que a sua empresa precisa, por texto ou por áudio, e acompanhe, ao lado, o que acontece por trás de cada resposta.",
      barTitle: "Eva por dentro", live: "ao vivo",
      mResp: "Tempo de resposta", mIntent: "Intenção", mSteps: "Etapas", mSys: "Sistemas acionados",
      empty: "Mande uma mensagem, grave um áudio ou escolha uma sugestão. As etapas aparecem aqui, em tempo real.",
      error: "Não consegui responder agora. Tente de novo ou fale com a gente pelo WhatsApp.",
      micError: "Não consegui acessar o microfone. Libere a permissão do navegador ou escreva sua mensagem.",
      errDetail: "Sem resposta do agente", intentWait: "aguardando",
      limit: "Chegamos ao limite desta demonstração. Para continuar, fale direto com a nossa equipe no WhatsApp.",
      attach: "Anexar imagem ou documento", removeAttach: "Remover anexo", file: "Arquivo", caption: "Legenda (opcional)",
      tooBig: "Esse arquivo passa de 3 MB. Pode mandar um menor?", badType: "Eu leio imagens, PDF, Word (.docx), texto e CSV. Esse formato não dá. Pode mandar em outro?", imgFail: "Não consegui preparar essa imagem. Tente outra ou outro formato (JPG ou PNG).",
      attachHint: "Descreva ou pergunte algo sobre o arquivo (opcional)"
    },
    en: {
      status: "online now", name: "Eva", sub: "Eva Holding's AI agent",
      nudge: "Your turn: type here", askPh: "Ask Eva anything", heroRec: "Recording", askS: ["How much does an AI agent cost?", "I want to automate our customer support", "How do you handle infrastructure?"], askBtn: "Send", placeholder: "Type your message", send: "Send", mic: "Record audio", cancel: "Cancel recording", stopSend: "Send audio",
      recording: "Recording", voice: "Voice message", youSaid: "You said",
      greeting: "Hi! I'm Eva. Tell me what your company needs, by text or by voice, and watch, next to the chat, what happens behind each answer.",
      barTitle: "Eva inside", live: "live",
      mResp: "Response time", mIntent: "Intent", mSteps: "Steps", mSys: "Systems used",
      empty: "Send a message, record audio or pick a suggestion. The steps show up here, in real time.",
      error: "I couldn't answer right now. Try again or reach us on WhatsApp.",
      micError: "I couldn't access the microphone. Allow it in your browser or type your message.",
      errDetail: "No answer from the agent", intentWait: "waiting",
      limit: "We've reached this demo's limit. To keep going, talk to our team directly on WhatsApp.",
      attach: "Attach an image or document", removeAttach: "Remove attachment", file: "File", caption: "Caption (optional)",
      tooBig: "That file is over 3 MB. Could you send a smaller one?", badType: "I can read images, PDF, Word (.docx), text and CSV. That format won't work. Could you send another?", imgFail: "I couldn't prepare that image. Try another one or a different format (JPG or PNG).",
      attachHint: "Describe or ask something about the file (optional)"
    },
    es: {
      status: "en línea ahora", name: "Eva", sub: "agente de IA de Eva Holding",
      nudge: "Tu turno: escribe aquí", askPh: "Pregunta algo sobre Eva", heroRec: "Grabando", askS: ["¿Cuánto cuesta un agente de IA?", "Quiero automatizar la atención de la empresa", "¿Cómo cuidan la infraestructura?"], askBtn: "Enviar", placeholder: "Escribe tu mensaje", send: "Enviar", mic: "Grabar audio", cancel: "Cancelar grabación", stopSend: "Enviar audio",
      recording: "Grabando", voice: "Mensaje de voz", youSaid: "Dijiste",
      greeting: "¡Hola! Soy Eva. Cuéntame qué necesita tu empresa, por texto o por audio, y mira, al lado, lo que ocurre detrás de cada respuesta.",
      barTitle: "Eva por dentro", live: "en vivo",
      mResp: "Tiempo de respuesta", mIntent: "Intención", mSteps: "Etapas", mSys: "Sistemas activados",
      empty: "Envía un mensaje, graba un audio o elige una sugerencia. Las etapas aparecen aquí, en tiempo real.",
      error: "No pude responder ahora. Inténtalo de nuevo o escríbenos por WhatsApp.",
      micError: "No pude acceder al micrófono. Permítelo en el navegador o escribe tu mensaje.",
      errDetail: "Sin respuesta del agente", intentWait: "esperando",
      limit: "Llegamos al límite de esta demostración. Para continuar, habla directamente con nuestro equipo por WhatsApp.",
      attach: "Adjuntar imagen o documento", removeAttach: "Quitar adjunto", file: "Archivo", caption: "Leyenda (opcional)",
      tooBig: "Ese archivo supera los 3 MB. ¿Puedes enviar uno más pequeño?", badType: "Leo imágenes, PDF, Word (.docx), texto y CSV. Ese formato no funciona. ¿Puedes enviar otro?", imgFail: "No pude preparar esa imagen. Prueba con otra o con otro formato (JPG o PNG).",
      attachHint: "Describe o pregunta algo sobre el archivo (opcional)"
    }
  };

  var CHIPS = {
    pt: ["Quero automatizar o atendimento da minha empresa", "Como a Eva se integra ao meu CRM?", "Como vocês cuidam da infraestrutura?", "Quanto custa um agente de IA?"],
    en: ["I want to automate my company's support", "How does Eva connect to my CRM?", "How do you handle infrastructure?", "How much does an AI agent cost?"],
    es: ["Quiero automatizar la atención de mi empresa", "¿Cómo se integra Eva con mi CRM?", "¿Cómo manejan la infraestructura?", "¿Cuánto cuesta un agente de IA?"]
  };

  // intenções: palavras (pt, en, es), rótulo, etapa específica e quais sistemas acendem em cada etapa
  var INTENTS = [
    { id: "humano", re: /humano|pessoa|atendente|vendedor|falar com (alguem|algu[eé]m)|human|person|agent\b|representative|persona|alguien/i,
      label: { pt: "Falar com uma pessoa", en: "Talk to a person", es: "Hablar con una persona" },
      step: { t: { pt: "Chamando uma pessoa do time", en: "Calling someone from the team", es: "Llamando a alguien del equipo" }, d: { pt: "Aviso enviado à equipe", en: "Alert sent to the team", es: "Aviso enviado al equipo" } },
      nodes: { 5: ["equipe"], 6: ["crm"] }, skipBase: true },
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

  ];
  var ANEXO = {
    id: "anexo",
    label: { pt: "Análise de arquivo", en: "File analysis", es: "Análisis de archivo" },
    step: { t: { pt: "Interpretando o conteúdo do arquivo", en: "Interpreting the file's content", es: "Interpretando el contenido del archivo" }, d: { pt: "Cruzando o que foi lido com o seu contexto", en: "Matching what was read with your context", es: "Cruzando lo leído con tu contexto" } },
    nodes: { 5: [], 6: ["crm", "equipe"] }
  };
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

  var CRM_STEP = { t: { pt: "Registrando a conversa no CRM", en: "Logging the conversation in the CRM", es: "Registrando la conversación en el CRM" }, d: { pt: "Contato e histórico salvos", en: "Contact and history saved", es: "Contacto e historial guardados" } };
  var REPLY_STEP = { t: { pt: "Gerando a resposta", en: "Writing the answer", es: "Redactando la respuesta" }, d: { pt: "Aguardando o agente", en: "Waiting for the agent", es: "Esperando al agente" } };

  // etapas depois que o texto é conhecido (digitado ou transcrito); `semEntrada` omite a etapa "Mensagem recebida"
  function stepsFor(intent, txt, semEntrada) {
    var n = txt.length, s = [];
    if (!semEntrada) s.push({ t: { pt: "Mensagem recebida", en: "Message received", es: "Mensaje recibido" }, d: { pt: "Canal: site, " + n + " caracteres", en: "Channel: website, " + n + " characters", es: "Canal: sitio web, " + n + " caracteres" }, nodes: ["canal"] });
    s.push({ t: { pt: "Entendendo a intenção", en: "Understanding the intent", es: "Entendiendo la intención" }, d: intent.label, nodes: ["agente"] });
    if (!intent.skipBase) s.push({ t: { pt: "Consultando a base de conhecimento", en: "Searching the knowledge base", es: "Consultando la base de conocimiento" }, d: { pt: "Soluções e perguntas frequentes", en: "Solutions and FAQ", es: "Soluciones y preguntas frecuentes" }, nodes: ["base"] });
    s.push({ t: { pt: "Conferindo as regras do negócio", en: "Checking the business rules", es: "Revisando las reglas del negocio" }, d: { pt: "Escopo, tom de voz e limites", en: "Scope, tone of voice and limits", es: "Alcance, tono de voz y límites" }, nodes: [] });
    s.push({ t: intent.step.t, d: intent.step.d, nodes: intent.nodes[5] || [] });
    s.push({ t: CRM_STEP.t, d: CRM_STEP.d, nodes: intent.nodes[6] || [] });
    s.push({ t: REPLY_STEP.t, d: REPLY_STEP.d, nodes: [], final: true });
    return s;
  }

  // ---- interface ----
  function svg(path) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '"/></svg>'; }

  function buildNodes() {
    nodesEl.innerHTML = NODE_ORDER.map(function (k) {
      return '<span class="live-node" data-node="' + k + '">' + svg(ICONS[k]) + "<span>" + pick(NODE_NAMES[k]) + "</span></span>";
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
    document.getElementById("liveRecLbl").textContent = u.recording;
    input.placeholder = u.placeholder;
    if (hint) hint.querySelector("span").textContent = u.nudge;
    var askIn = document.getElementById("heroAskInput"), askBtn = document.getElementById("heroAskBtn");
    if (askIn) askIn.placeholder = u.askPh;
    if (askBtn) askBtn.querySelector("span").textContent = u.askBtn;
    var hMic = document.getElementById("heroAskMic"), hCan = document.getElementById("heroAskCancel"), hLbl = document.getElementById("heroRecLbl");
    if (hMic) hMic.setAttribute("aria-label", u.mic);
    if (hCan) hCan.setAttribute("aria-label", u.cancel);
    if (hLbl) hLbl.textContent = u.heroRec;
    var askSug = document.getElementById("heroAskSug");
    if (askSug) {
      askSug.innerHTML = "";
      u.askS.forEach(function (t) {
        var b = document.createElement("button"); b.type = "button"; b.textContent = t;
        b.addEventListener("click", function () { askIn.value = t; document.getElementById("heroAsk").requestSubmit(); });
        askSug.appendChild(b);
      });
    }
    sendBtn.setAttribute("aria-label", u.send);
    if (micBtn) micBtn.setAttribute("aria-label", u.mic);
    if (attachBtn) attachBtn.setAttribute("aria-label", u.attach);
    if (recCancel) recCancel.setAttribute("aria-label", u.cancel);
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
    stepsEl.innerHTML = '<li class="live-empty">' + svg(ICONS.agente) + u.empty + "</li>";
    mResp.textContent = "—"; mResp.classList.remove("is-up");
    mIntent.textContent = u.intentWait; mSteps.textContent = "0/0"; mSys.textContent = "0";
    acesos = {};
  }
  function reset() {
    cancelaGravacao();
    if (pendente) limpaPendente();
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
    if (micBtn) micBtn.disabled = v;
    if (attachBtn) attachBtn.disabled = v;
    [].slice.call(chipsBox.children).forEach(function (c) { c.disabled = v; });
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

  function limpa(text) { return window.EvaChatUtil && window.EvaChatUtil.limpa ? window.EvaChatUtil.limpa(text) : text; }
  function renderBot(text) {
    text = limpa(text);
    if (window.EvaChatUtil && window.EvaChatUtil.renderMarkdown) return window.EvaChatUtil.renderMarkdown(text);
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>");
  }
  function endpoint() { return (window.EvaChatUtil && window.EvaChatUtil.webhook) || "https://evapp.vercel.app/api/widget/d7a79443-3a8b-40c9-b493-743127938986/message"; }

  async function pedir(payload) {
    var t0 = performance.now();
    var res = await fetch(endpoint(), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ contactId: sessionId, lang: lang(), hp: hp ? hp.value : "" }, payload))
    });
    var data = await res.json();
    return { data: data, ms: performance.now() - t0 };
  }

  // ---- linha do tempo e sistemas ----
  function renderSteps(steps) {
    stepsEl.innerHTML = steps.map(function (s, i) {
      return '<li class="live-step" data-i="' + i + '"><span class="live-st"></span><div><b>' + pick(s.t) + "</b><small>" + pick(s.d) + "</small></div></li>";
    }).join("");
  }
  function addSteps(steps, from) {
    steps.forEach(function (s, k) {
      var li = document.createElement("li");
      li.className = "live-step"; li.setAttribute("data-i", String(from + k));
      li.innerHTML = '<span class="live-st"></span><div><b>' + pick(s.t) + "</b><small>" + pick(s.d) + "</small></div>";
      stepsEl.appendChild(li);
    });
  }
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
    mSys.textContent = String(Object.keys(acesos).filter(function (k) { return k !== "canal" && k !== "agente"; }).length);
  }
  function limpaNodes() { acesos = {}; [].slice.call(nodesEl.children).forEach(function (n) { n.classList.remove("is-on", "is-done"); }); }

  // anda pelas etapas de `de` até antes da última (a última espera a resposta real)
  async function andar(steps, de, ate, id, ritmo) {
    for (var i = de; i < ate; i++) {
      if (id !== runId) return false;
      marca(i, "is-run"); acende(steps[i].nodes, "is-on");
      await sleep(ritmo);
      if (id !== runId) return false;
      marca(i, "is-done"); acende(steps[i].nodes, "is-done");
      mSteps.textContent = (i + 1) + "/" + stepsEl.children.length;
    }
    return true;
  }

  function fmtTempo(ms) { return (ms / 1000).toFixed(1).replace(".", lang() === "en" ? "." : ",") + " s"; }

  function falha(u, ultimo) {
    if (stepsEl.children[ultimo]) { marca(ultimo, "is-error"); stepsEl.children[ultimo].querySelector("small").textContent = u.errDetail; }
    mResp.textContent = "—";
    addMsg("bot", u.error, true);
    setBusy(false);
  }

  async function entregar(resultado, id, steps, ultimo) {
    marca(ultimo, "is-done");
    mSteps.textContent = steps.length + "/" + steps.length;
    var tempo = fmtTempo(resultado.r.ms);
    stepsEl.children[ultimo].querySelector("small").textContent = tempo;
    mResp.textContent = tempo; mResp.classList.add("is-up");
    var msgs = resultado.r.data.messages;
    for (var k = 0; k < msgs.length; k++) {
      if (id !== runId) return;
      var html = renderBot(msgs[k].text || "");
      if (!html.replace(/<[^>]*>/g, "").trim()) continue;
      if (k > 0) { var t2 = typing(); await sleep(650); t2.remove(); }
      var el = addMsg("bot", html);
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

  // ---- mensagem de texto ----
  async function enviar(texto) {
    texto = (texto || "").trim().slice(0, 500);
    if (!texto || busy) return;
    if (Date.now() - last < 900) return;
    last = Date.now();
    if (enviadas >= MAX_MSGS) { addMsg("bot", UI[lang()].limit, true); return; }
    enviadas++;
    var id = ++runId;
    setBusy(true);
    chipsBox.hidden = true;
    addMsg("user", texto, true);
    input.value = "";

    var intent = detect(texto);
    var steps = stepsFor(intent, texto, false);
    var u = UI[lang()];
    renderSteps(steps); limpaNodes();
    mResp.textContent = "…"; mResp.classList.remove("is-up");
    mIntent.textContent = pick(intent.label); mSteps.textContent = "0/" + steps.length; mSys.textContent = "0";

    var tTyping = typing();
    var promessa = pedir({ text: texto }).then(function (r) { return { ok: true, r: r }; }, function (e) { return { ok: false, e: e }; });

    if (!(await andar(steps, 0, steps.length - 1, id, 520))) return;
    var ultimo = steps.length - 1;
    marca(ultimo, "is-run");
    var resultado = await promessa;
    if (id !== runId) return;
    tTyping.remove();
    if (!resultado.ok || !resultado.r.data || !(resultado.r.data.messages || []).length) return falha(u, ultimo);
    await entregar(resultado, id, steps, ultimo);
  }

  // ---- mensagem de voz ----
  var mr = null, chunks = [], recStart = 0, recTimer = null, recStream = null, recCancelFlag = false, recSending = false;

  function fmtDur(ms) { var s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }

  function mostraGravacao(on) {
    form.classList.toggle("is-recording", on);
    recBar.hidden = !on;
    input.hidden = on;
    if (micBtn) micBtn.hidden = on;
    if (attachBtn) attachBtn.hidden = on;
    if (on && pendente) limpaPendente();
    if (recCancel) recCancel.hidden = !on;
  }

  async function iniciaGravacao() {
    if (busy || mr) return;
    var u = UI[lang()];
    try {
      recStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) { addMsg("bot", u.micError, true); return; }
    try { mr = new MediaRecorder(recStream); } catch (e) { recStream.getTracks().forEach(function (t) { t.stop(); }); addMsg("bot", u.micError, true); return; }
    chunks = []; recCancelFlag = false; recSending = false;
    mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = function () {
      if (recStream) recStream.getTracks().forEach(function (t) { t.stop(); });
      var dur = Date.now() - recStart, tipo = (mr && mr.mimeType) || "audio/webm";
      var cancelado = recCancelFlag;
      mr = null; recStream = null;
      if (cancelado || !chunks.length) return;
      enviarAudio(new Blob(chunks, { type: tipo }), dur);
    };
    mr.start();
    recStart = Date.now();
    mostraGravacao(true);
    recTime.textContent = "0:00";
    recTimer = setInterval(function () {
      var d = Date.now() - recStart;
      recTime.textContent = fmtDur(d);
      if (d >= MAX_REC_MS) paraGravacao(true);
    }, 200);
  }
  function paraGravacao(enviarAgora) {
    if (!mr) return;
    clearInterval(recTimer); recTimer = null;
    recCancelFlag = !enviarAgora;
    mostraGravacao(false);
    try { mr.stop(); } catch (e) {}
  }
  function cancelaGravacao() { if (mr) paraGravacao(false); }

  function blobParaBase64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onloadend = function () { resolve(String(r.result).split(",")[1] || ""); };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  async function enviarAudio(blob, dur) {
    if (busy) return;
    if (enviadas >= MAX_MSGS || audios >= MAX_AUDIOS) { addMsg("bot", UI[lang()].limit, true); return; }
    enviadas++; audios++;
    var id = ++runId;
    setBusy(true);
    chipsBox.hidden = true;
    var u = UI[lang()];
    var kb = Math.max(1, Math.round(blob.size / 1024));
    var bolha = addMsg("user", "", true);
    bolha.innerHTML = '<span class="live-voice">' + svg(ICONS_MIC) + "<span>" + u.voice + " · " + fmtDur(dur) + "</span></span>";

    var inicio = [
      { t: { pt: "Áudio recebido", en: "Audio received", es: "Audio recibido" }, d: { pt: "Canal: site, " + fmtDur(dur) + " (" + kb + " KB)", en: "Channel: website, " + fmtDur(dur) + " (" + kb + " KB)", es: "Canal: sitio web, " + fmtDur(dur) + " (" + kb + " KB)" }, nodes: ["canal"] },
      { t: { pt: "Transcrevendo a fala", en: "Transcribing the speech", es: "Transcribiendo el habla" }, d: { pt: "Convertendo voz em texto", en: "Turning voice into text", es: "Convirtiendo voz en texto" }, nodes: [] }
    ];
    renderSteps(inicio); limpaNodes();
    mResp.textContent = "…"; mResp.classList.remove("is-up");
    mIntent.textContent = u.intentWait; mSteps.textContent = "0/2"; mSys.textContent = "0";

    var tTyping = typing();
    var base64 = "";
    try { base64 = await blobParaBase64(blob); } catch (e) { tTyping.remove(); return falha(u, 0); }
    var promessa = pedir({ audio_base64: base64, audio_mime: blob.type || "audio/webm" }).then(function (r) { return { ok: true, r: r }; }, function (e) { return { ok: false, e: e }; });

    if (!(await andar(inicio, 0, 1, id, 450))) return;
    marca(1, "is-run");
    var resultado = await promessa;
    if (id !== runId) return;
    tTyping.remove();
    if (!resultado.ok || !resultado.r.data || !(resultado.r.data.messages || []).length) return falha(u, 1);

    var transcricao = (resultado.r.data.transcricao || "").trim();
    if (!transcricao) {
      // o servidor não conseguiu transcrever e devolveu um aviso: mostra o aviso
      marca(1, "is-error");
      stepsEl.children[1].querySelector("small").textContent = u.errDetail;
      mResp.textContent = fmtTempo(resultado.r.ms);
      resultado.r.data.messages.forEach(function (m) { var h = renderBot(m.text || ""); if (h.replace(/<[^>]*>/g, "").trim()) addMsg("bot", h); });
      setBusy(false);
      return;
    }

    // a fala vira texto: mostra a transcrição e segue com as etapas do assunto
    marca(1, "is-done");
    var curta = transcricao.length > 70 ? transcricao.slice(0, 67) + "…" : transcricao;
    stepsEl.children[1].querySelector("small").textContent = "“" + curta + "”";
    var tr = document.createElement("span"); tr.className = "live-transcript";
    tr.textContent = u.youSaid + ": “" + transcricao + "”";
    bolha.appendChild(tr);
    body.scrollTop = body.scrollHeight;

    var intent = detect(transcricao);
    var resto = stepsFor(intent, transcricao, true);
    addSteps(resto, 2);
    var todas = inicio.concat(resto);
    mIntent.textContent = pick(intent.label);
    mSteps.textContent = "2/" + todas.length;
    if (!(await andar(todas, 2, todas.length - 1, id, 360))) return;
    var ultimo = todas.length - 1;
    marca(ultimo, "is-run");
    await entregar(resultado, id, todas, ultimo);
  }
  var ICONS_MIC = "M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM19 11a7 7 0 01-14 0M12 18v3";

  // ---- anexos: imagem, PDF, Word, texto e CSV ----
  var EXT_MIME = { pdf: "application/pdf", txt: "text/plain", csv: "text/csv", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
  var LEGIVEIS = { "application/pdf": 1, "text/plain": 1, "text/csv": 1, "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 1 };
  function mimeDe(file) {
    if (file.type) return file.type;
    var ext = (file.name.split(".").pop() || "").toLowerCase();
    return EXT_MIME[ext] || "";
  }
  function fmtTam(b) { return b >= 1048576 ? (b / 1048576).toFixed(1).replace(".", lang() === "en" ? "." : ",") + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }

  // foto de celular pesa vários MB: reduz no navegador (1600 px, JPEG) antes de enviar. Mais rápido, mais barato e dentro do limite do servidor.
  async function prepararImagem(file) {
    var bmp = await createImageBitmap(file);
    var lado = 1600;
    for (var tentativa = 0; tentativa < 4; tentativa++) {
      var esc = Math.min(1, lado / Math.max(bmp.width, bmp.height));
      var c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(bmp.width * esc)); c.height = Math.max(1, Math.round(bmp.height * esc));
      var g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(bmp, 0, 0, c.width, c.height);
      var qualidade = [0.82, 0.74, 0.66, 0.58][tentativa];
      var blob = await new Promise(function (r) { c.toBlob(r, "image/jpeg", qualidade); });
      if (blob && blob.size <= ALVO_IMG_BYTES) { if (bmp.close) bmp.close(); return blob; }
      lado = Math.round(lado * 0.8);
    }
    if (bmp.close) bmp.close();
    return blob;
  }

  function limpaPendente() {
    if (pendente && pendente.thumb) URL.revokeObjectURL(pendente.thumb);
    pendente = null; fileInput.value = "";
    pendBox.hidden = true; pendBox.innerHTML = "";
    input.placeholder = UI[lang()].placeholder;
  }
  function mostraPendente() {
    var u = UI[lang()];
    pendBox.hidden = false;
    var visual = pendente.thumb ? '<img src="' + pendente.thumb + '" alt="">' : '<span class="live-pend-ic">' + svg(ICONS.arquivo) + "</span>";
    pendBox.innerHTML = visual + '<span class="live-pend-tx"><b></b><small></small></span><button type="button" class="live-pend-x" aria-label="' + u.removeAttach + '">' + svg("M6 6l12 12M18 6L6 18") + "</button>";
    pendBox.querySelector("b").textContent = pendente.nome;
    pendBox.querySelector("small").textContent = fmtTam(pendente.bytes);
    pendBox.querySelector(".live-pend-x").addEventListener("click", limpaPendente);
    input.placeholder = u.attachHint;
    try { input.focus({ preventScroll: true }); } catch (e) {}
  }

  async function escolheuArquivo() {
    var file = fileInput.files && fileInput.files[0];
    if (!file || busy) return;
    var u = UI[lang()];
    var mime = mimeDe(file);
    var ehImagem = mime.indexOf("image/") === 0;
    if (!ehImagem && !LEGIVEIS[mime]) { addMsg("bot", u.badType, true); fileInput.value = ""; return; }
    if (!ehImagem && file.size > MAX_DOC_BYTES) { addMsg("bot", u.tooBig, true); fileInput.value = ""; return; }
    if (ehImagem && file.size > MAX_IMG_ORIGINAL) { addMsg("bot", u.tooBig, true); fileInput.value = ""; return; }
    limpaPendente();
    var blob = file, mimeFinal = mime, nome = file.name;
    if (ehImagem) {
      try {
        blob = await prepararImagem(file); mimeFinal = "image/jpeg";
        if (!blob) throw new Error("vazio");
      } catch (e) {
        // formato que o navegador não abre (ex.: HEIC fora do Safari): só segue se couber no limite
        if (file.size > MAX_DOC_BYTES) { addMsg("bot", u.imgFail, true); fileInput.value = ""; return; }
        blob = file; mimeFinal = mime;
      }
    }
    pendente = { blob: blob, mime: mimeFinal, nome: nome, bytes: blob.size, imagem: ehImagem, thumb: ehImagem ? URL.createObjectURL(blob) : null };
    mostraPendente();
  }

  async function enviarAnexo(legenda) {
    if (busy || !pendente) return;
    var u = UI[lang()];
    if (enviadas >= MAX_MSGS || anexos >= MAX_ANEXOS) { addMsg("bot", u.limit, true); return; }
    enviadas++; anexos++;
    var arq = pendente; pendente = null;
    pendBox.hidden = true; pendBox.innerHTML = ""; fileInput.value = ""; input.placeholder = u.placeholder;
    var id = ++runId;
    setBusy(true);
    chipsBox.hidden = true;
    legenda = (legenda || "").trim().slice(0, 500);
    input.value = "";

    // bolha do cliente: miniatura da imagem ou ficha do documento, mais a legenda
    var bolha = addMsg("user", "", true);
    var visual = arq.imagem ? '<img class="live-thumb" src="' + arq.thumb + '" alt="">' : '<span class="live-doc">' + svg(ICONS.arquivo) + "<span></span></span>";
    bolha.innerHTML = visual + '<span class="live-fname"></span>' + (legenda ? '<span class="live-cap"></span>' : "");
    bolha.querySelector(".live-fname").textContent = arq.nome + " · " + fmtTam(arq.bytes);
    if (legenda) bolha.querySelector(".live-cap").textContent = legenda;
    if (!arq.imagem) bolha.querySelector(".live-doc span").textContent = u.file;
    body.scrollTop = body.scrollHeight;

    var intent = legenda ? detect(legenda) : ANEXO;
    if (legenda && intent === GENERAL) intent = ANEXO;
    var leitura = arq.imagem
      ? { t: { pt: "Lendo a imagem", en: "Reading the image", es: "Leyendo la imagen" }, d: { pt: "Visão computacional: descreve a cena e lê o texto que aparece", en: "Computer vision: describes the scene and reads visible text", es: "Visión por computadora: describe la escena y lee el texto visible" }, nodes: ["arquivo"] }
      : { t: { pt: "Extraindo o texto do documento", en: "Extracting the document's text", es: "Extrayendo el texto del documento" }, d: { pt: "PDF, Word, texto ou CSV", en: "PDF, Word, text or CSV", es: "PDF, Word, texto o CSV" }, nodes: ["arquivo"] };
    var recebido = { t: { pt: "Arquivo recebido", en: "File received", es: "Archivo recibido" }, d: { pt: "Canal: site, " + arq.nome + " (" + fmtTam(arq.bytes) + ")", en: "Channel: website, " + arq.nome + " (" + fmtTam(arq.bytes) + ")", es: "Canal: sitio web, " + arq.nome + " (" + fmtTam(arq.bytes) + ")" }, nodes: ["canal"] };
    var resto = stepsFor(intent, legenda || arq.nome, true);
    // o último passo do CRM de um anexo é guardar o arquivo para a equipe
    resto.forEach(function (st) { if (st.t === CRM_STEP.t) { st.t = { pt: "Guardando o arquivo para a equipe", en: "Saving the file for the team", es: "Guardando el archivo para el equipo" }; st.d = { pt: "Disponível na caixa de entrada", en: "Available in the inbox", es: "Disponible en la bandeja de entrada" }; } });
    var steps = [recebido, leitura].concat(resto);
    renderSteps(steps); limpaNodes();
    mResp.textContent = "…"; mResp.classList.remove("is-up");
    mIntent.textContent = pick(intent.label); mSteps.textContent = "0/" + steps.length; mSys.textContent = "0";

    var tTyping = typing();
    var base64 = "";
    try { base64 = await blobParaBase64(arq.blob); } catch (e) { tTyping.remove(); return falha(u, 0); }
    var payload = { attachment: { base64: base64, mime: arq.mime, name: arq.nome } };
    if (legenda) payload.text = legenda;
    var promessa = pedir(payload).then(function (r) { return { ok: true, r: r }; }, function (e) { return { ok: false, e: e }; });

    if (!(await andar(steps, 0, steps.length - 1, id, 560))) return;
    var ultimo = steps.length - 1;
    marca(ultimo, "is-run");
    var resultado = await promessa;
    if (id !== runId) return;
    tTyping.remove();
    if (!resultado.ok || !resultado.r.data || !(resultado.r.data.messages || []).length) return falha(u, ultimo);
    await entregar(resultado, id, steps, ultimo);
  }

  async function enviarOpcao(op) {
    if (busy) return;
    setBusy(true);
    addMsg("user", op.label, true);
    var t = typing();
    try {
      var r = await pedir({ optionId: op.id });
      t.remove();
      (r.data.messages || []).forEach(function (m) { var h = renderBot(m.text || ""); if (h.replace(/<[^>]*>/g, "").trim()) addMsg("bot", h); });
    } catch (e) { t.remove(); addMsg("bot", UI[lang()].error, true); }
    setBusy(false);
  }

  // ---- eventos ----
  // convite visual: deixa claro que o visitante pode digitar; some na primeira interação
  var hint = document.createElement("div");
  hint.className = "live-hint";
  hint.innerHTML = "<span></span><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 5v14M6 13l6 6 6-6\"/></svg>";
  hint.querySelector("span").textContent = UI[lang()].nudge;
  form.parentNode.insertBefore(hint, form);
  form.classList.add("is-nudge");
  function apagaConvite() { if (!hint) return; form.classList.remove("is-nudge"); hint.remove(); hint = null; }
  ["focusin", "input", "click"].forEach(function (ev) { chipsBox.addEventListener(ev, apagaConvite); form.addEventListener(ev, apagaConvite); });
  // campo da primeira tela: leva a pergunta para a vitrine e envia
  var heroAsk = document.getElementById("heroAsk");
  if (heroAsk) {
    // texto de exemplo que se digita sozinho, alternando as perguntas; para quando a pessoa usa o campo
    var campoAsk = document.getElementById("heroAskInput");
    var semMov = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var digitando = !semMov, idxS = 0, pos = 0, apagando = false;
    var parar = function () { digitando = false; campoAsk.placeholder = UI[lang()].askPh; };
    campoAsk.addEventListener("focus", parar);
    campoAsk.addEventListener("input", parar);
    (function passo() {
      if (!digitando) return;
      var lista = UI[lang()].askS, t = lista[idxS % lista.length], espera = apagando ? 28 : 55;
      if (!apagando) { pos++; if (pos >= t.length) { apagando = true; espera = 1800; } }
      else { pos--; if (pos <= 0) { apagando = false; idxS++; espera = 400; } }
      campoAsk.placeholder = t.slice(0, Math.max(pos, 0)) + (pos > 0 ? "|" : "");
      setTimeout(passo, espera);
    })();
    // áudio na primeira tela: grava aqui e manda para a vitrine, que transcreve e responde
    var hMic = document.getElementById("heroAskMic"), hCan = document.getElementById("heroAskCancel");
    var hRecEl = document.getElementById("heroRec"), hRecTime = document.getElementById("heroRecTime");
    var hMr = null, hChunks = [], hStart = 0, hTimer = null, hStream = null, hCancel = false;
    function hMostra(on) {
      heroAsk.classList.toggle("is-rec", on);
      hRecEl.hidden = !on; campoAsk.hidden = on; hMic.hidden = on; hCan.hidden = !on;
    }
    function hParar(enviarAgora) {
      if (!hMr) return;
      clearInterval(hTimer); hTimer = null; hCancel = !enviarAgora;
      hMostra(false);
      try { hMr.stop(); } catch (e) {}
    }
    async function hIniciar() {
      if (hMr) return;
      parar();
      try { hStream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return; }
      try { hMr = new MediaRecorder(hStream); } catch (e) { hStream.getTracks().forEach(function (t) { t.stop(); }); return; }
      hChunks = []; hCancel = false;
      hMr.ondataavailable = function (e) { if (e.data && e.data.size) hChunks.push(e.data); };
      hMr.onstop = function () {
        if (hStream) hStream.getTracks().forEach(function (t) { t.stop(); });
        var dur = Date.now() - hStart, tipo = (hMr && hMr.mimeType) || "audio/webm", cancelado = hCancel;
        hMr = null; hStream = null;
        if (cancelado || !hChunks.length) return;
        var blob = new Blob(hChunks, { type: tipo });
        document.getElementById("ao-vivo").scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(function () { enviarAudio(blob, dur); }, 500);
      };
      hMr.start(); hStart = Date.now(); hMostra(true); hRecTime.textContent = "0:00";
      hTimer = setInterval(function () {
        var d = Date.now() - hStart;
        hRecTime.textContent = fmtDur(d);
        if (d >= MAX_REC_MS) hParar(true);
      }, 200);
    }
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)) hMic.hidden = true;
    else hMic.addEventListener("click", hIniciar);
    hCan.addEventListener("click", function () { hParar(false); });
    heroAsk.addEventListener("submit", function (e) {
      e.preventDefault();
      if (hMr) { hParar(true); return; }
      var campo = document.getElementById("heroAskInput");
      var txt = campo.value.trim();
      document.getElementById("ao-vivo").scrollIntoView({ behavior: "smooth", block: "start" });
      if (!txt) { setTimeout(function () { input.focus({ preventScroll: true }); }, 600); return; }
      input.value = txt; campo.value = "";
      setTimeout(function () { if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event("submit", { cancelable: true })); }, 500);
    });
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (mr) { paraGravacao(true); return; }
    if (pendente) { enviarAnexo(input.value); return; }
    enviar(input.value);
  });
  var podeGravar = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  if (micBtn) {
    if (!podeGravar) micBtn.hidden = true;
    else micBtn.addEventListener("click", iniciaGravacao);
  }
  if (recCancel) recCancel.addEventListener("click", cancelaGravacao);
  if (attachBtn && fileInput) {
    attachBtn.addEventListener("click", function () { if (!busy) fileInput.click(); });
    fileInput.addEventListener("change", escolheuArquivo);
  }
  document.addEventListener("evalangchange", reset);
  reset();
})();
