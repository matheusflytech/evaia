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

  document.getElementById("year").textContent = new Date().getFullYear();

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

  /* ===== AI chat widget ===== */
  var chatFab = document.getElementById("chatFab");
  if (chatFab) {
    var WEBHOOK_URL = "https://integrations-hook.beeno.ai/webhook/evaai";
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

    function renderMsg(text, who) {
      var d = document.createElement("div");
      d.className = "chat-msg " + who;
      d.textContent = text;
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
      "Quanto custa um site?",
      "Como funciona o agente de IA?",
      "Quero automatizar meu negócio"
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

    async function sendChat() {
      var msg = chatInput.value.trim();
      if (!msg) return;
      removeSuggestions();
      appendMsg(msg, "user");
      chatInput.value = "";
      sessionStorage.removeItem(DRAFT_KEY);
      var typing = appendTyping();
      try {
        var res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg, sessionId: sessionId })
        });
        var data = await res.json();
        typing.remove();
        appendMsg(data.reply || "Desculpe, não consegui responder agora.", "bot");
      } catch (err) {
        typing.remove();
        appendMsg("Assistente indisponível no momento. Fale com a gente por e-mail!", "bot");
      }
    }
    document.getElementById("chatSend").addEventListener("click", sendChat);
    chatInput.addEventListener("keypress", function (e) { if (e.key === "Enter") sendChat(); });
    chatInput.addEventListener("input", function (e) { sessionStorage.setItem(DRAFT_KEY, e.target.value); });

    var mediaRecorder, audioChunks = [], recording = false;
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
        } catch (err) {
          appendMsg("Não consegui acessar o microfone.", "bot");
        }
      } else {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(function (t) { t.stop(); });
        recording = false;
        micBtn.classList.remove("recording");
      }
    }
    micBtn.addEventListener("click", toggleRecording);

    async function sendAudio() {
      var blob = new Blob(audioChunks, { type: "audio/webm" });
      var reader = new FileReader();
      reader.onloadend = async function () {
        var base64 = reader.result.split(",")[1];
        removeSuggestions();
        appendMsg("🎙️ Mensagem de voz enviada", "user");
        var typing = appendTyping();
        try {
          var res = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: base64, mimeType: "audio/webm", sessionId: sessionId })
          });
          var data = await res.json();
          typing.remove();
          appendMsg(data.reply || "Desculpe, não consegui entender o áudio.", "bot");
        } catch (err) {
          typing.remove();
          appendMsg("Assistente indisponível no momento. Fale com a gente por e-mail!", "bot");
        }
      };
      reader.readAsDataURL(blob);
    }
  }
})();
