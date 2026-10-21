/* ===== Topo da home: automações em loop (cerca de 28 s, três cenas) =====
   1. compra aprovada: um gatilho dispara quatro tarefas ao mesmo tempo;
   2. carrinho abandonado: espera, lembrete, decisão e fechamento;
   3. pedido no marketplace: baixa de estoque, painel e alerta de reposição.
   Cenário ensaiado, sem rede. Textos em português, inglês e espanhol; trocar o
   idioma reinicia a história. Respeita "reduzir movimento": mostra a cena 1 pronta. */
(function () {
  "use strict";

  var root = document.getElementById("autoHero");
  if (!root) return;

  var graph = document.getElementById("apGraph");
  var svg = document.getElementById("apSvg");
  var logEl = document.getElementById("apLog");
  var resultEl = document.getElementById("apResult");
  var nameEl = root.querySelector(".ap-scene-name");
  var bars = [].slice.call(root.querySelectorAll(".ap-bars i"));
  var mCount = document.getElementById("apMCount");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var NS = "http://www.w3.org/2000/svg";
  var SCENE_MS = 9200;
  var runId = 0;
  var BASE = 128;
  var count = BASE;
  var clock = 14 * 3600 + 2 * 60 + 7;

  var ICONS = {
    card: "M2 7h20v12H2zM2 11h20",
    cart: "M6 6h15l-2 9H8zM6 6L5 3H2M9 20a1 1 0 100-2 1 1 0 000 2zM18 20a1 1 0 100-2 1 1 0 000 2z",
    crm: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
    chat: "M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z",
    erp: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
    team: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
    clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
    branch: "M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9",
    chart: "M3 3v18h18M7 14l4-4 3 3 5-6",
    mail: "M3 5h18v14H3zM3 7l9 6 9-6",
    store: "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"
  };

  var UI = {
    pt: { title: "Eva Automação", live: "fluxo ao vivo", mCount: "Automações hoje", mTime: "Tempo médio", mErr: "Erros", sec: "3 s", note: "Simulação ilustrativa. Nomes e valores são fictícios.", yes: "Sim", no: "Não" },
    en: { title: "Eva Automation", live: "live flow", mCount: "Automations today", mTime: "Avg. time", mErr: "Errors", sec: "3 s", note: "Illustrative simulation. Names and values are fictional.", yes: "Yes", no: "No" },
    es: { title: "Eva Automatización", live: "flujo en vivo", mCount: "Automatizaciones hoy", mTime: "Tiempo medio", mErr: "Errores", sec: "3 s", note: "Simulación ilustrativa. Nombres y valores son ficticios.", yes: "Sí", no: "No" }
  };

  // x e y em % do grafo. t = [etiqueta, título, detalhe] por idioma; log = linha do registro.
  var SCENES = [
    {
      name: { pt: "Compra aprovada", en: "Purchase approved", es: "Compra aprobada" },
      result: { pt: "4 tarefas em 3 segundos, sem ninguém digitar", en: "4 tasks in 3 seconds, nobody typing", es: "4 tareas en 3 segundos, sin que nadie escriba" },
      add: 4,
      nodes: {
        t: { x: 17, y: 50, ic: "card", t: { pt: ["Vendas", "Compra aprovada", "Cliente: Ana Souza"], en: ["Sales", "Purchase approved", "Customer: Ana Souza"], es: ["Ventas", "Compra aprobada", "Cliente: Ana Souza"] }, log: { pt: "Vendas: compra aprovada", en: "Sales: purchase approved", es: "Ventas: compra aprobada" } },
        crm: { x: 80, y: 14, ic: "crm", t: { pt: ["CRM", "Cria contato e negócio", "Etapa: cliente novo"], en: ["CRM", "Creates contact and deal", "Stage: new customer"], es: ["CRM", "Crea contacto y negocio", "Etapa: cliente nuevo"] }, log: { pt: "CRM: contato e negócio criados", en: "CRM: contact and deal created", es: "CRM: contacto y negocio creados" } },
        wa: { x: 80, y: 38, ic: "chat", t: { pt: ["Mensagem", "Envia as boas-vindas", "Com o acesso ao produto"], en: ["Message", "Sends the welcome message", "With product access"], es: ["Mensaje", "Envía la bienvenida", "Con el acceso al producto"] }, log: { pt: "Mensagem: boas-vindas enviadas", en: "Message: welcome message sent", es: "Mensaje: bienvenida enviada" } },
        erp: { x: 80, y: 62, ic: "erp", t: { pt: ["ERP", "Registra o pedido", "Pedido #4821"], en: ["ERP", "Records the order", "Order #4821"], es: ["ERP", "Registra el pedido", "Pedido #4821"] }, log: { pt: "ERP: pedido #4821 registrado", en: "ERP: order #4821 recorded", es: "ERP: pedido #4821 registrado" } },
        team: { x: 80, y: 86, ic: "team", t: { pt: ["Equipe", "Avisa no canal de vendas", "Venda nova: Ana Souza"], en: ["Team", "Alerts the sales channel", "New sale: Ana Souza"], es: ["Equipo", "Avisa en el canal de ventas", "Venta nueva: Ana Souza"] }, log: { pt: "Equipe: aviso enviado no canal", en: "Team: sales channel alerted", es: "Equipo: aviso enviado al canal" } }
      },
      edges: [["t", "crm"], ["t", "wa"], ["t", "erp"], ["t", "team"]],
      // quando (ms), o que
      steps: [
        { at: 400, run: "t" }, { at: 1300, done: "t" },
        { at: 1500, edge: 0 }, { at: 1650, run: "crm" }, { at: 2650, done: "crm" },
        { at: 1950, edge: 1 }, { at: 2100, run: "wa" }, { at: 3100, done: "wa" },
        { at: 2400, edge: 2 }, { at: 2550, run: "erp" }, { at: 3550, done: "erp" },
        { at: 2850, edge: 3 }, { at: 3000, run: "team" }, { at: 4000, done: "team" },
        { at: 4600, result: true }
      ]
    },
    {
      name: { pt: "Carrinho abandonado", en: "Abandoned cart", es: "Carrito abandonado" },
      result: { pt: "Venda recuperada sem ninguém acompanhar", en: "Sale recovered with nobody watching", es: "Venta recuperada sin que nadie lo siga" },
      add: 3,
      nodes: {
        t: { x: 17, y: 16, ic: "cart", t: { pt: ["Loja online", "Carrinho abandonado", "Cliente: Bruno Lima"], en: ["Online store", "Abandoned cart", "Customer: Bruno Lima"], es: ["Tienda online", "Carrito abandonado", "Cliente: Bruno Lima"] }, log: { pt: "Loja: carrinho abandonado detectado", en: "Store: abandoned cart detected", es: "Tienda: carrito abandonado detectado" } },
        wait: { x: 50, y: 16, ic: "clock", t: { pt: ["Espera", "Aguarda 1 hora", "Dá tempo de voltar"], en: ["Wait", "Waits 1 hour", "Time to come back"], es: ["Espera", "Espera 1 hora", "Da tiempo a volver"] }, log: { pt: "Fluxo: aguardou 1 hora", en: "Flow: waited 1 hour", es: "Flujo: esperó 1 hora" } },
        wa: { x: 83, y: 16, ic: "chat", t: { pt: ["Mensagem", "Envia lembrete com o link", "Carrinho com 2 itens"], en: ["Message", "Sends a reminder with the link", "Cart with 2 items"], es: ["Mensaje", "Envía recordatorio con el enlace", "Carrito con 2 artículos"] }, log: { pt: "Mensagem: lembrete enviado", en: "Message: reminder sent", es: "Mensaje: recordatorio enviado" } },
        dec: { x: 83, y: 50, ic: "branch", t: { pt: ["Decisão", "Pagou?", "Confere o pagamento"], en: ["Decision", "Did they pay?", "Checks the payment"], es: ["Decisión", "¿Pagó?", "Verifica el pago"] }, log: { pt: "Pagamento confirmado", en: "Payment confirmed", es: "Pago confirmado" } },
        mail: { x: 45, y: 72, ic: "mail", t: { pt: ["E-mail", "Segundo lembrete", "Só se não pagar"], en: ["Email", "Second reminder", "Only if unpaid"], es: ["Correo", "Segundo recordatorio", "Solo si no paga"] }, log: { pt: "", en: "", es: "" } },
        crm: { x: 83, y: 86, ic: "crm", t: { pt: ["CRM", "Marca como fechado", "Venda recuperada"], en: ["CRM", "Marks as closed", "Sale recovered"], es: ["CRM", "Marca como cerrado", "Venta recuperada"] }, log: { pt: "CRM: negócio fechado", en: "CRM: deal closed", es: "CRM: negocio cerrado" } }
      },
      edges: [["t", "wait"], ["wait", "wa"], ["wa", "dec"], ["dec", "crm", "yes"], ["dec", "mail", "no"]],
      steps: [
        { at: 400, run: "t" }, { at: 1300, done: "t" },
        { at: 1500, edge: 0 }, { at: 1650, run: "wait" }, { at: 3000, done: "wait" },
        { at: 3150, edge: 1 }, { at: 3300, run: "wa" }, { at: 4500, done: "wa" },
        { at: 4650, edge: 2 }, { at: 4800, run: "dec" }, { at: 5800, done: "dec" },
        { at: 5900, edge: 4, skip: "mail" },
        { at: 6000, edge: 3 }, { at: 6150, run: "crm" }, { at: 7000, done: "crm" },
        { at: 7400, result: true }
      ]
    },
    {
      name: { pt: "Pedido no marketplace", en: "Marketplace order", es: "Pedido en marketplace" },
      result: { pt: "Estoque e painel em dia, com aviso de reposição", en: "Stock and dashboard up to date, with a restock alert", es: "Stock y panel al día, con aviso de reposición" },
      add: 3,
      nodes: {
        t: { x: 17, y: 32, ic: "store", t: { pt: ["Marketplace", "Novo pedido", "2 unidades, item 3317"], en: ["Marketplace", "New order", "2 units, item 3317"], es: ["Marketplace", "Nuevo pedido", "2 unidades, artículo 3317"] }, log: { pt: "Marketplace: novo pedido recebido", en: "Marketplace: new order received", es: "Marketplace: nuevo pedido recibido" } },
        erp: { x: 50, y: 32, ic: "erp", t: { pt: ["ERP", "Baixa o estoque", "Sobram 3 unidades"], en: ["ERP", "Updates the stock", "3 units left"], es: ["ERP", "Descuenta el stock", "Quedan 3 unidades"] }, log: { pt: "ERP: estoque atualizado", en: "ERP: stock updated", es: "ERP: stock actualizado" } },
        dash: { x: 83, y: 32, ic: "chart", t: { pt: ["Painel", "Atualiza as vendas do dia", "Sem planilha manual"], en: ["Dashboard", "Updates today's sales", "No manual spreadsheet"], es: ["Panel", "Actualiza las ventas del día", "Sin hoja manual"] }, log: { pt: "Painel: vendas do dia atualizadas", en: "Dashboard: today's sales updated", es: "Panel: ventas del día actualizadas" } },
        dec: { x: 50, y: 74, ic: "branch", t: { pt: ["Decisão", "Estoque baixo?", "Limite: 5 unidades"], en: ["Decision", "Low stock?", "Limit: 5 units"], es: ["Decisión", "¿Stock bajo?", "Límite: 5 unidades"] }, log: { pt: "Estoque abaixo do limite", en: "Stock below the limit", es: "Stock por debajo del límite" } },
        team: { x: 83, y: 74, ic: "team", t: { pt: ["Equipe", "Alerta de reposição", "Aviso ao time de compras"], en: ["Team", "Restock alert", "Notice to purchasing"], es: ["Equipo", "Alerta de reposición", "Aviso a compras"] }, log: { pt: "Equipe: alerta de reposição enviado", en: "Team: restock alert sent", es: "Equipo: alerta de reposición enviado" } }
      },
      edges: [["t", "erp"], ["erp", "dash"], ["erp", "dec"], ["dec", "team", "yes"]],
      steps: [
        { at: 400, run: "t" }, { at: 1300, done: "t" },
        { at: 1500, edge: 0 }, { at: 1650, run: "erp" }, { at: 2750, done: "erp" },
        { at: 2900, edge: 1 }, { at: 3050, run: "dash" }, { at: 4050, done: "dash" },
        { at: 3000, edge: 2 }, { at: 3150, run: "dec" }, { at: 4150, done: "dec" },
        { at: 4300, edge: 3 }, { at: 4450, run: "team" }, { at: 5450, done: "team" },
        { at: 5900, result: true }
      ]
    }
  ];

  function lang() {
    var l = (window.EvaI18n && window.EvaI18n.getLang && window.EvaI18n.getLang()) || document.documentElement.lang || "pt";
    l = String(l).slice(0, 2);
    return UI[l] ? l : "pt";
  }

  function sleep(ms, id) {
    return new Promise(function (res, rej) {
      setTimeout(function () { if (id === runId) res(); else rej(new Error("cancelado")); }, ms);
    });
  }

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ---------- desenho da cena ---------- */

  var cur = null; // { scene, nodes: {id: el}, edges: [el], labels: [] }

  function curve(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      return "M" + a.x + " " + a.y + " C" + (a.x + dx / 2) + " " + a.y + " " + (b.x - dx / 2) + " " + b.y + " " + b.x + " " + b.y;
    }
    return "M" + a.x + " " + a.y + " C" + a.x + " " + (a.y + dy / 2) + " " + b.x + " " + (b.y - dy / 2) + " " + b.x + " " + b.y;
  }

  function render(scene) {
    var l = lang(), u = UI[l];
    graph.querySelectorAll(".an").forEach(function (n) { n.remove(); });
    svg.innerHTML = "";

    var w = graph.clientWidth || 470, h = graph.clientHeight || 304;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);

    var pos = {};
    Object.keys(scene.nodes).forEach(function (id) {
      var n = scene.nodes[id];
      pos[id] = { x: (n.x / 100) * w, y: (n.y / 100) * h };
    });

    var edges = [], labels = [];
    scene.edges.forEach(function (e, i) {
      var d = curve(pos[e[0]], pos[e[1]]);
      el("path", { d: d, "class": "ae-bg" }, svg);
      var p = el("path", { d: d, "class": "ae" }, svg);
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.transition = "stroke-dashoffset 0.55s ease";
      p.setAttribute("data-len", len);
      edges.push(p);
      if (e[2]) {
        var mx = (pos[e[0]].x + pos[e[1]].x) / 2, my = (pos[e[0]].y + pos[e[1]].y) / 2;
        var t = el("text", { x: mx + (e[2] === "no" ? 0 : 14), y: my - 6, "class": "ae-label is-" + e[2] }, svg);
        t.textContent = e[2] === "yes" ? u.yes : u.no;
        labels[i] = t;
      }
    });

    var nodes = {};
    var k = 0;
    Object.keys(scene.nodes).forEach(function (id) {
      var n = scene.nodes[id], tx = n.t[l];
      var d = document.createElement("div");
      d.className = "an";
      d.style.left = n.x + "%";
      d.style.top = n.y + "%";
      d.style.transitionDelay = (k++ * 70) + "ms, " + (k * 70) + "ms, 0s, 0s, 0s";
      d.innerHTML =
        '<span class="an-ic"><svg viewBox="0 0 24 24"><path d="' + ICONS[n.ic] + '"/></svg></span>' +
        '<span class="an-tx"><em>' + tx[0] + "</em><b>" + tx[1] + "</b><small>" + tx[2] + "</small></span>" +
        '<span class="an-st"></span>';
      graph.appendChild(d);
      nodes[id] = d;
    });

    cur = { scene: scene, nodes: nodes, edges: edges, labels: labels };
    // força o navegador a registrar o estado inicial antes de mostrar
    void graph.offsetWidth;
    Object.keys(nodes).forEach(function (id) { nodes[id].classList.add("in"); });
  }

  /* ---------- registro, métricas, resultado ---------- */

  function hhmmss(s) {
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return p(Math.floor(s / 3600) % 24) + ":" + p(Math.floor(s / 60) % 60) + ":" + p(s % 60);
  }

  function addLog(text) {
    if (!text) return;
    clock += 1;
    var li = document.createElement("li");
    li.innerHTML = "<time>" + hhmmss(clock) + "</time>" + text;
    logEl.appendChild(li);
    while (logEl.children.length > 3) logEl.removeChild(logEl.firstChild);
  }

  function setCount(n) {
    count = n;
    mCount.textContent = n;
    mCount.classList.add("is-up");
    setTimeout(function () { mCount.classList.remove("is-up"); }, 900);
  }

  function showResult(text) {
    resultEl.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>' + text + "</span>";
    resultEl.classList.add("is-on");
  }

  function texts() {
    var l = lang(), u = UI[l];
    root.querySelector(".ap-title").textContent = u.title;
    root.querySelector(".ap-live em").textContent = u.live;
    root.querySelector(".ap-metric-count").textContent = u.mCount;
    root.querySelector(".ap-metric-time").textContent = u.mTime;
    root.querySelector(".ap-metric-err").textContent = u.mErr;
    document.getElementById("apMTime").textContent = u.sec;
    var nota = root.querySelector(".ap-note"); if (nota) nota.textContent = u.note;
  }

  /* ---------- execução ---------- */

  function runStep(s, id) {
    if (id !== runId || !cur) return;
    var scene = cur.scene, l = lang();
    if (s.run && cur.nodes[s.run]) cur.nodes[s.run].classList.add("is-run");
    if (s.done && cur.nodes[s.done]) {
      var nd = cur.nodes[s.done];
      nd.classList.remove("is-run");
      nd.classList.add("is-done");
      addLog(scene.nodes[s.done].log[l]);
    }
    if (typeof s.edge === "number") {
      var p = cur.edges[s.edge];
      if (s.skip) {
        // caminho não escolhido: tracejado apagado e o cartão fica de lado
        p.classList.add("is-dim");
        p.style.strokeDashoffset = 0;
        if (cur.nodes[s.skip]) cur.nodes[s.skip].classList.add("is-skip");
        if (cur.labels[s.edge]) cur.labels[s.edge].classList.add("is-on");
      } else {
        p.style.strokeDashoffset = 0;
        if (cur.labels[s.edge]) cur.labels[s.edge].classList.add("is-on");
      }
    }
    if (s.result) {
      showResult(scene.result[l]);
      setCount(count + scene.add);
    }
  }

  async function playScene(scene, index, id) {
    var l = lang();
    resultEl.classList.remove("is-on");
    nameEl.textContent = scene.name[l];
    bars.forEach(function (b, i) {
      var u = b.firstElementChild;
      u.style.transition = "none";
      u.style.width = i < index ? "100%" : "0";
      b.classList.toggle("is-done", i < index);
    });
    render(scene);
    await sleep(60, id);

    // a barra da cena atual enche durante a cena
    var bu = bars[index].firstElementChild;
    void bu.offsetWidth;
    bu.style.transition = "width " + SCENE_MS + "ms linear";
    bu.style.width = "100%";

    scene.steps.forEach(function (s) {
      setTimeout(function () { runStep(s, id); }, s.at);
    });
    await sleep(SCENE_MS - 700, id);
    // some devagar antes da próxima cena
    Object.keys(cur.nodes).forEach(function (k) { cur.nodes[k].classList.remove("in", "is-run", "is-done", "is-skip"); });
    cur.edges.forEach(function (p) { p.style.transition = "none"; p.style.strokeDashoffset = p.getAttribute("data-len"); p.classList.remove("is-dim"); });
    cur.labels.forEach(function (t) { if (t) t.classList.remove("is-on"); });
    resultEl.classList.remove("is-on");
    await sleep(700, id);
  }

  async function loop(id) {
    try {
      while (id === runId) {
        count = BASE;
        mCount.textContent = BASE;
        for (var i = 0; i < SCENES.length; i++) {
          await playScene(SCENES[i], i, id);
        }
      }
    } catch (e) {
      if (!e || e.message !== "cancelado") console.error(e);
    }
  }

  // "reduzir movimento": mostra a primeira cena já concluída, sem loop
  function estatico() {
    var scene = SCENES[0], l = lang();
    nameEl.textContent = scene.name[l];
    render(scene);
    Object.keys(cur.nodes).forEach(function (k) { cur.nodes[k].classList.add("is-done"); });
    cur.edges.forEach(function (p) { p.style.transition = "none"; p.style.strokeDashoffset = 0; });
    showResult(scene.result[l]);
    bars[0].classList.add("is-done");
    mCount.textContent = BASE + scene.add;
  }

  function start() {
    runId++;
    texts();
    logEl.innerHTML = "";
    clock = 14 * 3600 + 2 * 60 + 7;
    bars.forEach(function (b) { b.classList.remove("is-done"); b.firstElementChild.style.transition = "none"; b.firstElementChild.style.width = "0"; });
    if (reduced) { estatico(); return; }
    loop(runId);
  }

  var resizeTimer, lastW = window.innerWidth;
  window.addEventListener("resize", function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 300);
  });
  document.addEventListener("evalangchange", start);

  function init() {
    root.classList.add("is-ready");
    start();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
