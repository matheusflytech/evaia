/* ===== Eva AI por dentro: o agente raciocinando, em cenário ensaiado =====
   Três mensagens contam o que a Eva faz por trás da conversa:
   1. um áudio (transcreve, entende, consulta a base, não inventa preço);
   2. um texto pedindo horário (usa a ferramenta de agenda e atualiza o CRM);
   3. um pedido de desconto (regra de segurança: passa para uma pessoa).
   Nada aqui fala com servidor. Começa quando a seção aparece na tela. */
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

  var STEPS = ["Ouve", "Entende", "Consulta", "Age", "Passa para a equipe"];
  var runId = 0;
  var timer = null;
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
    var label = who === "bot" ? "Eva" : who === "human" ? "Marina, equipe" : "";
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
  async function botSays(id, text, who) {
    var t = typing();
    await sleep(900, id);
    t.remove();
    say(who || "bot", text);
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

  function reset() {
    chatBody.innerHTML = "";
    logEl.innerHTML = "";
    sources = 0;
    rules = 0;
    mResp.textContent = "—";
    mSources.textContent = "0";
    mRules.textContent = "0";
    mHuman.textContent = "Não";
    [mResp, mSources, mRules, mHuman].forEach(function (m) { m.className = ""; });
    setStep(-1);
  }

  var WAVE = [30, 55, 80, 45, 90, 60, 35, 75, 50, 85, 40, 65, 30, 70, 55, 40, 80, 35, 60, 45];

  async function play(id) {
    reset();
    await sleep(700, id);

    // MENSAGEM 1: áudio. A Eva ouve, entende, consulta a base e respeita a regra de preço
    setStep(0);
    turn("Mensagem 1 · áudio");
    var wave = WAVE.map(function (h) { return '<i style="height:' + h + '%"></i>'; }).join("");
    var audio = say("client",
      '<div class="eai-audio is-playing"><span class="eai-audio-play"><svg viewBox="0 0 10 12"><path d="M0 0l10 6-10 6z"/></svg></span><span class="eai-wave">' + wave + "</span><small>0:07</small></div>");
    var s1 = step("mic", "Ouvindo o áudio", "Recebido pelo WhatsApp, 0:07");
    await sleep(1700, id);
    audio.querySelector(".eai-audio").classList.remove("is-playing");
    setDetail(s1, 'Transcrição: <q>&ldquo;Oi, quero automatizar o atendimento da minha clínica. Quanto custa?&rdquo;</q>');
    done(s1);
    chip(s1, "Português", "ok");
    await sleep(1300, id);

    setStep(1);
    var s2 = step("brain", "Entendendo a intenção");
    await sleep(900, id);
    done(s2);
    chip(s2, "Quer automatizar atendimento");
    chip(s2, "Pergunta de preço", "warn");
    chip(s2, "Segmento: clínica");
    await sleep(1100, id);

    setStep(2);
    var s3 = step("book", "Consultando a base de conhecimento", "Buscando como a Eva Holding apresenta valores e prazos");
    await sleep(1200, id);
    done(s3);
    chip(s3, "agentes-de-ia.pdf", "doc");
    chip(s3, "como-orcamos.pdf", "doc");
    sources += 2;
    flash(mSources, String(sources));
    await sleep(900, id);

    var s4 = step("shield", "Conferindo as regras", "Não existe preço fixo na base: nada de inventar valor ou prazo");
    await sleep(1100, id);
    done(s4);
    chip(s4, "Sem preço inventado", "ok");
    chip(s4, "Convida para falar com a equipe", "ok");
    rules += 2;
    flash(mRules, String(rules));
    await sleep(700, id);

    var t1 = typing();
    await sleep(900, id);
    t1.remove();
    say("bot", "Oi! Cada projeto é montado sob medida, então o valor depende do que a sua clínica precisa. Posso marcar uma conversa de 20 minutos com nosso especialista para te passar uma proposta de verdade. Qual horário fica melhor?");
    flash(mResp, "3 s");
    await sleep(2200, id);

    // MENSAGEM 2: texto. A Eva usa ferramentas (agenda e CRM)
    turn("Mensagem 2 · texto");
    say("client", "Pode ser amanhã às 10h?");
    var s5 = step("brain", "Entendendo a intenção");
    await sleep(800, id);
    done(s5);
    chip(s5, "Aceita horário");
    chip(s5, "Amanhã 10h");
    await sleep(900, id);

    setStep(3);
    var s6 = step("tool", "Usando a ferramenta CRM", "Atualizando o cartão do lead com o que a Camila disse");
    await sleep(1200, id);
    done(s6);
    chip(s6, "Campos preenchidos", "ok");
    chip(s6, "Etapa: reunião agendada", "ok");
    await sleep(800, id);
    var s7 = step("tool", "Criando tarefa para a equipe", "Confirmar o horário com a Camila");
    await sleep(1100, id);
    done(s7);
    chip(s7, "Tarefa: reunião amanhã 10h", "ok");
    chip(s7, "Responsável: Marina", "ok");
    await sleep(700, id);

    var t2 = typing();
    await sleep(900, id);
    t2.remove();
    say("bot", "Combinado! Anotei amanhã às 10h. A Marina, do nosso time, confirma o horário com você por aqui.");
    flash(mResp, "2 s");
    await sleep(2200, id);

    // MENSAGEM 3: pedido sensível. A regra manda passar para uma pessoa
    turn("Mensagem 3 · assunto sensível");
    say("client", "Antes disso, vocês fazem 30% de desconto se eu fechar hoje?");
    var s8 = step("brain", "Entendendo a intenção");
    await sleep(800, id);
    done(s8, true);
    chip(s8, "Negociação de preço", "warn");
    await sleep(900, id);

    setStep(4);
    var s9 = step("shield", "Conferindo as regras", "Desconto e condição comercial são decisão da equipe, não da IA");
    await sleep(1200, id);
    done(s9, true);
    chip(s9, "Fora do que a Eva pode decidir", "warn");
    rules += 1;
    flash(mRules, String(rules), "is-warn");
    await sleep(800, id);

    var s10 = step("user", "Passando para uma pessoa", "A conversa vai para a fila da equipe, com nota interna: pediu desconto de 30%");
    s10.classList.add("eai-handoff");
    await sleep(1400, id);
    done(s10, true);
    chip(s10, "Nota interna registrada", "ok");
    chip(s10, "Histórico completo visível", "ok");
    chip(s10, "IA em silêncio", "ok");
    flash(mHuman, "Sim", "is-warn");
    await sleep(800, id);

    var t3 = typing();
    await sleep(900, id);
    t3.remove();
    say("bot", "Essa condição quem define é o nosso time comercial. Já passei o seu pedido para a Marina, que vai ver toda a nossa conversa e continuar com você.");
    await sleep(1800, id);
    say("human", "Oi, Camila! Marina aqui. Já vi tudo. Amanhã às 10h a gente conversa sobre valores com calma.");
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

  stepsEl.innerHTML = "";
  STEPS.forEach(function (s) { stepsEl.appendChild(el("li", null, "<i></i>" + s)); });
  reset();
  restartBtn.addEventListener("click", start);

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
