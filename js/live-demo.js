/* ===== Live demo — perguntas pré-montadas que alimentam o CRM ao vivo =====
   Seção do hero: um mockup de iPhone com uma tela de início com botão,
   depois 5 perguntas fixas, uma de cada vez — cada pergunta e resposta
   acumula na tela e sobe conforme chegam novas (igual WhatsApp), enquanto
   a barra de progresso no topo vai acendendo os segmentos conforme avança.
   É o mesmo motor que atende os clientes de verdade, rodando num agente
   dedicado ("Landing Interativa"), separado do agente de vendas real.
   EVA_STUDIO_ORIGIN aponta pro localhost enquanto testamos, trocar pra
   https://evapp.vercel.app antes de subir de verdade. */
(function () {
  var EVA_STUDIO_ORIGIN = "https://evapp.vercel.app";
  var AGENT_ID = "9b9c6392-6cc0-4093-847a-9589b525e51d";
  var WHATSAPP_NUMBER = "5521969156116"; // mesmo número usado no resto do site

  var canvasEl = document.getElementById("ldCanvas");
  var trailEl = document.getElementById("ldTrail");
  var messagesEl = document.getElementById("ldMessages");
  var inputEl = document.getElementById("ldInput");
  var sendBtn = document.getElementById("ldSend");
  var inputRow = document.getElementById("ldInputRow");
  var errorEl = document.getElementById("ldInputError");
  var ctaWrap = document.getElementById("ldCtaWrap");
  var clockEl = document.getElementById("ldClock");
  var phoneEl = document.querySelector(".ld-phone");
  var fullscreenCloseBtn = document.getElementById("ldFullscreenClose");
  if (!canvasEl || !messagesEl || !inputEl || !sendBtn) return;

  // No celular/tablet, o telefone assume a aba toda enquanto a demo roda —
  // fixo, sem o scroll da página por trás pra brigar com o teclado. Lê
  // como abrir o WhatsApp de verdade, não um card dentro da página. No PC
  // não faz sentido (não tem teclado cobrindo nada), então fica só mobile.
  function isMobile() {
    return window.matchMedia("(max-width: 900px)").matches;
  }
  var phoneHomeParent = phoneEl ? phoneEl.parentNode : null;
  var phoneHomeNextSibling = phoneEl ? phoneEl.nextSibling : null;

  function enterFullscreen() {
    if (!isMobile() || !phoneEl) return;
    // O header do site e o balão de chat flutuante vivem em contextos de
    // empilhamento próprios (fora do <main>) — só subir o z-index não basta
    // pra ficar por cima deles. Move o telefone pro fim do <body> enquanto
    // dura a tela cheia, e devolve pro lugar de origem ao fechar.
    document.body.appendChild(phoneEl);
    phoneEl.classList.add("is-fullscreen");
    document.body.classList.add("ld-scroll-locked");
    if (clockEl) clockEl.hidden = true;
    if (fullscreenCloseBtn) fullscreenCloseBtn.hidden = false;
  }
  function exitFullscreen() {
    if (!phoneEl) return;
    phoneEl.classList.remove("is-fullscreen");
    document.body.classList.remove("ld-scroll-locked");
    if (clockEl) clockEl.hidden = false;
    if (fullscreenCloseBtn) fullscreenCloseBtn.hidden = true;
    if (phoneHomeParent) {
      if (phoneHomeNextSibling) phoneHomeParent.insertBefore(phoneEl, phoneHomeNextSibling);
      else phoneHomeParent.appendChild(phoneEl);
    }
  }
  if (fullscreenCloseBtn) fullscreenCloseBtn.addEventListener("click", exitFullscreen);
  window.addEventListener("resize", function () {
    if (!isMobile() && phoneEl && phoneEl.classList.contains("is-fullscreen")) exitFullscreen();
  });

  function updateClock() {
    if (!clockEl) return;
    var now = new Date();
    var h = String(now.getHours()).padStart(2, "0");
    var m = String(now.getMinutes()).padStart(2, "0");
    clockEl.textContent = h + ":" + m;
  }
  updateClock();
  setInterval(updateClock, 15000);

  var ICON_WHATSAPP =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.902.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.908.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  var ICON_FLAG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V4a1 1 0 0 1 1-1h13.5a.5.5 0 0 1 .4.8L15 9l3.9 5.2a.5.5 0 0 1-.4.8H5"/></svg>';
  var ICON_USER =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
  var ICON_EDIT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  var ICON_MAIL =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';
  var ICON_ZAP =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>';
  var TRAIL_ICONS = [ICON_FLAG, ICON_USER, ICON_EDIT, ICON_EDIT, ICON_WHATSAPP, ICON_MAIL, ICON_ZAP];

  var T = {
    pt: {
      stage_inicio: "Início", stage_nome: "Nome", stage_nicho: "Nicho", stage_dor: "Dor",
      stage_telefone: "WhatsApp", stage_email: "E-mail", stage_pronto: "Pronto!",
      q_nome: "Qual seu nome?",
      q_nicho: "Qual o nicho do seu negócio?",
      q_dor: "Qual sua maior dor hoje?",
      q_telefone: "Qual seu telefone com DDD?",
      q_email: "Qual seu e-mail?",
      ph_telefone: "(11) 91234-5678",
      ph_email: "voce@email.com",
      err_telefone: "Digite um telefone válido (DDD + número).",
      err_email: "Digite um e-mail válido.",
      intro_text: "Um formulário rápido e objetivo para você falar com o nosso time.",
      intro_button: "Começar →",
      cta_bot_message: "Obrigado pelas informações. Fale agora mesmo com o nosso time:",
      cta_button: "Chamar no WhatsApp",
      cta_alt: "prefiro outro canal de contato",
      cta_message: "Olá! Gostaria de saber mais sobre a Eva. Vim pelo site.",
      network_error: "Não consegui carregar agora. Atualize a página.",
    },
    en: {
      stage_inicio: "Start", stage_nome: "Name", stage_nicho: "Niche", stage_dor: "Pain point",
      stage_telefone: "WhatsApp", stage_email: "Email", stage_pronto: "Done!",
      q_nome: "What's your name?",
      q_nicho: "What's your business niche?",
      q_dor: "What's your biggest pain point today?",
      q_telefone: "What's your phone number with area code?",
      q_email: "What's your email?",
      ph_telefone: "(11) 91234-5678",
      ph_email: "you@email.com",
      err_telefone: "Enter a valid phone number (area code + number).",
      err_email: "Enter a valid email.",
      intro_text: "A quick, straightforward form to get you talking to our team.",
      intro_button: "Start →",
      cta_bot_message: "Thank you for the information. Speak with our team right now:",
      cta_button: "Message us on WhatsApp",
      cta_alt: "I prefer another contact channel",
      cta_message: "Hi! I'd like to learn more about Eva. I came from the website.",
      network_error: "Couldn't load right now. Refresh the page.",
    },
    es: {
      stage_inicio: "Inicio", stage_nome: "Nombre", stage_nicho: "Nicho", stage_dor: "Dolor",
      stage_telefone: "WhatsApp", stage_email: "Correo", stage_pronto: "¡Listo!",
      q_nome: "¿Cuál es tu nombre?",
      q_nicho: "¿Cuál es el nicho de tu negocio?",
      q_dor: "¿Cuál es tu mayor dolor hoy?",
      q_telefone: "¿Cuál es tu teléfono con código de área?",
      q_email: "¿Cuál es tu correo electrónico?",
      ph_telefone: "(11) 91234-5678",
      ph_email: "tu@correo.com",
      err_telefone: "Ingresa un teléfono válido (código de área + número).",
      err_email: "Ingresa un correo electrónico válido.",
      intro_text: "Un formulario rápido y directo para hablar con nuestro equipo.",
      intro_button: "Comenzar →",
      cta_bot_message: "Gracias por la información. Habla ahora con nuestro equipo:",
      cta_button: "Escribir por WhatsApp",
      cta_alt: "prefiero otro canal de contacto",
      cta_message: "¡Hola! Me gustaría saber más sobre Eva. Vine desde el sitio web.",
      network_error: "No pude cargar ahora. Actualiza la página.",
    },
  };

  function t(key) {
    var lang = (window.EvaI18n && window.EvaI18n.getLang()) || "pt";
    return (T[lang] && T[lang][key]) || T.pt[key] || key;
  }

  var FIELDS = { 1: "nome", 2: "nicho", 3: "dor", 4: "telefone", 5: "email" };
  var QUESTION_KEY = { 1: "q_nome", 2: "q_nicho", 3: "q_dor", 4: "q_telefone", 5: "q_email" };
  var STAGE_KEYS = ["inicio", "nome", "nicho", "dor", "telefone", "email", "pronto"];

  var stageIndex = 0;
  var started = false;
  var ended = false;
  var answers = {};

  // Cada carregamento da página começa uma conversa nova (sem retomar uma
  // antiga): reaproveitar um contactId de uma visita anterior deixava a
  // demo num beco sem saída, sem a pergunta certa pra responder.
  var contactId = "landing_" + Math.random().toString(36).slice(2) + Date.now().toString(36);

  function renderCanvas() {
    canvasEl.innerHTML = "";
    STAGE_KEYS.forEach(function (key, i) {
      var state = i < stageIndex ? "done" : i === stageIndex ? "active" : "pending";
      var seg = document.createElement("div");
      seg.className = "ld-seg" + (state !== "pending" ? " ld-seg--" + state : "");
      seg.setAttribute("aria-label", t("stage_" + key));
      canvasEl.appendChild(seg);
    });
  }

  function renderTrail() {
    if (!trailEl) return;
    trailEl.innerHTML = "";
    STAGE_KEYS.forEach(function (key, i) {
      var state = i < stageIndex ? "done" : i === stageIndex ? "active" : "pending";
      var node = document.createElement("div");
      node.className = "ld-trail-node ld-trail-node--" + state;
      var badge = document.createElement("span");
      badge.className = "ld-trail-badge";
      badge.innerHTML = TRAIL_ICONS[i];
      var label = document.createElement("span");
      label.className = "ld-trail-label";
      label.textContent = t("stage_" + key);
      node.appendChild(badge);
      node.appendChild(label);
      trailEl.appendChild(node);
      if (i < STAGE_KEYS.length - 1) {
        var line = document.createElement("div");
        line.className = "ld-trail-line" + (i < stageIndex ? " ld-trail-line--done" : "");
        trailEl.appendChild(line);
      }
    });
  }

  function render() {
    renderCanvas();
    renderTrail();
  }
  render();

  function advanceStage() {
    stageIndex = Math.min(stageIndex + 1, STAGE_KEYS.length - 1);
    render();
  }

  function appendMessage(text, who) {
    var div = document.createElement("div");
    div.className = "chat-msg " + who;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function appendTyping() {
    var div = document.createElement("div");
    div.className = "chat-msg bot typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    typingStartedAt = Date.now();
    return div;
  }

  // Garante que o "digitando..." fique visível um tempo mínimo, mesmo
  // quando a resposta do servidor chega rápido — sem isso, com a rede
  // rápida, ele pisca e some quase instantaneamente, o que parece menos
  // natural do que o balão de chat do site.
  var TYPING_MIN_MS = 700;
  var typingStartedAt = 0;
  function afterTypingDelay(fn) {
    var elapsed = Date.now() - typingStartedAt;
    setTimeout(fn, Math.max(0, TYPING_MIN_MS - elapsed));
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function showError(text) {
    if (!errorEl) return;
    errorEl.textContent = text;
    errorEl.hidden = false;
    inputRow.classList.remove("ld-shake");
    void inputRow.offsetWidth; // reinicia a animação se o erro se repetir
    inputRow.classList.add("ld-shake");
  }

  function formatPhone(digits) {
    digits = digits.slice(0, 11);
    if (digits.length <= 2) return digits.replace(/(\d*)/, "($1");
    if (digits.length <= 6) return digits.replace(/(\d{2})(\d*)/, "($1) $2");
    if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d*)/, "($1) $2-$3");
    return digits.replace(/(\d{2})(\d{5})(\d*)/, "($1) $2-$3");
  }

  inputEl.addEventListener("input", function () {
    if (FIELDS[stageIndex] === "telefone") {
      var digits = inputEl.value.replace(/\D/g, "").slice(0, 11);
      inputEl.value = formatPhone(digits);
    }
  });

  function setupInputForStage() {
    var field = FIELDS[stageIndex];
    if (field === "telefone") {
      inputEl.type = "tel";
      inputEl.inputMode = "numeric";
      inputEl.placeholder = t("ph_telefone");
    } else if (field === "email") {
      inputEl.type = "email";
      inputEl.inputMode = "email";
      inputEl.placeholder = t("ph_email");
    } else {
      inputEl.type = "text";
      inputEl.inputMode = "text";
      inputEl.placeholder = "";
    }
  }

  function showQuestion() {
    var key = QUESTION_KEY[stageIndex];
    if (!key) return;
    var typing = messagesEl.querySelector(".chat-msg.typing");
    if (typing) typing.remove();
    clearError();
    setupInputForStage();
    appendMessage(t(key), "bot");
  }

  function showIntro() {
    inputRow.style.display = "none";
    messagesEl.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "ld-start";
    var p = document.createElement("p");
    p.className = "ld-start-text";
    p.textContent = t("intro_text");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ld-start-btn";
    btn.textContent = t("intro_button");
    btn.addEventListener("click", startDemo);
    wrap.appendChild(p);
    wrap.appendChild(btn);
    messagesEl.appendChild(wrap);
  }

  function showCta() {
    ended = true;
    inputRow.style.display = "none";
    if (errorEl) errorEl.hidden = true;
    var typing = messagesEl.querySelector(".chat-msg.typing");
    if (typing) typing.remove();
    appendMessage(t("cta_bot_message"), "bot");
    var waUrl = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(t("cta_message"));
    var box = document.createElement("div");
    box.className = "live-demo-cta";
    box.innerHTML =
      '<a class="live-demo-cta-wa" href="' + waUrl + '" target="_blank" rel="noopener noreferrer">' +
      ICON_WHATSAPP + " " + t("cta_button") + "</a>" +
      '<a class="live-demo-cta-alt" href="contato.html">' + t("cta_alt") + "</a>";
    ctaWrap.appendChild(box);
  }

  function send(payload) {
    return fetch(EVA_STUDIO_ORIGIN + "/api/widget/" + AGENT_ID + "/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ contactId: contactId }, payload)),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        afterTypingDelay(function () {
          if (data.status === "ended") showCta();
          else showQuestion();
        });
        return data;
      })
      .catch(function () {
        var typing = messagesEl.querySelector(".chat-msg.typing");
        if (typing) typing.remove();
        appendMessage(t("network_error"), "bot");
      });
  }

  function startDemo() {
    if (started) return;
    started = true;
    inputRow.style.display = "";
    messagesEl.innerHTML = "";
    appendTyping(); // feedback imediato — a resposta do servidor pode levar um instante
    enterFullscreen();
    advanceStage(); // Início -> Nome
    send({});
  }

  function submit() {
    if (ended) return;
    var raw = inputEl.value.trim();
    if (!raw) return;
    var field = FIELDS[stageIndex];
    var value = raw;
    if (field === "telefone") {
      var digits = raw.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 11) { showError(t("err_telefone")); return; }
      value = formatPhone(digits);
    } else if (field === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) { showError(t("err_email")); return; }
    }
    clearError();
    answers[field] = value;
    inputEl.value = "";
    appendMessage(value, "user");
    appendTyping(); // feedback imediato, antes da resposta do servidor chegar
    advanceStage();
    send({ text: value });
  }
  sendBtn.addEventListener("click", submit);
  inputEl.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });

  showIntro();
})();
