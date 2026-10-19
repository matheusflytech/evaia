/* ===== Eva AI por dentro: o agente raciocinando, em cenário ensaiado =====
   Três mensagens contam o que a Eva faz por trás da conversa:
   1. um áudio (transcreve, entende, consulta a base, não inventa preço);
   2. um texto aceitando horário (atualiza o CRM e cria tarefa para a equipe);
   3. um pedido de desconto (regra de segurança: passa para uma pessoa).
   Nada aqui fala com servidor. Começa quando a seção aparece na tela.
   Textos em português, inglês e espanhol; trocar o idioma reinicia a história. */
(function () {
  var root = document.getElementById("eaiDemo");
  if (!root) return;

  var chatBody = document.getElementById("eaiChatBody");
  var logEl = document.getElementById("eaiLog");
  var stepsEl = document.getElementById("eaiSteps");
  var restartBtn = document.getElementById("eaiRestart");
  var mResp = document.getElementById("eaiMResp");
  var mSources = document.getElementById("eaiMSources");
  var mRules = document.getElementById("eaiMRules");
  var mHuman = document.getElementById("eaiMHuman");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var L = {
    pt: {
      steps: ["Ouve", "Entende", "Consulta", "Age", "Passa para a equipe"],
      bot: "Eva", human: "Marina, equipe",
      no: "Não", yes: "Sim", sec: " s",
      turn1: "Mensagem 1 · áudio", turn2: "Mensagem 2 · texto", turn3: "Mensagem 3 · assunto sensível",
      s1t: "Ouvindo o áudio", s1d: "Recebido pelo WhatsApp, 0:07",
      s1d2: "Transcrição: <q>&ldquo;Oi, quero automatizar o atendimento da minha clínica. Quanto custa?&rdquo;</q>",
      chLang: "Português",
      s2t: "Entendendo a intenção",
      chIntent1: "Quer automatizar atendimento", chIntent2: "Pergunta de preço", chIntent3: "Segmento: clínica",
      s3t: "Consultando a base de conhecimento", s3d: "Buscando como a Eva Holding apresenta valores e prazos",
      s4t: "Conferindo as regras", s4d: "Não existe preço fixo na base: nada de inventar valor ou prazo",
      chNoPrice: "Sem preço inventado", chInvite: "Convida para falar com a equipe",
      b1: "Oi! Cada projeto é montado sob medida, então o valor depende do que a sua clínica precisa. Posso marcar uma conversa de 20 minutos com nosso especialista para te passar uma proposta de verdade. Qual horário fica melhor?",
      c2: "Pode ser amanhã às 10h?",
      chAccept: "Aceita horário", chTomorrow: "Amanhã 10h",
      s6t: "Usando a ferramenta CRM", s6d: "Atualizando o cartão do lead com o que a Camila disse",
      chFields: "Campos preenchidos", chStage: "Etapa: reunião agendada",
      s7t: "Criando tarefa para a equipe", s7d: "Confirmar o horário com a Camila",
      chTask: "Tarefa: reunião amanhã 10h", chOwner: "Responsável: Marina",
      b2: "Combinado! Anotei amanhã às 10h. A Marina, do nosso time, confirma o horário com você por aqui.",
      c3: "Antes disso, vocês fazem 30% de desconto se eu fechar hoje?",
      chNegotiate: "Negociação de preço",
      s9t: "Conferindo as regras", s9d: "Desconto e condição comercial são decisão da equipe, não da IA",
      chOutside: "Fora do que a Eva pode decidir",
      s10t: "Passando para uma pessoa", s10d: "A conversa vai para a fila da equipe, com nota interna: pediu desconto de 30%",
      chNote: "Nota interna registrada", chHistory: "Histórico completo visível", chSilent: "IA em silêncio",
      b3: "Essa condição quem define é o nosso time comercial. Já passei o seu pedido para a Marina, que vai ver toda a nossa conversa e continuar com você.",
      h1: "Oi, Camila! Marina aqui. Já vi tudo. Amanhã às 10h a gente conversa sobre valores com calma."
    },
    en: {
      steps: ["Listens", "Understands", "Searches", "Acts", "Hands off to the team"],
      bot: "Eva", human: "Marina, team",
      no: "No", yes: "Yes", sec: " s",
      turn1: "Message 1 · audio", turn2: "Message 2 · text", turn3: "Message 3 · sensitive topic",
      s1t: "Listening to the audio", s1d: "Received on WhatsApp, 0:07",
      s1d2: "Transcript: <q>&ldquo;Hi, I want to automate customer service at my clinic. How much does it cost?&rdquo;</q>",
      chLang: "English",
      s2t: "Understanding the intent",
      chIntent1: "Wants to automate support", chIntent2: "Asking about price", chIntent3: "Segment: clinic",
      s3t: "Searching the knowledge base", s3d: "Looking up how Eva Holding presents pricing and timelines",
      s4t: "Checking the rules", s4d: "There is no fixed price in the knowledge base: no made-up amounts or deadlines",
      chNoPrice: "No invented price", chInvite: "Invites a talk with the team",
      b1: "Hi! Every project is built to measure, so the price depends on what your clinic needs. I can set up a 20-minute call with our specialist to give you a real proposal. What time works best?",
      c2: "Tomorrow at 10 am works?",
      chAccept: "Accepts the time", chTomorrow: "Tomorrow 10 am",
      s6t: "Using the CRM tool", s6d: "Updating the lead's card with what Camila said",
      chFields: "Fields filled in", chStage: "Stage: meeting scheduled",
      s7t: "Creating a task for the team", s7d: "Confirm the time with Camila",
      chTask: "Task: meeting tomorrow 10 am", chOwner: "Owner: Marina",
      b2: "Done! I've noted tomorrow at 10 am. Marina from our team will confirm the time with you here.",
      c3: "Before that, do you offer a 30% discount if I close today?",
      chNegotiate: "Price negotiation",
      s9t: "Checking the rules", s9d: "Discounts and commercial terms are the team's call, not the AI's",
      chOutside: "Outside what Eva can decide",
      s10t: "Handing off to a person", s10d: "The conversation goes to the team's queue, with an internal note: asked for a 30% discount",
      chNote: "Internal note logged", chHistory: "Full history visible", chSilent: "AI stays silent",
      b3: "That one is up to our sales team. I've passed your request to Marina, who will see our whole conversation and continue with you.",
      h1: "Hi, Camila! Marina here. I've seen everything. Tomorrow at 10 am we'll go over pricing in detail."
    },
    es: {
      steps: ["Escucha", "Entiende", "Consulta", "Actúa", "Pasa al equipo"],
      bot: "Eva", human: "Marina, equipo",
      no: "No", yes: "Sí", sec: " s",
      turn1: "Mensaje 1 · audio", turn2: "Mensaje 2 · texto", turn3: "Mensaje 3 · tema sensible",
      s1t: "Escuchando el audio", s1d: "Recibido por WhatsApp, 0:07",
      s1d2: "Transcripción: <q>&ldquo;Hola, quiero automatizar la atención de mi clínica. ¿Cuánto cuesta?&rdquo;</q>",
      chLang: "Español",
      s2t: "Entendiendo la intención",
      chIntent1: "Quiere automatizar la atención", chIntent2: "Pregunta por el precio", chIntent3: "Segmento: clínica",
      s3t: "Consultando la base de conocimiento", s3d: "Buscando cómo Eva Holding presenta valores y plazos",
      s4t: "Verificando las reglas", s4d: "No hay precio fijo en la base: nada de inventar valores ni plazos",
      chNoPrice: "Sin precio inventado", chInvite: "Invita a hablar con el equipo",
      b1: "¡Hola! Cada proyecto se arma a medida, así que el valor depende de lo que necesite tu clínica. Puedo agendar una conversación de 20 minutos con nuestro especialista para darte una propuesta real. ¿Qué horario te queda mejor?",
      c2: "¿Puede ser mañana a las 10 h?",
      chAccept: "Acepta el horario", chTomorrow: "Mañana 10 h",
      s6t: "Usando la herramienta de CRM", s6d: "Actualizando la tarjeta del lead con lo que dijo Camila",
      chFields: "Campos completados", chStage: "Etapa: reunión agendada",
      s7t: "Creando una tarea para el equipo", s7d: "Confirmar el horario con Camila",
      chTask: "Tarea: reunión mañana 10 h", chOwner: "Responsable: Marina",
      b2: "¡Acordado! Anoté mañana a las 10 h. Marina, de nuestro equipo, confirma el horario contigo por aquí.",
      c3: "Antes de eso, ¿hacen un 30% de descuento si cierro hoy?",
      chNegotiate: "Negociación de precio",
      s9t: "Verificando las reglas", s9d: "El descuento y las condiciones comerciales los decide el equipo, no la IA",
      chOutside: "Fuera de lo que Eva puede decidir",
      s10t: "Pasando a una persona", s10d: "La conversación va a la cola del equipo, con una nota interna: pidió 30% de descuento",
      chNote: "Nota interna registrada", chHistory: "Historial completo visible", chSilent: "IA en silencio",
      b3: "Esa condición la define nuestro equipo comercial. Ya le pasé tu pedido a Marina, que verá toda nuestra conversación y continuará contigo.",
      h1: "¡Hola, Camila! Soy Marina. Ya lo vi todo. Mañana a las 10 h conversamos sobre los valores con calma."
    }
  };

  function lang() {
    var l = window.EvaI18n && window.EvaI18n.getLang ? window.EvaI18n.getLang() : "pt";
    return L[l] ? l : "pt";
  }
  function T(k) { return L[lang()][k]; }

  var runId = 0;
  var timer = null;
  var started = false;
  var sources = 0;
  var rules = 0;

  var ICON = {
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4"/></svg>',
    brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V4a3 3 0 0 0-3-1z"/><path d="M15 3a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
    tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>'
  };

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
  function scroll(n) { n.scrollTop = n.scrollHeight; }

  function setStep(i) {
    var items = stepsEl.children;
    for (var k = 0; k < items.length; k++) items[k].className = k < i ? "is-done" : k === i ? "is-active" : "";
  }
  function flash(node, text, cls) {
    node.textContent = text;
    node.className = cls || "is-up";
    setTimeout(function () { node.className = ""; }, 1300);
  }

  function say(who, html) {
    var label = who === "bot" ? T("bot") : who === "human" ? T("human") : "";
    var m = el("div", "crm-msg crm-msg--" + who, (label ? "<small>" + label + "</small>" : "") + html);
    chatBody.appendChild(m);
    scroll(chatBody);
    return m;
  }
  function typing() {
    var t = el("div", "crm-typing", "<i></i><i></i><i></i>");
    chatBody.appendChild(t);
    scroll(chatBody);
    return t;
  }

  function turn(text) {
    logEl.appendChild(el("div", "eai-turn", text));
    scroll(logEl);
  }
  // passo do raciocínio: nasce "rodando" e vira "feito" quando termina
  function step(icon, title, detail) {
    var s = el("div", "eai-step is-running",
      '<div class="eai-step-ic">' + ICON[icon] + "</div><div><h4>" + title + "</h4>" + (detail ? "<p>" + detail + "</p>" : "") + '<div class="eai-chips"></div></div>');
    logEl.appendChild(s);
    scroll(logEl);
    return s;
  }
  function done(s, warn) {
    s.classList.remove("is-running");
    s.classList.add(warn ? "is-warn" : "is-done");
  }
  function chip(s, text, cls) {
    s.querySelector(".eai-chips").appendChild(el("span", "eai-chip" + (cls ? " eai-chip--" + cls : ""), text));
    scroll(logEl);
  }
  function setDetail(s, html) {
    var p = s.querySelector("p");
    if (!p) { p = el("p"); s.querySelector("h4").after(p); }
    p.innerHTML = html;
    scroll(logEl);
  }

  function buildSteps() {
    stepsEl.innerHTML = "";
    T("steps").forEach(function (s) { stepsEl.appendChild(el("li", null, "<i></i>" + s)); });
  }

  function reset() {
    chatBody.innerHTML = "";
    logEl.innerHTML = "";
    sources = 0;
    rules = 0;
    mResp.textContent = "—";
    mSources.textContent = "0";
    mRules.textContent = "0";
    mHuman.textContent = T("no");
    [mResp, mSources, mRules, mHuman].forEach(function (m) { m.className = ""; });
    buildSteps();
    setStep(-1);
  }

  var WAVE = [30, 55, 80, 45, 90, 60, 35, 75, 50, 85, 40, 65, 30, 70, 55, 40, 80, 35, 60, 45];

  async function bot(id, texto) {
    var t = typing();
    await sleep(900, id);
    t.remove();
    say("bot", texto);
  }

  async function play(id) {
    reset();
    await sleep(700, id);

    // MENSAGEM 1: áudio. A Eva ouve, entende, consulta a base e respeita a regra de preço
    setStep(0);
    turn(T("turn1"));
    var wave = WAVE.map(function (h) { return '<i style="height:' + h + '%"></i>'; }).join("");
    var audio = say("client",
      '<div class="eai-audio is-playing"><span class="eai-audio-play"><svg viewBox="0 0 10 12"><path d="M0 0l10 6-10 6z"/></svg></span><span class="eai-wave">' + wave + "</span><small>0:07</small></div>");
    var s1 = step("mic", T("s1t"), T("s1d"));
    await sleep(1700, id);
    audio.querySelector(".eai-audio").classList.remove("is-playing");
    setDetail(s1, T("s1d2"));
    done(s1);
    chip(s1, T("chLang"), "ok");
    await sleep(1300, id);

    setStep(1);
    var s2 = step("brain", T("s2t"));
    await sleep(900, id);
    done(s2);
    chip(s2, T("chIntent1"));
    chip(s2, T("chIntent2"), "warn");
    chip(s2, T("chIntent3"));
    await sleep(1100, id);

    setStep(2);
    var s3 = step("book", T("s3t"), T("s3d"));
    await sleep(1200, id);
    done(s3);
    chip(s3, "agentes-de-ia.pdf", "doc");
    chip(s3, "como-orcamos.pdf", "doc");
    sources += 2;
    flash(mSources, String(sources));
    await sleep(900, id);

    var s4 = step("shield", T("s4t"), T("s4d"));
    await sleep(1100, id);
    done(s4);
    chip(s4, T("chNoPrice"), "ok");
    chip(s4, T("chInvite"), "ok");
    rules += 2;
    flash(mRules, String(rules));
    await sleep(700, id);

    await bot(id, T("b1"));
    flash(mResp, "3" + T("sec"));
    await sleep(2200, id);

    // MENSAGEM 2: texto. A Eva atualiza o CRM e cria tarefa para a equipe
    turn(T("turn2"));
    say("client", T("c2"));
    var s5 = step("brain", T("s2t"));
    await sleep(800, id);
    done(s5);
    chip(s5, T("chAccept"));
    chip(s5, T("chTomorrow"));
    await sleep(900, id);

    setStep(3);
    var s6 = step("tool", T("s6t"), T("s6d"));
    await sleep(1200, id);
    done(s6);
    chip(s6, T("chFields"), "ok");
    chip(s6, T("chStage"), "ok");
    await sleep(800, id);
    var s7 = step("tool", T("s7t"), T("s7d"));
    await sleep(1100, id);
    done(s7);
    chip(s7, T("chTask"), "ok");
    chip(s7, T("chOwner"), "ok");
    await sleep(700, id);

    await bot(id, T("b2"));
    flash(mResp, "2" + T("sec"));
    await sleep(2200, id);

    // MENSAGEM 3: pedido sensível. A regra manda passar para uma pessoa
    turn(T("turn3"));
    say("client", T("c3"));
    var s8 = step("brain", T("s2t"));
    await sleep(800, id);
    done(s8, true);
    chip(s8, T("chNegotiate"), "warn");
    await sleep(900, id);

    setStep(4);
    var s9 = step("shield", T("s9t"), T("s9d"));
    await sleep(1200, id);
    done(s9, true);
    chip(s9, T("chOutside"), "warn");
    rules += 1;
    flash(mRules, String(rules), "is-warn");
    await sleep(800, id);

    var s10 = step("user", T("s10t"), T("s10d"));
    s10.classList.add("eai-handoff");
    await sleep(1400, id);
    done(s10, true);
    chip(s10, T("chNote"), "ok");
    chip(s10, T("chHistory"), "ok");
    chip(s10, T("chSilent"), "ok");
    flash(mHuman, T("yes"), "is-warn");
    await sleep(800, id);

    await bot(id, T("b3"));
    await sleep(1800, id);
    say("human", T("h1"));
    await sleep(1400, id);
    setStep(5);
    for (var k = 0; k < stepsEl.children.length; k++) stepsEl.children[k].className = "is-done";
  }

  function start() {
    runId += 1;
    var id = runId;
    clearTimeout(timer);
    play(id).then(function () {
      if (reduced) return;
      timer = setTimeout(function () { if (id === runId && visibleEnough()) start(); }, 8000);
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
