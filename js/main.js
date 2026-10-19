(function () {
  "use strict";

  /* ===== Loader (counts up 0-100%, only once per browser session) ===== */
  (function () {
    var SESSION_KEY = "eva_loaded";

    if (sessionStorage.getItem(SESSION_KEY)) {
      document.body.classList.add("is-loaded");
      return;
    }

    var pctEl = document.getElementById("loaderPct");
    var barEl = document.getElementById("loaderBarFill");
    if (!pctEl || !barEl) return;

    var duration = 1400;
    var start = null;

    function tick(ts) {
      if (!start) start = ts;
      var elapsed = ts - start;
      var pct = Math.min(100, Math.round((elapsed / duration) * 100));
      pctEl.innerHTML = "<b>" + pct + "</b>%";
      barEl.style.width = pct + "%";
      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        sessionStorage.setItem(SESSION_KEY, "1");
        setTimeout(function () {
          document.body.classList.add("is-loaded");
        }, 300);
      }
    }
    requestAnimationFrame(tick);
  })();


  /* ===== Animated background (moving blobs, scoped to the hero section) ===== */
  var canvas = document.getElementById("bg-canvas");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var heroEl = canvas.parentElement;
    var w, h, dpr;
    var pointer = { x: 0.5, y: 0.4, tx: 0.5, ty: 0.4 };
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = heroEl.offsetWidth;
      h = heroEl.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();

    window.addEventListener("pointermove", function (e) {
      var rect = heroEl.getBoundingClientRect();
      pointer.tx = (e.clientX - rect.left) / w;
      pointer.ty = (e.clientY - rect.top) / h;
    });

    var blobs = [
      { baseX: 0.18, baseY: 0.25, r: 0.42, hue: "48,140,232", speed: 0.55, phase: 0 },
      { baseX: 0.82, baseY: 0.18, r: 0.36, hue: "153,204,255", speed: 0.4, phase: 2 },
      { baseX: 0.5, baseY: 0.85, r: 0.5, hue: "48,140,232", speed: 0.3, phase: 4 },
      { baseX: 0.9, baseY: 0.75, r: 0.3, hue: "153,204,255", speed: 0.62, phase: 1.3 }
    ];

    var t = 0;

    var draw = function () {
      t += 0.0035;

      pointer.x += (pointer.tx - pointer.x) * 0.03;
      pointer.y += (pointer.ty - pointer.y) * 0.03;

      ctx.clearRect(0, 0, w, h);

      ctx.globalCompositeOperation = "screen";

      blobs.forEach(function (b, i) {
        var driftX = Math.sin(t * b.speed + b.phase) * 0.06;
        var driftY = Math.cos(t * b.speed * 0.8 + b.phase) * 0.06;
        var parallax = (i % 2 === 0 ? 1 : -1) * 0.03;

        var cx = (b.baseX + driftX + (pointer.x - 0.5) * parallax) * w;
        var cy = (b.baseY + driftY + (pointer.y - 0.5) * parallax) * h;
        var r = b.r * Math.max(w, h) * (0.9 + Math.sin(t * b.speed + b.phase) * 0.06);

        var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, "rgba(" + b.hue + ",0.22)");
        grad.addColorStop(1, "rgba(" + b.hue + ",0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = "source-over";

      if (!reduceMotion) requestAnimationFrame(draw);
    };
    draw();
  }

  /* ===== Header scroll state ===== */
  var header = document.getElementById("site-header");
  function onScroll() {
    if (window.scrollY > 40) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ===== Mobile menu ===== */
  var toggle = document.getElementById("menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  toggle.addEventListener("click", function () {
    mobileMenu.classList.toggle("is-open");
    toggle.classList.toggle("is-active");
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      mobileMenu.classList.remove("is-open");
    });
  });

  /* ===== Scroll reveals ===== */
  var revealEls = document.querySelectorAll(".reveal, .hero-title");
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  revealEls.forEach(function (el) { io.observe(el); });

  /* ===== Mega menu (Soluções dropdown) ===== */
  document.querySelectorAll(".nav-item").forEach(function (item) {
    var btn = item.querySelector("button");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var wasOpen = item.classList.contains("is-open");
      document.querySelectorAll(".nav-item.is-open").forEach(function (i) { i.classList.remove("is-open"); });
      if (!wasOpen) item.classList.add("is-open");
    });
  });
  document.addEventListener("click", function () {
    document.querySelectorAll(".nav-item.is-open").forEach(function (i) { i.classList.remove("is-open"); });
  });

  /* ===== FAQ accordion ===== */
  document.querySelectorAll(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.parentElement;
      var a = item.querySelector(".faq-a");
      var icn = q.querySelector(".faq-icn");
      var wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(function (i) {
        i.classList.remove("open");
        i.querySelector(".faq-a").style.maxHeight = null;
        i.querySelector(".faq-icn").textContent = "+";
      });
      if (!wasOpen) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
        icn.textContent = "−";
      }
    });
  });

  /* ===== AI chat widget =====
     Passou a falar com o Eva Studio (agente "Vendedor Virtual") em vez de
     chamar o webhook do n8n direto — o Eva Studio delega pro MESMO webhook
     por baixo dos panos (agent.outboundUrl), então a resposta da IA é
     idêntica; a diferença é que agora a conversa fica registrada e o lead
     cai na página Leads do Eva Studio. EVA_STUDIO_ORIGIN aponta pro
     localhost enquanto testamos — trocar pra https://evapp.vercel.app antes
     de subir esse site de verdade. */
  var chatFab = document.getElementById("chatFab");
  if (chatFab) {
    var EVA_STUDIO_ORIGIN = "https://evapp.vercel.app";
    var EVA_AGENT_ID = "d7a79443-3a8b-40c9-b493-743127938986";
    var WEBHOOK_URL = EVA_STUDIO_ORIGIN + "/api/widget/" + EVA_AGENT_ID + "/message";
    var CHAT_KEY = "eva_chat_messages";
    var SESSION_KEY = "eva_chat_session";
    var DRAFT_KEY = "eva_chat_draft";
    var OPEN_KEY = "eva_chat_open";

    var sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = "site-" + Math.random().toString(36).slice(2);
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    var chatPanel = document.getElementById("chatPanel");
    var chatBody = document.getElementById("chatBody");
    var chatInput = document.getElementById("chatInput");
    var micBtn = document.getElementById("micBtn");

    function saveMessages(msgs) { sessionStorage.setItem(CHAT_KEY, JSON.stringify(msgs)); }
    function loadMessages() {
      try { return JSON.parse(sessionStorage.getItem(CHAT_KEY) || "[]"); }
      catch (e) { return []; }
    }

    function escapeHtml(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function inlineMarkdown(s) {
      s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
      return s;
    }

    function isTableSeparator(line) {
      return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
    }

    function splitTableRow(line) {
      var cells = line.split("|").map(function (c) { return c.trim(); });
      if (cells.length && cells[0] === "") cells.shift();
      if (cells.length && cells[cells.length - 1] === "") cells.pop();
      return cells;
    }

    function renderMarkdown(raw) {
      var lines = escapeHtml(raw).split("\n");
      var html = "";
      var inList = false;
      var i = 0;

      function closeList() { if (inList) { html += "</ul>"; inList = false; } }

      while (i < lines.length) {
        var line = lines[i];

        if (line.indexOf("|") !== -1 && lines[i + 1] && isTableSeparator(lines[i + 1])) {
          closeList();
          var headerCells = splitTableRow(line);
          html += '<div class="chat-table-wrap"><table class="chat-table"><thead><tr>';
          headerCells.forEach(function (c) { html += "<th>" + inlineMarkdown(c) + "</th>"; });
          html += "</tr></thead><tbody>";
          i += 2;
          while (i < lines.length && lines[i].indexOf("|") !== -1) {
            var rowCells = splitTableRow(lines[i]);
            html += "<tr>";
            rowCells.forEach(function (c) { html += "<td>" + inlineMarkdown(c) + "</td>"; });
            html += "</tr>";
            i++;
          }
          html += "</tbody></table></div>";
          continue;
        }

        var h = line.match(/^(#{1,6})\s+(.*)$/);
        if (h) {
          closeList();
          var level = Math.min(h[1].length + 2, 6);
          html += "<h" + level + ">" + inlineMarkdown(h[2]) + "</h" + level + ">";
          i++; continue;
        }

        var li = line.match(/^\s*[-*]\s+(.*)$/);
        if (li) {
          if (!inList) { html += "<ul>"; inList = true; }
          html += "<li>" + inlineMarkdown(li[1]) + "</li>";
          i++; continue;
        }

        closeList();
        if (line.trim() === "") { i++; continue; }
        html += "<p>" + inlineMarkdown(line) + "</p>";
        i++;
      }
      closeList();
      return html;
    }

    function renderMsg(text, who) {
      var d = document.createElement("div");
      d.className = "chat-msg " + who;
      if (who === "bot") {
        d.innerHTML = renderMarkdown(text);
      } else {
        d.textContent = text;
      }
      chatBody.appendChild(d);
      chatBody.scrollTop = chatBody.scrollHeight;
      return d;
    }

    function appendMsg(text, who) {
      renderMsg(text, who);
      var msgs = loadMessages();
      msgs.push({ text: text, who: who });
      saveMessages(msgs);
    }

    function appendTyping() {
      var d = document.createElement("div");
      d.className = "chat-msg bot typing";
      d.innerHTML = "<span></span><span></span><span></span>";
      chatBody.appendChild(d);
      chatBody.scrollTop = chatBody.scrollHeight;
      return d;
    }

    var SUGGESTIONS = [
      "Como funciona um agente de IA?",
      "Quero automatizar meu negócio",
      "Quais integrações vocês fazem?"
    ];

    function renderSuggestions() {
      if (document.getElementById("chatSuggestions")) return;
      var wrap = document.createElement("div");
      wrap.className = "chat-suggestions";
      wrap.id = "chatSuggestions";
      SUGGESTIONS.forEach(function (text) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.textContent = text;
        chip.addEventListener("click", function () {
          chatInput.value = text;
          sendChat();
        });
        wrap.appendChild(chip);
      });
      chatBody.appendChild(wrap);
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    function removeSuggestions() {
      var existing = document.getElementById("chatSuggestions");
      if (existing) existing.remove();
    }

    function toggleChat() {
      chatPanel.classList.toggle("open");
      sessionStorage.setItem(OPEN_KEY, chatPanel.classList.contains("open") ? "1" : "0");
    }
    chatFab.addEventListener("click", toggleChat);
    document.getElementById("chatClose").addEventListener("click", toggleChat);

    (function restoreChat() {
      var stored = loadMessages();
      if (stored.length > 0) {
        chatBody.innerHTML = "";
        stored.forEach(function (m) { renderMsg(m.text, m.who); });
        if (stored.length === 1) renderSuggestions();
      } else {
        var existing = chatBody.querySelector(".chat-msg");
        if (existing) {
          saveMessages([{ text: existing.textContent, who: "bot" }]);
          renderSuggestions();
        }
      }
      if (sessionStorage.getItem(OPEN_KEY) === "1") chatPanel.classList.add("open");
      var draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft) chatInput.value = draft;
    })();

    // Botões de opção (bloco de Captura com menu, se o fluxo do Eva Studio
    // tiver algum) — mesmo visual dos chips de sugestão, mas mandam optionId
    // em vez de repetir o texto digitado.
    function renderOptionChips(options) {
      var wrap = document.createElement("div");
      wrap.className = "chat-suggestions";
      options.forEach(function (opt) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.textContent = opt.label;
        chip.addEventListener("click", function () {
          wrap.remove();
          appendMsg(opt.label, "user");
          sendToEva({ optionId: opt.id });
        });
        wrap.appendChild(chip);
      });
      chatBody.appendChild(wrap);
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    async function sendToEva(payload) {
      var typing = appendTyping();
      try {
        var res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.assign(
            { contactId: sessionId, lang: (window.EvaI18n && window.EvaI18n.getLang()) || "pt" },
            payload
          ))
        });
        var data = await res.json();
        typing.remove();
        var messages = data.messages || [];
        if (messages.length === 0) {
          appendMsg("Desculpe, não consegui responder agora.", "bot");
          return;
        }
        messages.forEach(function (m) {
          appendMsg(m.text, "bot");
          if (m.options && m.options.length) renderOptionChips(m.options);
        });
      } catch (err) {
        typing.remove();
        appendMsg("Assistente indisponível no momento. Fale com a gente por e-mail!", "bot");
      }
    }

    async function sendChat() {
      var msg = chatInput.value.trim();
      if (!msg) return;
      removeSuggestions();
      appendMsg(msg, "user");
      chatInput.value = "";
      sessionStorage.removeItem(DRAFT_KEY);
      await sendToEva({ text: msg });
    }
    document.getElementById("chatSend").addEventListener("click", sendChat);
    chatInput.addEventListener("keypress", function (e) { if (e.key === "Enter") sendChat(); });
    chatInput.addEventListener("input", function (e) { sessionStorage.setItem(DRAFT_KEY, e.target.value); });

    /* ===== Anexos: imagem, PDF, Word e texto (até 3 MB) ===== */
    var MAX_ANEXO = 3 * 1024 * 1024;
    var attachBtn = document.getElementById("attachBtn");
    var chatFile = document.getElementById("chatFile");

    // texto do chat que não passa pelo dicionário do site: escolhe pelo idioma atual
    function tr(pt, en, es) {
      var l = (window.EvaI18n && window.EvaI18n.getLang()) || "pt";
      return l === "en" ? en : l === "es" ? es : pt;
    }

    function handleFile(file) {
      if (!file) return;
      if (file.size > MAX_ANEXO) {
        appendMsg(tr(
          "Esse arquivo passa de 3 MB. Pode mandar um menor?",
          "That file is over 3 MB. Could you send a smaller one?",
          "Ese archivo supera los 3 MB. ¿Puedes enviar uno más pequeño?"), "bot");
        return;
      }
      var reader = new FileReader();
      reader.onloadend = function () {
        var base64 = String(reader.result || "").split(",")[1];
        if (!base64) return;
        // se a pessoa já digitou algo, vai junto como legenda do arquivo
        var legenda = chatInput.value.trim();
        chatInput.value = "";
        sessionStorage.removeItem(DRAFT_KEY);
        removeSuggestions();
        appendMsg("📎 " + file.name + (legenda ? " • " + legenda : ""), "user");
        attachBtn.classList.add("is-busy");
        sendToEva({
          text: legenda || undefined,
          attachment: { base64: base64, mime: file.type || "application/octet-stream", name: file.name }
        }).then(function () { attachBtn.classList.remove("is-busy"); });
      };
      reader.readAsDataURL(file);
    }

    if (attachBtn && chatFile) {
      attachBtn.addEventListener("click", function () { chatFile.click(); });
      chatFile.addEventListener("change", function () {
        handleFile(chatFile.files && chatFile.files[0]);
        chatFile.value = "";
      });
    }

    var mediaRecorder, audioChunks = [], recording = false;
    var recordStartTime = 0, recordingInterval = null, lastRecordingDuration = 0;
    var recordingTimerEl = null;

    function formatDuration(ms) {
      var totalSec = Math.floor(ms / 1000);
      var m = Math.floor(totalSec / 60);
      var s = totalSec % 60;
      return m + ":" + (s < 10 ? "0" : "") + s;
    }

    function showRecordingTimer() {
      chatInput.style.display = "none";
      recordingTimerEl = document.createElement("div");
      recordingTimerEl.className = "recording-timer";
      recordingTimerEl.innerHTML = '<span class="rec-dot"></span><span class="rec-time">0:00</span>';
      chatInput.parentNode.insertBefore(recordingTimerEl, chatInput);
    }

    function updateRecordingTimer() {
      if (!recordingTimerEl) return;
      recordingTimerEl.querySelector(".rec-time").textContent = formatDuration(Date.now() - recordStartTime);
    }

    function hideRecordingTimer() {
      if (recordingTimerEl) { recordingTimerEl.remove(); recordingTimerEl = null; }
      chatInput.style.display = "";
    }

    async function toggleRecording() {
      if (!recording) {
        try {
          var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];
          mediaRecorder.ondataavailable = function (e) { audioChunks.push(e.data); };
          mediaRecorder.onstop = sendAudio;
          mediaRecorder.start();
          recording = true;
          micBtn.classList.add("recording");
          recordStartTime = Date.now();
          showRecordingTimer();
          recordingInterval = setInterval(updateRecordingTimer, 200);
        } catch (err) {
          appendMsg("Não consegui acessar o microfone.", "bot");
        }
      } else {
        lastRecordingDuration = Date.now() - recordStartTime;
        clearInterval(recordingInterval);
        hideRecordingTimer();
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(function (t) { t.stop(); });
        recording = false;
        micBtn.classList.remove("recording");
      }
    }
    micBtn.addEventListener("click", toggleRecording);

    async function sendAudio() {
      // Safari grava mp4 e o Chrome webm: usa o tipo que o navegador realmente gravou.
      var blob = new Blob(audioChunks, { type: (mediaRecorder && mediaRecorder.mimeType) || "audio/webm" });
      var reader = new FileReader();
      reader.onloadend = async function () {
        var base64 = reader.result.split(",")[1];
        removeSuggestions();
        appendMsg("🎙️ Mensagem de voz (" + formatDuration(lastRecordingDuration) + ")", "user");
        var typing = appendTyping();
        try {
          var res = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio_base64: base64, audio_mime: blob.type || "audio/webm", contactId: sessionId, lang: (window.EvaI18n && window.EvaI18n.getLang()) || "pt" })
          });
          var data = await res.json();
          typing.remove();
          var msgs = data.messages || [];
          if (msgs.length === 0) {
            appendMsg("Desculpe, não consegui entender o áudio.", "bot");
          } else {
            msgs.forEach(function (m) {
              appendMsg(m.text, "bot");
              if (m.options && m.options.length) renderOptionChips(m.options);
            });
          }
        } catch (err) {
          typing.remove();
          appendMsg("Assistente indisponível no momento. Fale com a gente por e-mail!", "bot");
        }
      };
      reader.readAsDataURL(blob);
    }
  }

  /* ===== Lead capture modal (Orçamento / Contato -> WhatsApp) ===== */
  var leadModal = document.getElementById("leadModal");
  if (leadModal) {
    var WHATSAPP_NUMBER = "5521969156116";

    var FLOWS = {
      orcamento: {
        title: "Fazer um orçamento",
        questions: [
          { key: "nome", q: "Qual seu nome?" },
          { key: "empresa", q: "Qual o nome da sua empresa?" },
          { key: "nicho", q: "Qual seu nicho de atuação?" },
          { key: "desafio", q: "Qual seu maior desafio hoje?" },
          { key: "faturamento", q: "Qual seu faturamento mensal aproximado?" },
          { key: "email", q: "Qual o seu e-mail?", tipo: "email" },
          { key: "whatsapp", q: "Qual o seu número de WhatsApp?", tipo: "telefone" }
        ],
        buildMessage: function (a) {
          return "Olá! Vim pelo site da Eva Holding e quero um orçamento.\n\n" +
            "*Nome:* " + a.nome + "\n" +
            "*Empresa:* " + a.empresa + "\n" +
            "*Nicho de atuação:* " + a.nicho + "\n" +
            "*Maior desafio:* " + a.desafio + "\n" +
            "*Faturamento mensal:* " + a.faturamento + "\n" +
            "*E-mail:* " + a.email + "\n" +
            "*WhatsApp:* " + a.whatsapp;
        }
      },
      contato: {
        title: "Entrar em contato",
        questions: [
          { key: "nome", q: "Qual seu nome?" },
          { key: "mensagem", q: "O que você gostaria de saber ou precisa?" },
          { key: "contatoInfo", q: "Qual o seu e-mail ou WhatsApp pra te responder?", tipo: "contato" }
        ],
        buildMessage: function (a) {
          return "Olá! Vim pelo site da Eva Holding.\n\n" +
            "*Nome:* " + a.nome + "\n" +
            "*Mensagem:* " + a.mensagem + "\n" +
            "*Contato:* " + a.contatoInfo;
        }
      }
    };

    // Textos do formulário em inglês e espanhol. A mensagem que chega ao WhatsApp da
    // equipe continua em português; só o que o visitante lê é traduzido.
    var LTXT = {
      "Fazer um orçamento": ["Get a quote", "Pedir un presupuesto"],
      "Entrar em contato": ["Get in touch", "Ponerse en contacto"],
      "Qual seu nome?": ["What's your name?", "¿Cuál es su nombre?"],
      "Qual o nome da sua empresa?": ["What's your company's name?", "¿Cuál es el nombre de su empresa?"],
      "Qual seu nicho de atuação?": ["What industry are you in?", "¿En qué sector actúa?"],
      "Qual seu maior desafio hoje?": ["What's your biggest challenge today?", "¿Cuál es su mayor desafío hoy?"],
      "Qual seu faturamento mensal aproximado?": ["What's your approximate monthly revenue?", "¿Cuál es su facturación mensual aproximada?"],
      "Qual o seu e-mail?": ["What's your email?", "¿Cuál es su correo electrónico?"],
      "Qual o seu número de WhatsApp?": ["What's your WhatsApp number?", "¿Cuál es su número de WhatsApp?"],
      "O que você gostaria de saber ou precisa?": ["What would you like to know, or what do you need?", "¿Qué le gustaría saber o qué necesita?"],
      "Qual o seu e-mail ou WhatsApp pra te responder?": ["What's your email or WhatsApp so we can reply?", "¿Cuál es su correo o WhatsApp para responderle?"],
      "Voltar": ["Back", "Volver"],
      "Próximo": ["Next", "Siguiente"],
      "Enviar pelo WhatsApp": ["Send via WhatsApp", "Enviar por WhatsApp"],
      "Tudo certo!": ["All set!", "¡Todo listo!"],
      "Abrimos o WhatsApp com sua mensagem pronta, é só enviar por lá.": ["We opened WhatsApp with your message ready, just hit send there.", "Abrimos WhatsApp con su mensaje listo, solo envíelo desde allí."],
      "Fechar": ["Close", "Cerrar"]
    };
    function idioma() { return (window.EvaI18n && window.EvaI18n.getLang()) || "pt"; }
    function lt(pt) {
      var l = idioma();
      var v = LTXT[pt];
      return l === "pt" || !v ? pt : (l === "en" ? v[0] : v[1]);
    }
    function perguntaDe(n, total) {
      var l = idioma();
      return l === "en" ? "Question " + n + " of " + total : l === "es" ? "Pregunta " + n + " de " + total : "Pergunta " + n + " de " + total;
    }

    // ── Validação do e-mail e do celular ───────────────────────────────────
    // E-mail: algo@dominio.ext, com extensão de verdade (.com, .ai, .com.br...).
    // Celular brasileiro: DDD de 2 dígitos + 9 + 8 números, ex.: (21) 98888-7766.
    var DDD_VALIDOS = "11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99".split(" ");

    function emailValido(txt) {
      var e = String(txt).trim().toLowerCase();
      if (e.length > 120 || /\s/.test(e)) return null;
      // parte local sem pontos soltos; domínio com rótulos válidos e extensão só de letras
      var ok = /^[a-z0-9]+([._%+-][a-z0-9]+)*@([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,24}$/.test(e);
      return ok ? e : null;
    }

    function celularValido(txt) {
      var d = String(txt).replace(/\D/g, "");
      if (d.length === 13 && d.indexOf("55") === 0) d = d.slice(2);   // +55
      if (d.length === 12 && d.charAt(0) === "0") d = d.slice(1);     // 0 na frente do DDD
      if (d.length !== 11) return null;
      if (DDD_VALIDOS.indexOf(d.slice(0, 2)) === -1) return null;
      if (d.charAt(2) !== "9") return null;                           // celular começa com 9
      if (!/[6-9]/.test(d.charAt(3))) return null;
      if (/^(\d)\1+$/.test(d.slice(2))) return null;                  // 999999999 e afins
      return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    }

    // formata enquanto a pessoa digita: (21) 98888-7766
    function mascaraCelular(txt) {
      var d = String(txt).replace(/\D/g, "").slice(0, 11);
      if (!d) return "";
      if (d.length <= 2) return "(" + d;
      if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
      if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
      return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    }

    var ERROS = {
      email: ["Digite um e-mail válido, como nome@empresa.com", "Enter a valid email, like name@company.com", "Ingrese un correo válido, como nombre@empresa.com"],
      telefone: ["Digite o celular com DDD, como (21) 98888-7766", "Enter a Brazilian mobile number with area code, like (21) 98888-7766", "Ingrese un celular brasileño con código de área, como (21) 98888-7766"],
      contato: ["Digite um e-mail válido (nome@empresa.com) ou um celular com DDD ((21) 98888-7766)", "Enter a valid email (name@company.com) or a mobile number with area code ((21) 98888-7766)", "Ingrese un correo válido (nombre@empresa.com) o un celular con código de área ((21) 98888-7766)"],
      vazio: ["Preencha para continuar", "Please fill this in to continue", "Complete este campo para continuar"]
    };
    function erroDe(tipo) {
      var l = idioma();
      var v = ERROS[tipo] || ERROS.vazio;
      return l === "en" ? v[1] : l === "es" ? v[2] : v[0];
    }

    // devolve { valor } já normalizado, ou { erro } com a mensagem
    function validar(tipo, txt) {
      if (!txt) return { erro: erroDe("vazio") };
      if (tipo === "email") { var e = emailValido(txt); return e ? { valor: e } : { erro: erroDe("email") }; }
      if (tipo === "telefone") { var c = celularValido(txt); return c ? { valor: c } : { erro: erroDe("telefone") }; }
      if (tipo === "contato") {
        if (txt.indexOf("@") !== -1) { var e2 = emailValido(txt); return e2 ? { valor: e2 } : { erro: erroDe("contato") }; }
        var c2 = celularValido(txt);
        return c2 ? { valor: c2 } : { erro: erroDe("contato") };
      }
      return { valor: txt };
    }

    var currentFlow = null;
    var stepIndex = 0;
    var answers = {};

    var modalBody = document.getElementById("leadModalBody");
    var progressFill = document.getElementById("leadProgressFill");

    function openLeadModal(flowKey) {
      currentFlow = FLOWS[flowKey];
      stepIndex = 0;
      answers = {};
      leadModal.classList.add("open");
      renderStep();
    }

    function closeLeadModal() {
      leadModal.classList.remove("open");
    }

    function renderStep() {
      var total = currentFlow.questions.length;
      var q = currentFlow.questions[stepIndex];
      var isLast = stepIndex === total - 1;

      progressFill.style.width = ((stepIndex / total) * 100) + "%";

      modalBody.innerHTML =
        '<p class="lead-step-label">' + lt(currentFlow.title) + " · " + perguntaDe(stepIndex + 1, total) + '</p>' +
        '<h3 class="lead-question">' + lt(q.q) + '</h3>' +
        '<input type="' + (q.tipo === "email" ? "email" : q.tipo === "telefone" ? "tel" : "text") + '" class="lead-input" id="leadAnswerInput"' +
          (q.tipo === "email" ? ' inputmode="email" autocapitalize="off" placeholder="nome@empresa.com"' : "") +
          (q.tipo === "telefone" ? ' inputmode="tel" placeholder="(21) 98888-7766"' : "") +
          (q.tipo === "contato" ? ' placeholder="nome@empresa.com / (21) 98888-7766"' : "") +
          ' value="' + (answers[q.key] || "").replace(/"/g, "&quot;") + '" autocomplete="off">' +
        '<p class="lead-error" id="leadError" role="alert" hidden></p>' +
        '<div class="lead-actions">' +
        (stepIndex > 0 ? '<button type="button" class="btn btn--ghost" id="leadBack">' + lt("Voltar") + '</button>' : "<span></span>") +
        '<button type="button" class="btn btn--solid" id="leadNext">' + lt(isLast ? "Enviar pelo WhatsApp" : "Próximo") + "</button>" +
        "</div>";

      var input = document.getElementById("leadAnswerInput");
      input.focus();
      input.addEventListener("keypress", function (e) { if (e.key === "Enter") handleNext(); });
      // máscara do celular enquanto digita; tirar o erro assim que a pessoa corrige
      input.addEventListener("input", function () {
        var ehNumero = q.tipo === "telefone" || (q.tipo === "contato" && input.value.indexOf("@") === -1 && /^[\d\s()+-]*$/.test(input.value));
        if (ehNumero) input.value = mascaraCelular(input.value);
        input.style.borderColor = "";
        var er = document.getElementById("leadError");
        if (er) er.hidden = true;
      });

      var backBtn = document.getElementById("leadBack");
      if (backBtn) {
        backBtn.addEventListener("click", function () {
          answers[q.key] = input.value.trim();
          stepIndex--;
          renderStep();
        });
      }
      document.getElementById("leadNext").addEventListener("click", handleNext);
    }

    function handleNext() {
      var q = currentFlow.questions[stepIndex];
      var input = document.getElementById("leadAnswerInput");
      var res = validar(q.tipo, input.value.trim());
      if (res.erro) {
        var er = document.getElementById("leadError");
        if (er) { er.textContent = res.erro; er.hidden = false; }
        input.focus();
        input.style.borderColor = "#ff5b5b";
        return;
      }
      answers[q.key] = res.valor;

      if (stepIndex === currentFlow.questions.length - 1) {
        submitLead();
      } else {
        stepIndex++;
        renderStep();
      }
    }

    function submitLead() {
      var message = currentFlow.buildMessage(answers);
      // a equipe lê em português, mas precisa saber em que idioma responder
      if (idioma() !== "pt") message += "\n\n(Visitante usou o site em " + (idioma() === "en" ? "inglês" : "espanhol") + ".)";
      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
      window.open(url, "_blank");

      progressFill.style.width = "100%";
      modalBody.innerHTML =
        '<p class="lead-step-label">' + lt("Tudo certo!") + '</p>' +
        '<h3 class="lead-question">' + lt("Abrimos o WhatsApp com sua mensagem pronta, é só enviar por lá.") + '</h3>' +
        '<div class="lead-actions"><span></span><button type="button" class="btn btn--solid" id="leadDone">' + lt("Fechar") + '</button></div>';
      document.getElementById("leadDone").addEventListener("click", closeLeadModal);
    }

    document.querySelectorAll(".lead-trigger").forEach(function (btn) {
      btn.addEventListener("click", function () { openLeadModal(btn.getAttribute("data-flow")); });
    });
    document.getElementById("leadModalClose").addEventListener("click", closeLeadModal);
    document.getElementById("leadModalBackdrop").addEventListener("click", closeLeadModal);
  }
})();
